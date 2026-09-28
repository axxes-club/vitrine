"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done" }
  | { kind: "error"; message: string };

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "busy") return;
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        already?: boolean;
      };
      if (!res.ok) {
        setState({
          kind: "error",
          message: body.error ?? "Something went wrong. Please try again.",
        });
        return;
      }
      setState({ kind: "done" });
    } catch {
      setState({ kind: "error", message: "The network is being shy. Please try again." });
    }
  }

  if (state.kind === "done") {
    return (
      <p
        className="serif"
        style={{ fontSize: "1.2rem", lineHeight: 1.6, fontStyle: "italic" }}
        role="status"
      >
        Noted. Your name is on the register — we will write when a place is
        ready.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        gap: 0,
        maxWidth: 460,
        margin: "0 auto",
        borderBottom: "1px solid var(--foreground)",
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@click.com"
        aria-label="Email address"
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          padding: "0.9rem 0.2rem",
          fontFamily: "var(--font-serif)",
          fontSize: "1.08rem",
          color: "var(--foreground)",
        }}
      />
      <button
        type="submit"
        disabled={state.kind === "busy"}
        style={{
          border: "none",
          background: "none",
          cursor: state.kind === "busy" ? "wait" : "pointer",
          padding: "0.9rem 0.4rem",
          fontFamily: "var(--font-display)",
          fontSize: "0.64rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "var(--foreground)",
        }}
      >
        {state.kind === "busy" ? "Sending" : "Join"}
      </button>
      {state.kind === "error" && (
        <p
          role="alert"
          style={{
            width: "100%",
            padding: "0.7rem 0.2rem 0",
            fontSize: "0.92rem",
            color: "#8a2f2f",
          }}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
