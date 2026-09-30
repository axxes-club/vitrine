import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { AwaitingAccess } from "@/components/awaiting-access";
import { NeedsSubscription } from "@/components/needs-subscription";
import { CollectionSwitcher } from "@/components/collection-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { vitrinePlans } from "@/lib/billing";
import { requireContext, canEdit, getAccess } from "@/lib/context";
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

  return (
    <main className="min-h-screen">
      <div className="frame py-8">
        <PageHeader
          heading={ctx.tenant.name}
          description="The collection, as it stands."
          actions={
            ctx.collections.length > 1 ? (
              <CollectionSwitcher
                collections={ctx.collections}
                activeSlug={ctx.tenant.slug}
              />
            ) : undefined
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
