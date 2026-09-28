import Link from "next/link";

/**
 * Signed in, but not on the collection's team.
 *
 * This is not an error — the AXXES account is real and working, it just
 * doesn't carry a role for this particular desk. Landing someone in a fully
 * rendered desk where every control is inert is the worst version of this
 * screen: it looks broken. So say plainly what happened, who to ask, and
 * leave the door visibly open.
 */
export function AwaitingAccess({ name, email }: { name?: string; email?: string }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "6vw 1.5rem",
      }}
    >
      <div style={{ maxWidth: "34rem", width: "100%", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.62rem",
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "1.5rem",
          }}
        >
          The Desk · Vitrine
        </p>

        <h1
          style={{
            fontSize: "clamp(1.9rem, 4.5vw, 2.6rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            marginBottom: "1rem",
          }}
        >
          You&rsquo;re signed in.
          <br />
          <span style={{ color: "var(--muted)", fontWeight: 400 }}>
            You just don&rsquo;t have a seat here yet.
          </span>
        </h1>

        <p
          style={{
            color: "var(--muted)",
            lineHeight: 1.65,
            marginBottom: "2.25rem",
          }}
        >
          {name ? (
            <>
              Your AXXES account (<strong>{email ?? name}</strong>) is working
              correctly.
            </>
          ) : (
            <>Your AXXES account is working correctly.</>
          )}{" "}
          The Desk is open to the collection&rsquo;s own team, and to anyone on
          the AXXES CLUB roster &mdash; the people who look after the objects,
          photograph the works and manage the records. If you should be able to
          get in, ask an existing owner to add you to AXXES CLUB, and it takes
          effect the moment they save.
        </p>

        <div
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: "1.75rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <a
            href="mailto:members.axxes.club?subject=Request%20access%20to%20The%20Desk"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.7rem 1.4rem",
              background: "#111111",
              color: "#fdfcfc",
              fontSize: "0.8rem",
              letterSpacing: "0.06em",
              borderRadius: 999,
            }}
          >
            Ask the collection for access
          </a>
          <a
            href="https://handshake.axxes.club/sign-out?redirect=%2F"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.7rem 1.4rem",
              border: "1px solid var(--line)",
              color: "var(--muted)",
              fontSize: "0.8rem",
              letterSpacing: "0.06em",
              borderRadius: 999,
            }}
          >
            Switch AXXES account
          </a>
        </div>

        <p
          style={{
            marginTop: "2rem",
            fontSize: "0.72rem",
            color: "var(--muted)",
          }}
        >
          You&rsquo;re already signed in to every other AXXES product.
        </p>
      </div>
    </main>
  );
}
