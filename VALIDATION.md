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
