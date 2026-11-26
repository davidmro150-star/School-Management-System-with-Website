CREATE TABLE "student_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"village" varchar(150),
	"post_office" varchar(150),
	"postal_code" varchar(20),
	"union_name" varchar(150),
	"upazila" varchar(150),
	"district" varchar(150),
	"present_address" text,
	"permanent_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_addresses_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "student_emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"contact_name" varchar(150) NOT NULL,
	"relationship" varchar(50),
	"phone" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_guardians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"father_name" varchar(150),
	"father_phone" varchar(30),
	"father_occupation" varchar(100),
	"mother_name" varchar(150),
	"mother_phone" varchar(30),
	"mother_occupation" varchar(100),
	"guardian_name" varchar(150),
	"guardian_relationship" varchar(50),
	"guardian_phone" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_guardians_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "blood_group" varchar(5);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "religion" varchar(50);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "previous_school" varchar(200);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "previous_class" varchar(50);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "admission_date" date;--> statement-breakpoint
ALTER TABLE "student_addresses" ADD CONSTRAINT "student_addresses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_emergency_contacts" ADD CONSTRAINT "student_emergency_contacts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_emergency_contacts_student_idx" ON "student_emergency_contacts" USING btree ("student_id");