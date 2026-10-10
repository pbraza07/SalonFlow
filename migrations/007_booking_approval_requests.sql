
-- SelahFlow v1.3.9: owner/team approval queue, no changes to confirmed appointments.
CREATE TABLE IF NOT EXISTS booking_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  start_minute INTEGER NOT NULL CHECK(start_minute>=0 AND start_minute<1440),
  duration INTEGER NOT NULL CHECK(duration>0 AND duration<=480),
  details TEXT NOT NULL,
  reviewer TEXT NOT NULL DEFAULT 'owner',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')),
  appointment_id TEXT REFERENCES appointments(id),
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT booking_request_appointment_consistency CHECK(status<>'accepted' OR appointment_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS booking_requests_owner_status ON booking_requests(owner_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS booking_requests_reviewer_status ON booking_requests(business_id,reviewer,status,created_at DESC);
CREATE TABLE IF NOT EXISTS booking_review_links (
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(business_id,staff_id)
);
