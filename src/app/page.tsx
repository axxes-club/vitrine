import Image from "next/image";
import WaitlistForm from "@/app/WaitlistForm";
import { vitrinePlans, type Plan } from "@/lib/billing";

/**
 * The collection, used as the argument.
 *
 * Vitrine sells one idea: a collection is a line, not a pile. It is a hard thing
 * to say in the abstract and an easy thing to show, so the page shows it — three
 * real works from Colección Reyes-Veray, each labelled the way a wall labels
 * them, each making a different part of the same argument.
 *
 * The images are used at a size that respects the work and the collection. They
 * are not decoration and they are not a stock texture: if a work is not known to
 * the person writing this, it does not go on the page.
 */
const STORY = [
  {
    src: "/art/colon-guarionex.jpg",
    alt: "Drawing of a Taíno coa rattle-staff, vertical, its shaft and gourd picked out in orange and black over a field of small drawn marks.",
    width: 1349,
    height: 1800,
    artist: "José Colón",
    title: "Guarionex",
    year: "",
    accession: "CRV-2259",
    note:
      "A record that has outlived everyone who made it. Provenance is the same problem in a different key: the object survives, and the paper around it has to survive with it.",
  },
  {
    src: "/art/candelaria-triptico-1.jpg",
    alt: "A panel from a triptych: dark architectural forms on a mauve ground above a translucent blue-green wash and a deep grey rectangle.",
    width: 1745,
    height: 1800,
    artist: "Efren Candelaria",
    title: "Tríptico uno, Panel 1",
    year: "2021",
    accession: "",
    note:
      "A triptych is three works that are only one work when they are together — and a set whose panels get separated is three strangers. The record is what holds the sequence together.",
  },
  {
    src: "/art/mercado-guanabana.jpg",
    alt: "A large cross-section of a soursop fruit, its pale flesh and ring of dark seeds opened flat and mounted like a botanical plate.",
    width: 1730,
    height: 1800,
    artist: "Carlos Mercado",
    title: "Guanabana",
    year: "2012",
    accession: "",
    note:
      "One object, examined rather than owned. Condition, imaging, examination and conservation history belong to a single work and to a date — which is the whole of the second pillar.",
  },
];

const ALSO = [
  {
    src: "/art/candelaria-triptico-3.jpg",
    width: 1714,
    height: 1800,
    alt: "The third panel of the same triptych: layered greys and slate blues with a dark rectangle set into a paler field.",
    artist: "Efren Candelaria",
    title: "Tríptico uno, Panel 3",
    year: "2021",
  },
  {
    src: "/art/negroni-crv-2252.jpg",
    width: 1372,
    height: 1800,
    alt: "Pale organic forms and fine green outlines rising against a deep grey ground.",
    artist: "Juan Alberto Negroni",
    title: "Untitled",
    year: "",
    accession: "CRV-2252",
  },
  {
    src: "/art/didier-crv-2260.jpg",
    width: 1800,
    height: 978,
    alt: "A blue print of a figure pushing a wheelbarrow beneath a large arch, the frame darker at the edges.",
    artist: "Didier Dominique",
    title: "Untitled",
    year: "",
    accession: "CRV-2260",
  },
];

const PILLARS = [
  {
    n: "01",
    title: "Provenance",
    body:
      "Every acquisition, exhibition, publication and movement of a work — kept in one unbroken line. Records your heirs will not have to reconstruct.",
  },
  {
    n: "02",
    title: "Condition",
    body:
      "Examination reports, imaging, and conservation history, organized per work and dated as the collection evolves.",
  },
  {
    n: "03",
    title: "Legacy",
    body:
      "Succession-ready archives for the next steward, the estate, or the institution. Nothing left to chance.",
  },
  {
    n: "04",
    title: "Publish",
    body:
      "When you are ready for the world, your collection can step onto the web — published from your Vitrine records through the AXXES web developer app. The archive stays private either way.",
  },
];

