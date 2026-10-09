
-- v1.3.7: preserve all existing live business accounts and appointments.
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_status_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_status_check CHECK(status IN ('pending','active','rejected','suspended'));
CREATE INDEX IF NOT EXISTS businesses_pending_approval_idx ON businesses(status,created_at) WHERE status='pending';

CREATE TABLE IF NOT EXISTS service_enrollments (
 id TEXT PRIMARY KEY,
 business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 service_id TEXT NOT NULL,
 service_name TEXT NOT NULL,
 duration_value INTEGER NOT NULL CHECK(duration_value BETWEEN 1 AND 365),
 duration_unit TEXT NOT NULL CHECK(duration_unit IN ('days','weeks','months','years')),
 client_name TEXT NOT NULL,
 client_email TEXT NOT NULL DEFAULT '',
 starts_on DATE NOT NULL,
 ends_on DATE NOT NULL,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled','completed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(ends_on>starts_on)
);
CREATE INDEX IF NOT EXISTS service_enrollments_business_idx ON service_enrollments(business_id,duration_unit,ends_on);
