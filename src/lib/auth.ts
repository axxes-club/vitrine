import {wrapAccountAuth} from "@/lib/security/auth-guard";
import {sql} from "drizzle-orm";
import {accountAllowed,accountSessionAllowed} from "@/lib/security/account.mjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins";
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

/**
 * Central AXXES sign-in; when unset the app shows its own sign-in page.
 */
export const HANDSHAKE_URL = process.env.HANDSHAKE_URL?.replace(/\/$/, "") || null;

/**
 * Whether the "Continue with AXXES" OAuth button is wired up.
 *
 * The provider is optional. The shared session cookie is the primary path and
 * needs nothing but BETTER_AUTH_SECRET; OAuth is the extra door for an account
 * whose cookie did not come along. Handshake issues a client secret, and
 * without one the provider has nothing to exchange, so it is left out entirely
 * rather than registered with an empty secret — which makes discovery fail on
 * every request that touches the auth config, and because that config is built
 * at import time, it stalls the first render of anything that signs in.
 */
const oidcClientId = process.env.AXXES_OIDC_CLIENT_ID;
const oidcClientSecret = process.env.AXXES_OIDC_CLIENT_SECRET;
export const OIDC_ENABLED = Boolean(oidcClientId && oidcClientSecret);


// Vitrine is an administrators' application: only people with a membership in
// a collection organization may enter the desk.
//
// Which collection is chosen per request (see lib/context.ts), not fixed here.
// This is only the fallback when a signed-in person belongs to exactly one
// collection, and when VITRINE_TENANT_SLUG pins the deployment to a single
// collection — the Reyes-Veray desk, which is still how it is deployed.
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

const baseAuth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  // Surface the shared AXXES admin flag on the session user.
  //
  // The column exists on the shared `user` table and is mapped in the schema,
  // but Better Auth only returns columns it knows about, so without this
  // `session.user.isSuperadmin` was always undefined and every superadmin
  // exemption in the gate silently evaluated false. Reading the flag is what
  // keeps the people who run AXXES from being locked out of their own product.
  user: {
    additionalFields: {
      isSuperadmin: { type: "boolean", required: false, input: false },
      role: { type: "string", required: false, input: false },
    },
  },
  trustedOrigins: [
    baseURL,
    `https://${parentDomain}`,
    `https://*.${parentDomain}`,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  advanced: {
    cookiePrefix: process.env.AUTH_COOKIE_PREFIX || "better-auth",
    ...(cookieDomain ? { crossSubDomainCookies: { enabled: true, domain: cookieDomain } } : {}),
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  plugins: [
    nextCookies(),
    // "Continue with AXXES" — Handshake is the suite's identity provider.
    // Discovery + PKCE; claims come from its /userinfo. The shared-cookie path
    // above still works first-party; this opens the door from any host and for
    // accounts whose cookie did not come along. Registered only when Handshake
    // has issued a client secret — see OIDC_ENABLED.
    ...(OIDC_ENABLED
      ? [
          genericOAuth({
            config: [
              {
                providerId: "axxes" as const,
                discoveryUrl: `${HANDSHAKE_URL || "https://handshake.axxes.club"}/api/auth/.well-known/openid-configuration`,
                clientId: oidcClientId as string,
                clientSecret: oidcClientSecret as string,
                scopes: ["openid", "email", "profile"],
                pkce: true,
              },
            ],
          }),
        ]
      : []),
  ],
});

const accountDb={query:async(text:string,values:unknown[])=>{
 const [id,userId]=values;
 const result=await db.execute(text.includes('FROM "session"')
  ?sql`SELECT id FROM "session" WHERE id=${id} AND user_id=${userId} AND expires_at>now()`
  :sql`SELECT u.id,coalesce(p.state,'active') AS state FROM "user" u LEFT JOIN platform_subject_policy p ON p.subject_kind='user' AND p.subject_id=u.id WHERE u.id=${id}`);
 return {rows:result.rows as Record<string,unknown>[]};
}};
export async function getAppSession(h:Headers){
 const value=await auth.api.getSession({headers:h});
 return value;
}

export const auth=wrapAccountAuth(baseAuth,(userId,sessionId)=>accountSessionAllowed(accountDb,userId,sessionId));
