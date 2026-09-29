"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Switches which collection the desk is looking at.
 *
 * A client component only because the interaction is a form submit and a
 * redirect — the authoritative check happens on the server, which re-validates
 * the requested collection against what this person may actually open. A
 * crafted cookie naming someone else's collection gets ignored, not trusted.
 */
export function CollectionSwitcher({
  collections,
  activeSlug,
}: {
  collections: Array<{ id: string; name: string; slug: string; role: string }>;
  activeSlug: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  if (collections.length < 2) return null;

  const active = collections.find((c) => c.slug === activeSlug) ?? collections[0];

  async function choose(slug: string) {
    setPending(true);
    await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setOpen(false);
    setPending(false);
    router.refresh();
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "transparent",
          border: "1px solid var(--line)",
          color: "var(--muted)",
          padding: "0.45rem 0.8rem",
          borderRadius: 999,
          fontFamily: "var(--font-display)",
          fontSize: "0.62rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          cursor: "pointer",
          opacity: pending ? 0.5 : 1,
        }}
      >
        <span style={{ color: "inherit" }}>{active.name}</span>
        <span aria-hidden style={{ fontSize: "0.55rem" }}>▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 0.4rem)",
            right: 0,
            minWidth: "14rem",
            margin: 0,
            padding: "0.3rem",
            listStyle: "none",
            background: "var(--background)",
            border: "1px solid var(--line)",
            boxShadow: "0 12px 32px rgba(17,17,17,0.10)",
            zIndex: 60,
          }}
        >
          {collections.map((c) => {
            const isActive = c.slug === active.slug;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => choose(c.slug)}
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "0.8rem",
                    padding: "0.55rem 0.7rem",
                    background: isActive ? "var(--line)" : "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                >
                  <span className="serif" style={{ fontSize: "1rem" }}>
                    {c.name}
                  </span>
                  <span className="overline">{c.role}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
