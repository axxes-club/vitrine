import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getContext, ACTIVE_COLLECTION_COOKIE } from "@/lib/context";

/**
 * Records which collection the desk should open on.
 *
 * The requested slug is checked against the collections this person can
 * actually open, and the cookie is only ever set to something from that list.
 * A hand-edited cookie naming another organization's collection is therefore
 * rejected here, and would be ignored again on read.
 */
export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : null;
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const match = ctx.collections.find((c) => c.slug === slug || c.id === slug);
  if (!match) {
    return NextResponse.json(
      { error: "No access to that collection" },
      { status: 403 }
    );
  }

  (await cookies()).set(ACTIVE_COLLECTION_COOKIE, match.slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true, collection: match.slug });
}
