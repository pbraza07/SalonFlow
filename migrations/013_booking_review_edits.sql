-- SelahFlow 1.3.22: Every approved reviewer edit is kept for accountability.
-- Do not alter service/date/time/session capacity through this form.
CREATE TABLE IF NOT EXISTS booking_request_edits(
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
 business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 edited_by TEXT NOT NULL,
 before_details JSONB NOT NULL,
 after_details JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_request_edits_request_idx ON booking_request_edits(request_id,created_at);