const TRUST = [
  "Invite-only",
  "Your records remain yours — exportable, always",
  "Built with museum-standard care",
  "Publish to the web only when you choose",
];

/**
 * The plans are read from the shared `plans` table rather than written here, so
 * the price a collector reads on this page is the price the gate charges. Two
 * copies of a price is one more thing to forget to update.
 *
 * `scale` also lists Vitrine, but it is a suite price for a company reselling
 * AXXES to its own customers, not a price a collector pays for one collection,
 * so it is filtered out of display and the fallback keeps the page from ever
 * rendering empty if the table is unreachable.
 */
async function collectorPlans(): Promise<Plan[]> {
  try {
    const all = await vitrinePlans();
    const perCollection = all.filter((p) => p.maxApps === 1);
    return perCollection.length ? perCollection : all;
  } catch {
    return FALLBACK_PLANS;
  }
}

const FALLBACK_PLANS: Plan[] = [
  {
    key: "collector",
    name: "Collector",
    blurb: "One collection, properly kept.",
    priceCents: 9900,
    annualPriceCents: 99000,
    maxApps: 1,
    products: ["vitrine"],
    features: [
      "Unlimited works in one collection",
      "Provenance, condition and exhibition history per work",
      "Artist index with biographies",
      "Exports to CSV and JSON",
      "Invited registrars and viewers",
    ],
  },
  {
    key: "collector-pro",
    name: "Collector Pro",
    blurb: "The desk, plus an assistant that reads what you already have.",
    priceCents: 19900,
    annualPriceCents: 199000,
    maxApps: 1,
    products: ["vitrine"],
    features: [
      "Everything in Collector",
      "Assisted cataloguing — propose a record from a catalogue, wall label or condition report",
      "Review before anything is written; nothing saves without a human",
      "Duplicate and near-duplicate detection across your own records",
      "Priority support",
    ],
  },
];

