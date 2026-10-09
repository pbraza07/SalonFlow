-- SalonFlow v1.3: additive platform foundation. This migration never rewrites legacy appointments.
CREATE TABLE IF NOT EXISTS platform_admins (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS businesses (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 slug TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 industry TEXT NOT NULL DEFAULT 'barber',
 description TEXT NOT NULL DEFAULT '',
 city TEXT NOT NULL DEFAULT '',
 region TEXT NOT NULL DEFAULT '',
 timezone TEXT NOT NULL DEFAULT 'America/New_York',
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
 listing_requested BOOLEAN NOT NULL DEFAULT FALSE,
 is_listed BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT business_slug_format CHECK(slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$')
);
CREATE INDEX IF NOT EXISTS businesses_marketplace_idx ON businesses(is_listed,status,industry,city);
CREATE TABLE IF NOT EXISTS business_memberships (
 business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('owner','manager','staff')),
 PRIMARY KEY(business_id,user_id)
);
CREATE TABLE IF NOT EXISTS business_subscriptions (
 business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
 plan_code TEXT NOT NULL DEFAULT 'free' CHECK(plan_code IN ('free','professional','business')),
 status TEXT NOT NULL DEFAULT 'active',
 stripe_customer_id TEXT UNIQUE,
 stripe_subscription_id TEXT UNIQUE,
 ai_addon BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS merchant_accounts (
 business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
 provider TEXT NOT NULL DEFAULT 'stripe',
 external_account_id TEXT UNIQUE,
 onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
 charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_referrals (
 id TEXT PRIMARY KEY,
 business_id TEXT NOT NULL REFERENCES businesses(id),
 appointment_id TEXT NOT NULL UNIQUE REFERENCES appointments(id),
 customer_fingerprint TEXT NOT NULL,
 fee_cents INTEGER NOT NULL CHECK(fee_cents>=0),
 currency TEXT NOT NULL DEFAULT 'usd',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','earned','waived','refunded')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(business_id,customer_fingerprint)
);
CREATE INDEX IF NOT EXISTS marketplace_referrals_business_idx ON marketplace_referrals(business_id,created_at);
CREATE TABLE IF NOT EXISTS ai_usage (
 id TEXT PRIMARY KEY,
 business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 channel TEXT NOT NULL CHECK(channel IN ('web','sms','voice')),
 units INTEGER NOT NULL DEFAULT 0 CHECK(units>=0),
 estimated_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK(estimated_cost_cents>=0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_business_idx ON ai_usage(business_id,created_at);
