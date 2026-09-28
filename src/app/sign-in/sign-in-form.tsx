"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/admin",
    });
    if (error) {
      setBusy(false);
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

  return (
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
        disabled={busy}
        style={{
          marginTop: "0.6rem",
          padding: "0.95rem 2.4rem",
          border: "1px solid var(--foreground)",
          background: "transparent",
          cursor: busy ? "wait" : "pointer",
          fontFamily: "var(--font-display)",
          fontSize: "0.66rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--foreground)",
        }}
      >
        {busy ? "One moment" : "Enter"}
      </button>
    </form>
  );
}
