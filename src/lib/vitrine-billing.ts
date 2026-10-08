import type { PlanCatalog } from "./plan-billing-core"

/** Vitrine plans sold on AXXES Payments, by Stripe lookup key → shared `plans.key`. */
export const VITRINE_CATALOG: PlanCatalog = {
  product: "vitrine",
  planByLookupKey: {
    vitrine_collector_monthly: "collector",
    vitrine_collector_annual: "collector",
    "vitrine_collector-pro_monthly": "collector-pro",
    "vitrine_collector-pro_annual": "collector-pro",
  },
}

export function lookupKeyFor(plan: string, interval: string) {
  const key = `vitrine_${plan}_${interval === "annual" ? "annual" : "monthly"}`
  return key in VITRINE_CATALOG.planByLookupKey ? key : null
}
