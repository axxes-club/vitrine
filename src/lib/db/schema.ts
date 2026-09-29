import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Shared AXXES platform tables (schema owned by the members portal — mapped
 * here, never migrated from this app), plus the collection tables Vitrine
 * administers.
 */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isSuperadmin: boolean("is_superadmin").notNull().default(false),
  // Shared with members.axxes.club: `SUPERADMIN` mirrors is_superadmin, kept in
  // step by demb-inventory. Mapped here because Better Auth validates every
  // field it is asked to expose against this schema and refuses to start if a
  // declared field has no column.
  role: text("role"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // Mapped from the shared table so a retired organization stops being an
  // entry route. Vitrine reads the same rows every other AXXES app does.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const tenantMemberships = pgTable(
  "tenant_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull().default("member"),
    isPrimary: boolean("is_primary").default(true),
    // A membership can be retired rather than deleted; an old one must not
    // keep granting access to the desk.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [uniqueIndex("vitrine_memberships_tenant_user_idx").on(t.tenantId, t.userId)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    description: text("description"),
    shortDescription: text("short_description"),
    price: text("price"),
    currency: text("currency").default("USD"),
    sku: text("sku"),
    status: text("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").default(false),
    images: jsonb("images").$type<{ url: string; alt?: string; position: number }[]>(),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [index("vitrine_products_tenant_idx").on(t.tenantId)]
);

export const artworkDetails = pgTable(
  "artwork_details",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    productId: uuid("product_id").notNull(),

    artistName: text("artist_name"),
    artistSortName: text("artist_sort_name"),
    artistSlug: text("artist_slug"),
    title: text("title"),
    medium: text("medium"),
    dimensions: text("dimensions"),
    year: text("year"),
    edition: text("edition"),
    series: text("series"),
    inventoryNumber: text("inventory_number"),
    location: text("location"),
    origin: text("origin"),
    publications: jsonb("publications")
      .$type<Array<{ title: string; venue?: string; year?: string; url?: string; note?: string }>>(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    uniqueIndex("vitrine_artwork_product_idx").on(t.productId),
    index("vitrine_artwork_tenant_idx").on(t.tenantId),
  ]
);

/**
 * The collection engine, mapped from the shared schema.
 *
 * These tables are owned by members.axxes.club (src/lib/db/schema/collection.ts),
 * which holds the DDL and the reasoning. Vitrine maps rather than duplicates: one
 * database backs every AXXES app, and a second copy of the definition would be a
 * second thing to keep in step. The header comment on the owner's file explains
 * the append-only ledger and why it is shaped this way — read it before changing
 * a column here.
 */

export const vitrineWorks = pgTable(
  "vitrine_works",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    productId: uuid("product_id"),
    artistId: uuid("artist_id"),
    /** Unique per collection. The insurance schedule's handle on a work. */
    accession: text("accession").notNull(),
    title: text("title"),
    status: text("status").notNull().default("draft"),
    location: text("location"),
    locationKind: text("location_kind"),
    insuredValueCents: integer("insured_value_cents"),
    currency: text("currency").default("USD"),
    onSite: boolean("on_site").default(true),
    deaccessionedAt: timestamp("deaccessioned_at", { withTimezone: true }),
    deaccessionMethod: text("deaccession_method"),
    deaccessionNotes: text("deaccession_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    uniqueIndex("vitrine_works_accession_idx").on(t.tenantId, t.accession),
    index("vitrine_works_tenant_idx").on(t.tenantId),
    index("vitrine_works_product_idx").on(t.productId),
    index("vitrine_works_artist_idx").on(t.artistId),
  ]
);

/** The ledger. One dated, attributable fact per row; never edited to undo. */
export const vitrineEvents = pgTable(
  "vitrine_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    workId: uuid("work_id").notNull(),
    kind: text("kind").notNull(),
    occurredOn: text("occurred_on").notNull(),
    occurredOnText: text("occurred_on_text"),
    title: text("title"),
    notes: text("notes"),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    actorKey: text("actor_key").notNull(),
    actorName: text("actor_name"),
    supersededBy: uuid("superseded_by"),
    supersededReason: text("superseded_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    index("vitrine_events_work_idx").on(t.workId),
    index("vitrine_events_tenant_idx").on(t.tenantId),
  ]
);

