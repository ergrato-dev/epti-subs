CREATE TYPE "public"."billing_cycle" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" text,
	"cost" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'COP' NOT NULL,
	"billing_cycle" "billing_cycle" DEFAULT 'monthly' NOT NULL,
	"next_payment_date" date NOT NULL,
	"category_id" integer,
	"payment_last4" varchar(4),
	"plan_name" varchar(100),
	"color" varchar(7),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;