import { NextResponse } from "next/server";
import { getContext } from "@/lib/context";
import { createCheckout, PaymentsError } from "@/lib/axxes-payments";
import { canSellTo } from "@/lib/plan-billing";
import { VITRINE_CATALOG, lookupKeyFor } from "@/lib/vitrine-billing";
import { publicOrigin } from "@/lib/public-origin";

/** A collection admin starts a Vitrine plan for the active collection on AXXES Payments. */
export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx?.tenant || ctx.role !== "admin") {
    return NextResponse.json({ error: "Only a collection administrator can choose a plan." }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { plan?: string; interval?: string };
  const lookupKey = lookupKeyFor(body.plan ?? "", body.interval ?? "monthly");
  if (!lookupKey) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const sellable = await canSellTo(ctx.tenant.id, VITRINE_CATALOG);
  if (!sellable.ok) {
    return NextResponse.json({ error: `${ctx.tenant.name} already has an AXXES plan (${sellable.current}). Contact AXXES to add Vitrine.` }, { status: 409 });
  }
  if (sellable.current) {
    return NextResponse.json({ error: "This collection already has a Vitrine plan. Use Manage subscription." }, { status: 409 });
  }
  try {
    const checkout = await createCheckout({
      product: "vitrine",
      purchase: "subscription",
      lookupKey,
      reference: ctx.tenant.id,
      idempotencyKey: `vitrine-${ctx.tenant.id}-${lookupKey}-${Date.now()}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100),
      returnUrl: `${publicOrigin(request)}/api/axxes-payments/return`,
      email: ctx.user.email ?? undefined,
    });
    return NextResponse.json({ url: checkout.checkout_url });
  } catch (error) {
    console.error("vitrine_checkout_failed", error instanceof PaymentsError ? error.status : "unknown");
    return NextResponse.json({ error: "Checkout is unavailable right now." }, { status: 502 });
  }
}
