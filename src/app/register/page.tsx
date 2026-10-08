import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, getAppSession } from "@/lib/auth";
import { vitrinePlans } from "@/lib/billing";
import { RegisterForm } from "./register-form";
import styles from "../account.module.css";
export const metadata = { title: "Create your account — Vitrine" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  if (await getAppSession(await headers())) redirect("/orc");
  const requested = (await searchParams).plan;
  const plans = (await vitrinePlans()).filter(p => p.maxApps === 1);
  const selectedPlan = plans.some(p => p.key === requested) ? requested : undefined;
  return <main className={styles.page}><div className={styles.card}>
    <Link href="/" className={styles.wordmark}>vitrine<span>.</span></Link>
    <p className={styles.eyebrow}>YOUR COLLECTION’S NEXT CHAPTER</p>
    <h1>Create your account.</h1>
    <p className={styles.intro}>One account for your collection’s records, history, and future. Collection access is activated with your membership.</p>
    <RegisterForm plans={plans.map(({key,name,priceCents})=>({key,name,priceCents}))} selectedPlan={selectedPlan} />
    <p className={styles.note}>Already have an account? <Link href="/sign-in">Sign in</Link></p>
    <Link href="/#membership" className={styles.back}>Explore memberships</Link>
  </div></main>;
}
