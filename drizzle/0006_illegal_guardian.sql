CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "teacher_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"alternate_phone" varchar(30),
	"gender" varchar(30),
	"date_of_birth" date,
	"joining_date" date NOT NULL,
	"designation" varchar(100) DEFAULT 'Teacher' NOT NULL,
	"qualification" varchar(180),
	"specialization" varchar(180),
	"experience_years" integer DEFAULT 0 NOT NULL,
	"address" text,
	"emergency_contact_name" varchar(150),
	"emergency_contact_phone" varchar(30),
	"employment_status" varchar(30) DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "teacher_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "teacher_profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "teacher_subject_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_user_id" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"class_section_id" uuid NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_subject_assignments" ADD CONSTRAINT "teacher_subject_assignments_teacher_user_id_teacher_profiles_user_id_fk" FOREIGN KEY ("teacher_user_id") REFERENCES "public"."teacher_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_subject_assignments" ADD CONSTRAINT "teacher_subject_assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_subject_assignments" ADD CONSTRAINT "teacher_subject_assignments_class_section_id_class_sections_id_fk" FOREIGN KEY ("class_section_id") REFERENCES "public"."class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subjects_name_idx" ON "subjects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "subjects_active_idx" ON "subjects" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "teacher_profiles_employee_id_idx" ON "teacher_profiles" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "teacher_profiles_status_idx" ON "teacher_profiles" USING btree ("employment_status");--> statement-breakpoint
CREATE INDEX "teacher_profiles_joining_date_idx" ON "teacher_profiles" USING btree ("joining_date");--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_subject_assignment_unique" ON "teacher_subject_assignments" USING btree ("teacher_user_id","subject_id","class_section_id","academic_year");--> statement-breakpoint
CREATE INDEX "teacher_subject_assignment_teacher_idx" ON "teacher_subject_assignments" USING btree ("teacher_user_id","is_active");--> statement-breakpoint
CREATE INDEX "teacher_subject_assignment_subject_idx" ON "teacher_subject_assignments" USING btree ("subject_id","is_active");--> statement-breakpoint
CREATE INDEX "teacher_subject_assignment_section_idx" ON "teacher_subject_assignments" USING btree ("class_section_id","is_active");--> statement-breakpoint
CREATE INDEX "teacher_subject_assignment_year_idx" ON "teacher_subject_assignments" USING btree ("academic_year");