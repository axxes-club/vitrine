import { redirect } from "next/navigation";
import Link from "next/link";
import { requireContext, getAccess } from "@/lib/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Viewing Room — Vitrine" };

/** The collection renderer is ORC internally; the signed-in product is Vitrine. */
export default async function ViewingRoom() {
  const ctx = await requireContext();
  const access = await getAccess(ctx);
  if (!access.allowed || !ctx.tenant) redirect("/orc");
  const published = ctx.tenant.slug === "coleccion-reyes-veray";
  return <main className="min-h-screen">
    <header className="frame flex items-center justify-between gap-4 py-6">
      <div><Link href="/orc" className="wordmark">Vitrine</Link><p className="mt-2 text-xs text-muted-foreground">{ctx.tenant.name} · Viewing room</p></div>
      <Link href="/orc" className="text-xs underline underline-offset-4">Return to the desk</Link>
    </header>
    {published ? <iframe src="https://orc.axxes.app" title={`${ctx.tenant.name} — Vitrine viewing room`} className="w-full border-0" style={{height:"calc(100vh - 110px)",minHeight:600}} referrerPolicy="strict-origin-when-cross-origin" /> : <div className="frame py-16"><h1 className="serif text-3xl">Your collection’s viewing room</h1><p className="mt-4 text-muted-foreground">This collection does not have a published viewing room yet.</p></div>}
  </main>;
}
