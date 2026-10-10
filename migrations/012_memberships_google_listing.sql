-- SelahFlow v1.3.22. Payment processing is per-merchant Stripe Connect.
-- No membership grants access before a verified advance payment webhook.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_listing_url TEXT NOT NULL DEFAULT '';
ALTER TABLE businesses ADD CONSTRAINT google_listing_url_max CHECK (length(google_listing_url)<=500);
CREATE TABLE IF NOT EXISTS membership_plans (
 id TEXT PRIMARY KEY,
 business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 100),
 description TEXT NOT NULL DEFAULT '' CHECK(length(description)<=1000),
 interval_unit TEXT NOT NULL CHECK(interval_unit IN ('week','month','year')),
 price_cents INTEGER NOT NULL CHECK(price_cents>=100 AND price_cents<=100000000),
 currency TEXT NOT NULL DEFAULT 'usd' CHECK(currency='usd'),
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS membership_plans_business_idx ON membership_plans(business_id,active,created_at);
CREATE TABLE IF NOT EXISTS customer_memberships (
 id TEXT PRIMARY KEY,
 business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 plan_id TEXT NOT NULL REFERENCES membership_plans(id),
 price_cents INTEGER NOT NULL CHECK(price_cents>=100 AND price_cents<=100000000),
 customer_name TEXT NOT NULL CHECK(length(trim(customer_name)) BETWEEN 2 AND 100),
 customer_email TEXT NOT NULL CHECK(length(trim(customer_email))<=254),
 status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK(status IN ('pending_payment','active','past_due','canceled','expired','payment_failed')),
 stripe_account_id TEXT NOT NULL,
 stripe_customer_id TEXT,
 stripe_subscription_id TEXT,
 stripe_checkout_session_id TEXT,
 paid_through TIMESTAMPTZ,
 last_paid_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (business_id,stripe_checkout_session_id),
 UNIQUE (business_id,stripe_subscription_id)
);
CREATE INDEX IF NOT EXISTS customer_memberships_business_idx ON customer_memberships(business_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS membership_webhook_events (
 event_id TEXT NOT NULL,
 stripe_account_id TEXT NOT NULL,
 event_type TEXT NOT NULL,
 processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY (event_id,stripe_account_id)
);
CREATE INDEX IF NOT EXISTS customer_memberships_checkout_idx ON customer_memberships(stripe_checkout_session_id);
