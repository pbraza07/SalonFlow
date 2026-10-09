# v1.5 — Browser icon refresh

- Use the deep-teal Pause & Flow app icon as the browser-tab and shortcut icon on all routes.
- Give the icon a new versioned URL so browsers can stop reusing the old purple SF favicon.
- No business data, routes, authentication, workflows or deployment settings changed.

# SelahFlow release history

## Version 1.4 — Branding only — 2026-10-09
- Applied Pause & Flow logos, deep teal/sage/ivory/gold palette and platform display name.
- Preserved v1.3 application behavior, database/migrations, business identities, Crawford routes, authentication, permissions and deployment settings.
- Technical SalonFlow identifiers remain unchanged for compatibility.

## Version 1.3 (development branch) — 2026-10-08
- Added additive multi-business schema, customer-facing signup, per-business booking slugs, platform admin role, business profile editor, discovery marketplace and listing approval.
- Preserved original /book, owner data and existing calendar/checkout; owner dashboard now resolves its branded booking URL.
- Protected the platform administrator during startup migrations instead of rewriting the oldest owner indiscriminately.
- Added a static proposed price catalog, referral fee calculation and storage tables. Paid checkout, Connect merchant payments, fee assessment, AI, SMS and voice are NOT implemented or live.
- Added platform foundation tests, CI workflow and phased development roadmap in docs/RELEASE_v1.3_ROADMAP.md.
- Requires backup and staging validation. Public self-registration must undergo further email verification, security and abuse testing before unrestricted commercial launch.

# Release history

## Version 1.2 — 2026-10-08
- Added public customer booking at /book, with no customer login required.
- Added a restricted public catalog/availability/booking API using the existing transactional scheduling engine.
- Added public request limits, policy consent, stale-quote protection, idempotent submissions and a hidden anti-bot field.
- Added owner dashboard booking-link copy/open actions and 30-second refresh outside Settings.
- Changed the theme to charcoal, navy and steel blue.
- Preserved existing records, owner authentication and the 6-character admin password minimum.

## Version 1.1 — 2026-10-08
- Reduced ADMIN_PASSWORD minimum length from 16 to 6 characters.
- Updated setup instructions and environment example.
- Existing passwords continue to work; change ADMIN_PASSWORD in Render and restart to set a new password.

## Version 1 — 2026-10-08
- Standalone GitHub + Render distribution.
- Standard Next.js Node server and PostgreSQL persistence.
- Independent owner email/password login and secure session cookies.
- Removed ChatGPT login, Sites, Cloudflare runtime, and OpenAI dependencies.
- Preserved appointment booking, calendar, clients, catalog settings, check-in, cancellation, manual cash checkout, reporting, and guided FAQ assistant.
- Added Render Blueprint, database migrations, startup account provisioning and deployment instructions.

## Version convention
User-facing releases: 1, 1.1, 1.2, 1.3, …
ZIP filenames: SelahFlow_Studio_v1.zip, SelahFlow_Studio_v1.1.zip, …
The package.json machine version for version 1 is 1.0.0; version 1.1 uses 1.1.0.
Do not create an empty new version without actual changes.
