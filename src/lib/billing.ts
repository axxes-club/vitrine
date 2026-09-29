import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/db/schema";

/**
 * Billing.
 *
 * Vitrine reads the AXXES-wide `subscriptions` and `plans` tables rather than
 * keeping its own. The handoff is explicit that this is the right call: the
 * shape is already correct (`subscriptions` is keyed by `tenant_id`, which is
 * exactly the collection), and a second billing table would be a second source
 * of truth that eventually disagrees with the first.
 *
 * What is *not* built here is taking a payment. Nothing in AXXES does that yet
 * (see HANDOFF-2026-09-28.md: "Nothing has ever subscribed to anything"). So
 * access is granted by the existence of a row written by whatever does the
 * checkout. That is honest: the gate is real, and it will not open for an
 * organization with no subscription — which is the property that matters —
 * without pretending a card flow exists when it does not.
 */

export type Plan = {
  key: string;
  name: string;
  blurb: string | null;
  priceCents: number;
  annualPriceCents: number | null;
  maxApps: number | null;
  products: string[];
  features: string[];
};

export type Subscription = {
  planKey: string;
  status: string;
  currentPeriodEnd: Date | null;
  plan: Plan | null;
};

/** Statuses that grant access. Anything else — lapsed, cancelled — does not. */
const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

/** The plans that carry Vitrine, cheapest first, for display. */
export async function vitrinePlans(): Promise<Plan[]> {
  const rows = await db.select().from(plans);
  return rows
    .filter((p) => {
      const prods = Array.isArray(p.products) ? p.products : [];
      return prods.includes("vitrine");
    })
    .sort((a, b) => a.priceCents - b.priceCents)
    .map(toPlan);
}

function toPlan(p: typeof plans.$inferSelect): Plan {
  return {
    key: p.key,
    name: p.name,
    blurb: p.blurb,
    priceCents: p.priceCents,
    annualPriceCents: p.annualPriceCents,
    maxApps: p.maxApps,
    products: Array.isArray(p.products) ? (p.products as string[]) : [],
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
  };
}

/** The organization's current subscription, or null if it has none. */
export async function getSubscription(tenantId: string): Promise<Subscription | null> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);
  if (!sub) return null;

  let plan: Plan | null = null;
  if (sub.planKey) {
    const [p] = await db
      .select()
      .from(plans)
      .where(eq(plans.key, sub.planKey))
      .limit(1);
    if (p) plan = toPlan(p);
  }

  return {
    planKey: sub.planKey ?? "",
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    plan,
  };
}

/** True when the organization is currently paying for something that includes Vitrine. */
export async function hasVitrineAccess(tenantId: string): Promise<boolean> {
  const sub = await getSubscription(tenantId);
  if (!sub) return false;
  if (!ACTIVE_STATUSES.includes(sub.status)) return false;
  if (sub.plan && !sub.plan.products.includes("vitrine")) return false;

  // A period that has run out stops granting access even while the row says
  // "active" — a stale row should not keep a collection's desk open forever.
  if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < Date.now()) {
    return false;
  }
  return true;
}
