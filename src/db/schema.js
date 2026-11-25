
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Website page publishing status.
export const pageStatusEnum = pgEnum("website_page_status", [
  "draft",
  "published",
  "archived",
]);

// Website Pages table.
export const websitePages = pgTable(
  "website_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: varchar("title", { length: 180 }).notNull(),

    slug: varchar("slug", { length: 200 }).notNull(),

    excerpt: text("excerpt"),

    content: text("content").notNull().default(""),

    featuredImageUrl: text("featured_image_url"),

    status: pageStatusEnum("status").notNull().default("draft"),

    metaTitle: varchar("meta_title", { length: 180 }),

    metaDescription: varchar("meta_description", {
      length: 320,
    }),

    publishedAt: timestamp("published_at", {
      withTimezone: true,
    }),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("website_pages_slug_unique").on(
      table.slug
    ),

    statusIndex: index("website_pages_status_idx").on(
      table.status
    ),
  })
);
