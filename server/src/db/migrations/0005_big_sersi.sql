CREATE TABLE "campaign_channel_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"channel" varchar(100) NOT NULL,
	"spend" integer NOT NULL,
	"impressions" integer NOT NULL,
	"reach" integer NOT NULL,
	"clicks" integer NOT NULL,
	"ctr" numeric(5, 2) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"report_status" varchar(30) DEFAULT 'INTERIM' NOT NULL,
	"funds_raised" integer NOT NULL,
	"advertising_allocation" integer NOT NULL,
	"advertising_spend" integer NOT NULL,
	"platform_fee" integer NOT NULL,
	"processing_fee" integer NOT NULL,
	"estimated_impressions_min" integer NOT NULL,
	"estimated_impressions_max" integer NOT NULL,
	"measured_impressions" integer NOT NULL,
	"measured_reach" integer NOT NULL,
	"clicks" integer NOT NULL,
	"ctr" numeric(5, 2) NOT NULL,
	"duration_days" integer DEFAULT 14 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disclaimer" text NOT NULL,
	"is_demo_data" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_reports_campaign_id_unique" UNIQUE("campaign_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_channel_results" ADD CONSTRAINT "campaign_channel_results_report_id_campaign_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."campaign_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_reports" ADD CONSTRAINT "campaign_reports_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_channel_results_report_id_idx" ON "campaign_channel_results" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "campaign_reports_campaign_id_idx" ON "campaign_reports" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_reports_status_idx" ON "campaign_reports" USING btree ("report_status");