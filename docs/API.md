# API

The Fastify service is the single business API for web and Flutter.

- Local base URL: `http://localhost:3001/api/v1`
- JSON success envelope: `{ "data": ..., "meta": ... }`
- JSON error envelope: `{ "error": { "code": "...", "message": "..." } }`
- Validation and response schemas come from `packages/contracts`.
- OpenAPI is generated from registered route schemas; it is not maintained by hand.
- Interactive Swagger UI is served at `/documentation/` only when `APP_ENV=local`.

## Implemented routes

```text
GET  /health/live
GET  /health/ready

POST /api/v1/auth/otp/request
POST /api/v1/auth/otp/verify
POST /api/v1/auth/logout

GET  /api/v1/me
GET  /api/v1/communities/current
GET  /api/v1/home

GET  /api/v1/announcements
GET  /api/v1/announcements/:id
POST /api/v1/announcements/:id/read

GET  /api/v1/onboarding/options
POST /api/v1/onboarding/residency-requests

GET  /api/v1/admin/residency-requests
POST /api/v1/admin/residency-requests/:id/approve
POST /api/v1/admin/residency-requests/:id/reject

GET   /api/v1/agenda
GET   /api/v1/agenda/:id
POST  /api/v1/admin/agenda
PATCH /api/v1/admin/agenda/:id
POST  /api/v1/admin/agenda/:id/archive

GET  /api/v1/notifications
GET  /api/v1/notifications/unread-count
POST /api/v1/notifications/:id/read
POST /api/v1/notifications/read-all

GET  /api/v1/cameras
POST /api/v1/cameras
PATCH /api/v1/cameras/:id
POST /api/v1/cameras/:id/stream-ticket

POST /api/v1/emergencies
GET  /api/v1/emergencies
POST /api/v1/emergencies/:id/acknowledge
POST /api/v1/emergencies/:id/respond
POST /api/v1/emergencies/:id/resolve

POST /api/v1/visitors
POST /api/v1/visitors/walk-in
GET  /api/v1/visitors
GET  /api/v1/visitors/lookup/:qrToken
POST /api/v1/visitors/check-in/:qrToken
POST /api/v1/visitors/:id/check-out

POST /api/v1/packages
GET  /api/v1/packages
POST /api/v1/packages/:id/collect

GET  /api/v1/security/shift
POST /api/v1/security/shift/start
POST /api/v1/security/shift/end
GET  /api/v1/security/dashboard

GET  /api/v1/patrol/checkpoints
GET  /api/v1/patrol/session
POST /api/v1/patrol/session/start
POST /api/v1/patrol/session/scan
POST /api/v1/patrol/session/end
GET  /api/v1/patrol/history

POST  /api/v1/incidents
GET   /api/v1/incidents
GET   /api/v1/incidents/:id
PATCH /api/v1/incidents/:id

POST /api/v1/reports
GET  /api/v1/reports
GET  /api/v1/reports/:id
POST /api/v1/reports/:id/updates

GET  /api/v1/letter-types
POST /api/v1/letters
GET  /api/v1/letters
POST /api/v1/letters/:id/approve
POST /api/v1/letters/:id/reject
POST /api/v1/letters/:id/ready

GET  /api/v1/facilities
GET  /api/v1/facility-bookings
POST /api/v1/facility-bookings
POST /api/v1/facility-bookings/:id/cancel

GET  /api/v1/dues-types
POST /api/v1/dues-types
POST /api/v1/invoices/generate
GET  /api/v1/invoices
GET  /api/v1/invoices/:id
POST /api/v1/invoices/:id/waive

POST /api/v1/payments
GET  /api/v1/payments
POST /api/v1/payments/:id/verify
POST /api/v1/payments/:id/reject

GET  /api/v1/cash-transactions
POST /api/v1/cash-transactions

GET  /api/v1/finance/dashboard
```

The route list is the verified foundation plus the current Phase 1 slices; a route is not
considered available until its package implementation and tests exist.

Resident registration options reveal registration-open communities only. Houses are never
enumerated publicly: the resident submits one exact `houseCode`, and both unknown community
and unknown house use the same unavailable response. Approval/rejection endpoints require
`resident.manage`, resolve requests inside the active tenant, and write the state change and
mandatory audit in one transaction.

