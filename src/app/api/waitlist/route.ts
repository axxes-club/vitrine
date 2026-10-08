import { NextResponse } from "next/server";
import { auth, getAppSession } from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";

const pool = getPostgresPool();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: { email?: unknown; plan?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({error:"Invalid request."},{status:400});
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json(
      { error: "That address doesn't look right." },
      { status: 400 }
    );
  }

  const plan = typeof body.plan === "string" ? body.plan : null;
  if (plan) {
    if (!["collector", "collector-pro"].includes(plan)) return NextResponse.json({error:"Choose a valid Vitrine membership."},{status:400});
    const session = await getAppSession(req.headers);
    if (!session?.user || session.user.email.toLowerCase() !== email) return NextResponse.json({error:"Sign in to request your membership."},{status:401});
  }
  try {
    // A repeat signup is a friendly no-op, not an error.
    const inserted = await pool.query(
      `INSERT INTO waitlist (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET updated_at = now(), source = CASE WHEN $3::boolean THEN EXCLUDED.source ELSE waitlist.source END
       RETURNING (xmax = 0) AS created`,
      [email, plan ? `vitrine-plan:${plan}` : "vitrine-public-access-request", Boolean(plan)]
    );
    return NextResponse.json({ ok: true, already: !inserted.rows[0].created });
  } catch (err) {
    console.error("waitlist insert failed", err);
    return NextResponse.json(
      { error: "The register is momentarily closed. Please try again." },
      { status: 500 }
    );
  }
}
