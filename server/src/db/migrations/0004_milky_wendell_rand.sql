ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_success_idx" ON "payments" USING btree ("contribution_id") WHERE "payments"."status" = 'SUCCESS';--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_provider_reference_unique" UNIQUE("provider_reference");