/** Valuations are a series over time; insurance and fair-market are not one number. */
export const vitrineValuations = pgTable(
  "vitrine_valuations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    workId: uuid("work_id").notNull(),
    valueCents: integer("value_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    basis: text("basis").notNull(),
    valuedOn: text("valued_on").notNull(),
    valuer: text("valuer"),
    valuationFirm: text("valuation_firm"),
    reference: text("reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    index("vitrine_valuations_work_idx").on(t.workId),
    index("vitrine_valuations_tenant_idx").on(t.tenantId),
  ]
);

/** A condition report is a statement about a moment, not about the object. */
export const vitrineConditions = pgTable(
  "vitrine_conditions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    workId: uuid("work_id").notNull(),
    eventId: uuid("event_id"),
    observedOn: text("observed_on").notNull(),
    observedBy: text("observed_by"),
    grade: text("grade"),
    summary: text("summary"),
    detail: jsonb("detail").$type<{ area: string; note: string }[]>().default([]),
    images: jsonb("images").$type<{ url: string; caption?: string }[]>().default([]),
    treated: boolean("treated").default(false),
    treatedBy: text("treated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    index("vitrine_conditions_work_idx").on(t.workId),
    index("vitrine_conditions_tenant_idx").on(t.tenantId),
  ]
);

/** Loans in and out, with a condition report expected at each end. */
export const vitrineLoans = pgTable(
  "vitrine_loans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    workId: uuid("work_id").notNull(),
    direction: text("direction").notNull(),
    counterparty: text("counterparty").notNull(),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    startsOn: text("starts_on").notNull(),
    endsOn: text("ends_on"),
    insuranceValueCents: integer("insurance_value_cents"),
    currency: text("currency").default("USD"),
    insurancePolicy: text("insurance_policy"),
    status: text("status").notNull().default("out_going"),
    conditionOut: uuid("condition_out"),
    conditionIn: uuid("condition_in"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    index("vitrine_loans_work_idx").on(t.workId),
    index("vitrine_loans_tenant_idx").on(t.tenantId),
  ]
);

/** Provenance claims carry a source and a certainty; unsourced is marked, not dropped. */
export const vitrineProvenance = pgTable(
  "vitrine_provenance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    workId: uuid("work_id").notNull(),
    periodFrom: text("period_from"),
    periodTo: text("period_to"),
    periodText: text("period_text"),
    ownerName: text("owner_name"),
    location: text("location"),
    transferType: text("transfer_type"),
    sourceType: text("source_type"),
    sourceReference: text("source_reference"),
    notes: text("notes"),
    certainty: text("certainty").default("attributed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    index("vitrine_provenance_work_idx").on(t.workId),
    index("vitrine_provenance_tenant_idx").on(t.tenantId),
  ]
);

/** Real locations, with addresses — a transit loss is only investigable with one. */
export const vitrineLocations = pgTable(
  "vitrine_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    address: text("address"),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    climateControlled: boolean("climate_controlled"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [index("vitrine_locations_tenant_idx").on(t.tenantId)]
);

export const vitrineShowings = pgTable(
  "vitrine_showings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("exhibition"),
    venue: text("venue"),
    city: text("city"),
    country: text("country"),
    opensOn: text("opens_on"),
    closesOn: text("closes_on"),
    catalogueReference: text("catalogue_reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [index("vitrine_showings_tenant_idx").on(t.tenantId)]
);

export const vitrineShowingWorks = pgTable(
  "vitrine_showing_works",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    showingId: uuid("showing_id").notNull(),
    workId: uuid("work_id").notNull(),
    role: text("role").notNull().default("exhibited"),
    displayTitle: text("display_title"),
    position: text("position"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    index("vitrine_showing_works_showing_idx").on(t.showingId),
    index("vitrine_showing_works_work_idx").on(t.workId),
  ]
);


/**
 * Artists represented in the collection.
 *
 * Owned by members.axxes.club (schema/artists.ts), mapped here for the same
 * reason as the collection tables: one database, one definition. These were
 * originally imported as image-less products with a `glossary/` slug prefix,
 * which polluted the catalogue; they are first-class records now, and a work
 * points at one rather than repeating an artist's name on every row.
 */
export const artists = pgTable(
  "artists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    /** The slug without the legacy "glossary/" prefix. */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    bio: text("bio"),
    /** e.g. "Aibonito, 1946" — extracted from the bio, not free-form. */
    lifespan: text("lifespan"),
    /** Denormalized count of works, so the index can sort without a join. */
    artworkCount: integer("artwork_count").notNull().default(0),
    /** Name with any leading article removed, for alphabetical ordering. */
    sortName: text("sort_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    uniqueIndex("artists_tenant_slug_idx").on(t.tenantId, t.slug),
    index("artists_tenant_idx").on(t.tenantId),
  ]
);


export const waitlist = pgTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Billing, mapped from the shared AXXES schema (owned by the members portal).
 *
 * Vitrine reads these and never migrates them: one subscription table across
 * the suite, so a collector's plan is the same fact everywhere it is asked
 * about. The collector plans that carry vitrine are `collector` ($99/mo) and
 * `collector-pro` ($199/mo); `scale` also lists it and is left alone so an
 * existing subscriber does not lose a product they already pay for.
 */
export const plans = pgTable("plans", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  blurb: text("blurb"),
  priceCents: integer("price_cents").notNull(),
  annualPriceCents: integer("annual_price_cents"),
  maxApps: integer("max_apps"),
  products: jsonb("products").$type<string[]>().notNull().default([]),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  position: integer("position").notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // The organization. This is the unit a collector buys for.
    tenantId: uuid("tenant_id").notNull(),
    planKey: text("plan_key"),
    status: text("status").notNull().default("incomplete"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    pendingPlanKey: text("pending_plan_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => [index("vitrine_subscriptions_tenant_idx").on(t.tenantId)]
);

