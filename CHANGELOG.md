## SelahFlow v1.3.8 — Marketplace backfill and platform business drilldown (2026-10-09)
- Existing approved active businesses, including previously non-listed businesses, are published to the marketplace by one-time additive migration 006.
- The public marketplace returns all active businesses, independent of stale preexisting is_listed flags; pending, rejected and suspended businesses remain hidden.
- Platform admin dashboard now includes a clickable, responsive directory of all registered businesses, with industry, city, owner, plan, status and appointment totals.
- Protected administrator-only detail endpoint returns business profile, services, team, aggregate client counts, and the latest 200 customer appointments with status and quoted prices. No customer history is exposed in the public marketplace.
- Monthly/yearly service tracking panels are hidden for businesses with no term-service catalog or historical enrollments; no empty tracking sections are shown in the platform dashboard.
- Active business listings cannot be manually disabled through the legacy listing-approval API.
- Existing bookings, tenants, branding and database records are preserved. Recurring billing remains inactive.

## v1.3.7 — Business approval, duration units and service-term tracking — October 9, 2026

- New business registrations enter 'pending'; primary platform administrator approves/declines from the protected dashboard.
- Approval activates the owner dashboard, public booking and marketplace listing in one server-side update. Declined accounts are not publicly listed.
- Existing active Crawford and other historical businesses retain their status, appointments and data.
- Registration and marketplace dropdowns offer broad categories across beauty, health, education, trades, professional services, events and others.
- State dropdowns for all 50 U.S. states plus Washington, DC in signup, Business Profile and owner Settings.
- Services offer duration units minutes, hours, days, weeks, months and years. Minutes/hours book slots as before; longer services are recorded as term enrollments.
- Owners can record and complete/cancel client enrollments. Monthly and annual active enrollment counts are visible on owner and platform administrator dashboards; no subscription charges or renewals are automated.
- PostgreSQL migration 005 adds pending/rejected business statuses and owner-scoped service_enrollments, without modifying existing appointments.
- The 6-character minimum password policy remains unchanged.

## v1.3.6 — Consistent business branding, address autocomplete & Google Maps — 2026-10-09
- Applied every business theme to every dedicated business screen: owner dashboard pages, dashboard dialogs, public booking, public business profile, and private Business Profile editor.
- Fixed text/background contrast and font propagation in previously hardcoded dashboard, booking, and service card sections; semantic success/error messages remain distinguishable.
- Added OpenStreetMap Photon-powered street address suggestions to dashboard Settings and Business Profile, with server-side validation, cache, request throttling, graceful manual entry fallback, and OpenStreetMap attribution.
- Added universal Google Maps directions links to booking page, confirmation, public business pages, marketplace listings, owner settings, and private Business Profile.
- Synchronizes the selected street address with business settings and city/region, preserving independent business ownership and existing appointments.
- Fixed brand/header and rebooking links to retain the current business slug instead of redirecting other tenants to Crawford.
- No new migrations, changes to booking business logic, service catalog, subscriptions, roles, or passwords.
- Public Photon geocoding demo is intended for modest traffic. Switch to a dedicated/commercial geocoding service for production scale.

## Version 1.3.5 — Business-wide palette and typography customization — 2026-10-09
- 20 coordinated color palettes and 12 font choices with separate heading/body typography.
- 19 editable HEX color roles covering booking header, page, cards, policy, forms, steps, selections, buttons, links, and footer.
- Browser and server validate saved themes; automatically choose readable text colors for contrasting backgrounds.
- Applied themes to individual owners' workspaces, public business profiles and customer booking pages.
- Theme saved per owner in the existing PostgreSQL settings record (no new migration or database reset).
- Existing logos, service/staff catalog, passwords and v1.3.4 six-character password policy preserved.

## Version 1.3.4 — October 9, 2026
- Unified six-character minimum for new owner passwords, password changes, administrator invites, sign-in and startup.
- Matched server validation, browser form limits, user-visible messages and tests.
- No database migrations or existing account password resets.

## Version 1.3.3 — October 9, 2026
- Customizable business logo, brand colors, and business model.
- Add/remove service types and staff, with server-side plan enforcement.
- Secure owner password changes; invited administrators managed by primary account.
- Role-based platform admin route, preserving original appointments and business data.

## Version 1.3.2 — October 9, 2026
- Separate public platform home from per-business dashboards.
- Add Crawford public profile and private workspace.
- Route login and signup to each business workspace.
- Preserve all business and appointment records, and reserve platform slugs.

# SelahFlow release history

## Version 1.3.1 — Branding and favicon patch — 2026-10-09
- Applied SelahFlow Pause & Flow logos, palette and display name to the v1.3 platform.
- Added the deep-teal browser icon with a versioned URL to refresh cached icons.
- Corrected earlier branding release labels; this is a v1.3 patch, not a new feature milestone.
- Preserved business data, Crawford booking, permissions, authentication, workflows and the approved roadmap.

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
Current release: 1.3.1. Branding/fix patches remain in the 1.3.x series; feature milestones follow the approved roadmap.
ZIP filenames: SelahFlow_Studio_v1.zip, SelahFlow_Studio_v1.1.zip, …
The package.json machine version for version 1 is 1.0.0; version 1.1 uses 1.1.0.
Do not create an empty new version without actual changes.
