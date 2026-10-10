-- Preserve existing records while allowing separate business opt-ins on one browser endpoint.
ALTER TABLE business_push_subscriptions DROP CONSTRAINT IF EXISTS business_push_subscriptions_endpoint_key;
CREATE UNIQUE INDEX IF NOT EXISTS business_push_business_reviewer_endpoint_unique ON business_push_subscriptions(business_id,reviewer,endpoint);
