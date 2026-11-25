CREATE TYPE "public"."website_page_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "website_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"excerpt" text,
	"content" text DEFAULT '' NOT NULL,
	"featured_image_url" text,
	"status" "website_page_status" DEFAULT 'draft' NOT NULL,
	"meta_title" varchar(180),
	"meta_description" varchar(320),
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "website_pages_slug_unique" ON "website_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "website_pages_status_idx" ON "website_pages" USING btree ("status");