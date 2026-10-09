# SelahFlow Studio v1.3.7 — Release & Operations Guide

## Pending registration lifecycle
- Every new signup creates a `businesses.status='pending'` row and a user session. It does NOT create a live booking or marketplace listing.
- The owner lands at `/registration-status`; a rejected application displays a declined message.
- Only the **primary platform administrator** (`pbraza@gmail.com` with the primary role) may approve/decline registrations at `/admin/platform`. Secondary platform admins may read metrics but cannot make this decision.
- **Approve** atomically sets `status='active'` and `is_listed=true` and clears outstanding listing-request flags. Owner access and public booking then become available. Staff/services start empty; business owners can populate them after approval.
- **Decline** sets `status='rejected'` and `is_listed=false`. Changing routes or sign-in cannot bypass approval.
- Existing active Crawford, pre-existing registered businesses and appointments are preserved. No retroactive changes to their listings. Existing active business manual listing-review workflow remains available.

## Business lines and states
- `lib/business-options.ts` provides broad industry choices for registration and marketplace search.
- `US_STATES` includes all 50 U.S. states plus the District of Columbia. Dropdowns appear at signup, Business Profile and owner Settings; address selection fills the state when possible.

## Service duration and tracking
- `durationUnit` and `durationValue` are added to each business's existing settings JSON service catalog. Legacy services without these fields remain 'minutes' automatically.
- Minute services support 15–480 minutes in 15-minute increments; hours support 1–8 hours. They remain schedule-compatible appointment services.
- Day/week/month/year services support 1–365 units, use a stored `duration=0`, and are explicitly not bookable in same-day appointment slots.
- The `service_enrollments` PostgreSQL table stores manually entered customer name/email, service snapshot, start/end calendar dates and status. Month/year ends use calendar arithmetic; no approximate 30/365-day assumptions.
- Owner Overview, Services, and Reports sections show monthly and annual counts. Service tab shows individual enrollments, their dates and status. Platform dashboard shows aggregated totals per business and term unit.
- This release provides **tracking**, not auto-renewing payment plans, alerts or card billing.

## Verification
Run `npm ci && npm run typecheck && npm test && npm run build`. Verify Render auto-applies migration 005. Inspect /api/health, /signup, /registration-status, /admin/platform, /discover and business booking URLs. Preserve the production database and secrets.

