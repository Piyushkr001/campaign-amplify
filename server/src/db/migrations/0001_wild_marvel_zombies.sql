ALTER TABLE "campaigns" ALTER COLUMN "creator_display_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "summary" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "funding_goal" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "cover_image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "story_content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "failed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "campaign_reviews_campaign_id_idx" ON "campaign_reviews" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_sources_campaign_id_idx" ON "campaign_sources" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_status_history_campaign_id_idx" ON "campaign_status_history" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_targeting_campaign_id_idx" ON "campaign_targeting" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_category_idx" ON "campaigns" USING btree ("category");--> statement-breakpoint
CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaigns_amount_raised_idx" ON "campaigns" USING btree ("amount_raised");--> statement-breakpoint
ALTER TABLE "campaign_targeting" DROP COLUMN "duration_days";