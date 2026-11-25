CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'cancelled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."gallery_album_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."media_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."notice_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"meta_title" varchar(180),
	"meta_description" varchar(320),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"status" "gallery_album_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"caption" varchar(255),
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket" "media_visibility" NOT NULL,
	"object_key" varchar(500) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(127) NOT NULL,
	"size_bytes" integer NOT NULL,
	"alt_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "navigation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_key" varchar(60) DEFAULT 'main' NOT NULL,
	"label" varchar(120) NOT NULL,
	"href" varchar(500) NOT NULL,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "website_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"summary" text,
	"description" text DEFAULT '' NOT NULL,
	"category" varchar(80) DEFAULT 'school' NOT NULL,
	"location" varchar(255),
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"cover_image_url" text,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "website_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"summary" text,
	"content" text DEFAULT '' NOT NULL,
	"category" varchar(80) DEFAULT 'general' NOT NULL,
	"attachment_url" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"status" "notice_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_page_id_website_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."website_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_album_id_gallery_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_revisions_page_idx" ON "content_revisions" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_revisions_page_revision_unique" ON "content_revisions" USING btree ("page_id","revision_number");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_albums_slug_unique" ON "gallery_albums" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "gallery_albums_status_idx" ON "gallery_albums" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gallery_items_album_idx" ON "gallery_items" USING btree ("album_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_items_album_media_unique" ON "gallery_items" USING btree ("album_id","media_asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_bucket_object_key_unique" ON "media_assets" USING btree ("bucket","object_key");--> statement-breakpoint
CREATE INDEX "media_assets_visibility_idx" ON "media_assets" USING btree ("bucket");--> statement-breakpoint
CREATE INDEX "navigation_items_menu_idx" ON "navigation_items" USING btree ("menu_key","sort_order");--> statement-breakpoint
CREATE INDEX "navigation_items_parent_idx" ON "navigation_items" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "website_events_slug_unique" ON "website_events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "website_events_status_idx" ON "website_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "website_events_start_at_idx" ON "website_events" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "website_notices_slug_unique" ON "website_notices" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "website_notices_status_idx" ON "website_notices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "website_notices_published_at_idx" ON "website_notices" USING btree ("published_at");