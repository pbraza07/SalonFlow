-- SelahFlow 1.3.11: per-business, per-reviewer Web Push subscriptions and unread receipts.
-- No changes to existing appointments or review flows.
CREATE TABLE IF NOT EXISTS business_push_subscriptions(
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_by_reviewer ON business_push_subscriptions(business_id,reviewer);
CREATE TABLE IF NOT EXISTS business_notification_reads(
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL,
  request_id TEXT NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(business_id,reviewer,request_id)
);
CREATE INDEX IF NOT EXISTS business_notification_reads_recent ON business_notification_reads(business_id,reviewer,read_at DESC);
