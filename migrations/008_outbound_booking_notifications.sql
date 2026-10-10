-- v1.3.10: single-request signed review links and outbound delivery audit.
-- Existing bookings, staff and reviewer invitation links remain intact.
CREATE TABLE IF NOT EXISTS booking_action_tokens (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_action_tokens_request_idx ON booking_action_tokens(request_id,expires_at);
CREATE TABLE IF NOT EXISTS booking_notification_attempts (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK(channel IN ('email','sms')),
  destination_masked TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('submitted','failed','not_configured','invalid_destination')),
  detail TEXT NOT NULL DEFAULT '',
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_notification_attempts_request_idx ON booking_notification_attempts(request_id,attempted_at DESC);
