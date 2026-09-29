"use client";

import { useState } from "react";
import type { Plan } from "@/lib/billing";

/**
 * Signed in, seated, but the collection is not on a plan that includes Vitrine.
 *
 * This is the screen a collector arrives at immediately after paying, so it has
 * to be the same product the landing page described — same names, same prices,
 * same order — or the first thing they see contradicts the page that sold it.
 *
 * The copy names the work, not the mechanism. A registrar's objection to
 * "artificial intelligence" is not marketing taste: the record has to be
 * defensible in a dispute, and a record nobody can account for is worth
 * nothing. Everything the second tier proposes is reviewed by a human before it
 * is written, and that is the claim being made.
 */
export function NeedsSubscription({
  collectionName,
  currentPlan,
  plans,
}: {
  collectionName: string;
  currentPlan: string | null;
  plans: Plan[];
}) {
  const [sent, setSent] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "4rem 6vw 6rem",
        maxWidth: "62rem",
        marginInline: "auto",
      }}
    >
      <p className="overline">The Desk · Vitrine</p>

      <h1
        className="serif"
        style={{
          fontWeight: 300,
          fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)",
          lineHeight: 1.15,
          marginTop: "1.2rem",
        }}
      >
        {collectionName} is ready.
        <br />
        <span style={{ color: "var(--muted)" }}>It needs a plan to open.</span>
      </h1>

      <p
        className="serif"
        style={{
          marginTop: "1.4rem",
          maxWidth: "38rem",
          color: "var(--muted)",
          lineHeight: 1.65,
          fontSize: "1.05rem",
        }}
      >
        Your seat is active and your records are exactly where you left them.
        {" "}
        {currentPlan
          ? `${collectionName} is currently on ${currentPlan}, which does not include Vitrine.`
          : `${collectionName} does not have a plan yet.`}{" "}
        Choose one and the desk opens.
      </p>

      <div
        style={{
          marginTop: "3.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))",
          gap: "1px",
          background: "var(--line)",
          border: "1px solid var(--line)",
        }}
      >
        {plans.map((p) => (
          <div key={p.key} style={{ background: "var(--background)", padding: "2rem" }}>
            <p className="overline">{p.name}</p>
            <p
              className="serif"
              style={{ marginTop: "0.6rem", fontSize: "2.4rem", fontWeight: 300 }}
            >
              ${(p.priceCents / 100).toFixed(0)}
              <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/month</span>
            </p>
            {p.blurb && (
              <p className="serif" style={{ marginTop: "0.5rem", color: "var(--muted)" }}>
                {p.blurb}
              </p>
            )}

            <ul
              style={{
                margin: "1.5rem 0 0",
                padding: 0,
                listStyle: "none",
                display: "grid",
                gap: "0.6rem",
              }}
            >
              {p.features.map((f) => (
                <li
                  key={f}
                  className="serif"
                  style={{ display: "flex", gap: "0.6rem", lineHeight: 1.5 }}
                >
                  <span aria-hidden style={{ color: "var(--muted)" }}>
                    ·
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href={`mailto:members.axxes.club?subject=${encodeURIComponent(
                `Start ${p.name} for ${collectionName}`
              )}&body=${encodeURIComponent(
                `Collection: ${collectionName}\nPlan: ${p.name} ($${(
                  p.priceCents / 100
                ).toFixed(0)}/month)\n\n`
              )}`}
              style={{
                display: "block",
                marginTop: "2rem",
                textAlign: "center",
                padding: "0.85rem 1.2rem",
                background: "#111111",
                color: "#fdfcfc",
                textDecoration: "none",
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
                borderRadius: 999,
              }}
            >
              Start {p.name}
            </a>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: "2.5rem",
          fontSize: "0.78rem",
          color: "var(--muted)",
          maxWidth: "34rem",
          lineHeight: 1.6,
        }}
      >
        {sent ? "Noted." : "Plans are per organization and cover one collection. "}
        Nothing is charged from this page — the AXXES team sets the plan up with
        you and the desk opens as soon as it is on.
      </p>
    </main>
  );
}
