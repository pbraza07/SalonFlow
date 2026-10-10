-- v1.3.8: one-time additive backfill. Only previously approved ACTIVE businesses become visible.
-- Pending, rejected and suspended businesses stay private. No customer/booking records are changed.
UPDATE businesses
SET is_listed=TRUE,
    listing_requested=FALSE,
    updated_at=now()
WHERE status='active'
  AND (is_listed=FALSE OR listing_requested=TRUE);
