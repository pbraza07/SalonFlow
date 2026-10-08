# SalonFlow Studio — Version 1

A standalone hair salon and barbershop management app for your own GitHub repository and Render account.

**No ChatGPT integration, ChatGPT login, Sites hosting, OpenAI API key or AI-provider dependency is required.** This ZIP is the source project. It has not been uploaded to your GitHub account or deployed to your Render account.

Start with [DEPLOY_RENDER.md](DEPLOY_RENDER.md).

## Included
- Owner email/password login, password hashing, 12-hour server-side sessions, logout and database-backed login throttling.
- Multi-service appointment creation, staff qualification matching, server-checked available times and cleanup buffers.
- PostgreSQL transactions and a unique owner/date/staff/minute reservation constraint to reject overlaps.
- Calendar, client directory, check-in, completion, cancellation and appointment CSV exports.
- Editable salon name, contact information, service prices/durations, staff names, hours and cancellation policy.
- Manual cash-sale recording with service/retail revenue reporting; appointment values remain separate from paid revenue.
- Deterministic guided FAQ assistant using configured services, hours and policy, with saved human-handoff requests.
- Clearly labeled sample appointments; samples are never saved as actual bookings or financial transactions.

## Version 1 scope
This is a single-owner, single-business first release. Customer booking is an authenticated preview managed by the owner, not a public client portal. The receptionist is a guided FAQ assistant, not generative AI. Additional production features from the master prompt remain unimplemented: public booking, customer/staff accounts and roles, staff breaks/holidays/time off, rescheduling, resource/chair capacity, checkout holds, provider payments/deposits/refunds, SMS/email reminders, true AI/voice, inventory ledger, packages, memberships, gift cards, full expenses/profit accounting, and multi-location/tenant onboarding. Do not represent those as active features.

Hours apply every day in America/New_York; configure daytime hours only. Booking durations and buffers use 15-minute increments. Existing bookings keep their original quoted price and reserved buffer. A settings change that alters a price/duration while booking is open rejects stale confirmation and asks for review.

Cash checkout uses the current catalog and a single configured tax rate. Product unit cost is snapshotted when a sale is recorded. Inventory is not decremented. Completed appointments are not automatically marked paid. The booked-time ratio uses opening hours, not fully adjusted staff utilization. Gross/net profit are intentionally unavailable until all required costs are recorded.

## Stack
Next.js + React + TypeScript, Node.js, PostgreSQL (`pg`). Standard npm commands; no proprietary hosting adapter. Keep PostgreSQL data outside the web service filesystem so deployments do not erase records.

## Local development
1. Install Node 22.22 or another supported Node 22/24 release and PostgreSQL 17+.
2. Copy `.env.example` to `.env.local`.
3. Set a local `DATABASE_URL`, your `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 16 characters.
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
Every studio API action requires a valid session. User IDs come from server-side sessions, never browser identity headers. The owner page redirects to login when unauthenticated; API data is not returned to anonymous callers. State-changing endpoints require same-origin requests. Passwords use salted scrypt, and the database stores only hashes of random session tokens. Production cookies are Secure and HttpOnly. Use HTTPS in production. No third-party payment credentials are collected.

Database access is internal-only in render.yaml (`ipAllowList: []`). Configure backup/restore retention in your Render database before using real customer records. Never commit `.env.local`, credentials, database dumps, `node_modules`, or `.next`.

## Release numbering
This is **version 1**. Subsequent requested releases will be **1.1, 1.2, 1.3**, and onward. See CHANGELOG.md. Replace source files in the existing repository when upgrading; preserve the Render database and apply additive migrations. Do not restore an older source version across incompatible migrations without a migration plan.

## Acceptance checks after deployment
Sign in, create a test appointment, refresh and confirm it persists; open a second browser session and confirm the same slot cannot be double-booked; cancel it and confirm capacity is released. Record a test cash sale only if clearly kept separate from real business records. Sign out and verify `/api/studio` returns 401. Verify the custom domain origin after setting APP_URL. Complete these checks in your actual Render account before opening operations.
