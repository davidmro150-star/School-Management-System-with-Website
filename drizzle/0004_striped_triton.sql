CREATE TABLE "teacher_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_user_id" varchar(255) NOT NULL,
	"class_section_id" uuid NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_class_section_id_class_sections_id_fk" FOREIGN KEY ("class_section_id") REFERENCES "public"."class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_assignments_teacher_section_year_unique" ON "teacher_assignments" USING btree ("teacher_user_id","class_section_id","academic_year");--> statement-breakpoint
CREATE INDEX "teacher_assignments_teacher_idx" ON "teacher_assignments" USING btree ("teacher_user_id","is_active");--> statement-breakpoint
CREATE INDEX "teacher_assignments_section_idx" ON "teacher_assignments" USING btree ("class_section_id","is_active");--> statement-breakpoint
CREATE INDEX "teacher_assignments_year_idx" ON "teacher_assignments" USING btree ("academic_year");