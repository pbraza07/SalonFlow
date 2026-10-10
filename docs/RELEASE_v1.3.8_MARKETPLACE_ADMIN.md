# SelahFlow v1.3.8 — Full business marketplace and admin drilldown

## Active businesses: public marketplace
- Migration `006_marketplace_active_businesses.sql` backfills `is_listed=TRUE` for existing `status='active'` businesses. Existing Crawford, appointments, payments and credentials are not touched.
- `GET /api/marketplace` lists approved active businesses even if legacy `is_listed` was previously false. Pending, rejected and suspended businesses are **never** public.
- Newly approved businesses still receive `status='active'` and `is_listed=true` atomically through the primary administrator approval workflow.

## Private administration
- Administrator `/admin/platform` shows all registered businesses, including pending applications, as clickable cards. Sort/filter by status, search by owner/business name.
- Click any business to load `GET /api/platform/businesses/{id}`. The server first authenticates the current user and verifies the `platform_admins` role; ordinary owners, anonymous users and non-administrator clients cannot access business client data.
- Details include business name, business category, owner email, description, business model, address, subscription plan, services, team, appointment count, distinct client-email count, latest 200 appointments and client summaries derived from that recent history. Quoted prices are explicitly not proof of paid revenue.
- Customer history is only available inside protected administration, never the public marketplace.
- Existing business registration approvals are still **primary-admin only**. The now-unneeded manual listing toggles are removed.

## Conditional long-term tracking
- Owner Overview, Services and Reports show the `OwnerTermTracker` section only if a day/week/month/year service is configured **or** term enrollments exist.
- The global administrator long-term enrollment section is only shown when actual enrollments exist; a business's private details only show its term enrollments if nonempty.
- No recurring payment functions are enabled by this release.

## Deployment verification
GitHub CI must pass TypeScript, unit/regression tests and Next.js build. Render must apply migration 006 and report healthy live startup for commit/version 1.3.8. Check /api/health and /discover after deployment.
