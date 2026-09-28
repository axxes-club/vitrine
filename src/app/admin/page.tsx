import { desc, eq, sql } from "drizzle-orm";
import { requireContext, canEdit } from "@/lib/context";
import { AwaitingAccess } from "@/components/awaiting-access";
import { db } from "@/lib/db";
import { products, artworkDetails } from "@/lib/db/schema";

export const metadata = { title: "The Desk — Vitrine" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ctx = await requireContext();

  // A valid AXXES account with no seat at this collection: show them the door
  // and who opens it, rather than a desk where every control is inert.
  if (!ctx.role) {
    return (
      <AwaitingAccess
        name={ctx.user?.name}
        email={ctx.user?.email}
      />
    );
  }

  const [counts] = await db
    .select({
      works: sqlCount(),
    })
    .from(products)
    .where(eq(products.tenantId, ctx.tenant.id));

  const recent = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      images: products.images,
      status: products.status,
      updatedAt: products.updatedAt,
      artist: artworkDetails.artistName,
      title: artworkDetails.title,
      year: artworkDetails.year,
      medium: artworkDetails.medium,
      inventoryNumber: artworkDetails.inventoryNumber,
    })
    .from(products)
    .leftJoin(artworkDetails, eq(artworkDetails.productId, products.id))
    .where(eq(products.tenantId, ctx.tenant.id))
    .orderBy(desc(products.updatedAt))
    .limit(12);

  return (
    <main style={{ minHeight: "100vh", padding: "2.2rem 6vw 4rem" }}>
      {/* Masthead */}
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "0.8rem 2rem",
        }}
      >
        <span className="wordmark" style={{ fontSize: "0.85rem" }}>
          Vitrine
        </span>
        <nav className="overline" style={{ display: "flex", gap: "1.8rem" }}>
          <a href="https://handshake.axxes.club" style={{ color: "inherit", textDecoration: "none" }}>
            AXXES apps
          </a>
          <a href="/api/auth/sign-out" style={{ color: "inherit", textDecoration: "none" }}>
            Sign out
          </a>
        </nav>
      </header>

      {/* Heading */}
      <section style={{ marginTop: "8vh", maxWidth: 1100, marginInline: "auto" }}>
        <p className="overline">{ctx.tenant.name}</p>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: "clamp(2rem, 4.5vw, 3.2rem)" }}>
          The administrator's desk
        </h1>
        <p className="serif" style={{ marginTop: "0.8rem", color: "var(--muted)", fontSize: "1.1rem" }}>
          Signed in as {ctx.user.email} · {ctx.role}
          {canEdit(ctx.role) ? "" : " (read-only)"}
        </p>
      </section>

      {/* Collection summary */}
      <section
        style={{
          marginTop: "5vh",
          maxWidth: 1100,
          marginInline: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1px",
          background: "var(--line)",
          border: "1px solid var(--line)",
        }}
      >
        {[
          ["Works in the collection", counts?.works ?? 0],
          ["Artists", "—"],
          ["On view", "—"],
        ].map(([label, value]) => (
          <div key={String(label)} style={{ background: "var(--background)", padding: "1.6rem" }}>
            <p className="overline">{label}</p>
            <p
              className="serif"
              style={{ marginTop: "0.5rem", fontSize: "2rem", fontWeight: 300 }}
            >
              {value}
            </p>
          </div>
        ))}
      </section>

      {/* Recent works */}
      <section style={{ marginTop: "6vh", maxWidth: 1100, marginInline: "auto" }}>
        <hr className="rule" />
        <h2 className="serif" style={{ marginTop: "2.4rem", fontWeight: 400, fontSize: "1.6rem" }}>
          Recently touched
        </h2>
        <div
          style={{
            marginTop: "1.6rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "2rem 1.4rem",
          }}
        >
          {recent.map(w => {
            const img = w.images?.find(i => i.position === 0)?.url ?? w.images?.[0]?.url;
            return (
              <a
                key={w.id}
                href={`https://coleccionreyesveray.com/art/${w.slug ?? w.id}`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <div
                  style={{
                    aspectRatio: "1",
                    background: "#f2f1ef",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                  }}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={w.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span className="overline">No image</span>
                  )}
                </div>
                <p className="serif" style={{ marginTop: "0.7rem", fontSize: "1.05rem" }}>
                  {w.artist ?? "Unknown artist"}
                </p>
                <p className="serif" style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                  {w.title ?? w.name}
                  {w.year ? `, ${w.year}` : ""}
                </p>
                <p className="overline" style={{ marginTop: "0.3rem" }}>
                  {w.inventoryNumber ?? w.status}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      <footer
        style={{
          marginTop: "10vh",
          borderTop: "1px solid var(--line)",
          paddingTop: "2rem",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <span className="wordmark" style={{ fontSize: "0.68rem" }}>
          Vitrine by AXXES
        </span>
        <span className="overline">© MMXXVI</span>
      </footer>
    </main>
  );
}

function sqlCount() {
  return sql`count(*)`.mapWith(Number);
}
