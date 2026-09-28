# Vitrine — Positioning

**Vitrine is the administrator's side of a collection system. It is not a website builder.**

- Vitrine = the private admin/archive application: catalog, provenance, condition,
  legacy records. Functionally the same system that runs the Colección
  Reyes-Veray admin, minus any public-facing website capabilities.
- Public display is a separate product: members publish their collections to the
  web through AXXES.club's upcoming static site hosting, including the web
  developer app built into members.axxes.club. Vitrine records become the source
  a published site draws from — an integration, not a feature inside Vitrine.
- Launch posture: invite-only waitlist. This repo currently serves the landing
  page + waitlist capture only (`/api/waitlist` → `waitlist` table on Neon).

## Product split

| | Vitrine (this) | Public site (future, separate) |
|---|---|---|
| Audience | The collection's administrator/staff | The world |
| Capabilities | Catalog, provenance, condition, legacy, exports | Static presentation of a collection |
| Hosting | Private app | AXXES static hosting / members web developer app |
| Relationship | Source of record | Renders from Vitrine data via integration |

## House style (mirrors Colección Reyes-Veray frontend)

- Fonts: Syncopate (display/wordmark), Cormorant Garamond (serif body)
- Palette: `#fdfcfc` warm gallery white, `#111111` ink, `--accent` quiet brass,
  hairline rules `rgba(17,17,17,.12)`
- Voice: quiet, assured, no exclamation marks. "Every collection deserves a vitrine."
- No Tailwind in this repo; hand-rolled CSS, inline styles for one-off layout.
