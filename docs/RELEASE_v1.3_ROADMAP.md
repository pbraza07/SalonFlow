# SalonFlow v1.3 platform roadmap — October 8, 2026

## Scope and release truth
Version 1.3 is a **development foundation**, not a Fresha-equivalent production release. The earlier 1.2 owner studio and public /book flow are preserved. Do not deploy the branch to a public production service until the registration and authorization checks below pass with a PostgreSQL backup. Do not charge marketplace fees, switch on paid checkout, or claim generative AI or SMS/voice access is working.

## Implemented in branch v1.3
- Additive businesses, platform admin, business memberships, plan, merchant-account, referral and AI-cost database tables. Merchant, referral and usage records are **storage only**; integrations are not wired up.
- Preserve the initial platform admin identity across deployments; prevent startup from overwriting newly registered owner credentials.
- Register the existing original studio as the first platform business with permanently reserved slug `crawford`. Canonical customer booking URL is `/book/crawford`; legacy `/book` also targets Crawford. Keep the original owner ID and all existing appointments, settings and team members.
- Public business signup with own authenticated owner session and isolated settings.
- Public /book/[slug] route reusing the current booking engine; legacy /book continues serving the original business.
- Owner-dashboard link resolves to its business slug.
- Business profile edit + request-for-listing workflow.
- Administrator-only listing moderation and summary counts.
- Discovery directory showing **approved** businesses only.
- Public proposal pricing page; v1.3 subscription records start on Free only.
- Additive migration test and basic commission calculator tests.

## Safety and known limitations
- Registration currently has password + rate limits but **not verified email, CAPTCHA, SSO, password reset or a staff invitation flow**. Limit exposure until those exist.
- New businesses need to add team members and services in Settings before accepting bookings. Public search requires listing approval.
- Scheduling and availability are currently hard-coded to America/New_York with shared daily hours; multi-timezone support, per-staff breaks and resources need a separate release.
- Public /book/[slug] does not yet support online payments, deposits, self-service cancellations or outbound confirmations. Booking response is server-confirmed, displayed in browser.
- The existing /api/studio records are tenant-isolated using owner session ID; platform businesses currently map one owner to one business. Staff/member roles are schema-only.
- Free/Professional/Business limits are not yet enforced by the backend, so they are displayed as proposed future tiers, not activated products.
- Marketplace origin tracking is not sufficient for billing without signed attribution and protection from fee disputes; referrals are not recorded or charged.
- AI and Stripe integrations are placeholders for roadmap work. There are no live provider secrets.
- Existing owner analytics track manual recorded cash sales, not reconciled payout revenue or net operating profit.
- Review privacy, consumer protection, consent, and accessibility before public launch.

## Upcoming milestone: v1.4 — SaaS security + subscription billing
1. Email verification, password reset, tenant-level authorization enforcement and staff role invite.
2. Stripe Billing hosted checkout, Customer Portal, idempotent webhook verification and subscription lifecycle state.
3. Server-side feature entitlements and a true subscription ledger.
4. Pricing terms, trial handling, refunds, tax and payment reconciliation.
Acceptance: subscriptions cannot be activated by tampering with the browser; payment retries do not duplicate fulfillment; accounts cannot read another tenant's records.

## Upcoming milestone: v1.5 — Merchant payments + marketplace revenue
1. Stripe Connect business onboarding, capability checks, transparent merchant terms.
2. Optional booking deposits, charges/refunds/disputes, receipts, fee reporting.
3. Signed marketplace referral attribution, one-time-new-customer eligibility by business, tips/tax/retail exclusion, dedupe, fee caps and refunds.
4. Sales, settlement, cash, tax and P&L report separation; business revenue dashboards.
Acceptance: zero duplicate commissions, checkout/refund reconciliation, direct-booking fee exemption and dispute reversal.

## Upcoming milestone: v1.6 — AI receptionist
1. Tool-based availability and booking assistant with human escalation, recording/consent disclosure.
2. Web chat -> opted-in SMS -> compliant voice call flow.
3. Per-business AI configuration and usage metering/limits.
4. Human override, no invented price or availability, prompt injection tests and service-safe refusals.
Acceptance: AI cannot see other customers or businesses, double-book, or create appointments without explicit confirmation.

## Upcoming milestone: v1.7+ — Operational scale
1. Pet profiles, vaccination/handling details, travel/service areas and business-template-specific resource booking.
2. Inventory movements, retail, memberships, gift cards, loyalty, customer account and cancellations.
3. Marketing consent, rebooking, promos and campaign profitability.
4. Per-staff availability/timezones, multi-location, ratings, SEO, performance, data retention, accessibility and mobile polishing.
Acceptance: recurring billing tested, backups restored, network errors recovered, measurable onboarding funnel and support runbook.

## Owner acceptance checklist for v1.3
1. Backup the production database; review SQL migration 003 before deploy.
2. Deploy on a staging Render service/database rather than production.
3. Confirm original owner account and existing appointments remain available.
4. Register a fresh test business at /signup with a different owner email.
5. Log in as that test owner; add services and a team member.
6. Open /business; copy /book/test-business-slug and make a future test booking.
7. Verify the booked record belongs only to the new owner (not the platform owner).
8. Request marketplace listing; approve as platform admin at /admin/platform.
9. Confirm /discover shows only the approved listing and booking uses the correct business.
10. Verify new owner cannot load /admin/platform metrics or approve its own listing.
11. Verify paid upgrade, card capture, commissions, AI/SMS/voice are **not** live.
12. Run npm ci, npm run typecheck, npm test, npm run build before promotion.

## Proposed prices (not activated)
Free $0; Professional $24.99/month; Business $69.99/month; AI add-on $49/month plus disclosed usage; referral 10% once on qualifying marketplace-acquired client, min $2 max $15, no fee on direct or repeat appointments. Terms and prices may change before commercial launch.

## Deployment
Existing stack: Next.js + React + TypeScript + Node 22 + PostgreSQL on Render. Existing DATABASE_URL, APP_URL, ADMIN_EMAIL and ADMIN_PASSWORD remain. No new external secrets are required in v1.3. Use a **staging** database first. Never share production PostgreSQL credentials in screenshots or GitHub. Deploying a GitHub branch to production without checking feature access is not recommended.
