import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Invitation codes.
 *
 * Vitrine is invite-only, and historically that meant a waitlist and a human
 * writing to you when a place opened. A code lets someone who already has a
 * code walk in immediately, which is the difference between an invitation and a
 * waiting list.
 *
 * Codes live in `VITRITE_INVITE_CODES` (comma separated) rather than in the
 * database: they are a property of the deployment, not of a person, and a code
 * that could be read out of a table would be a code that leaks with any
 * read-only database access.
 *
 * The cookie is signed with BETTER_AUTH_SECRET so it cannot be forged by hand,
 * and it grants desk access only. It is not an identity — signing in is still
 * required, and the account that signs in is the one whose work gets written.
 */

export const INVITE_COOKIE = "vitrine_invite";
const MAX_AGE = 60 * 60 * 24 * 30; // a month is a season, not a decade

function secret(): string {
  const value=process.env.BETTER_AUTH_SECRET;
  if(!value || value.length<32)throw new Error("Invitation signing is not configured");
  return value;
}

/** Explicitly configured invitation codes; no deployment default. */
export function inviteCodes(): string[] {
  const raw = process.env.VITRINE_INVITE_CODES ?? "";
  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Constant-time compare, so a wrong code cannot be discovered one char at a time. */
function matches(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate.trim().toUpperCase());
  const b = Buffer.from(expected.trim().toUpperCase());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isValidCode(code: string): boolean {
  return inviteCodes().some((c) => matches(code, c));
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

/** The value to store in the cookie for a given code. */
export function grantFor(code: string): string {
  return `${code.trim().toUpperCase()}.${sign(code.trim().toUpperCase())}`;
}

/** True when the caller presented a code this deployment issued. */
export async function hasValidInvite(): Promise<boolean> {
  if(!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length<32)return false;
  const raw = (await cookies()).get(INVITE_COOKIE)?.value;
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return false;
  const code = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  const expected = sign(code);
  if (mac.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
  return isValidCode(code);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}
