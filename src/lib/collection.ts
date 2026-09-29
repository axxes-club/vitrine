/**
 * The collection queries the desk runs.
 *
 * Two rules shape everything here.
 *
 * THE INDEX IS A JOIN, AND MUST STAY ONE QUERY
 *
 * A work is a `vitrine_works` row (accession, status, location) and a catalogue
 * row (`artwork_details`: medium, dimensions, year) with images on `products`.
 * The index shows all three. Fetching them separately and stitching in
 * JavaScript is the N+1 that turns 3,667 rows into 3,667 round trips, which is
 * what makes a desk over a real collection feel slow. One query, keyed and
 * counted in SQL, so the facets come off indexes.
 *
 * FACETS ARE COUNTS, NOT A ROUND TRIP PER VALUE
 *
 * `facetCounts()` derives the artist, decade, medium, status and location counts
 * from the same filtered set the rows came from, in SQL. Counting in JavaScript
 * would mean shipping 3,667 rows to count them, which is the mistake again.
 */

import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, artworkDetails, artists, vitrineWorks } from "@/lib/db/schema";

export type WorkRow = {
  workId: string;
  accession: string;
  productId: string | null;
  artistId: string | null;
  artistName: string | null;
  artistSlug: string | null;
  /** Nullable in the database: a wired work always has one, but the column is. */
  title: string | null;
  medium: string | null;
  dimensions: string | null;
  year: string | null;
  status: string;
  location: string | null;
  /** Defaults to true in the column, so a null here means "not recorded". */
  onSite: boolean | null;
  /** The number the collection originally used, which may be a shared base. */
  legacyNumber: string | null;
  image: string | null;
};

export type WorksQuery = {
  tenantId: string;
  search?: string;
  artistSlug?: string;
  status?: string;
  decade?: number;
  locationKind?: string;
  hasImage?: boolean;
  sort?: "accession" | "artist" | "year" | "title" | "updated";
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
};

const PER_PAGE_MAX = 200;

/** images is jsonb; this picks the first usable url out of it. */
const FIRST_IMAGE = sql<string | null>`
  CASE
    WHEN p.images IS NULL OR jsonb_array_length(p.images) = 0 THEN NULL
    ELSE (
      SELECT im->>'url'
      FROM jsonb_array_elements(p.images) AS im
      WHERE im->>'url' IS NOT NULL
      LIMIT 1
    )
  END
`;

/** "1998" / "c. 1998" / "1998-99" -> 1990, for the decade facet. */
const DECADE = sql<number | null>`
  CASE
    WHEN d.year ~ '^[0-9]{4}' THEN (substring(d.year from 1 for 4))::int / 10 * 10
    ELSE NULL
  END
`;

/** Filters shared by the rows and the facet counts, so the two cannot disagree. */
function buildConditions(q: WorksQuery): SQL[] {
  const c: SQL[] = [eq(vitrineWorks.tenantId, q.tenantId)];

  if (q.search?.trim()) {
    const term = `%${q.search.trim()}%`;
    c.push(
      or(
        ilike(vitrineWorks.accession, term),
        ilike(vitrineWorks.title, term),
        ilike(artworkDetails.artistName, term),
        ilike(artworkDetails.medium, term),
        ilike(artworkDetails.title, term),
        ilike(artworkDetails.series, term),
        ilike(artworkDetails.inventoryNumber, term)
      )!
    );
  }
  if (q.artistSlug) c.push(eq(artworkDetails.artistSlug, q.artistSlug));
  if (q.status) c.push(eq(vitrineWorks.status, q.status));
  if (typeof q.decade === "number") c.push(sql`${DECADE} = ${q.decade}`);
  if (q.locationKind) c.push(eq(vitrineWorks.locationKind, q.locationKind));
  if (q.hasImage) c.push(sql`${FIRST_IMAGE} IS NOT NULL`);

  return c;
}

const SORTABLE = {
  accession: vitrineWorks.accession,
  artist: artworkDetails.artistName,
  year: artworkDetails.year,
  title: vitrineWorks.title,
  updated: vitrineWorks.updatedAt,
} as const;

/**
 * One page of works, plus the total for the same filter.
 *
 * Counted in SQL and returned alongside, because a separate COUNT on every
 * filter change is a second round trip a registrar feels on every keystroke.
 * The secondary sort on accession is what keeps pagination stable — two works
 * with no year would otherwise swap places and a row could be shown twice.
 */
export async function listWorks(q: WorksQuery): Promise<{
  rows: WorkRow[];
  total: number;
  page: number;
  perPage: number;
}> {
  const page = Math.max(1, q.page ?? 1);
  const perPage = Math.min(PER_PAGE_MAX, Math.max(1, q.perPage ?? 50));
  const where = and(...buildConditions(q));

  const orderCol = SORTABLE[(q.sort ?? "accession") as keyof typeof SORTABLE] ?? vitrineWorks.accession;
  const dir = q.dir === "desc" ? desc : asc;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        workId: vitrineWorks.id,
        accession: vitrineWorks.accession,
        productId: vitrineWorks.productId,
        artistId: vitrineWorks.artistId,
        artistName: artworkDetails.artistName,
        artistSlug: artworkDetails.artistSlug,
        title: vitrineWorks.title,
        medium: artworkDetails.medium,
        dimensions: artworkDetails.dimensions,
        year: artworkDetails.year,
        status: vitrineWorks.status,
        location: vitrineWorks.location,
        onSite: vitrineWorks.onSite,
        legacyNumber: artworkDetails.inventoryNumber,
        image: FIRST_IMAGE,
      })
      .from(vitrineWorks)
      .leftJoin(products, eq(products.id, vitrineWorks.productId))
      .leftJoin(artworkDetails, eq(artworkDetails.productId, vitrineWorks.productId))
      .where(where)
      .orderBy(dir(orderCol), asc(vitrineWorks.accession))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(vitrineWorks)
      .leftJoin(products, eq(products.id, vitrineWorks.productId))
      .leftJoin(artworkDetails, eq(artworkDetails.productId, vitrineWorks.productId))
      .where(where),
  ]);

  return { rows, total: totalRow?.n ?? 0, page, perPage };
}

