import { NextResponse } from "next/server";
import { getContext } from "@/lib/context";
import { createPortalSession, listSubscriptions } from "@/lib/axxes-payments";
import { publicOrigin } from "@/lib/public-origin";

/** Opens the AXXES Payments billing portal for the active collection's own subscription. */
export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx?.tenant || ctx.role !== "admin") {
    return NextResponse.json({ error: "Only a collection administrator can manage billing." }, { status: 403 });
  }
  try {
    const [latest] = await listSubscriptions(ctx.tenant.id);
    if (!latest) return NextResponse.json({ error: "This collection has no subscription to manage." }, { status: 404 });
    const portal = await createPortalSession(latest.id, `${publicOrigin(request)}/admin`);
    return NextResponse.json({ url: portal.url });
  } catch {
    return NextResponse.json({ error: "Subscription management is unavailable." }, { status: 502 });
  }
}
