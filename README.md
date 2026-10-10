# SelahFlow Studio v1.3.8 — Business marketplace and administrator directory

All **approved, active** businesses are discoverable at `/discover`. Database migration 006 publishes previously unlisted active businesses; businesses still pending registration, declined or suspended remain private.

The authenticated platform dashboard at `/admin/platform` now includes clickable business cards for **all accounts**, with a protected drilldown into owner information, business type, service catalogs, staff and customer booking history. Details are never returned to anonymous visitors or ordinary business owners. The main "Businesses" and "Listed businesses" metric cards link to the directory.

Businesses with no long-term service catalog or historical term enrollments have **no term-service tracking panel**. The platform's aggregated term-service section also disappears when there are no recorded term enrollments.

See `docs/RELEASE_v1.3.8_MARKETPLACE_ADMIN.md` for verification steps and scope.

# SelahFlow Studio v1.3.7 — All business registrations require approval

The **primary administrator** approves every new application in /admin/platform. New signups are `pending` and redirected to /registration-status. They cannot use private studio APIs or public booking until approved. Approval atomically makes the business `active` and `is_listed=true` so it appears in /discover automatically.

Signup supports broad service-industry categories plus 50-state dropdowns (and DC). Owner Settings supports minute/hour appointment service durations and separately tracked day/week/month/year services. Monthly and annual service enrollments, their start/renewal dates and statuses are visible to business owners and as aggregated counts to platform administrators. Term-service tracking is manual; Stripe recurring charges are still not active.

Full rollout and architecture: docs/RELEASE_v1.3.7_APPROVAL_AND_TERMS.md

# SelahFlow v1.3.6 — Business-wide themes and addresses

**Current release: 1.3.6.** Independent saved business themes apply to all owner dashboard views, dialogs, business profile, public business homepage, and booking screens. No changes to platform administration or shared SelahFlow branding.

Owners can type a business street address in **Dashboard → Settings** or **Business Profile**. Suggestions come from OpenStreetMap Photon with a 650ms client debounce, server-side per-owner throttling, an upstream limit, a ten-minute cache, explicit attribution, and manual-entry fallback. Public location displays include **Google Maps Directions** links (no Google API key required). Coordinates are not stored; the selected address, city and region remain in existing owner/business settings.

**Capacity note:** `photon.komoot.io` is a public demo best suited to development and light usage. It has no uptime or high-volume guarantee; use a hosted or self-managed geocoding provider for commercial scale. See docs/RELEASE_v1.3.6_BUSINESS_THEMES_ADDRESSES.md.

# SelahFlow Studio v1.3.5 — Full theme personalization

Owners can choose 20 presets and edit 19 HEX color roles or use a fully custom palette, plus select separate heading and body fonts from 12 options. Changes publish to the business's own public page, booking flow and owner dashboard without affecting the SelahFlow platform or other businesses. Accessible text colors are computed automatically. No migration or data reset. See docs/RELEASE_v1.3.5_THEMES.md.

# SelahFlow v1.3.4 — Password Minimum of Six Characters

This maintenance patch aligns password creation, change, administrator invitation, login and startup at a minimum of six characters. Existing v1.3.3 features and all account/business data remain untouched. Use long, unique passwords for stronger security.

# SelahFlow v1.3.3 — Owner Controls

New business-specific colors, logo uploads, descriptions, service catalog + team editors, server-enforced team subscription caps, self-service password changes, and primary administrator invitations. The original Crawford data remains intact. The primary administrator email is pbraza@gmail.com; passwords are not embedded in source, and new passwords must be at least 6 characters. Paid subscription activation is not implemented.

See [v1.3.3 guide](docs/RELEASE_v1.3.3_OWNER_CONTROLS.md).

# SelahFlow Studio v1.3.2 — Platform and per-business routing

Main platform: https://salonflow-hf3w.onrender.com/
Crawford public business page: /crawford
Crawford private dashboard: /studio/crawford
Crawford booking: /book/crawford
Business dashboard: /studio/{slug}
Customer booking: /book/{slug}
Crawford database records and existing SQL migrations remain unchanged.

# SelahFlow Studio — Version 1.3.1 Branding Update

v1.3.1 applies the Pause & Flow identity to the existing v1.3 platform. See [branding release and validation](docs/BRANDING_UPDATE_v1.3.1.md). Functional scope and the approved v1.3 roadmap remain unchanged.

SelahFlow is expanding from the original single-studio product into a multi-business booking platform. Version 1.3 is a development branch with registration, business booking slugs, marketplace directory moderation, owner business profiles and platform administrator summary counts. **It has not been verified or deployed to your Render production environment.**

**Important:** v1.3 does not process Stripe payments, bill paid subscriptions, collect marketplace referral commissions, send SMS, or run generative AI/voice. The published /pricing figures are a proposed business model, not live payment plans. See [v1.3 roadmap](docs/RELEASE_v1.3_ROADMAP.md). Do not publicly launch registration without email verification and security review.

Existing production v1.2 instructions and original /book booking flow are retained below for compatibility, but any statement below describing the app as exclusively single-business refers to the earlier v1.2 scope.


A standalone hair salon and barbershop management app for your own GitHub repository and Render account.

**No ChatGPT integration, ChatGPT login, Sites hosting, OpenAI API key or AI-provider dependency is required.** This ZIP is the source project. It has not been uploaded to your GitHub account or deployed to your Render account.