export type Facet = { value: string; label: string; count: number };

/**
 * Counts for the filter sidebar, derived from the same filtered set.
 *
 * Each facet counts over the collection as it stands *before* that one facet is
 * applied, which is what makes a sidebar usable: with an artist applied you
 * still see how many works every other artist has, instead of one row and five
 * zeros.
 */
export async function facetCounts(q: WorksQuery): Promise<{
  artists: Facet[];
  decades: Facet[];
  media: Facet[];
  statuses: Facet[];
  locations: Facet[];
}> {
  const without = <K extends keyof WorksQuery>(omit: K) => {
    const next = { ...q };
    delete next[omit];
    return and(...buildConditions(next))!;
  };

  const [artistRows, decadeRows, mediumRows, statusRows, locationRows] =
    await Promise.all([
      db
        .select({
          value: artists.slug,
          label: artists.name,
          count: sql<number>`count(*)::int`,
        })
        .from(vitrineWorks)
        .innerJoin(artists, eq(artists.id, vitrineWorks.artistId))
        .where(without("artistSlug"))
        .groupBy(artists.slug, artists.name)
        .orderBy(sql`count(*) DESC`),
      db
        .select({ value: sql<string>`${DECADE}::text`, count: sql<number>`count(*)::int` })
        .from(vitrineWorks)
        .leftJoin(products, eq(products.id, vitrineWorks.productId))
        .leftJoin(artworkDetails, eq(artworkDetails.productId, vitrineWorks.productId))
        .where(without("decade"))
        .groupBy(DECADE)
        .orderBy(desc(DECADE)),
      db
        .select({ value: artworkDetails.medium, count: sql<number>`count(*)::int` })
        .from(vitrineWorks)
        .leftJoin(products, eq(products.id, vitrineWorks.productId))
        .leftJoin(artworkDetails, eq(artworkDetails.productId, vitrineWorks.productId))
        .where(without("search"))
        .groupBy(artworkDetails.medium)
        .orderBy(sql`count(*) DESC`),
      db
        .select({ value: vitrineWorks.status, count: sql<number>`count(*)::int` })
        .from(vitrineWorks)
        .where(without("status"))
        .groupBy(vitrineWorks.status)
        .orderBy(sql`count(*) DESC`),
      db
        .select({ value: vitrineWorks.location, count: sql<number>`count(*)::int` })
        .from(vitrineWorks)
        .where(without("locationKind"))
        .groupBy(vitrineWorks.location)
        .orderBy(sql`count(*) DESC`)
        .limit(24),
    ]);

  // A free-text medium is a list of free text: grouped raw it yields one row per
  // work. Take the leading term instead, so "Litografía sobre papel" and
  // "Litografía" bucket rather than compete.
  const mediaBuckets = new Map<string, number>();
  for (const r of mediumRows) {
    if (!r.value) continue;
    const lead = r.value.split(/[/,\n]/)[0].trim().slice(0, 28);
    if (!lead) continue;
    mediaBuckets.set(lead, (mediaBuckets.get(lead) || 0) + r.count);
  }

  return {
    artists: artistRows
      .filter((r) => r.value)
      .slice(0, 40)
      .map((r) => ({ value: r.value as string, label: r.label || r.value, count: r.count })),
    decades: decadeRows
      .filter((r) => r.value && r.value !== "null")
      .map((r) => ({ value: r.value, label: `${r.value}s`, count: r.count })),
    media: [...mediaBuckets.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([value, count]) => ({ value, label: value, count })),
    statuses: statusRows.map((r) => ({ value: r.value, label: r.value, count: r.count })),
    locations: locationRows
      .filter((r) => r.value)
      .map((r) => ({ value: r.value as string, label: r.value as string, count: r.count })),
  };
}

/** Headline figures for the desk. Computed, never hardcoded. */
export async function collectionSummary(tenantId: string) {
  const [row] = await db
    .select({
      works: sql<number>`count(*)::int`,
      onSite: sql<number>`count(*) FILTER (WHERE ${vitrineWorks.onSite})::int`,
      deaccessioned: sql<number>`count(*) FILTER (WHERE ${vitrineWorks.status} = 'deaccessioned')::int`,
      onLoan: sql<number>`count(*) FILTER (WHERE ${vitrineWorks.status} = 'on_loan')::int`,
      artists: sql<number>`count(DISTINCT ${vitrineWorks.artistId})::int`,
    })
    .from(vitrineWorks)
    .where(eq(vitrineWorks.tenantId, tenantId));

  return {
    works: row?.works ?? 0,
    onSite: row?.onSite ?? 0,
    deaccessioned: row?.deaccessioned ?? 0,
    onLoan: row?.onLoan ?? 0,
    artists: row?.artists ?? 0,
  };
}
