import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import {
  user,
  session,
  account,
  verification,
} from "@/lib/db/schema";

// Shares the user/session/account tables with members.axxes.club, so every
// AXXES account can sign in here with the same credentials. With Handshake
// (handshake.axxes.club), every *.axxes.club app shares one session cookie.
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN;
const parentDomain = (cookieDomain || "axxes.club").replace(/^\./, "");
const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Central AXXES sign-in; when unset the app shows its own sign-in page.
export const HANDSHAKE_URL = process.env.HANDSHAKE_URL?.replace(/\/$/, "") || null;

// Vitrine is an administrators' application: only people with a membership in
// a collection organization may enter the desk.
export const COLLECTION_TENANT_SLUG =
  process.env.VITRINE_TENANT_SLUG || "coleccion-reyes-veray";

/**
 * Organizations whose membership is enough to reach the desk, on top of a seat
 * in the collection itself.
 *
 * AXXES CLUB is here because it is the company: anyone on the company roster
 * can open the desk without also being added to the collection's private
 * workspace. Matched by name rather than slug, because that org's slug was
 * generated when the workspace was created and is not something to hardcode.
 */
export const ENTRY_ORG_NAMES: string[] = (
  process.env.VITRINE_ENTRY_ORGS || "AXXES CLUB"
)
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    baseURL,
    `https://${parentDomain}`,
    `https://*.${parentDomain}`,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  advanced: cookieDomain
    ? { crossSubDomainCookies: { enabled: true, domain: cookieDomain } }
    : undefined,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()],
});
