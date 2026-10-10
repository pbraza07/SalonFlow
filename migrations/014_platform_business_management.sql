-- Business lifecycle managed by signed-in SelahFlow platform administrators.
-- Archive is a reversible soft removal: never delete owners, appointments, clients,
-- subscriptions, bookings, Stripe IDs, or financial history.
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_status_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_status_check
 CHECK(status IN ('pending','active','rejected','suspended','archived'));
CREATE TABLE IF NOT EXISTS platform_business_audit (
 id TEXT PRIMARY KEY,
 business_id TEXT NOT NULL REFERENCES businesses(id),
 actor_id TEXT NOT NULL REFERENCES users(id),
 action TEXT NOT NULL CHECK (action IN ('create','edit','archive','restore','suspend','activate')),
 before_record JSONB,
 after_record JSONB,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_business_audit_business_idx
 ON platform_business_audit(business_id,created_at DESC);
