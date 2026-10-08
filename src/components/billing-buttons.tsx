"use client";

import { useState } from "react";

async function openBilling(path: string, body?: object) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url) throw new Error(data.error || "Something went wrong");
  window.location.href = data.url;
}

/** Monthly and annual subscribe buttons for one plan. Payment is taken on AXXES Payments. */
export function SubscribeButtons({ plan, monthly, annual }: { plan: string; monthly: number; annual: number | null }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const go = async (interval: string) => {
    setBusy(interval);
    setError(null);
    try { await openBilling("/api/billing/checkout", { plan, interval }); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); setBusy(null); }
  };
  const btn = { display: "block", width: "100%", marginTop: "0.6rem", padding: "0.7rem 1rem", border: "1px solid var(--foreground)", background: "transparent", cursor: "pointer", font: "inherit" } as const;
  return (
    <div style={{ marginTop: "2rem" }}>
      <button style={{ ...btn, background: "var(--foreground)", color: "var(--background)" }} disabled={busy !== null} onClick={() => go("monthly")}>
        {busy === "monthly" ? "Opening checkout…" : `Subscribe · $${(monthly / 100).toFixed(0)}/month`}
      </button>
      {annual ? (
        <button style={btn} disabled={busy !== null} onClick={() => go("annual")}>
          {busy === "annual" ? "Opening checkout…" : `Subscribe yearly · $${(annual / 100).toLocaleString()}/year`}
        </button>
      ) : null}
      {error && <p role="alert" style={{ marginTop: "0.6rem", color: "#b42318", fontSize: "0.85rem" }}>{error}</p>}
    </div>
  );
}

/** Opens the billing portal (update card, cancel) for the active collection. */
export function ManageSubscriptionButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        className="text-xs underline underline-offset-4"
        disabled={busy}
        onClick={async () => { setBusy(true); try { await openBilling("/api/billing/portal"); } catch (e) { setError(e instanceof Error ? e.message : "Unavailable"); setBusy(false); } }}
      >
        {busy ? "Opening…" : "Manage subscription"}
      </button>
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </>
  );
}
