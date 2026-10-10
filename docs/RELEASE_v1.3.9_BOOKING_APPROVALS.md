# SelahFlow Studio 1.3.9 — Booking Approvals and Capacity

## Approval configuration
Owner Dashboard → Settings → Booking requests and reviewer notifications:
1. Enable booking approval notifications.
2. Pick business owner or a designated team member.
3. Save settings.
4. For staff, generate a revocable, 30-day reviewer link and send it privately to the staff member (there is no automated email/SMS integration). They can view their assigned requests in the private team review page.
5. The owner may review any of the business's requests from the Overview/Calendar inbox, including ones assigned to staff.

Default is **off**, retaining all existing immediate-confirmation bookings.

## Public booking flow
- When approval enabled, /book/{slug} records a `pending` entry in `booking_requests`; it does not make a confirmed appointment or reserve staff slots.
- Customer sees "Booking request received / awaiting approval" and is told their time is not held and no confirmation has occurred.
- Owner/staff accept: server loads service and staff catalog, verifies business is active and staff assigned, then locks the business/day transaction, checks calendar conflict and per-service simultaneous capacity, inserts confirmed appointment and staff slots, and marks the request accepted in the same transaction.
- Owner/staff decline: request is marked declined, with no calendar change.
- If a time is no longer available, acceptance fails; no appointment is created and the request remains pending for follow-up.
- Reviewer access uses cryptographically random 256-bit bearer links stored as hashes; only the selected staff member is authorized to see staff-assigned requests. Owner can revoke and replace links.

## Service capacity
- Every service (minute/hour appointments) has a "Simultaneous slots" field, 1 through 20; default is 1 for legacy services.
- Capacity counts confirmed appointments with overlapping service usage across qualified team members. Individual staff always have exclusive calendar slots; higher service capacity never allows two customers with one person at once.
- Pending requests consume no capacity until accepted.
- Term-based day/week/month/year enrollments remain separate from appointment slots.

## Limitations
This version implements **in-app** notification inboxes, not email, SMS, or device push messaging. Staff reviewers need an open review page to receive updates. Clients are not automatically emailed on approval or rejection; the business must contact them using its own communication method. Recurring billing remains inactive.
