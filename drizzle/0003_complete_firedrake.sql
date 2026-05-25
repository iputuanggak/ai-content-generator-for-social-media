CREATE TYPE "public"."credit_batch_type" AS ENUM('starter', 'top_up');--> statement-breakpoint
CREATE TYPE "public"."credit_transaction_type" AS ENUM('starter_grant', 'top_up', 'generation', 'regeneration', 'batch_expiry');--> statement-breakpoint
CREATE TABLE "credit_batch" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"initial_amount" integer NOT NULL,
	"remaining" integer NOT NULL,
	"type" "credit_batch_type" NOT NULL,
	"stripe_session_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"amount" integer NOT NULL,
	"type" "credit_transaction_type" NOT NULL,
	"reference_id" text,
	"member_id" text,
	"batch_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_batch" ADD CONSTRAINT "credit_batch_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_batch_id_credit_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."credit_batch"("id") ON DELETE no action ON UPDATE no action;