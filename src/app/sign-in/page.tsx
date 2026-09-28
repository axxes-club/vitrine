import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, HANDSHAKE_URL } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in — Vitrine" };

export default async function SignInPage() {
  if (await auth.api.getSession({ headers: await headers() })) redirect("/admin");
  if (HANDSHAKE_URL) {
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${
      h.get("x-forwarded-host") ?? h.get("host")
    }`;
    redirect(`${HANDSHAKE_URL}/sign-in?redirect=${encodeURIComponent(`${origin}/admin`)}`);
  }
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "0 6vw" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <span className="wordmark" style={{ fontSize: "0.85rem" }}>
          Vitrine
        </span>
        <h1
          className="serif"
          style={{ marginTop: "2.2rem", fontWeight: 300, fontSize: "2rem" }}
        >
          The administrator's desk
        </h1>
        <p className="serif" style={{ marginTop: "0.6rem", color: "var(--muted)" }}>
          Use your AXXES account.
        </p>
        <div style={{ marginTop: "2rem" }}>
          <SignInForm />
        </div>
        <p
          className="overline"
          style={{ marginTop: "2.4rem", letterSpacing: "0.22em" }}
        >
          Vitrine by AXXES
        </p>
      </div>
    </main>
  );
}
