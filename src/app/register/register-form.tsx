"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "../account.module.css";
export function RegisterForm({ plans, selectedPlan }: { plans: {key:string;name:string;priceCents:number}[]; selectedPlan?:string }) {
  const [plan, setPlan] = useState(selectedPlan ?? plans[0]?.key ?? "");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(null);
    let created = accountCreated;
    try {
      if (!created) {
      const result = await authClient.signUp.email({ name: name.trim(), email: email.trim().toLowerCase(), password, callbackURL: "/orc" });
      if (result.error) { setError("We couldn’t create that account. If you already have an account, please sign in."); setBusy(false); return; }
      created = true; setAccountCreated(true); setPassword("");
      }
      // Membership activation remains the existing human-assisted flow.
      const request = await fetch("/api/waitlist", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim().toLowerCase(),...(plan?{plan}:{})})});
      if (!request.ok) throw new Error("Membership request failed");
      router.replace("/orc"); router.refresh();
    } catch { setError(created ? "Your account is ready. We couldn’t record your membership request. Please retry below." : "We couldn’t connect. Please try again."); setBusy(false); }
  }
  return <form onSubmit={submit} className={styles.form} aria-busy={busy}>
    <label>Name<input name="name" autoComplete="name" required disabled={accountCreated} maxLength={120} value={name} onChange={e=>setName(e.target.value)} /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required disabled={accountCreated} maxLength={320} value={email} onChange={e=>setEmail(e.target.value)} /></label>
    <label>Password<input name="password" type="password" autoComplete="new-password" required disabled={accountCreated} minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} /></label>
    {plans.length > 0 && <label>Membership<select name="plan" value={plan} onChange={e=>setPlan(e.target.value)}>{plans.map(p=><option key={p.key} value={p.key}>{p.name} · ${p.priceCents/100}/month</option>)}</select></label>}
    <p className={styles.hint}>Use at least 8 characters.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button type="submit" disabled={busy}>{busy ? "One moment…" : accountCreated ? "Retry membership request" : "Create account"}</button>
  </form>;
}
