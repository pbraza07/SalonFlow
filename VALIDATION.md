# v1.3.11 Web Push acceptance
- npm ci, npm run typecheck, npm test, npm run build.
- Verify /api/health reports 1.3.11, /sw.js and /manifest.webmanifest available on HTTPS.
- Owner Settings → Device Push → Enable prompts for permission on a direct user click and registers a device only under that logged-in business.
- Team reviewer (authorized expiring team link) can enable their own device and see only their assigned requests.
- Owner top bar bell shows pending/unread counts, clicking marks items read, and navigation opens the correct approval inbox.
- New request for Crawford notifies only Crawford's owner and designated team reviewers. Notification tap never accepts/declines without explicit confirmation.
- Confirm missing VAPID env values show Not configured without claiming delivery.
- Verify invalid Web Push endpoints (localhost/internal HTTP) rejected to prevent SSRF; expired push endpoints pruned.
- Verify no customer data is displayed in public marketplace or unrelated businesses. No existing bookings changed by migration.
- On iOS 16.4+, install Home Screen web app and enable notifications there; on Android and desktop browsers test actual receipt with consent.
- Ensure Render VAPID_PRIVATE_KEY persists through subsequent deployments and Render records successful migration 009.

# v1.3.10 Validation
- npm ci && npm run typecheck && npm test && npm run build.
- Owner can select email, SMS, or both, and choose owner or staff reviewer. All notification contacts are validated.
- Public booking with approval enabled creates pending request; no calendar slot until accepted.
- With verified provider credentials: email/SMS notification contains customer/service/date/time and review link; provider acceptance is shown in dashboard. Without credentials: dashboard indicates not configured, and no message is falsely reported as delivered.
- GET review link previews only; it cannot change a request. POST with a valid 72h token and explicit accept/decline changes the status. Replays fail.
- Accept checks team assignment, time, service limits; Decline leaves appointment calendar unchanged.
- Staff reviewer contacts are owner-managed; owner can resend failed channels with rate limit and successful channels never resend automatically.
- Existing v1.3.9 in-app staff review links and existing bookings remain functional.
- Render startup applies migration 008, and /api/health reports 1.3.10.

# v1.3.9 acceptance tests
- npm ci; npm run typecheck; npm test; npm run build
- Check /signup business categories sorted alphabetically by displayed label.
- Owner Settings: enable approval toggle, reviewer owner/staff, service slot limits 1–20. Save and refresh.
- When approval disabled, online bookings confirm immediately. When enabled, online bookings return pending and no appointment or calendar slots are created yet.
- Owner receives an in-app pending request within 20s, accepts and sees appointment on calendar; declines create no appointment.
- Staff review link is private, 30-day, revocable; only staff assigned to that reviewer ID can view/accept booking requests.
- Acceptance checks current team availability, business hours, and simultaneous service slot limits atomically. Concurrent requests for the same time cannot double-book a team member; on conflict keep request pending.
- Check duplicate request idempotency and preserve existing appointments from earlier releases.
- Confirm customer sees pending notice and not false booking confirmation.
- Verify Render migration 007 and service status live.

# v1.3.8 Release checks
- npm ci; npm run typecheck; npm test; npm run build.
- Migration 006 lists all preexisting active businesses without listing pending, rejected or suspended businesses.
- Marketplace /discover and GET /api/marketplace include all active business accounts.
- Platform admin /admin/platform shows business tiles, with expanded owner/business metadata, service list, staff list and customer booking history.
- Click both Businesses and Listed businesses metrics to navigate to the business directory; click a business tile to see details.
- GET /api/platform/businesses/:id returns 401 without session and 403 for nonadmins; it never exposes password hashes, raw auth data or client info through public endpoints.
- Long-term tracking disappears entirely on owner Overview/Reports/Services if no term service or enrollments, and at platform level if no term enrollment records.
- Existing business booking, Crawford, branding, subscriptions and data remain unchanged.

# v1.3.7 Acceptance tests

- New signup creates a pending business; owner is sent to /registration-status, private studio APIs return blocked and public /book/{slug} is inaccessible.
- Primary administrator pbraza@gmail.com sees all pending businesses in /admin/platform, can approve or decline. Other platform administrators cannot perform registration approvals.
- Approval sets status active AND is_listed true automatically. The business immediately appears in /discover and can sign in to its private dashboard.
- Declined business is not listed or bookable; old Crawford and approved businesses are unchanged.
- Signup industry categories and marketplace filters are consistent; state select includes all 50 states and DC.
- Service durations cover minutes/hours/days/weeks/months/years; hourly appointment slots never span multiple days.
- Manually enroll a client in monthly and yearly plans, verify owner counts and platform admin counts, mark an enrollment complete/cancelled and verify counts update.
- Existing appointment bookings remain valid and the 6-character password policy is unchanged.
- Run npm ci, npm run typecheck, npm test, npm run build; inspect Render migrations and /api/health 1.3.7.

# v1.3.5 acceptance
- Run npm ci, npm run typecheck, npm test, npm run build.
- Verify all 20 palettes and 12 font types appear in Branding.
- Select a preset, customize buttons/header/service card/booking steps/inputs/footer, and Save & publish. Reload /book/crawford and /crawford.
- Check readable text on light/dark colors and narrow mobile screen, including all booking steps.
- Verify custom colors remain after reload, and other business pages remain unchanged.
- Confirm existing Crawford staff, services and appointments remain.

# v1.3.3 acceptance: npm ci, typecheck, tests, build; verify booking records, logo persistence, plan team limits, password change and admin isolation after deploy.

# SelahFlow v1.3.2 route validation

Run npm ci, npm run typecheck, npm test and npm run build. Confirm Crawford existing appointments, services, team and account persist.

# Version 1 validation

Verified in the build environment on October 8, 2026:
- TypeScript validation passed.
- Standard Next.js production build passed.
- Four automated test groups passed: salted password verification, cookie/origin helpers, parameterized SQL adapter, and PostgreSQL reservation constraints/atomic rollback/owner scoping/cancellation release/audit idempotency.
- PostgreSQL tests used PGlite, an embedded PostgreSQL engine; they did not connect to a live Render database.
- Production HTTP smoke checks passed: login page renders; anonymous reads and writes return 401; a forged old hosting identity header grants no access; cross-origin login returns 403; unavailable database health returns 503.
- Runtime source/dependencies contain no ChatGPT authentication, Sites, Cloudflare or OpenAI integrations.

Not verified here: deployment in your GitHub/Render accounts, full live-PostgreSQL login and booking flows, visual browser interaction, provider payments or messaging. Follow the post-deployment acceptance checks in README.md. Those provider features are not included in version 1.

## Version 1.1 validation
Startup validation rejects a 5-character password and accepts 6- and 16-character passwords, then proceeds to database configuration validation. No database or deployed account was changed. The version 1 build and other test results above were not rerun for this small policy/documentation change.

## Version 1.2 validation
TypeScript validation and all five automated test groups passed. The new public handler test uses embedded PostgreSQL and verifies public catalog redaction, owner API rejection of anonymous requests, blocked public settings mutations, explicit policy acceptance, stale-price rejection, persistent booking creation, same-key retry, slot conflict rejection, correct owner/online-channel assignment and cross-origin rejection. Production build and route-render smoke checks are recorded with this release. Live Render database deployment and full browser visual QA still require verification in your installation.
