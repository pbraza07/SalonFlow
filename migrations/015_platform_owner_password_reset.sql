-- v1.3.22 primary administrator password recovery.
-- Password hashes remain one way; no original password is revealed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE platform_business_audit DROP CONSTRAINT IF EXISTS platform_business_audit_action_check;
ALTER TABLE platform_business_audit ADD CONSTRAINT platform_business_audit_action_check
 CHECK(action IN ('create','edit','archive','restore','suspend','activate','reset_password'));
CREATE INDEX IF NOT EXISTS users_password_rotation_idx ON users(id) WHERE must_change_password=TRUE;
