import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth, COLLECTION_TENANT_SLUG, HANDSHAKE_URL } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants, tenantMemberships } from "@/lib/db/schema";

export type VitrineRole = "admin" | "registrar" | "viewer";

/**
 * The session plus the acting user's membership in the collection
 * organization. Vitrine reads AXXES team roles (`owner`/`admin`/`manager`/
 * `member`/`viewer`) and maps them onto the desk's roles: owners and admins
 * run the desk, managers and members catalog, viewers read.
 */
export async function getContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, COLLECTION_TENANT_SLUG))
    .limit(1);
  if (!tenant) return null;

  const [membership] = await db
    .select()
    .from(tenantMemberships)
    .where(
      and(
        eq(tenantMemberships.tenantId, tenant.id),
        eq(tenantMemberships.userId, session.user.id)
      )
    )
    .limit(1);

  const teamRole = membership?.role ?? null;
  const role: VitrineRole | null =
    teamRole === "owner" || teamRole === "admin"
      ? "admin"
      : teamRole === "manager" || teamRole === "member"
        ? "registrar"
        : teamRole === "viewer"
          ? "viewer"
          : null;

  return {
    user: session.user,
    tenant,
    teamRole,
    role,
  };
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
