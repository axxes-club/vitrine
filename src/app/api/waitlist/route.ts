import { NextResponse } from "next/server";
import { Pool } from "pg";

// One small pool is enough for a landing page.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json(
      { error: "That address doesn't look right." },
      { status: 400 }
    );
  }

  try {
    // A repeat signup is a friendly no-op, not an error.
    const inserted = await pool.query(
      `INSERT INTO waitlist (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET updated_at = now()
       RETURNING (xmax = 0) AS created`,
      [email, req.headers.get("referer") ?? null]
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
