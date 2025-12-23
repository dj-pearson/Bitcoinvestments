drop extension if exists "pg_net";

create type "public"."ad_status" as enum ('active', 'paused', 'ended');

create type "public"."ad_zone" as enum ('banner', 'sidebar', 'native', 'popup');

create type "public"."alert_condition" as enum ('above', 'below');

create type "public"."article_status" as enum ('draft', 'published', 'archived');

create type "public"."platform_type" as enum ('exchange', 'wallet', 'tax_software', 'course');

create type "public"."subscription_status" as enum ('free', 'premium');

create type "public"."transaction_type" as enum ('buy', 'sell', 'transfer_in', 'transfer_out', 'staking_reward');

alter table "public"."video_tutorials" drop constraint "video_tutorials_instructor_id_fkey";

alter table "public"."portfolios" drop constraint "portfolios_user_id_fkey";

drop function if exists "public"."handle_new_user"();

drop index if exists "public"."idx_users_id";

drop index if exists "public"."idx_users_auth";


  create table "public"."advertisements" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "campaign_name" text not null,
    "advertiser_id" text not null,
    "ad_zone" public.ad_zone not null,
    "image_url" text not null,
    "target_url" text not null,
    "alt_text" text not null,
    "cta_text" text,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone not null,
    "impressions" integer default 0,
    "clicks" integer default 0,
    "status" public.ad_status default 'active'::public.ad_status,
    "targeting" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."advertisements" enable row level security;


  create table "public"."affiliate_clicks" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "session_id" text not null,
    "affiliate_id" text not null,
    "platform_type" public.platform_type not null,
    "platform_name" text not null,
    "source_page" text not null,
    "clicked_at" timestamp with time zone default now(),
    "converted" boolean default false,
    "conversion_value" numeric(10,2)
      );


alter table "public"."affiliate_clicks" enable row level security;


  create table "public"."articles" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "slug" text not null,
    "excerpt" text not null,
    "content" text not null,
    "featured_image" text,
    "author_id" uuid not null,
    "category" text not null,
    "tags" text[] default '{}'::text[],
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "status" public.article_status default 'draft'::public.article_status,
    "seo_title" text,
    "seo_description" text,
    "read_time_minutes" integer default 5,
    "view_count" integer default 0
      );


alter table "public"."articles" enable row level security;


  create table "public"."holdings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "portfolio_id" uuid not null,
    "cryptocurrency_id" text not null,
    "symbol" text not null,
    "name" text not null,
    "amount" numeric(20,10) not null default 0,
    "average_buy_price" numeric(20,10) not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."holdings" enable row level security;


  create table "public"."newsletter_subscribers" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "email" text not null,
    "subscribed_at" timestamp with time zone default now(),
    "unsubscribed_at" timestamp with time zone,
    "is_active" boolean default true,
    "source" text
      );


alter table "public"."newsletter_subscribers" enable row level security;


  create table "public"."price_alerts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "cryptocurrency_id" text not null,
    "symbol" text not null,
    "target_price" numeric(20,10) not null,
    "condition" public.alert_condition not null,
    "is_active" boolean default true,
    "triggered_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."price_alerts" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "holding_id" uuid not null,
    "type" public.transaction_type not null,
    "amount" numeric(20,10) not null,
    "price_per_unit" numeric(20,10) not null,
    "total_value" numeric(20,10) not null,
    "fee" numeric(20,10),
    "date" timestamp with time zone not null,
    "notes" text,
    "exchange" text,
    "created_at" timestamp with time zone default now(),
    "blockchain_tx_hash" text,
    "blockchain_chain" text,
    "synced_from_wallet" boolean default false,
    "synced_at" timestamp with time zone,
    "gas_fee" numeric(20,8),
    "token_address" text
      );


alter table "public"."transactions" enable row level security;

alter table "public"."portfolios" drop column "color";

alter table "public"."portfolios" drop column "description";

alter table "public"."portfolios" drop column "icon";

alter table "public"."portfolios" alter column "created_at" drop not null;

alter table "public"."portfolios" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."portfolios" alter column "is_default" drop not null;

alter table "public"."portfolios" alter column "updated_at" drop not null;

alter table "public"."users" drop column "avatar_url";

alter table "public"."users" drop column "full_name";

alter table "public"."users" add column "preferences" jsonb default '{}'::jsonb;

alter table "public"."users" add column "referral_code" text;

alter table "public"."users" add column "referred_by" text;

