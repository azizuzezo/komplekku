# Database

PostgreSQL is the system of record and Prisma owns application migrations.

## Local connection

- Host: `localhost`
- Host port: `5433`
- Container port: `5432`
- Development database: `komplekku`
- Integration-test database: `komplekku_test`

The alternate host port is intentional because local port `5432` is already occupied.

## Conventions

- UUID primary keys.
- `community_id`, `created_at`, and `updated_at` on tenant-owned domain tables.
- Composite indexes begin with `community_id` for scoped access paths.
- Foreign keys protect tenant relationships; cross-community access receives no fallback.
- Soft deletion is reserved for administrative records that require retention.
- Database timestamps remain standard timestamps; Indonesian formatting is presentation-only.

The foundation migration covers communities, users, sessions, OTP requests, roles,
permissions, scoped user roles, houses, households, household members, residents,
announcements, announcement read state, and audit logs. Phase 1 migrations add privacy-safe
residency-request review fields plus tenant-scoped agenda events and user-targeted in-app
notifications, resident contact preference, and vehicles. The Phase 2 migration adds cameras,
emergencies, visitors, packages, security shifts, patrol checkpoints/sessions/scans, and
incidents. The Phase 3 migration adds reports/report updates, letter types/letter requests, and
facilities/facility bookings. The Phase 4 migration adds dues types, invoices, payments, and cash
transactions. Later phases add their own domain migrations instead of creating unused tables in
advance.

Current committed migrations:

- `20260811042814_init`
- `20260811060000_resident_onboarding`
- `20260811090000_agenda_notifications`
- `20260811103000_directory_vehicles`
- `20260811101756_security_operations`
- `20260811121046_community_services`
- `20260811133007_finance`

The Phase 2 migration follows the same tenant-scoped conventions as the rest of the schema:
`Camera`, `Emergency`, `Visitor`, `Package`, `SecurityShift`, `PatrolCheckpoint`,
`PatrolSession`, `PatrolScan`, and `Incident` all carry `communityId` and are indexed on it
first. `Camera.accessLevel` (`RESIDENT`/`SECURITY`/`ADMIN_ONLY`) gates visibility instead of a
separate camera-permissions table; there is no dedicated camera-access-log table — the existing
`AuditLog` table covers that. `Visitor`/`PatrolCheckpoint` carry a unique `qrToken` per
community for QR-based lookup.

The Phase 3 migration follows the same conventions: `Report`, `ReportUpdate`, `LetterType`,
`LetterRequest`, `Facility`, and `FacilityBooking` all carry `communityId` first. `Report` is
household-scoped like `Visitor`/`Package`; each status change (including the initial submission)
appends a `ReportUpdate` row rather than overwriting history, so residents can see a full timeline.
`LetterType` and `Facility` are lightweight, seed-populated catalog tables with no admin
create/update route yet (see Engineering.md's Open decisions). `FacilityBooking.startTime`/
`endTime` are plain `VARCHAR(5)` "HH:mm" strings rather than a `Time` column, matching how
`bookingDate` alone uses `@db.Date` — overlap detection for double-booking prevention is done in
application code (a lexicographic string-range comparison, since zero-padded HH:mm strings sort
correctly), not a database constraint, consistent with how patrol checkpoint "already scanned"
detection also happens in application code rather than a DB-level uniqueness guard.

The Phase 4 migration adds `DuesType`, `Invoice`, `Payment`, and `CashTransaction`, all
`communityId`-first. `Invoice` carries a `@@unique([householdId, duesTypeId, period])` constraint
so bulk invoice generation for a given dues-type+period is naturally idempotent via
`createMany({ skipDuplicates: true })` (Prisma/Postgres) or an equivalent existence check (the
in-memory repository). Money amounts are plain `Int` columns (whole Rupiah, no decimal/currency
type) throughout — there is no cents/subunit representation anywhere in this schema. `Invoice`
does not store an `OVERDUE` value at rest; both repositories compute it at read time by comparing
`dueDate` against "now" whenever the stored status is `UNPAID`. `Payment.note` is a required
free-text field standing in for proof-of-payment (see `docs/API.md` and Engineering.md ENG-017
for why this is a deliberate MVP choice, not a missing attachment column) — there is no
`Attachment` table or MinIO reference anywhere in the Phase 4 schema.

The repeatable demo seed includes two communities so real PostgreSQL integration tests can
prove that administrators, agenda cursors/details, notifications, and announcements do not
cross tenant boundaries.

## Commands

```bash
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm db:status
```

The initialization SQL creates `komplekku_test` only on a fresh Docker volume. Never point a
test reset at the development database.