Agenda reads require `agenda.read`; management requires `agenda.manage`. Agenda creation
fans out in-app notifications only to active residents in the same community. Notifications
require `notification.read`, are scoped to the authenticated user and current community,
and support idempotent one/all read transitions. Attachment upload and external push remain
unimplemented until secure storage and provider contracts exist.

Phase 2 (security and CCTV) routes are permission-gated per module: `camera.public.read` /
`camera.security.read` / `camera.manage` (camera list, gated via `requireAnyPermission`, with
`camera.manage` also required for create/edit); `emergency.create` / `emergency.read` /
`emergency.manage` (raise, list, and acknowledge/respond/resolve — a strict `SENT` ->
`ACKNOWLEDGED` -> `RESPONDING` -> `RESOLVED` state machine, 409 on an out-of-order transition);
`visitor.create` / `visitor.read` / `visitor.checkin` (resident invite with a QR token, security
walk-in creation, lookup-by-token, check-in, check-out); `package.read` / `package.manage`
(resident read-only list scoped to their own household; security logs arrivals and collections —
logging a package also sends the resident an in-app notification); `security.dashboard.read`
(shift start/end and the aggregated dashboard); `patrol.execute` / `patrol.manage` (checkpoint
list, session start/scan/end, with scan requiring an active session and rejecting a checkpoint
already scanned this session; `patrol.manage` additionally gates session history); and
`incident.create` / `incident.read` / `incident.manage` (create/list/detail, with status/action
updates gated separately from create/read). CCTV streaming is mock-only in this environment — see
`docs/CCTV.md`. Incident/package photo attachments are not implemented.

Phase 3 (community services) routes: `report.create` / `report.read` / `report.manage` (resident
report/complaint submission with a status timeline — each status change, including the initial
submission, appends a `ReportUpdate` row; residents see only their own household's reports,
`report.manage` sees all); `letter.create` / `letter.read` / `letter.manage` (letter-type lookup is
read-only and seed-populated; requests flow `SUBMITTED` -> `APPROVED`/`REJECTED` -> `READY`, each a
separate endpoint with 404/409 outcomes); `facility.read` / `facility.book` / `facility.manage`
(facility catalog is read-only and seed-populated — no create/update route exists; booking checks
for a time-range overlap against other `CONFIRMED` bookings for the same facility+date and rejects
with 409 `SLOT_UNAVAILABLE` on conflict; cancelling a booking is allowed for the original booker via
`facility.book` or for anyone with `facility.manage`). None of the three modules has an attachment
upload path yet (see `docs/CCTV.md`-adjacent note: no MinIO client wiring exists anywhere in this
API despite MinIO running locally with buckets already provisioned).

Phase 4 (finance) routes: `dues.manage` (create dues types, bulk-generate invoices — one per
household per dues-type+period, idempotent via a unique constraint so re-generating the same
period is a no-op, and waive an invoice); `invoice.read` (residents see only their own
household's invoices; `dues.manage` holders see all — `GET /invoices` and `GET /invoices/:id`
report a computed `OVERDUE` status for any `UNPAID` invoice whose due date has passed, without a
background job mutating the stored value); `payment.create` (residents submit a manual payment
against one of their own household's `UNPAID`/`OVERDUE` invoices — proof is a required free-text
description, not a file upload, by deliberate MVP decision; see Engineering.md ENG-017);
`payment.verify` (treasurer verifies, generating a `receiptNumber` and flipping the invoice to
`PAID`, or rejects with a reason, flipping the invoice back to `UNPAID`); `cash.read` /
`cash.manage` (cash-transaction visibility is `PUBLIC_TO_RESIDENTS` or `ADMIN_ONLY`; `GET
/cash-transactions?period=YYYY-MM` returns an opening/closing balance summary computed relative
to that period, or all-time if no period is given); `finance.dashboard.read` (treasurer-only
aggregate counts/amounts).

## Authentication

Web uses an HttpOnly local session cookie. Flutter uses the same opaque session token as a
Bearer credential stored in secure platform storage. Only a token hash is persisted.
Development OTP acceptance must hard-fail outside an explicitly local development mode.

## Errors and privacy

Return stable machine codes and natural Bahasa Indonesia messages. Never return stack
traces, Prisma errors, tenant IDs from inaccessible records, phone-directory data, storage
credentials, or RTSP URLs. `401` means no valid session; `403` means an authenticated actor
lacks permission.
