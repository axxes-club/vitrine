import "server-only"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { subscriptions } from "@/lib/db/schema"
import { ACCESS_STATUSES, listSubscriptions, type SubscriptionSnapshot } from "@/lib/axxes-payments"

/**
 * Writes AXXES Payments subscription state into the shared, members-owned `subscriptions`
 * row for a workspace (one row per tenant; reference = tenant ID). Several products read
 * that row (gateFor, Vitrine), so a product only ever writes when the row is empty, lapsed,
 * or already one of its own plans; it never replaces another product's live plan.
 */
export type PlanCatalog = { product: string; planByLookupKey: Record<string, string> }

const live = (row: { status: string; currentPeriodEnd: Date | null }) =>
  ACCESS_STATUSES.includes(row.status as SubscriptionSnapshot["status"]) &&
  (!row.currentPeriodEnd || row.currentPeriodEnd.getTime() >= Date.now())

/** Whether this product may sell a plan to the workspace without displacing another product's plan. */
export async function canSellTo(tenantId: string, catalog: PlanCatalog) {
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).limit(1)
  if (!row || !live(row) || !row.planKey || row.planKey === "free") return { ok: true as const, current: null }
  const own = Object.values(catalog.planByLookupKey).includes(row.planKey)
  return { ok: !own ? (false as const) : (true as const), current: row.planKey, own }
}

export async function applyPlanSnapshot(snapshot: SubscriptionSnapshot, catalog: PlanCatalog, others?: SubscriptionSnapshot[]) {
  if (snapshot.product !== catalog.product) return
  const tenantId = snapshot.reference
  let effective = snapshot
  if (!ACCESS_STATUSES.includes(snapshot.status)) {
    // An ended subscription must not close access another live one still pays for.
    const other = (others ?? (await listSubscriptions(tenantId))).find((s) => s.id !== snapshot.id && ACCESS_STATUSES.includes(s.status))
    if (other) effective = other
  }
  const planKey = effective.lookup_key ? catalog.planByLookupKey[effective.lookup_key] : undefined
  if (!planKey) return
  const values = {
    planKey,
    status: effective.status,
    currentPeriodEnd: effective.current_period_end ? new Date(effective.current_period_end * 1000) : null,
    updatedAt: new Date(),
  }
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).limit(1).for("update")
    if (!row) {
      await tx.insert(subscriptions).values({ tenantId, ...values })
      return
    }
    const ours = Object.values(catalog.planByLookupKey).includes(row.planKey ?? "")
    if (!ours && row.planKey && row.planKey !== "free" && live(row)) {
      console.error("plan_conflict", { tenantId, product: catalog.product, existing: row.planKey })
      return
    }
    await tx.update(subscriptions).set(values).where(eq(subscriptions.id, row.id))
  })
}
