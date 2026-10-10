-- v1.3.21: owner-isolated client profiles. Never delete booking or attendance history.
CREATE TABLE IF NOT EXISTS business_client_profiles (
 id TEXT PRIMARY KEY,
 owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 source_key TEXT,
 anchor_appointment_id TEXT,
 name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
 email TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 archived BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT client_profile_source_length CHECK (source_key IS NULL OR length(source_key)=32),
 CONSTRAINT client_profile_email_length CHECK (length(email)<=254),
 CONSTRAINT client_profile_phone_length CHECK (length(phone)<=40),
 CONSTRAINT client_profile_notes_length CHECK (length(notes)<=1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS business_client_profiles_source_unique
 ON business_client_profiles(owner,source_key) WHERE source_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS business_client_profiles_owner_idx
 ON business_client_profiles(owner,archived,updated_at DESC);
