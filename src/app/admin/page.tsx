import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { AwaitingAccess } from "@/components/awaiting-access";
import { NeedsSubscription } from "@/components/needs-subscription";
import { ManageSubscriptionButton } from "@/components/billing-buttons";
import { AllAppsSwitcher } from "@/components/all-apps-switcher";
import { CollectionSwitcher } from "@/components/collection-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { vitrinePlans } from "@/lib/billing";
import { requireContext, canEdit, getAccess } from "@/lib/context";
import { getCustomerBrand } from "@/lib/white-label";
import { vitrineWorks, vitrineEvents, vitrineValuations } from "@/lib/db/schema";
import { collectionSummary, listWorks, facetCounts, type WorkRow } from "@/lib/collection";
import { WorksTable } from "@/components/works-table";
import type { Facet } from "@/lib/collection";

export const metadata = { title: "The Desk — Vitrine" };
export const dynamic = "force-dynamic";

/** The desk's landing view: the collection at a glance, then the index. */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireContext();

  // A valid AXXES account with no seat at this collection: show them the door
  // and who opens it, rather than a desk where every control is inert.
  if (!ctx.role || !ctx.tenant) {
    return <AwaitingAccess name={ctx.user?.name} email={ctx.user?.email} />;
  }

  // Seated, but the collection is not on a plan that includes Vitrine. Show the
  // plans rather than a desk, because a desk nobody can save into is worse than
  // an honest "this needs a plan".
  const access = await getAccess(ctx);
  if (!access.allowed && access.reason === "no-subscription") {
    return (
      <NeedsSubscription
        collectionName={ctx.tenant.name}
        currentPlan={ctx.subscription?.plan?.name ?? null}
        plans={await vitrinePlans()}
        collections={ctx.collections}
        activeSlug={ctx.tenant.slug}
        canSubscribe={ctx.role === "admin"}
        returned={typeof (await searchParams).subscription === "string" ? ((await searchParams).subscription as string) : null}
      />
    );
  }

  const params = await searchParams;
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const query = {
    tenantId: ctx.tenant.id,
    search: one("q") ?? undefined,
    artistSlug: one("artist") ?? undefined,
    status: one("status") ?? undefined,
    decade: one("decade") ? Number(one("decade")) : undefined,
    sort: (one("sort") as "accession") ?? undefined,
    dir: (one("dir") as "asc") ?? undefined,
    page: one("page") ? Number(one("page")) : 1,
    perPage: 50,
  };

  // Rows and facets in parallel: they are independent reads of the same tables,
  // and a desk that waits for both before painting is a desk that feels slow.
  const [summary, { rows, total, page, perPage }, facets] = await Promise.all([
    collectionSummary(ctx.tenant.id),
    listWorks(query),
    facetCounts(query),
  ]);

  const [events, values] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(vitrineEvents)
      .where(eq(vitrineEvents.tenantId, ctx.tenant.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(vitrineValuations)
      .where(eq(vitrineValuations.tenantId, ctx.tenant.id)),
  ]);

  const stats = [
    { label: "Works", value: summary.works.toLocaleString() },
    { label: "On site", value: summary.onSite.toLocaleString() },
    { label: "Artists", value: summary.artists.toLocaleString() },
    { label: "On loan", value: summary.onLoan.toLocaleString() },
    { label: "Recorded events", value: (events[0]?.n ?? 0).toLocaleString() },
    { label: "Valuations", value: (values[0]?.n ?? 0).toLocaleString() },
  ];

  // A white-label customer's desk carries their mark and color.
  const brand = await getCustomerBrand(ctx.tenant.id);

  return (
    <main className="min-h-screen" style={brand?.accent ? ({ "--primary": hslParts(brand.accent) } as React.CSSProperties) : undefined}>
      <div className="frame py-8">
        {brand && (
          <div className="mb-6 flex items-center gap-3">
            {(brand.iconUrl || brand.logoUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(brand.iconUrl || brand.logoUrl)!} alt="" className="h-9 max-w-[160px] object-contain" />
            )}
            <span className="text-xs text-muted-foreground">{brand.name} · Powered by AXXES</span>
          </div>
        )}
        <PageHeader
          heading={ctx.tenant.name}
          description="The collection, as it stands."
          actions={
            <div className="flex items-center gap-2">
              <Link href="/orc/viewing-room" className="text-xs underline underline-offset-4">Viewing room</Link>
              {ctx.role === "admin" && ctx.subscription && ctx.subscription.status !== "incomplete" && access.planName !== "AXXES internal" && access.planName !== "AXXES CLUB" && <ManageSubscriptionButton />}
              <AllAppsSwitcher />
              {ctx.collections.length > 1 && <CollectionSwitcher
                collections={ctx.collections}
                activeSlug={ctx.tenant.slug}
              />}
            </div>
          }
        />

        {/* The figures, computed rather than asserted. */}
        <dl className="mt-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-background px-4 py-5">
              <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1 font-serif text-3xl tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-14">
          <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="font-serif text-2xl">The works</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Accession · image · artist · title · medium · year · status
            </span>
          </div>
          <WorksTable
            rows={rows}
            total={total}
            page={page}
            perPage={perPage}
            facets={facets}
            canEdit={canEdit(ctx.role)}
          />
        </section>
      </div>
    </main>
  );
}

/** Vitrine's theme keeps colors as bare HSL parts ("40 20% 43%"); a customer's hex is converted. */
function hslParts(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
  }
  hue = Math.round(hue * 60 + 360) % 360;
  return `${hue} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
