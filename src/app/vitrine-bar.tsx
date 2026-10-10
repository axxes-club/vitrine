"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CornerDownLeft, Search } from "lucide-react";
import styles from "./vitrine-bar.module.css";

/**
 * The AXXES top bar (axxes.app) in Vitrine's hand: a floating, frosted bar with
 * the wordmark, the page's sections, a finder on "/" and the account button.
 *
 * Signing in and the account go to the Vitrine app (app.vitrine.axxes.app),
 * which shares the session with this site; creating an account stays here,
 * because membership is arranged here.
 */

export const APP_URL = (process.env.NEXT_PUBLIC_VITRINE_APP_URL || "https://app.vitrine.axxes.app").replace(/\/$/, "");

type Item = { label: string; detail: string; href: string; external?: boolean };

const ITEMS: Item[] = [
  { label: "The platform", detail: "What Vitrine does for a collection", href: "#platform" },
  { label: "The collection", detail: "Why the record matters", href: "#collection" },
  { label: "Membership", detail: "Plans and what each includes", href: "#membership" },
  { label: "Sign in", detail: "Open your collection in the Vitrine app", href: `${APP_URL}/login`, external: true },
  { label: "Your inventory", detail: "Go straight to your works", href: `${APP_URL}/inventory`, external: true },
  { label: "Import your records", detail: "Bring a spreadsheet, FileMaker, another program or your website", href: `${APP_URL}/welcome`, external: true },
  { label: "Create an account", detail: "Start a Vitrine membership", href: "/register" },
];

function fold(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function VitrineBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const results = useMemo(() => {
    const q = fold(query.trim());
    return q ? ITEMS.filter((i) => fold(`${i.label} ${i.detail}`).includes(q)) : ITEMS;
  }, [query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    } else if (wasOpen.current) {
      // Back to where the person was, only after the finder actually closed.
      trigger.current?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open]);

  function go(item: Item) {
    setOpen(false);
    if (item.href.startsWith("#")) {
      document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", item.href);
    } else {
      window.location.href = item.href;
    }
  }

  return (
    <>
      <div className={styles.wrap}>
      <header className={styles.bar}>
        <a className={styles.brand} href="#top" aria-label="Vitrine home">
          vitrine<span>.</span>
        </a>
        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#platform">The platform</a>
          <a href="#collection">The collection</a>
          <a href="#membership">Membership</a>
        </nav>
        <button ref={trigger} className={styles.find} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <Search size={14} strokeWidth={1.6} aria-hidden="true" />
          <span>Find in Vitrine</span>
          <kbd>/</kbd>
        </button>
        <a className={styles.signIn} href={`${APP_URL}/login`}>
          Sign in
        </a>
        <a className={styles.account} href={APP_URL}>
          Account
        </a>
      </header>
      </div>

      {open && (
        <div className={styles.scrim} onMouseDown={() => setOpen(false)}>
          <div
            className={styles.finder}
            role="dialog"
            aria-modal="true"
            aria-label="Find in Vitrine"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              ref={input}
              value={query}
              placeholder="Find a section, your collection, membership…"
              aria-label="Find in Vitrine"
              aria-controls="vitrine-finder-results"
              aria-activedescendant={results[active] ? `vitrine-finder-${active}` : undefined}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && results[active]) {
                  e.preventDefault();
                  go(results[active]);
                }
              }}
            />
            <ul id="vitrine-finder-results" role="listbox">
              {results.map((item, i) => (
                <li key={item.label} id={`vitrine-finder-${i}`} role="option" aria-selected={i === active}>
                  <a
                    href={item.href}
                    onMouseEnter={() => setActive(i)}
                    onClick={(e) => {
                      e.preventDefault();
                      go(item);
                    }}
                  >
                    <span>
                      <strong>{item.label}</strong>
                      <em>{item.detail}</em>
                    </span>
                    {item.external ? <ArrowUpRight size={15} aria-hidden="true" /> : null}
                  </a>
                </li>
              ))}
              {results.length === 0 && <li className={styles.empty}>Nothing matches “{query}”.</li>}
            </ul>
            <div className={styles.keys}>
              <span>↑↓ to move</span>
              <span>
                <CornerDownLeft size={11} aria-hidden="true" /> to open
              </span>
              <span>esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
