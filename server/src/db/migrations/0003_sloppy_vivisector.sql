CREATE TYPE "public"."contribution_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('DEMO');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" uuid,
	"amount" integer NOT NULL,
	"status" "contribution_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"refunded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid NOT NULL,
	"provider" "payment_provider" DEFAULT 'DEMO' NOT NULL,
	"provider_reference" text NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"card_last4" varchar(4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"error_code" varchar(50),
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "draft_step" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contributions_campaign_id_idx" ON "contributions" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "contributions_user_id_idx" ON "contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contributions_status_idx" ON "contributions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contributions_created_at_idx" ON "contributions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_contribution_id_idx" ON "payments" USING btree ("contribution_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_provider_reference_idx" ON "payments" USING btree ("provider_reference");