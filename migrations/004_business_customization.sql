-- v1.3.3 additive business identity, branding and administrators
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_primary TEXT NOT NULL DEFAULT '#123F3A';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_background TEXT NOT NULL DEFAULT '#F7F4EC';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_model TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS business_logos (
 business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
 mime_type TEXT NOT NULL CHECK(mime_type IN ('image/png','image/jpeg','image/webp')),
 bytes BYTEA NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE platform_admins ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE platform_admins ADD COLUMN IF NOT EXISTS granted_by TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS one_primary_platform_admin ON platform_admins(role) WHERE role='primary';
