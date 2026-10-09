import "server-only";
import { authorizedCollections } from "./collection-access";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { auth, getAppSession, COLLECTION_TENANT_SLUG, ENTRY_ORG_NAMES, HANDSHAKE_URL } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, tenants, tenantMemberships, plans, subscriptions } from "@/lib/db/schema";
import { hasValidInvite } from "@/lib/invite";
import { getSubscription } from "@/lib/billing";

export type VitrineRole = "admin" | "registrar" | "viewer";

/** Cookie holding the collection this person is currently looking at. */
export const ACTIVE_COLLECTION_COOKIE = "vitrine_collection";

/**
 * A collection this person may open the desk on, and how they got in.
 */
export type Collection = {
  id: string;
  name: string;
  slug: string;
  role: VitrineRole;
  /** The org the seat actually came from, when it was not a direct seat. */
  viaOrg: string | null;
};


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
 *
 * Two further ways in, both deliberate:
 *
 *   - A **superadmin** is not locked out of the suite's own front door. They
 *     get the desk as an admin without needing a seat they would have to grant
 *     themselves. Before this, a superadmin who was not a member of either
 *     organization was redirected to sign-in, signed in successfully, and was
 *     then told they had no access — the worst possible outcome, because it
 *     looks like a broken account rather than a missing grant.
 *   - A valid **invitation code** gets someone to the door. It grants access to
 *     the desk, not an identity: they still sign in, and the work is written
 *     against the account that did.
 */

/**
 * Every collection this person may open a desk on.
 *
 * Three sources, all of which have to be asked because a collector can arrive
 * by any of them:
 *
 *   - a direct seat in the collection (the normal case)
 *   - membership of an entry organization such as AXXES CLUB, which is the
 *     company and can reach the pinned collection
 *   - a superadmin, who is never locked out of the suite's own front door
 *
 * A valid invitation is handled separately: it gets someone through the door
 * but names no collection, so it is applied after we know which one is being
 * opened rather than pretending to be a seat.
 *
 * Collections with no artwork are still listed. A collector who has just paid
 * must be able to open an empty desk to add their first work; hiding it until
 * it has records would be a desk that cannot be filled.
 */
export async function getCollections(userId: string): Promise<Collection[]> {
  const seats = await db
    .select({ role: tenantMemberships.role, tenantId: tenantMemberships.tenantId })
    .from(tenantMemberships)
    .where(and(eq(tenantMemberships.userId, userId), isNull(tenantMemberships.deletedAt)));

  const orgs = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(and(
      isNull(tenants.deletedAt),
       sql`${tenants.status} NOT IN ('suspended', 'cancelled')`,
      or(
        inArray(tenants.name, ENTRY_ORG_NAMES),
        ...(COLLECTION_TENANT_SLUG ? [eq(tenants.slug, COLLECTION_TENANT_SLUG)] : []),
        ...(seats.length ? [inArray(tenants.id, seats.map(s => s.tenantId))] : [])
      )
    ));

  return authorizedCollections(orgs, seats, COLLECTION_TENANT_SLUG, ENTRY_ORG_NAMES);
}

export async function getContext() {
  const session = await getAppSession(await headers());
  if (!session?.user) return null;

  const [currentUser]=await db.select({isSuperadmin:user.isSuperadmin}).from(user).where(eq(user.id,session.user.id)).limit(1);
  if(!currentUser)return null;
  const isSuperadmin = currentUser.isSuperadmin===true;
  const invited = await hasValidInvite();

  const collections = await getCollections(session.user.id);

  // Platform administrators may select the configured collection. An invite
  // grants entry only; collection access always requires a membership.
  let effective = collections;
  if (!effective.length && isSuperadmin) {
    const fallback = await db
      .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
      .from(tenants)
      .where(
        and(
          isNull(tenants.deletedAt),
       sql`${tenants.status} NOT IN ('suspended', 'cancelled')`,
          ...(COLLECTION_TENANT_SLUG
            ? [eq(tenants.slug, COLLECTION_TENANT_SLUG)]
            : [inArray(tenants.name, ENTRY_ORG_NAMES)])
        )
      )
      .limit(1);
    if (fallback.length) {
      effective = [
        {
          id: fallback[0].id,
          name: fallback[0].name,
          slug: fallback[0].slug,
          role: "admin",
          viaOrg: "AXXES",
        },
      ];
    }
  }

  if (!effective.length) {
    return {
      user: session.user,
      collections: [] as Collection[],
      tenant: null,
      role: null,
      viaOrg: null,
      isSuperadmin,
      invited,
      subscription: null,
    };
  }

  // Which collection: the one in the cookie if it is still one they can open,
  // otherwise their first. Cookies are user-editable, so it is re-validated
  // against the list rather than trusted.
  const wanted = (await cookies()).get(ACTIVE_COLLECTION_COOKIE)?.value;
  const tenant =
    effective.find((c) => c.slug === wanted || c.id === wanted) ?? effective[0];

  const subscription = await getSubscription(tenant.id);

  return {
    user: session.user,
    collections: effective,
    tenant,
    teamRole: null,
    role: tenant.role,
    viaOrg: tenant.viaOrg,
    isSuperadmin,
    invited,
    subscription,
  };
}

/**
 * Whether this organization may actually use the desk.
 *
 * A seat says you may enter; a subscription says the collection is paid for.
 * Both are required, because either alone is wrong: a free seat on an unpaid
 * organization is not a customer, and a paid organization with no registrar is
 * nobody's problem yet.
 *
 * The two exemptions are deliberate and both are about not locking the company
 * out of its own front door: a superadmin is never billed, and the AXXES CLUB
 * desk is how the team demonstrates the product to a collector considering it.
 */
export async function getAccess(
  ctx: NonNullable<Awaited<ReturnType<typeof getContext>>>
): Promise<{ allowed: boolean; reason: "ok" | "no-seat" | "no-subscription"; planName: string | null }> {
  if (!ctx.role || !ctx.tenant) return { allowed: false, reason: "no-seat", planName: null };

  if (ctx.isSuperadmin) {
    return { allowed: true, reason: "ok", planName: "AXXES internal" };
  }

  // AXXES CLUB reaches the pinned collection without it being individually
  // subscribed; it is the company demonstrating its own product.
  if (ctx.viaOrg && ENTRY_ORG_NAMES.includes(ctx.viaOrg)) {
    return { allowed: true, reason: "ok", planName: "AXXES CLUB" };
  }

  const sub = ctx.subscription;
  if (!sub) return { allowed: false, reason: "no-subscription", planName: null };

  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const notExpired =
    !sub.currentPeriodEnd || sub.currentPeriodEnd.getTime() >= Date.now();
  const carriesVitrine = !sub.plan || sub.plan.products.includes("vitrine");

  if (!active || !notExpired || !carriesVitrine) {
    return { allowed: false, reason: "no-subscription", planName: sub.plan?.name ?? null };
  }

  return { allowed: true, reason: "ok", planName: sub.plan?.name ?? null };
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
