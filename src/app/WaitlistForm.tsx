"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import styles from "./waitlist.module.css";

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
      setState({ kind: "error", message: "We couldn’t connect. Please try again." });
    }
  }

  if (state.kind === "done") {
    return (
      <p className={styles.success} role="status">
        You’re on the list. We’ll be in touch when a place is ready for your collection.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={styles.form} aria-label="Request an invitation" aria-busy={state.kind === "busy"}>
      <input
        className={styles.input}
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        aria-label="Email address"
        aria-invalid={state.kind === "error"}
        aria-describedby={state.kind === "error" ? "waitlist-error" : undefined}
      />
      <button className={styles.button} type="submit" disabled={state.kind === "busy"}>
        {state.kind === "busy" ? "Sending…" : "Request access"}
        <ArrowUpRight size={15} aria-hidden="true" />
      </button>
      {state.kind === "error" && <p id="waitlist-error" role="alert" className={styles.error}>{state.message}</p>}
    </form>
  );
}
