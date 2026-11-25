
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

// =====================================================
// ENUMS
// =====================================================

export const pageStatusEnum = pgEnum("website_page_status", [
  "draft",
  "published",
  "archived",
]);

export const noticeStatusEnum = pgEnum("notice_status", [
  "draft",
  "published",
  "archived",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "archived",
]);

export const mediaVisibilityEnum = pgEnum("media_visibility", [
  "public",
  "private",
]);

export const galleryAlbumStatusEnum = pgEnum(
  "gallery_album_status",
  ["draft", "published", "archived"]
);

// =====================================================
// 1. WEBSITE PAGES
// =====================================================

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

// =====================================================
// 2. MEDIA ASSETS
// =====================================================

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    bucket: mediaVisibilityEnum("bucket").notNull(),

    objectKey: varchar("object_key", {
      length: 500,
    }).notNull(),

    originalName: varchar("original_name", {
      length: 255,
    }).notNull(),

    mimeType: varchar("mime_type", {
      length: 127,
    }).notNull(),

    sizeBytes: integer("size_bytes").notNull(),

    altText: text("alt_text"),

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

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    objectKeyUnique: uniqueIndex(
      "media_assets_bucket_object_key_unique"
    ).on(table.bucket, table.objectKey),

    visibilityIndex: index(
      "media_assets_visibility_idx"
    ).on(table.bucket),
  })
);

// =====================================================
// 3. WEBSITE NOTICES
// =====================================================

export const websiteNotices = pgTable(
  "website_notices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: varchar("title", { length: 180 }).notNull(),

    slug: varchar("slug", { length: 200 }).notNull(),

    summary: text("summary"),

    content: text("content").notNull().default(""),

    category: varchar("category", {
      length: 80,
    })
      .notNull()
      .default("general"),

    attachmentUrl: text("attachment_url"),

    isPinned: boolean("is_pinned").notNull().default(false),

    status: noticeStatusEnum("status")
      .notNull()
      .default("draft"),

    publishedAt: timestamp("published_at", {
      withTimezone: true,
    }),

    expiresAt: timestamp("expires_at", {
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

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    slugUnique: uniqueIndex("website_notices_slug_unique").on(
      table.slug
    ),

    statusIndex: index("website_notices_status_idx").on(
      table.status
    ),

    publishedIndex: index(
      "website_notices_published_at_idx"
    ).on(table.publishedAt),
  })
);

// =====================================================
// 4. WEBSITE EVENTS
// =====================================================

export const websiteEvents = pgTable(
  "website_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: varchar("title", { length: 180 }).notNull(),

    slug: varchar("slug", { length: 200 }).notNull(),

    summary: text("summary"),

    description: text("description").notNull().default(""),

    category: varchar("category", {
      length: 80,
    })
      .notNull()
      .default("school"),

    location: varchar("location", {
      length: 255,
    }),

    startAt: timestamp("start_at", {
      withTimezone: true,
    }).notNull(),

    endAt: timestamp("end_at", {
      withTimezone: true,
    }),

    coverImageUrl: text("cover_image_url"),

    status: eventStatusEnum("status")
      .notNull()
      .default("draft"),

    publishedAt: timestamp("published_at", {
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

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    slugUnique: uniqueIndex("website_events_slug_unique").on(
      table.slug
    ),

    statusIndex: index("website_events_status_idx").on(
      table.status
    ),

    startDateIndex: index("website_events_start_at_idx").on(
      table.startAt
    ),
  })
);

// =====================================================
// 5. GALLERY ALBUMS
// =====================================================

export const galleryAlbums = pgTable(
  "gallery_albums",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: varchar("title", { length: 180 }).notNull(),

    slug: varchar("slug", { length: 200 }).notNull(),

    description: text("description"),

    status: galleryAlbumStatusEnum("status")
      .notNull()
      .default("draft"),

    sortOrder: integer("sort_order").notNull().default(0),

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

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    slugUnique: uniqueIndex("gallery_albums_slug_unique").on(
      table.slug
    ),

    statusIndex: index("gallery_albums_status_idx").on(
      table.status
    ),
  })
);

// =====================================================
// 6. GALLERY ITEMS
// =====================================================

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    albumId: uuid("album_id")
      .notNull()
      .references(() => galleryAlbums.id, {
        onDelete: "cascade",
      }),

    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, {
        onDelete: "restrict",
      }),

    caption: varchar("caption", {
      length: 255,
    }),

    altText: text("alt_text"),

    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    albumIndex: index("gallery_items_album_idx").on(
      table.albumId
    ),

    uniqueMedia: uniqueIndex(
      "gallery_items_album_media_unique"
    ).on(table.albumId, table.mediaAssetId),
  })
);

// =====================================================
// 7. WEBSITE NAVIGATION
// =====================================================

export const navigationItems = pgTable(
  "navigation_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    menuKey: varchar("menu_key", {
      length: 60,
    })
      .notNull()
      .default("main"),

    label: varchar("label", {
      length: 120,
    }).notNull(),

    href: varchar("href", {
      length: 500,
    }).notNull(),

    parentId: uuid("parent_id"),

    sortOrder: integer("sort_order").notNull().default(0),

    isVisible: boolean("is_visible").notNull().default(true),

    openInNewTab: boolean("open_in_new_tab")
      .notNull()
      .default(false),

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
    menuIndex: index("navigation_items_menu_idx").on(
      table.menuKey,
      table.sortOrder
    ),

    parentIndex: index("navigation_items_parent_idx").on(
      table.parentId
    ),
  })
);

// =====================================================
// 8. WEBSITE SETTINGS
// =====================================================

export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    key: varchar("key", {
      length: 100,
    })
      .notNull()
      .unique(),

    value: jsonb("value").notNull(),

    description: text("description"),

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
  }
);

// =====================================================
// 9. WEBSITE CONTENT REVISIONS
// =====================================================

export const contentRevisions = pgTable(
  "content_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    pageId: uuid("page_id")
      .notNull()
      .references(() => websitePages.id, {
        onDelete: "cascade",
      }),

    revisionNumber: integer("revision_number").notNull(),

    title: varchar("title", {
      length: 180,
    }).notNull(),

    excerpt: text("excerpt"),

    content: text("content").notNull(),

    metaTitle: varchar("meta_title", {
      length: 180,
    }),

    metaDescription: varchar("meta_description", {
      length: 320,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pageIndex: index("content_revisions_page_idx").on(
      table.pageId
    ),

    revisionUnique: uniqueIndex(
      "content_revisions_page_revision_unique"
    ).on(table.pageId, table.revisionNumber),
  })
);
