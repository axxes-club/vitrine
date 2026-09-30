"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, ArrowUpDown, Loader2 } from "lucide-react";
import type { Facet, WorkRow } from "@/lib/collection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Filter state lives in the URL, not in component state.
 *
 * A registrar looking for a work and then forwarding the link to a colleague is
 * an ordinary Tuesday. State in the URL makes that link carry the filters with
 * it, and makes the back button work, which is how anyone actually undoes a
 * filter.
 */
const SORTS = [
  { key: "accession", label: "Accession" },
  { key: "artist", label: "Artist" },
  { key: "year", label: "Year" },
  { key: "title", label: "Title" },
  { key: "updated", label: "Updated" },
] as const;

type Apply = (patch: Record<string, string | null>) => void;

export function WorksTable({
  rows,
  total,
  page,
  perPage,
  facets,
  canEdit,
}: {
  rows: WorkRow[];
  total: number;
  page: number;
  perPage: number;
  facets: {
    artists: Facet[];
    decades: Facet[];
    media: Facet[];
    statuses: Facet[];
    locations: Facet[];
  };
  canEdit: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  // The server owns the result set. Every filter change goes through the URL and
  // comes back as new rows, so there is no second copy of the collection to fall
  // out of step with the database.
  const apply: Apply = useCallback(
    (patch) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      // Any filter change invalidates the page number; staying on page 7 of a new
      // result set is never what anyone wants.
      if (!("page" in patch)) next.delete("page");
      startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
    },
    [params, pathname, router]
  );

  // Debounced, so typing does not fire a query per keystroke against 3,667 rows.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => apply({ q: search }), 300);
    return () => clearTimeout(t);
  }, [search, apply]);

  const artist = params.get("artist");
  const status = params.get("status");
  const decade = params.get("decade");
  const sort = params.get("sort") ?? "accession";
  const dir = params.get("dir") ?? "asc";
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accession, artist, title, medium, series…"
            aria-label="Search works"
            className="pl-9"
          />
          {pending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <select
            value={sort}
            onChange={(e) => apply({ sort: e.target.value })}
            aria-label="Sort by"
            className="border border-border bg-background px-2 py-2 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => apply({ dir: dir === "asc" ? "desc" : "asc" })}
            title="Reverse sort"
          >
            {dir === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FacetGroup title="Artist" items={facets.artists} activeValue={artist}
          onPick={(v) => apply({ artist: artist === v ? null : v })} />
        <FacetGroup title="Decade" items={facets.decades} activeValue={decade}
          onPick={(v) => apply({ decade: decade === v ? null : v })} />
        <FacetGroup title="Status" items={facets.statuses} activeValue={status}
          onPick={(v) => apply({ status: status === v ? null : v })} />
      </div>

      <div className="flex items-center justify-between border-y border-border py-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{total.toLocaleString()}</span>{" "}
          {total === 1 ? "work" : "works"}
          {total > 0 && (
            <span>
              {" "}· showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}
            </span>
          )}
        </p>
        {(artist || status || decade || params.get("q")) && (
          <Button variant="ghost" size="sm"
            onClick={() => {
              setSearch("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <WorksRows rows={rows} artist={artist} apply={apply} />

      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1}
            onClick={() => apply({ page: String(page - 1) })}>Previous</Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages}
            onClick={() => apply({ page: String(page + 1) })}>Next</Button>
        </div>
      )}

      {!canEdit && (
        <p className="text-xs text-muted-foreground">
          You have read access to this collection. A registrar or owner records changes.
        </p>
      )}
    </div>
  );
}

/** The rows. Split out so the table above stays readable. */
function WorksRows({
  rows,
  artist,
  apply,
}: {
  rows: WorkRow[];
  artist: string | null;
  apply: Apply;
}) {
  if (rows.length === 0) {
    return (
      <div className="border border-border py-16 text-center">
        <p className="font-serif text-xl">No work matches that.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try a broader term, or clear the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <Th className="w-24">Acc.</Th>
            <Th className="w-16">Image</Th>
            <Th>Artist</Th>
            <Th>Title</Th>
            <Th className="w-44">Medium</Th>
            <Th className="w-16">Year</Th>
            <Th className="w-28">Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((w) => (
            <tr
              key={w.workId}
              className="border-b border-border/60 transition-colors hover:bg-accent/40"
            >
              <Td className="font-mono text-xs">{w.accession}</Td>
              <Td>
                {w.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={w.image}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 border border-border object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </Td>
              <Td>
                {w.artistSlug ? (
                  <button
                    onClick={() => apply({ artist: artist === w.artistSlug ? null : w.artistSlug })}
                    className="text-left hover:underline"
                  >
                    {w.artistName}
                  </button>
                ) : (
                  <span className="text-muted-foreground">Unrecorded</span>
                )}
              </Td>
              <Td className="font-serif text-base">
                {w.title || <span className="text-muted-foreground">Untitled</span>}
              </Td>
              <Td className="text-muted-foreground">{w.medium || "—"}</Td>
              <Td className="tabular-nums">{w.year || "—"}</Td>
              <Td>
                <StatusBadge status={w.status} onSite={w.onSite} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Status is the one column where colour carries meaning: a work that is lent out
 * is not in the building, and a missing work is a different emergency again.
 */
function StatusBadge({ status, onSite }: { status: string; onSite: boolean | null }) {
  const variant =
    status === "deaccessioned"
      ? "secondary"
      : status === "on_loan"
        ? "warning"
        : status === "missing"
          ? "destructive"
          : "outline";
  return (
    <Badge variant={variant as never} className="text-[10px] uppercase tracking-wider">
      {status.replace("_", " ")}
      {onSite === false ? " · off site" : ""}
    </Badge>
  );
}

function FacetGroup({
  title,
  items,
  activeValue,
  onPick,
}: {
  title: string;
  items: Facet[];
  activeValue: string | null;
  onPick: (v: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.slice(0, 12).map((f) => (
          <button
            key={f.value}
            onClick={() => onPick(f.value)}
            className={cn(
              "border px-2 py-1 text-xs transition-colors",
              activeValue === f.value
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground"
            )}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-60">{f.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-2 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-2 py-2 align-middle", className)}>{children}</td>;
}
