import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await auth.api.signOut({ headers: req.headers });
  return NextResponse.redirect(new URL("/", req.url));
}
