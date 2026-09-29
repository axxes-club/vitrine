"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"sso" | "password" | null>(null);

  // "Continue with AXXES" — Handshake is the suite's identity provider, so an
  // AXXES account opens the desk without typing a password here.
  async function withAxxes() {
    if (busy) return;
    setBusy("sso");
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "axxes",
        callbackURL: "/admin",
      });
      // The browser leaves for Handshake; nothing to do on success.
    } catch {
      setBusy(null);
      setError("Could not reach AXXES sign-in. Please try again.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy("password");
    setError(null);
    const { error } = await authClient.signIn.email({
      // Stored lowercased; fold the input so Me.com still matches me.com.
      email: email.trim().toLowerCase(),
      password,
      callbackURL: "/admin",
    });
    if (error) {
      setBusy(null);
      setError("That email or password doesn't match our records.");
    }
    // On success better-auth navigates to the callback URL.
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid var(--line)",
    outline: "none",
    background: "transparent",
    padding: "0.8rem 0.2rem",
    fontFamily: "var(--font-serif)",
    fontSize: "1.05rem",
    color: "var(--foreground)",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "0.95rem 2.4rem",
    border: "1px solid var(--foreground)",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
    fontSize: "0.66rem",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "var(--foreground)",
    width: "100%",
  };

  return (
    <div style={{ display: "grid", gap: "1.6rem" }}>
      <button
        type="button"
        onClick={withAxxes}
        disabled={busy !== null}
        style={{ ...buttonStyle, cursor: busy ? "wait" : "pointer" }}
      >
        {busy === "sso" ? "One moment" : "Continue with AXXES"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <hr className="rule" style={{ flex: 1 }} />
        <span className="overline">or</span>
        <hr className="rule" style={{ flex: 1 }} />
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "1.4rem" }}>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          style={inputStyle}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          style={inputStyle}
        />
        {error && (
          <p role="alert" style={{ fontSize: "0.92rem", color: "#8a2f2f" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy !== null}
          style={{ ...buttonStyle, marginTop: 0, cursor: busy ? "wait" : "pointer" }}
        >
          {busy === "password" ? "One moment" : "Enter"}
        </button>
      </form>
    </div>
  );
}
