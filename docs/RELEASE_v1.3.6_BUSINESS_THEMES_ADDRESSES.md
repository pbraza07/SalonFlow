# SelahFlow v1.3.6 — Business themes & address workflow

## Branding persistence
- Themes remain saved per business owner in the `settings.data.theme` JSON field. No schema change required.
- The `themeStyles` utility now maps all palette roles, font styles, readable text colors to business home, booking, every owner dashboard view/modal, and business profile.
- General platform home, discovery shell, signup/login, and platform administration are **not** recolored globally. Individual marketplace businesses have location + directions rather than changing marketplace-wide branding.
- Semantic error/success warnings remain recognizable even when palette is changed.

## Owner addresses
- On `/studio/{slug}`, select **Settings → Business street address**, start typing 3+ characters, and select the suggested address.
- On `/business`, do the same. Selection fills city and state/region automatically; manual typing is always allowed.
- Addresses are stored in existing `settings.data.address`; city and region are also stored on the business profile, with scoped authenticated updates.
- Address suggestions are returned from `GET /api/addresses?q=...` only for signed-in owners, via server-side Photon search, a 650-ms browser debounce, 10-minute in-memory result cache, per-owner throttling and a global 1.1-second upstream throttle. Attributions appear in UI.
- Search failure, provider downtime, or throttling does **not** block manual entry or booking.

## Google Maps directions
- Every displayed public business address links to `https://www.google.com/maps/dir/?api=1&destination=...`: public booking and confirmation, individual business page, approved marketplace listing, owner's dashboard Settings and Business Profile.
- Existing services, appointments, staff, URLs and credentials remain unchanged. Customer rebooking keeps the correct business slug.

## Usage limits
The default public `photon.komoot.io` server is an open demo, with no availability or scale guarantee. For production-scale commercial usage, replace it with a dedicated/self-hosted geocoder. Users can enter addresses manually if the demo is unavailable. No Google Maps API key is necessary for the outgoing directions links.

## Validation
Run `npm ci && npm run typecheck && npm test && npm run build`. Test an owner custom dark/bright theme across all screens on both mobile and desktop. Check both address editors; confirm choosing a result fills city and region and persists after refresh. Open Maps from all location displays. Verify no tenant data crosses business boundaries.
