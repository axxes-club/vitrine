import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { auth, COLLECTION_TENANT_SLUG, ENTRY_ORG_NAMES, HANDSHAKE_URL } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants, tenantMemberships } from "@/lib/db/schema";

export type VitrineRole = "admin" | "registrar" | "viewer";

/**
 * The session, the collection the desk is looking at, and the acting user's
 * right to be here.
 *
 * Two different organizations are involved and conflating them was the trap:
 *
 *   - The **collection** holds the artwork, and every query in the desk is
 *     scoped to it. It is fixed, and it is what `tenant` below always is.
 *   - An **entry organization** only decides who may come through the door.
 *
 * Belonging to AXXES CLUB is enough on its own. An administrator of the
 * company should not also have to be added to the collection's private
 * workspace to reach the desk, and before this was true that meant adding
 * every colleague by hand, one seat at a time.
 */

/** AXXES team rank -> what they may do at the desk. */
function deskRoleFor(teamRole: string | null | undefined): VitrineRole | null {
  return teamRole === "owner" || teamRole === "admin"
    ? "admin"
    : teamRole === "manager" || teamRole === "member"
      ? "registrar"
      : teamRole === "viewer"
        ? "viewer"
        : null;
}

export async function getContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  // The collection is the data boundary and never varies.
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, COLLECTION_TENANT_SLUG))
    .limit(1);
  if (!tenant) return null;

  // The collection's own seat wins when there is one, so granting someone a
  // direct seat can always refine what their AXXES CLUB rank implies.
  const orgs = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(
      and(
        isNull(tenants.deletedAt),
        or(
          eq(tenants.slug, COLLECTION_TENANT_SLUG),
          inArray(tenants.name, ENTRY_ORG_NAMES)
        )
      )
    );
  const ordered = orgs.sort(
    (a, b) => rank(a.id, tenant.id) - rank(b.id, tenant.id)
  );

  const seats = ordered.length
    ? await db
        .select({ role: tenantMemberships.role, tenantId: tenantMemberships.tenantId })
        .from(tenantMemberships)
        .where(
          and(
            inArray(tenantMemberships.tenantId, ordered.map((o) => o.id)),
            eq(tenantMemberships.userId, session.user.id),
            isNull(tenantMemberships.deletedAt)
          )
        )
    : [];

  const seat =
    seats.find((s) => s.tenantId === tenant.id) ??
    ordered.map((o) => seats.find((s) => s.tenantId === o.id)).find(Boolean);

  const teamRole = seat?.role ?? null;
  const viaOrg = seat ? ordered.find((o) => o.id === seat.tenantId)?.name ?? null : null;

  return { user: session.user, tenant, teamRole, role: deskRoleFor(teamRole), viaOrg };
}

/** The collection sorts first, so a direct seat always outranks a derived one. */
function rank(tenantId: string, collectionId: string): number {
  return tenantId === collectionId ? 0 : 1;
}

export async function requireContext() {
  const ctx = await getContext();
  if (!ctx) {
    if (HANDSHAKE_URL) {
      const h = await headers();
      const origin = `${h.get("x-forwarded-proto") ?? "https"}://${
        h.get("x-forwarded-host") ?? h.get("host")
      }`;
      redirect(`${HANDSHAKE_URL}/sign-in?redirect=${encodeURIComponent(`${origin}/admin`)}`);
    }
    redirect("/sign-in");
  }
  return ctx as NonNullable<Awaited<ReturnType<typeof getContext>>>;
}

/** Registrars and admins may change records; viewers may not. */
export function canEdit(role: VitrineRole | null): boolean {
  return role === "admin" || role === "registrar";
}