Start with [DEPLOY_RENDER.md](DEPLOY_RENDER.md).

## Included
- Public `/book` page with live availability, server-confirmed bookings and confirmation printing.
- Charcoal/navy/steel-blue theme and a dashboard button to copy the customer link.
- Owner email/password login, password hashing, 12-hour server-side sessions, logout and database-backed login throttling.
- Multi-service appointment creation, staff qualification matching, server-checked available times and cleanup buffers.
- PostgreSQL transactions and a unique owner/date/staff/minute reservation constraint to reject overlaps.
- Calendar, client directory, check-in, completion, cancellation and appointment CSV exports.
- Editable salon name, contact information, service prices/durations, staff names, hours and cancellation policy.
- Manual cash-sale recording with service/retail revenue reporting; appointment values remain separate from paid revenue.
- Deterministic guided FAQ assistant using configured services, hours and policy, with saved human-handoff requests.
- Clearly labeled sample appointments; samples are never saved as actual bookings or financial transactions.

## Current scope
This is a single-owner, single-business first release. Customers can book at `/book` without logging in. The owner dashboard remains protected. There are no customer accounts or customer self-service cancellation/rescheduling yet. The receptionist is a guided FAQ assistant, not generative AI. Additional production features from the master prompt remain unimplemented: customer/staff accounts and roles, staff breaks/holidays/time off, rescheduling, resource/chair capacity, checkout holds, provider payments/deposits/refunds, SMS/email reminders, true AI/voice, inventory ledger, packages, memberships, gift cards, full expenses/profit accounting, and multi-location/tenant onboarding. Do not represent those as active features.

Hours apply every day in America/New_York; configure daytime hours only. Booking durations and buffers use 15-minute increments. Existing bookings keep their original quoted price and reserved buffer. A settings change that alters a price/duration while booking is open rejects stale confirmation and asks for review.

Cash checkout uses the current catalog and a single configured tax rate. Product unit cost is snapshotted when a sale is recorded. Inventory is not decremented. Completed appointments are not automatically marked paid. The booked-time ratio uses opening hours, not fully adjusted staff utilization. Gross/net profit are intentionally unavailable until all required costs are recorded.

## Stack
Next.js + React + TypeScript, Node.js, PostgreSQL (`pg`). Standard npm commands; no proprietary hosting adapter. Keep PostgreSQL data outside the web service filesystem so deployments do not erase records.

## Local development
1. Install Node 22.22 or another supported Node 22/24 release and PostgreSQL 17+.
2. Copy `.env.example` to `.env.local`.
3. Set a local `DATABASE_URL`, your `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 6 characters.
4. Run `npm ci`.
5. Run `npm run db:migrate`.
6. Run `npm run dev` and open `http://localhost:3000`.
7. Sign in with your configured credentials.

The database migration requires PostgreSQL, not SQLite. Startup migrations are versioned and protected by a PostgreSQL advisory lock. Changing ADMIN_EMAIL or ADMIN_PASSWORD and restarting updates the same owner account and invalidates existing sessions; appointments remain attached to the same owner ID. There is no email password-reset provider.

## Commands
- `npm run dev` — local development
- `npm run typecheck` — TypeScript validation
- `npm test` — schema, transaction, password/session helper and origin tests
- `npm run build` — production Next.js build
- `npm start` — migrate database, provision owner, start on PORT (default 3000)
- `npm run db:migrate` — apply pending migrations and provision/update owner

## Data and access
Every owner studio API action requires a valid session. The separate public `/api/booking` endpoint permits only catalog retrieval, availability lookup and new booking creation. It never returns client records, owner email, sales, costs or internal events. Public booking adds database rate limits and a hidden anti-bot field; it does not include CAPTCHA or email identity verification. User IDs come from server-side sessions, never browser identity headers. The owner page redirects to login when unauthenticated; API data is not returned to anonymous callers. State-changing endpoints require same-origin requests. Passwords use salted scrypt, and the database stores only hashes of random session tokens. Production cookies are Secure and HttpOnly. Use HTTPS in production. No third-party payment credentials are collected.

Database access is internal-only in render.yaml (`ipAllowList: []`). Configure backup/restore retention in your Render database before using real customer records. Never commit `.env.local`, credentials, database dumps, `node_modules`, or `.next`.

## Release numbering
This is **version 1.3.1**, the branding and favicon patch for the v1.3 platform. The planned v1.4 feature milestone has not been released. See CHANGELOG.md. Replace source files in the existing repository when upgrading; preserve the Render database and apply additive migrations. Do not restore an older source version across incompatible migrations without a migration plan.

## Acceptance checks after deployment
Sign in, create a test appointment, refresh and confirm it persists; open a second browser session and confirm the same slot cannot be double-booked; cancel it and confirm capacity is released. Record a test cash sale only if clearly kept separate from real business records. Sign out and verify `/api/studio` returns 401. Verify the custom domain origin after setting APP_URL. Complete these checks in your actual Render account before opening operations.

## Sharing the booking link
Deploy this release to the existing Render web service. Use **Copy customer link** in the sidebar or open your normal app URL with `/book` appended. Example only: `https://YOUR-SERVICE.onrender.com/book`. Do not share the owner login credentials. The owner appointment list refreshes every 30 seconds while outside Settings, or immediately on page refresh.
