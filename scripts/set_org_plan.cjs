/**
 * Puts an organization on a plan, by slug.
 *
 * Subscriptions are keyed by `tenant_id` — an organization, not a person. That
 * is deliberate and is what makes "any organization may use Vitrine" work: the
 * thing you buy for is the collection, and the people who can use it are its
 * seats. A person is granted a seat; an organization is granted a plan.
 *
 * So "give Jose Collector Pro" is not a statement about a user row. It is this:
 * the organization they administer gets the plan, and every registrar seated in
 * it gets the desk. This script takes the organization so the intent is explicit
 * at the call site rather than inferred.
 *
 * Idempotent on (tenant_id): re-running updates the existing row instead of
 * creating a second subscription, which is what would happen with a blind
 * INSERT and would leave the gate reading whichever row it found first.
 *
 * Usage:
 *   node scripts/set_org_plan.cjs <tenant-slug> <plan-key> [status] [months]
 *
 * Example:
 *   node scripts/set_org_plan.cjs coleccion-reyes-veray collector-pro active 1
 */
const fs = require("fs");
const path = require("path");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const m = env.match(/^DATABASE_URL="?([^"\n]+)"?/m);
if (!m) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}
const { neon } = require("@neondatabase/serverless");
const sql = neon(m[1]);

const [tenantSlug, planKey, statusArg, monthsArg] = process.argv.slice(2);
if (!tenantSlug || !planKey) {
  console.error(
    "Usage: node scripts/set_org_plan.cjs <tenant-slug> <plan-key> [status] [months]"
  );
  process.exit(1);
}
const status = statusArg || "active";
const months = Number(monthsArg || 1);

async function main() {
  const [tenant] = await sql`
    SELECT id, name, slug FROM tenants
    WHERE lower(slug) = lower(${tenantSlug}) AND deleted_at IS NULL
    LIMIT 1
  `;
  if (!tenant) {
    console.error("No such organization:", tenantSlug);
    process.exit(1);
  }

  const [plan] = await sql`
    SELECT key, name, price_cents, products FROM plans WHERE key = ${planKey}
  `;
  if (!plan) {
    console.error("No such plan:", planKey);
    const known = await sql`SELECT key FROM plans ORDER BY position`;
    console.error("known plans:", known.map((p) => p.key).join(", "));
    process.exit(1);
  }

  const products = Array.isArray(plan.products) ? plan.products : [];
  if (!products.includes("vitrine")) {
    console.error(
      `Refusing: plan "${planKey}" does not include vitrine (has: ${products.join(", ") || "none"}).`
    );
    console.error("A subscription on a plan without vitrine would not open the desk.");
    process.exit(1);
  }

  const before = await sql`
    SELECT id, plan_key, status, current_period_end FROM subscriptions
    WHERE tenant_id = ${tenant.id}
  `;

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + months);

  const [row] = await sql`
    INSERT INTO subscriptions (tenant_id, plan_key, status, current_period_end, updated_at)
    VALUES (${tenant.id}, ${planKey}, ${status}, ${periodEnd.toISOString()}, now())
    ON CONFLICT (tenant_id) DO UPDATE SET
      plan_key = EXCLUDED.plan_key,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = now()
    RETURNING id, plan_key, status, current_period_end
  `;

  console.log(`organization : ${tenant.name} (${tenant.slug})`);
  if (before.length) {
    console.log(
      `was          : ${before[0].plan_key} / ${before[0].status} / until ${before[0].current_period_end}`
    );
  } else {
    console.log("was          : (no subscription)");
  }
  console.log(`now          : ${row.plan_key} / ${row.status} / until ${row.current_period_end}`);
  console.log(`price        : $${(plan.price_cents / 100).toFixed(0)}/month — ${plan.name}`);
  console.log(`seats gain the desk: everyone in ${tenant.name}`);

  // Who can now open it, so the grant is not a surprise later.
  const seats = await sql`
    SELECT u.email, tm.role
    FROM tenant_memberships tm
    JOIN "user" u ON u.id = tm.user_id
    WHERE tm.tenant_id = ${tenant.id} AND tm.deleted_at IS NULL
    ORDER BY u.email
  `;
  console.log("members      :", seats.map((s) => `${s.email} (${s.role})`).join(", ") || "none");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
