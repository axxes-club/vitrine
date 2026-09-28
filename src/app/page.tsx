import WaitlistForm from "@/app/WaitlistForm";

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
];

const TRUST = [
  "Invite-only",
  "Your records remain yours — exportable, always",
  "Built with museum-standard care",
  "For collectors, estates & their advisors",
];

export default function Home() {
  return (
    <main style={{ display: "flex", flexDirection: "column" }}>
      {/* Masthead */}
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "2.2rem 6vw 0",
        }}
      >
        <span className="wordmark" style={{ fontSize: "0.85rem" }}>
          Vitrine
        </span>
        <span className="overline">Private Collections · MMXXVI</span>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: "14vh 6vw 10vh",
          maxWidth: 980,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p className="overline" style={{ marginBottom: "2.2rem" }}>
          By invitation
        </p>
        <h1
          className="serif"
          style={{
            fontWeight: 300,
            fontSize: "clamp(2.6rem, 6.4vw, 4.8rem)",
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
          }}
        >
          Every collection
          <br />
          deserves a <em>vitrine</em>.
        </h1>
        <p
          className="serif"
          style={{
            margin: "2.4rem auto 0",
            maxWidth: 560,
            fontSize: "1.25rem",
            lineHeight: 1.6,
            color: "var(--muted)",
          }}
        >
          The private-archive standard for serious art collections — provenance,
          condition and legacy, kept in one quiet room.
        </p>
        <div style={{ marginTop: "3.2rem" }}>
          <a
            href="#waitlist"
            style={{
              display: "inline-block",
              padding: "1rem 2.6rem",
              border: "1px solid var(--foreground)",
              color: "var(--foreground)",
              textDecoration: "none",
              fontFamily: "var(--font-display)",
              fontSize: "0.68rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            Request an invitation
          </a>
        </div>
      </section>

      <hr className="rule" style={{ margin: "0 6vw" }} />

      {/* Pillars */}
      <section style={{ padding: "9vh 6vw", maxWidth: 1100, margin: "0 auto" }}>
        {PILLARS.map(p => (
          <div
            key={p.n}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              gap: "2.5rem",
              padding: "3.2rem 0",
              borderBottom: p.n === "03" ? "none" : "1px solid var(--line)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.72rem",
                letterSpacing: "0.3em",
                color: "var(--accent)",
                paddingTop: "0.55rem",
              }}
            >
              {p.n}
            </span>
            <div>
              <h2
                className="serif"
                style={{ fontWeight: 400, fontSize: "clamp(1.7rem, 3.4vw, 2.4rem)" }}
              >
                {p.title}
              </h2>
              <p
                className="serif"
                style={{
                  marginTop: "1rem",
                  maxWidth: 620,
                  fontSize: "1.14rem",
                  lineHeight: 1.65,
                  color: "var(--muted)",
                }}
              >
                {p.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Trust strip */}
      <section
        aria-label="Principles"
        style={{
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          padding: "2.2rem 6vw",
        }}
      >
        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem 3rem",
            justifyContent: "center",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {TRUST.map(t => (
            <li
              key={t}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.6rem",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Waitlist */}
      <section
        id="waitlist"
        style={{
          padding: "13vh 6vw",
          maxWidth: 640,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          className="serif"
          style={{ fontWeight: 300, fontSize: "clamp(1.9rem, 4vw, 2.9rem)" }}
        >
          The register opens quietly.
        </h2>
        <p
          className="serif"
          style={{
            margin: "1.4rem auto 0",
            maxWidth: 480,
            fontSize: "1.1rem",
            lineHeight: 1.6,
            color: "var(--muted)",
          }}
        >
          Membership is extended by invitation, one collection at a time. Leave
          your address and we will write when a place is ready.
        </p>
        <div style={{ marginTop: "3rem" }}>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "2.6rem 6vw 3.2rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem 2.5rem",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <span className="wordmark" style={{ fontSize: "0.72rem" }}>
          Vitrine
        </span>
        <span
          className="serif"
          style={{ fontSize: "0.95rem", color: "var(--muted)" }}
        >
          Provenance, kept.
        </span>
        <span className="overline">© MMXXVI</span>
      </footer>
    </main>
  );
}
