import Image from "next/image";
import { ArrowUpRight, ArrowRight, Check, ShieldCheck, Layers, FileText, MapPin, Search, LayoutGrid, List, ChevronDown, LockKeyhole, Plus } from "lucide-react";
import WaitlistForm from "@/app/WaitlistForm";
import { vitrinePlans, type Plan } from "@/lib/billing";
import styles from "./landing.module.css";

const works = [
  { src: "/art/candelaria-triptico-1.jpg", artist: "Efren Candelaria", title: "Tríptico uno, Panel 1", year: "2021", width: 1745, height: 1800, alt: "Abstract architectural forms in mauve, blue-green, and charcoal." },
  { src: "/art/colon-guarionex.jpg", artist: "José Colón", title: "Guarionex", year: "", width: 1349, height: 1800, alt: "Orange and black drawing of a Taíno rattle-staff over a field of fine marks." },
  { src: "/art/negroni-crv-2252.jpg", artist: "Juan Alberto Negroni", title: "Untitled", year: "", width: 1372, height: 1800, alt: "Pale organic forms with fine green outlines on a deep grey ground." },
];

const capabilities = [
  { number: "01", icon: Layers, title: "Every work. Every detail.", body: "Bring images, artist biographies, acquisition details, and supporting documents together. A complete record, always within reach." },
  { number: "02", icon: FileText, title: "A history worth keeping.", body: "Trace provenance, exhibitions, and condition over time. Preserve the context that makes each work irreplaceable." },
  { number: "03", icon: ShieldCheck, title: "Built for the next chapter.", body: "Give your registrars and advisors the access they need. Keep exportable records ready for the next steward of your collection." },
];

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
    <main className={styles.landing} id="top">
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <a className={styles.wordmark} href="#top" aria-label="Vitrine home">vitrine<span className={styles.brandDot}>.</span></a>
        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#platform">The platform</a>
          <a href="#collection">The collection</a>
          <a href="#membership">Membership</a>
        </nav>
        <div className={styles.headerActions}>
          <a className={styles.signIn} href="/sign-in">Sign in</a>
          <a className={styles.headerCta} href="#waitlist">Request access <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </header>

      <section className={styles.hero} id="main-content" aria-labelledby="hero-heading">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> THE ART OF COLLECTING, PERFECTED</p>
          <h1 id="hero-heading">Exceptional art.<br />An extraordinary<br /><em>collection.</em></h1>
          <p className={styles.heroDescription}>The collection you have built deserves a world-class home. Catalog, care for, and preserve it with Vitrine — art collection software for those who see more.</p>
          <div className={styles.heroActions}>
            <a className={styles.button} href="#waitlist">Request an invitation <ArrowUpRight size={18} aria-hidden="true" /></a>
            <a className={styles.textLink} href="#platform">Explore Vitrine <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          <p className={styles.heroNote}><LockKeyhole size={12} aria-hidden="true" /> Private by design. Yours, always.</p>
        </div>
        <div className={styles.heroGallery}>
          <div className={styles.galleryHeading}><span>A DIFFERENT STANDARD</span><span>FIG. 001</span></div>
          <div className={styles.galleryWall}>
            <div className={styles.artFrame}><Image src={works[0].src} alt={works[0].alt} width={works[0].width} height={works[0].height} preload sizes="(max-width: 700px) 70vw, 33vw" /></div>
            <div className={styles.recordTag}><span className={styles.recordTagIcon}><Check size={14} aria-hidden="true" /></span><div><strong>Art, beautifully organized.</strong><span>One work. Its entire story.</span></div></div>
          </div>
          <div className={styles.artCaption}><div><strong>{works[0].artist}</strong><span><em>{works[0].title}</em>, {works[0].year}</span></div><span>COLECCIÓN REYES-VERAY</span></div>
        </div>
        <div className={styles.heroFooter}><span>FOR THE COLLECTOR. FOR THE COLLECTION. FOR WHAT COMES NEXT.</span><a href="#platform">Discover the platform <span>↓</span></a></div>
      </section>

      <section className={styles.principles} aria-label="Collection principles">
        <span>Serious collecting.<br /><strong>Considered software.</strong></span>
        <p><LockKeyhole size={18} aria-hidden="true" /> Invitation-only access</p>
        <p><Layers size={18} aria-hidden="true" /> Unlimited works</p>
        <p><ArrowUpRight size={18} aria-hidden="true" /> Your records. Your ownership.</p>
      </section>

      <section className={styles.platform} id="platform" aria-labelledby="platform-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>THE COLLECTION, IN FOCUS</p><h2 id="platform-heading">A remarkable collection.<br /><em>A complete perspective.</em></h2></div><p>From the first acquisition to the next generation. One considered place for everything that matters.</p></div>
        <figure className={styles.productFigure}>
          <div className={styles.productWindow}>
            <aside className={styles.productSidebar} aria-hidden="true">
              <span className={styles.productBrand}>vitrine.</span>
              <span className={styles.collectionName}>Colección<br />Reyes-Veray <ChevronDown size={12} /></span>
              <p className={styles.sidebarLabel}>WORKSPACE</p>
              <span className={styles.sidebarActive}><LayoutGrid size={14} /> Collection</span>
              <span><Layers size={14} /> Artists</span>
              <span><FileText size={14} /> Records</span>
              <span><MapPin size={14} /> Locations</span>
              <div className={styles.sidebarBottom}><LockKeyhole size={12} /> Private collection</div>
            </aside>
            <div className={styles.productMain}>
              <div className={styles.productTopbar}><span>Workspace / <strong>Collection</strong></span><span className={styles.avatar}>RV</span></div>
              <div className={styles.productTitle}><div><p>YOUR COLLECTION, AT A GLANCE</p><h3>The collection</h3></div><span className={styles.previewAdd} aria-hidden="true"><Plus size={13} /> Add work</span></div>
              <div className={styles.productStats}><div><span>Works in collection</span><strong>3,667</strong></div><div><span>Documentation</span><strong>One complete archive</strong></div><div><span>Access</span><strong><span className={styles.statusDot} /> By invitation</strong></div></div>
              <div className={styles.productToolbar} aria-hidden="true"><span><Search size={14} /> Find a work, artist, or accession…</span><div><span>All works <ChevronDown size={12} /></span><LayoutGrid size={14} /><List size={14} /></div></div>
              <div className={styles.productCards}>{works.map(work => <article key={work.src} className={styles.productCard}><div><Image src={work.src} alt={work.alt} width={work.width} height={work.height} sizes="(max-width: 700px) 26vw, 22vw" /></div><h4>{work.artist}</h4><p><em>{work.title}</em>{work.year && `, ${work.year}`}</p><span><span className={styles.statusDot} /> In collection</span></article>)}</div>
            </div>
          </div>
          <figcaption><span>THE VITRINE EXPERIENCE</span><span>Illustrative collection preview · Artwork from Colección Reyes-Veray</span></figcaption>
        </figure>
        <div className={styles.capabilities}>{capabilities.map(({ number, icon: Icon, title, body }) => <article key={number}><div><Icon size={21} strokeWidth={1.3} aria-hidden="true" /><span>{number}</span></div><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className={styles.collectionSection} id="collection" aria-labelledby="collection-heading">
        <div className={styles.collectionArtwork}><Image src="/art/mercado-guanabana.jpg" alt="A soursop fruit opened to reveal its pale flesh and dark seeds, presented like a botanical specimen." width={1730} height={1800} sizes="(max-width: 700px) 85vw, 40vw" /><span>Carlos Mercado · <em>Guanabana</em>, 2012</span></div>
        <div className={styles.collectionCopy}><p className={styles.eyebrow}>MORE THAN AN INVENTORY</p><h2 id="collection-heading">You collect<br />with intention.<br /><em>So do we.</em></h2><p>A collection is a lifetime of decisions. The work that moved you. The artist you believed in. The piece you could not leave behind.</p><p>Vitrine keeps the record as considered as the collection itself — so its story stays intact, wherever it goes next.</p><a className={styles.textLink} href="#waitlist">Give your collection a home <ArrowUpRight size={16} aria-hidden="true" /></a><div className={styles.collectionCredit}><span>FEATURING WORKS FROM</span><strong>Colección Reyes-Veray</strong><span>Puerto Rico</span></div></div>
      </section>

      <section className={styles.membership} id="membership" aria-labelledby="membership-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>A MEMBERSHIP THAT FITS</p><h2 id="membership-heading">Your collection.<br /><em>Your next chapter.</em></h2></div><p>One membership. One collection. Unlimited works. Choose the level of support your collection deserves.</p></div>
        <div className={styles.plans}>{plans.map((plan) => <article className={`${styles.plan} ${plan.key === "collector-pro" ? styles.planFeatured : ""}`} key={plan.key}><div className={styles.planHeader}><span>{plan.name}</span>{plan.key === "collector-pro" && <span className={styles.planBadge}>ASSISTED CATALOGUING</span>}</div><p className={styles.price}>${(plan.priceCents / 100).toFixed(0)}<span> / month</span></p><p className={styles.planBlurb}>{plan.blurb}</p><a className={styles.button} href="#waitlist">Request {plan.name} <ArrowUpRight size={16} aria-hidden="true" /></a><ul>{plan.features.map(feature => <li key={feature}><Check size={15} aria-hidden="true" /><span>{feature}</span></li>)}</ul></article>)}</div>
        <p className={styles.membershipNote}><LockKeyhole size={13} aria-hidden="true" /> Your collection remains yours. Export your records in CSV or JSON, on either plan.</p>
      </section>

      <section className={styles.invitation} id="waitlist" aria-labelledby="invitation-heading"><p className={styles.eyebrow}>AN INVITATION TO SOMETHING EXCEPTIONAL</p><h2 id="invitation-heading">The next chapter<br />of your collection <em>starts here.</em></h2><p>Vitrine is available by invitation. Leave your email and we’ll be in touch when a place is ready for your collection.</p><WaitlistForm /><span className={styles.invitationNote}>Already a member? <a href="/sign-in">Sign in <ArrowUpRight size={12} aria-hidden="true" /></a></span></section>

      <footer className={styles.footer}><div><a className={styles.wordmark} href="#top">vitrine<span className={styles.brandDot}>.</span></a><p>For the art. For the story. For the future.</p></div><div><a href="#platform">The platform</a><a href="#membership">Membership</a><a href="/sign-in">Sign in</a></div><span>© {new Date().getFullYear()} Vitrine<br />An AXXES product</span></footer>
    </main>
  );
}