export default async function Home() {
  const plans = await collectorPlans();
  return (
    <main>
      {/* Masthead */}
      <header className="frame" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: "2.2rem" }}>
        <span className="wordmark" style={{ fontSize: "0.85rem" }}>Vitrine</span>
        <span className="overline">Private collections</span>
      </header>

      {/* Hero — one work, set like the cover of a catalogue */}
      <section className="frame band" style={{ paddingTop: "clamp(3.5rem, 9vh, 7rem)" }}>
        <div
          style={{
            display: "grid",
            gap: "clamp(2.5rem, 5vw, 5rem)",
            alignItems: "center",
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
          className="hero"
        >
          <div className="measure">
            <p className="overline" style={{ marginBottom: "2.2rem" }}>By invitation · Two plans</p>
            <h1 className="serif" style={{ fontWeight: 300, fontSize: "clamp(2.6rem, 6.4vw, 4.6rem)", lineHeight: 1.1, letterSpacing: "-0.012em" }}>
              Every collection
              <br />
              deserves a <em>vitrine</em>.
            </h1>
            <p className="lede" style={{ marginTop: "2.2rem" }}>
              The administrator&rsquo;s desk for serious art collections — provenance, condition and
              legacy, kept in one quiet room. When the world should see it, publish; until then, it
              stays yours.
            </p>
            <div style={{ marginTop: "2.8rem", display: "flex", flexWrap: "wrap", gap: "1.4rem 2.4rem", alignItems: "center" }}>
              <a href="#waitlist" className="cta">Request an invitation</a>
              <a href="#the-collection" className="quiet-link serif" style={{ fontSize: "1.02rem" }}>
                See it on real work
              </a>
            </div>
          </div>

          <figure style={{ margin: 0 }}>
            <div className="plate">
              <Image
                src={STORY[1].src}
                alt={STORY[1].alt}
                width={STORY[1].width}
                height={STORY[1].height}
                priority
                sizes="(max-width: 900px) 88vw, 46vw"
                style={{ height: "auto" }}
              />
            </div>
            <figcaption className="label">
              <span className="artist">{STORY[1].artist}</span>
              <span className="title">, <em>{STORY[1].title}</em>{STORY[1].year ? `, ${STORY[1].year}` : ""}</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* The argument, made with the collection's own work */}
      <section id="the-collection" className="band-quiet" style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="frame">
          <p className="overline">Colección Reyes-Veray</p>
          <h2 className="statement measure" style={{ marginTop: "1.4rem" }}>
            A collection is a line, not a pile.
          </h2>
          <p className="lede measure" style={{ marginTop: "1.6rem" }}>
            Every object here is documented to the same standard and hung to the same wall. Below
            are three works from the collection that make the argument better than this page could.
          </p>
        </div>

        <div className="frame" style={{ marginTop: "clamp(3rem, 7vh, 5.5rem)" }}>
          {STORY.map((work, i) => (
            <div
              key={work.src}
              style={{
                display: "grid",
                gap: "clamp(1.6rem, 4vw, 4rem)",
                alignItems: "center",
                padding: "clamp(2.4rem, 6vh, 4.5rem) 0",
                gridTemplateColumns: "minmax(0, 1fr)",
                borderTop: i === 0 ? "none" : "1px solid var(--line)",
              }}
              className="story-row"
            >
              <figure style={{ margin: 0, order: i % 2 === 0 ? 0 : 1 }}>
                <div className="plate">
                  <Image
                    src={work.src}
                    alt={work.alt}
                    width={work.width}
                    height={work.height}
                    sizes="(max-width: 900px) 88vw, 44vw"
                    style={{ height: "auto" }}
                  />
                </div>
                <figcaption className="label">
                  <span className="artist">{work.artist}</span>
                  <span className="title">, <em>{work.title}</em></span>
                  {work.year && <span className="year">{work.year}</span>}
                  {work.accession && <span className="accession">{work.accession}</span>}
                </figcaption>
              </figure>
              <div className="measure">
                <span className="folio">{String(i + 1).padStart(2, "0")}</span>
                <p className="serif" style={{ marginTop: "0.9rem", fontSize: "clamp(1.08rem, 1.7vw, 1.3rem)", lineHeight: 1.62, color: "var(--muted)" }}>
                  {work.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* One moment of colour, used once */}
      <section className="plate-bleed" aria-hidden="true">
        <Image
          src="/art/moreno-pasionize-life.jpg"
          alt=""
          width={1800}
          height={722}
          sizes="100vw"
          style={{ height: "auto" }}
        />
      </section>

      {/* The rest of the collection, small and quiet */}
      <section className="band-quiet">
        <div className="frame">
          <p className="overline">Also in the collection</p>
          <div style={{ display: "grid", gap: "clamp(1.2rem, 3vw, 2.4rem)", marginTop: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {ALSO.map((work) => (
              <figure key={work.src} style={{ margin: 0 }}>
                <div className="plate" style={{ padding: "clamp(0.9rem, 1.6vw, 1.4rem)" }}>
                  <Image
                    src={work.src}
                    alt={`${work.artist}, ${work.title}`}
                    width={work.width}
                    height={work.height}
                    sizes="(max-width: 700px) 88vw, 28vw"
                    style={{ height: "auto" }}
                  />
                </div>
                <figcaption className="label" style={{ fontSize: "0.9rem" }}>
                  <span className="artist">{work.artist}</span>
                  <span className="title">, <em>{work.title}</em></span>
                  {work.year && <span className="year">{work.year}</span>}
                  {work.accession && <span className="accession">{work.accession}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* What the desk does */}
      <section className="band" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="frame">
          <p className="overline">The desk</p>
          <div style={{ marginTop: "clamp(2.4rem, 6vh, 4rem)" }}>
            {PILLARS.map((p) => (
              <div
                key={p.n}
                style={{
                  display: "grid",
                  gap: "1.2rem 2.4rem",
                  padding: "clamp(1.8rem, 4vh, 2.8rem) 0",
                  borderTop: "1px solid var(--line)",
                  gridTemplateColumns: "minmax(0, 1fr)",
                }}
                className="pillar-row"
              >
                <span className="folio">{p.n}</span>
                <div className="measure">
                  <h3 className="serif" style={{ fontWeight: 400, fontSize: "clamp(1.5rem, 2.8vw, 2.1rem)" }}>{p.title}</h3>
                  <p className="serif" style={{ marginTop: "0.9rem", fontSize: "1.12rem", lineHeight: 1.66, color: "var(--muted)" }}>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Principles" style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "2.2rem 0" }}>
        <ul className="frame" style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: "1rem 3rem", justifyContent: "center" }}>
          {TRUST.map((t) => (
            <li key={t} className="overline">{t}</li>
          ))}
        </ul>
      </section>

      {/* Membership */}
      <section id="membership" className="band-quiet" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="frame">
          <p className="overline">Membership</p>
          <h2
            className="serif"
            style={{ fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", marginTop: "1rem" }}
          >
            Two plans. Per collection.
          </h2>
          <p className="lede measure" style={{ marginTop: "1.2rem" }}>
            One collection each. Your records are yours and leave with you at any time, in CSV or
            JSON — that is not a tier difference.
          </p>

          <div
            style={{
              marginTop: "3rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))",
              gap: "1px",
              background: "var(--line)",
              border: "1px solid var(--line)",
            }}
          >
            {plans.map((p) => (
              <div key={p.key} style={{ background: "var(--background)", padding: "2rem" }}>
                <p className="overline">{p.name}</p>
                <p className="serif" style={{ marginTop: "0.6rem", fontSize: "2.6rem", fontWeight: 300 }}>
                  ${(p.priceCents / 100).toFixed(0)}
                  <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/month</span>
                </p>
                {p.blurb && (
                  <p className="serif" style={{ marginTop: "0.5rem", color: "var(--muted)" }}>
                    {p.blurb}
                  </p>
                )}
                <ul
                  style={{
                    margin: "1.5rem 0 0",
                    padding: 0,
                    listStyle: "none",
                    display: "grid",
                    gap: "0.6rem",
                  }}
                >
                  {p.features.map((f) => (
                    <li key={f} className="serif" style={{ display: "flex", gap: "0.6rem", lineHeight: 1.5 }}>
                      <span aria-hidden style={{ color: "var(--muted)" }}>·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: "1.8rem" }}>
                  <a href="#waitlist" className="cta" style={{ fontSize: "0.8rem" }}>
                    Request {p.name}
                  </a>
                </p>
              </div>
            ))}
          </div>

          <p style={{ marginTop: "1.8rem", fontSize: "0.78rem", color: "var(--muted)" }}>
            Membership is extended by invitation, one collection at a time. Leave your address and we
            will write when a place is ready — or join now with an invitation code.
          </p>
        </div>
      </section>

      {/* Waitlist / invite */}
      <section id="waitlist" className="frame band" style={{ textAlign: "center" }}>
        <h2 className="statement" style={{ fontWeight: 300 }}>The register opens quietly.</h2>
        <p className="lede measure" style={{ margin: "1.3rem auto 0" }}>
          Tell us about the collection and we will write when a place is ready — or join now with an
          invitation code.
        </p>
        <div style={{ marginTop: "2.6rem" }}>
          <WaitlistForm />
        </div>
        <p style={{ marginTop: "1.6rem" }}>
          <a href="/sign-in" className="quiet-link" style={{ fontSize: "0.78rem" }}>Already have an account? Sign in</a>
        </p>
      </section>

      {/* Footer */}
      <footer className="frame" style={{ borderTop: "1px solid var(--line)", padding: "2.6rem 0 3.2rem", display: "flex", flexWrap: "wrap", gap: "1rem 2.5rem", alignItems: "baseline", justifyContent: "space-between" }}>
        <span className="wordmark" style={{ fontSize: "0.72rem" }}>Vitrine</span>
        <span className="serif" style={{ fontSize: "0.95rem", color: "var(--muted)" }}>Provenance, kept.</span>
        <span className="overline">An AXXES product</span>
      </footer>
    </main>
  );
}
