CREATE TABLE "bridal_anonymous_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"device_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridal_generated_image" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"recommendation_id" text NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"type" varchar(32) NOT NULL,
	"r2_key" text,
	"thumbnail_r2_key" text,
	"generation_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"seedream_prompt" text NOT NULL,
	"prompt_version" varchar(32) NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridal_generation_job" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridal_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text,
	"report_id" text NOT NULL,
	"provider" varchar(32) DEFAULT 'creem' NOT NULL,
	"amount_cents" integer DEFAULT 1990 NOT NULL,
	"currency" varchar(8) DEFAULT 'usd' NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"creem_checkout_id" text,
	"creem_payment_id" text,
	"raw" text,
	"refund_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bridal_quiz_answer" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"answers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridal_recommendation" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"rank" integer NOT NULL,
	"style_name" text NOT NULL,
	"silhouette" text NOT NULL,
	"neckline" text NOT NULL,
	"fabric" text NOT NULL,
	"venue_match" text NOT NULL,
	"why_it_works" text NOT NULL,
	"what_to_avoid" text NOT NULL,
	"budget_min" integer NOT NULL,
	"budget_max" integer NOT NULL,
	"budget_guardrail" text NOT NULL,
	"try_first" jsonb NOT NULL,
	"skip_first" jsonb NOT NULL,
	"consultant_script" text NOT NULL,
	"sales_pressure_reminder" text NOT NULL,
	"detail_captions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridal_report" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"title" text DEFAULT 'Your Bridal Style Report' NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"price_cents" integer DEFAULT 1990 NOT NULL,
	"currency" varchar(8) DEFAULT 'usd' NOT NULL,
	"pdf_r2_key" text,
	"share_enabled" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridal_share_token" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"token" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bridal_share_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "bridal_uploaded_photo" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"r2_key" text NOT NULL,
	"processed_r2_key" text,
	"upload_status" varchar(32) DEFAULT 'uploaded' NOT NULL,
	"quality_score" real,
	"moderation_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridal_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"recommendation_id" text NOT NULL,
	"vote_type" varchar(32) NOT NULL,
	"voter_name" text,
	"voter_ip_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bridal_anonymous_session" ADD CONSTRAINT "bridal_anonymous_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_generated_image" ADD CONSTRAINT "bridal_generated_image_report_id_bridal_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."bridal_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_generated_image" ADD CONSTRAINT "bridal_generated_image_recommendation_id_bridal_recommendation_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."bridal_recommendation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_generated_image" ADD CONSTRAINT "bridal_generated_image_session_id_bridal_anonymous_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bridal_anonymous_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_generated_image" ADD CONSTRAINT "bridal_generated_image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_generation_job" ADD CONSTRAINT "bridal_generation_job_report_id_bridal_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."bridal_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_payment" ADD CONSTRAINT "bridal_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_payment" ADD CONSTRAINT "bridal_payment_session_id_bridal_anonymous_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bridal_anonymous_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_payment" ADD CONSTRAINT "bridal_payment_report_id_bridal_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."bridal_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_quiz_answer" ADD CONSTRAINT "bridal_quiz_answer_session_id_bridal_anonymous_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bridal_anonymous_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_quiz_answer" ADD CONSTRAINT "bridal_quiz_answer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_recommendation" ADD CONSTRAINT "bridal_recommendation_report_id_bridal_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."bridal_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_recommendation" ADD CONSTRAINT "bridal_recommendation_session_id_bridal_anonymous_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bridal_anonymous_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_recommendation" ADD CONSTRAINT "bridal_recommendation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_report" ADD CONSTRAINT "bridal_report_session_id_bridal_anonymous_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bridal_anonymous_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_report" ADD CONSTRAINT "bridal_report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_share_token" ADD CONSTRAINT "bridal_share_token_report_id_bridal_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."bridal_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_uploaded_photo" ADD CONSTRAINT "bridal_uploaded_photo_session_id_bridal_anonymous_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bridal_anonymous_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_uploaded_photo" ADD CONSTRAINT "bridal_uploaded_photo_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_vote" ADD CONSTRAINT "bridal_vote_report_id_bridal_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."bridal_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridal_vote" ADD CONSTRAINT "bridal_vote_recommendation_id_bridal_recommendation_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."bridal_recommendation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bridal_anonymous_session_user_idx" ON "bridal_anonymous_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bridal_anonymous_session_expires_at_idx" ON "bridal_anonymous_session" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bridal_generated_image_type_unique" ON "bridal_generated_image" USING btree ("recommendation_id","type");--> statement-breakpoint
CREATE INDEX "bridal_generated_image_report_idx" ON "bridal_generated_image" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "bridal_generated_image_status_idx" ON "bridal_generated_image" USING btree ("generation_status");--> statement-breakpoint
CREATE INDEX "bridal_generation_job_pending_idx" ON "bridal_generation_job" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "bridal_generation_job_report_idx" ON "bridal_generation_job" USING btree ("report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bridal_payment_creem_checkout_unique" ON "bridal_payment" USING btree ("creem_checkout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bridal_payment_creem_payment_unique" ON "bridal_payment" USING btree ("creem_payment_id");--> statement-breakpoint
CREATE INDEX "bridal_payment_report_idx" ON "bridal_payment" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "bridal_payment_user_idx" ON "bridal_payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bridal_quiz_answer_session_idx" ON "bridal_quiz_answer" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "bridal_quiz_answer_user_idx" ON "bridal_quiz_answer" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bridal_recommendation_report_rank_unique" ON "bridal_recommendation" USING btree ("report_id","rank");--> statement-breakpoint
CREATE INDEX "bridal_recommendation_report_idx" ON "bridal_recommendation" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "bridal_recommendation_user_idx" ON "bridal_recommendation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bridal_report_session_idx" ON "bridal_report" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "bridal_report_user_idx" ON "bridal_report" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bridal_report_status_idx" ON "bridal_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bridal_share_token_report_idx" ON "bridal_share_token" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "bridal_share_token_expires_at_idx" ON "bridal_share_token" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "bridal_uploaded_photo_session_idx" ON "bridal_uploaded_photo" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "bridal_uploaded_photo_user_idx" ON "bridal_uploaded_photo" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bridal_uploaded_photo_expires_at_idx" ON "bridal_uploaded_photo" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bridal_vote_voter_unique" ON "bridal_vote" USING btree ("report_id","voter_ip_hash","vote_type");--> statement-breakpoint
CREATE INDEX "bridal_vote_report_idx" ON "bridal_vote" USING btree ("report_id");