alter table "public"."users" add column "subscription_expires_at" timestamp with time zone;

alter table "public"."users" add column "subscription_status" public.subscription_status default 'free'::public.subscription_status;

alter table "public"."users" alter column "email" set not null;

CREATE UNIQUE INDEX advertisements_pkey ON public.advertisements USING btree (id);

CREATE UNIQUE INDEX affiliate_clicks_pkey ON public.affiliate_clicks USING btree (id);

CREATE UNIQUE INDEX articles_pkey ON public.articles USING btree (id);

CREATE UNIQUE INDEX articles_slug_key ON public.articles USING btree (slug);

CREATE UNIQUE INDEX holdings_pkey ON public.holdings USING btree (id);

CREATE UNIQUE INDEX holdings_portfolio_id_cryptocurrency_id_key ON public.holdings USING btree (portfolio_id, cryptocurrency_id);

CREATE INDEX idx_admin_audit_logs_created_brin ON public.admin_audit_logs USING brin (created_at) WITH (pages_per_range='128');

CREATE INDEX idx_advertisements_status ON public.advertisements USING btree (status);

CREATE INDEX idx_advertisements_zone ON public.advertisements USING btree (ad_zone);

CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks USING btree (affiliate_id);

CREATE INDEX idx_affiliate_clicks_clicked_at ON public.affiliate_clicks USING btree (clicked_at);

CREATE INDEX idx_affiliate_clicks_user ON public.affiliate_clicks USING btree (user_id);

CREATE INDEX idx_articles_category ON public.articles USING btree (category);

CREATE INDEX idx_articles_slug ON public.articles USING btree (slug);

CREATE INDEX idx_articles_status ON public.articles USING btree (status);

CREATE INDEX idx_holdings_portfolio_id ON public.holdings USING btree (portfolio_id);

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers USING btree (email);

CREATE INDEX idx_newsletter_subscribers_active ON public.newsletter_subscribers USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers USING btree (email);

CREATE INDEX idx_price_alerts_active ON public.price_alerts USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_price_alerts_user_id ON public.price_alerts USING btree (user_id);

CREATE INDEX idx_scam_reports_pending ON public.scam_reports USING btree (created_at DESC) WHERE (status = 'pending'::text);

CREATE INDEX idx_transactions_chain ON public.transactions USING btree (blockchain_chain);

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date);

CREATE INDEX idx_transactions_date_type ON public.transactions USING btree (date, type);

CREATE INDEX idx_transactions_holding_id ON public.transactions USING btree (holding_id);

CREATE INDEX idx_transactions_tx_hash ON public.transactions USING btree (blockchain_tx_hash);

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);

CREATE INDEX idx_users_subscription_status ON public.users USING btree (subscription_status);

CREATE UNIQUE INDEX newsletter_subscribers_email_key ON public.newsletter_subscribers USING btree (email);

CREATE UNIQUE INDEX newsletter_subscribers_pkey ON public.newsletter_subscribers USING btree (id);

CREATE UNIQUE INDEX price_alerts_pkey ON public.price_alerts USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_referral_code_key ON public.users USING btree (referral_code);

CREATE INDEX idx_users_auth ON public.users USING btree (id) INCLUDE (email, role, subscription_status, is_suspended);

alter table "public"."advertisements" add constraint "advertisements_pkey" PRIMARY KEY using index "advertisements_pkey";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_pkey" PRIMARY KEY using index "affiliate_clicks_pkey";

alter table "public"."articles" add constraint "articles_pkey" PRIMARY KEY using index "articles_pkey";

alter table "public"."holdings" add constraint "holdings_pkey" PRIMARY KEY using index "holdings_pkey";

alter table "public"."newsletter_subscribers" add constraint "newsletter_subscribers_pkey" PRIMARY KEY using index "newsletter_subscribers_pkey";

alter table "public"."price_alerts" add constraint "price_alerts_pkey" PRIMARY KEY using index "price_alerts_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."affiliate_clicks" validate constraint "affiliate_clicks_user_id_fkey";

alter table "public"."articles" add constraint "articles_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."articles" validate constraint "articles_author_id_fkey";

alter table "public"."articles" add constraint "articles_slug_key" UNIQUE using index "articles_slug_key";

alter table "public"."copy_trade_executions" add constraint "copy_trade_executions_original_transaction_id_fkey" FOREIGN KEY (original_transaction_id) REFERENCES public.transactions(id) not valid;

