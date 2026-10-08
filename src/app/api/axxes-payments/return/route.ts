import { NextResponse, type NextRequest } from "next/server";
import { getCheckout, getSubscription } from "@/lib/axxes-payments";
import { applyPlanSnapshot } from "@/lib/plan-billing";
import { VITRINE_CATALOG } from "@/lib/vitrine-billing";
import { publicOrigin } from "@/lib/public-origin";

// Buyers return here from payments.axxes.app. The checkout ID is a pointer only; the plan is
// written from state read back from Payments with Vitrine's key.
export async function GET(request: NextRequest) {
  const desk = new URL("/admin", publicOrigin(request));
  try {
    const checkout = await getCheckout(request.nextUrl.searchParams.get("axxes_checkout") ?? "");
    const done = checkout.state === "paid" || checkout.state === "no_payment_due";
    if (checkout.product === "vitrine" && checkout.subscription && done) {
      await applyPlanSnapshot(await getSubscription(checkout.subscription), VITRINE_CATALOG);
      desk.searchParams.set("subscription", "success");
    } else {
      desk.searchParams.set("subscription", "incomplete");
    }
  } catch {
    desk.searchParams.set("subscription", "incomplete");
  }
  return NextResponse.redirect(desk, 303);
}
