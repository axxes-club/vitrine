import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, getAppSession, HANDSHAKE_URL } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";
import styles from "../account.module.css";
export const metadata = { title: "Sign in — Vitrine" };
export default async function SignInPage() {
  if (await getAppSession(await headers())) redirect("/orc");
  if (HANDSHAKE_URL) {
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    redirect(`${HANDSHAKE_URL}/sign-in?redirect=${encodeURIComponent(`${origin}/orc`)}`);
  }
  return <main className={styles.page}><div className={styles.card}>
    <Link href="/" className={styles.wordmark}>vitrine<span>.</span></Link>
    <p className={styles.eyebrow}>THE COLLECTION, IN FOCUS</p>
    <h1>Welcome back.</h1>
    <p className={styles.intro}>Sign in to open your Vitrine collection.</p>
    <SignInForm />
    <p className={styles.note}>New to Vitrine? <Link href="/register">Create an account</Link></p>
    <Link href="/" className={styles.back}>Return to Vitrine</Link>
  </div></main>;
}
