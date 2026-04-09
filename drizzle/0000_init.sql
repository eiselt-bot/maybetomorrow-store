CREATE TYPE "public"."delivery_zone" AS ENUM('diani-strip', 'south-coast', 'mombasa', 'further');--> statement-breakpoint
CREATE TYPE "public"."driver_status" AS ENUM('active', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('yellow', 'red');--> statement-breakpoint
CREATE TYPE "public"."incident_subject" AS ENUM('vendor', 'driver');--> statement-breakpoint
CREATE TYPE "public"."layout_variant" AS ENUM('earthy-artisan', 'vibrant-market', 'ocean-calm', 'heritage-story', 'bold-maker');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('new', 'confirmed', 'picked_up', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'stripe', 'mpesa');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'vendor');--> statement-breakpoint
CREATE TYPE "public"."root_cause" AS ENUM('vendor_fault', 'driver_fault', 'customer_fault', 'unclear');--> statement-breakpoint
CREATE TYPE "public"."shop_status" AS ENUM('draft', 'live', 'paused', 'archived');--> statement-breakpoint
CREATE TABLE "ai_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer,
	"purpose" text NOT NULL,
	"model" text NOT NULL,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"cost_usd" numeric(10, 4),
	"prompt_hash" text,
	"response_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"card_variant" text,
	"session_id" text,
	"user_agent" text,
	"referer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cross_sell_impressions" (
	"id" serial PRIMARY KEY NOT NULL,
	"trigger_order_id" integer NOT NULL,
	"suggested_product_id" integer NOT NULL,
	"clicked" boolean DEFAULT false NOT NULL,
	"converted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_rates" (
	"date" text PRIMARY KEY NOT NULL,
	"usd" numeric(12, 6) NOT NULL,
	"eur" numeric(12, 6) NOT NULL,
	"chf" numeric(12, 6) NOT NULL,
	"source" text DEFAULT 'exchangerate.host' NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"mpesa_number" text,
	"yellow_card_count" integer DEFAULT 0 NOT NULL,
	"status" "driver_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "incident_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_type" "incident_subject" NOT NULL,
	"subject_id" integer NOT NULL,
	"order_id" integer,
	"severity" "incident_severity" NOT NULL,
	"root_cause" "root_cause" NOT NULL,
	"evidence_photo_url" text,
	"description" text,
	"resolution_notes" text,
	"settlement_kes" integer DEFAULT 0,
	"issued_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_optins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"source_shop_id" integer,
	"source_order_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"shop_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price_kes" integer NOT NULL,
	"discount_pct" integer DEFAULT 0 NOT NULL,
	"line_total_kes" integer NOT NULL,
	"margin_kes" integer NOT NULL,
	"is_cross_sell" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"delivery_zone" "delivery_zone" NOT NULL,
	"delivery_address" text NOT NULL,
	"delivery_date" text NOT NULL,
	"delivery_time_note" text,
	"delivery_fee_kes" integer NOT NULL,
	"initial_shop_id" integer NOT NULL,
	"products_subtotal_kes" integer NOT NULL,
	"margin_kes" integer NOT NULL,
	"total_kes" integer NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cash' NOT NULL,
	"status" "order_status" DEFAULT 'new' NOT NULL,
	"newsletter_optin" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"gross_kes" integer NOT NULL,
	"margin_kes" integer NOT NULL,
	"deductions_kes" integer DEFAULT 0 NOT NULL,
	"net_kes" integer NOT NULL,
	"mpesa_ref" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"production_info" text,
	"delivery_days" integer DEFAULT 1,
	"price_kes" integer NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"is_top5" boolean DEFAULT true NOT NULL,
	"discount_pct" integer DEFAULT 0 NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"tagline" text,
	"vendor_user_id" integer,
	"vendor_phone" text NOT NULL,
	"vendor_mpesa_number" text,
	"about_photo_url" text,
	"about_name" text,
	"about_offering" text,
	"about_purpose" text,
	"about_production" text,
	"brand_values" jsonb,
	"layout_variant" "layout_variant",
	"design_tokens" jsonb,
	"copy_tone" text,
	"status" "shop_status" DEFAULT 'draft' NOT NULL,
	"yellow_card_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" "role" NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"hashed_password" text,
	"mpesa_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_scans" ADD CONSTRAINT "card_scans_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_sell_impressions" ADD CONSTRAINT "cross_sell_impressions_trigger_order_id_orders_id_fk" FOREIGN KEY ("trigger_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_sell_impressions" ADD CONSTRAINT "cross_sell_impressions_suggested_product_id_products_id_fk" FOREIGN KEY ("suggested_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_cards" ADD CONSTRAINT "incident_cards_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_cards" ADD CONSTRAINT "incident_cards_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_optins" ADD CONSTRAINT "newsletter_optins_source_shop_id_shops_id_fk" FOREIGN KEY ("source_shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_optins" ADD CONSTRAINT "newsletter_optins_source_order_id_orders_id_fk" FOREIGN KEY ("source_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_initial_shop_id_shops_id_fk" FOREIGN KEY ("initial_shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_vendor_user_id_users_id_fk" FOREIGN KEY ("vendor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_shop_idx" ON "order_items" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "orders_initial_shop_idx" ON "orders" USING btree ("initial_shop_id");--> statement-breakpoint
CREATE INDEX "products_shop_idx" ON "products" USING btree ("shop_id","is_top5");--> statement-breakpoint
CREATE INDEX "shops_status_idx" ON "shops" USING btree ("status");