alter table "public"."copy_trade_executions" validate constraint "copy_trade_executions_original_transaction_id_fkey";

alter table "public"."holdings" add constraint "holdings_portfolio_id_cryptocurrency_id_key" UNIQUE using index "holdings_portfolio_id_cryptocurrency_id_key";

alter table "public"."holdings" add constraint "holdings_portfolio_id_fkey" FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE not valid;

alter table "public"."holdings" validate constraint "holdings_portfolio_id_fkey";

alter table "public"."newsletter_subscribers" add constraint "newsletter_subscribers_email_key" UNIQUE using index "newsletter_subscribers_email_key";

alter table "public"."price_alerts" add constraint "price_alerts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."price_alerts" validate constraint "price_alerts_user_id_fkey";

alter table "public"."transactions" add constraint "transactions_holding_id_fkey" FOREIGN KEY (holding_id) REFERENCES public.holdings(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_holding_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_referral_code_key" UNIQUE using index "users_referral_code_key";

alter table "public"."users" add constraint "users_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES public.users(referral_code) not valid;

alter table "public"."users" validate constraint "users_referred_by_fkey";

alter table "public"."portfolios" add constraint "portfolios_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."portfolios" validate constraint "portfolios_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        code := upper(substr(md5(random()::text), 1, 8));
        SELECT COUNT(*) INTO exists_count FROM public.users WHERE referral_code = code;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.advertisements
    SET clicks = clicks + 1
    WHERE id = ad_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.advertisements
    SET impressions = impressions + 1
    WHERE id = ad_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_nonces()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM wallet_auth_nonces
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$function$
;

grant delete on table "public"."advertisements" to "anon";

grant insert on table "public"."advertisements" to "anon";

grant references on table "public"."advertisements" to "anon";

grant select on table "public"."advertisements" to "anon";

grant trigger on table "public"."advertisements" to "anon";

grant truncate on table "public"."advertisements" to "anon";

grant update on table "public"."advertisements" to "anon";

grant delete on table "public"."advertisements" to "authenticated";

grant insert on table "public"."advertisements" to "authenticated";

grant references on table "public"."advertisements" to "authenticated";

grant select on table "public"."advertisements" to "authenticated";

grant trigger on table "public"."advertisements" to "authenticated";

grant truncate on table "public"."advertisements" to "authenticated";

grant update on table "public"."advertisements" to "authenticated";

grant delete on table "public"."advertisements" to "service_role";

grant insert on table "public"."advertisements" to "service_role";

grant references on table "public"."advertisements" to "service_role";

grant select on table "public"."advertisements" to "service_role";

grant trigger on table "public"."advertisements" to "service_role";

grant truncate on table "public"."advertisements" to "service_role";

grant update on table "public"."advertisements" to "service_role";

grant delete on table "public"."affiliate_clicks" to "anon";

grant insert on table "public"."affiliate_clicks" to "anon";

grant references on table "public"."affiliate_clicks" to "anon";

grant select on table "public"."affiliate_clicks" to "anon";

grant trigger on table "public"."affiliate_clicks" to "anon";

grant truncate on table "public"."affiliate_clicks" to "anon";

grant update on table "public"."affiliate_clicks" to "anon";

grant delete on table "public"."affiliate_clicks" to "authenticated";

grant insert on table "public"."affiliate_clicks" to "authenticated";

grant references on table "public"."affiliate_clicks" to "authenticated";

grant select on table "public"."affiliate_clicks" to "authenticated";

grant trigger on table "public"."affiliate_clicks" to "authenticated";

grant truncate on table "public"."affiliate_clicks" to "authenticated";

grant update on table "public"."affiliate_clicks" to "authenticated";

grant delete on table "public"."affiliate_clicks" to "service_role";

grant insert on table "public"."affiliate_clicks" to "service_role";

grant references on table "public"."affiliate_clicks" to "service_role";

grant select on table "public"."affiliate_clicks" to "service_role";

grant trigger on table "public"."affiliate_clicks" to "service_role";

grant truncate on table "public"."affiliate_clicks" to "service_role";

grant update on table "public"."affiliate_clicks" to "service_role";

grant delete on table "public"."articles" to "anon";

grant insert on table "public"."articles" to "anon";

grant references on table "public"."articles" to "anon";

grant select on table "public"."articles" to "anon";

grant trigger on table "public"."articles" to "anon";

grant truncate on table "public"."articles" to "anon";

grant update on table "public"."articles" to "anon";

grant delete on table "public"."articles" to "authenticated";

grant insert on table "public"."articles" to "authenticated";

grant references on table "public"."articles" to "authenticated";

grant select on table "public"."articles" to "authenticated";

grant trigger on table "public"."articles" to "authenticated";

grant truncate on table "public"."articles" to "authenticated";

grant update on table "public"."articles" to "authenticated";

grant delete on table "public"."articles" to "service_role";

grant insert on table "public"."articles" to "service_role";

grant references on table "public"."articles" to "service_role";

grant select on table "public"."articles" to "service_role";

grant trigger on table "public"."articles" to "service_role";

grant truncate on table "public"."articles" to "service_role";

grant update on table "public"."articles" to "service_role";

grant delete on table "public"."holdings" to "anon";

grant insert on table "public"."holdings" to "anon";

grant references on table "public"."holdings" to "anon";

grant select on table "public"."holdings" to "anon";

grant trigger on table "public"."holdings" to "anon";

grant truncate on table "public"."holdings" to "anon";

grant update on table "public"."holdings" to "anon";

grant delete on table "public"."holdings" to "authenticated";

grant insert on table "public"."holdings" to "authenticated";

grant references on table "public"."holdings" to "authenticated";

grant select on table "public"."holdings" to "authenticated";

grant trigger on table "public"."holdings" to "authenticated";

grant truncate on table "public"."holdings" to "authenticated";

grant update on table "public"."holdings" to "authenticated";

grant delete on table "public"."holdings" to "service_role";

grant insert on table "public"."holdings" to "service_role";

grant references on table "public"."holdings" to "service_role";

grant select on table "public"."holdings" to "service_role";

grant trigger on table "public"."holdings" to "service_role";

grant truncate on table "public"."holdings" to "service_role";

grant update on table "public"."holdings" to "service_role";

grant delete on table "public"."newsletter_subscribers" to "anon";

grant insert on table "public"."newsletter_subscribers" to "anon";

grant references on table "public"."newsletter_subscribers" to "anon";

grant select on table "public"."newsletter_subscribers" to "anon";

grant trigger on table "public"."newsletter_subscribers" to "anon";

grant truncate on table "public"."newsletter_subscribers" to "anon";

grant update on table "public"."newsletter_subscribers" to "anon";

grant delete on table "public"."newsletter_subscribers" to "authenticated";

grant insert on table "public"."newsletter_subscribers" to "authenticated";

grant references on table "public"."newsletter_subscribers" to "authenticated";

grant select on table "public"."newsletter_subscribers" to "authenticated";

grant trigger on table "public"."newsletter_subscribers" to "authenticated";

grant truncate on table "public"."newsletter_subscribers" to "authenticated";

grant update on table "public"."newsletter_subscribers" to "authenticated";

grant delete on table "public"."newsletter_subscribers" to "service_role";

grant insert on table "public"."newsletter_subscribers" to "service_role";

grant references on table "public"."newsletter_subscribers" to "service_role";

grant select on table "public"."newsletter_subscribers" to "service_role";

grant trigger on table "public"."newsletter_subscribers" to "service_role";

grant truncate on table "public"."newsletter_subscribers" to "service_role";

grant update on table "public"."newsletter_subscribers" to "service_role";

grant delete on table "public"."price_alerts" to "anon";

grant insert on table "public"."price_alerts" to "anon";

grant references on table "public"."price_alerts" to "anon";

grant select on table "public"."price_alerts" to "anon";

grant trigger on table "public"."price_alerts" to "anon";

grant truncate on table "public"."price_alerts" to "anon";

grant update on table "public"."price_alerts" to "anon";

grant delete on table "public"."price_alerts" to "authenticated";

grant insert on table "public"."price_alerts" to "authenticated";

grant references on table "public"."price_alerts" to "authenticated";

grant select on table "public"."price_alerts" to "authenticated";

grant trigger on table "public"."price_alerts" to "authenticated";

grant truncate on table "public"."price_alerts" to "authenticated";

grant update on table "public"."price_alerts" to "authenticated";

grant delete on table "public"."price_alerts" to "service_role";

grant insert on table "public"."price_alerts" to "service_role";

grant references on table "public"."price_alerts" to "service_role";

grant select on table "public"."price_alerts" to "service_role";

grant trigger on table "public"."price_alerts" to "service_role";

grant truncate on table "public"."price_alerts" to "service_role";

grant update on table "public"."price_alerts" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

drop trigger if exists "on_auth_user_created" on "auth"."users";


