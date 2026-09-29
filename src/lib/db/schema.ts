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

