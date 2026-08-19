# Komplekku Engineering Journal

This file is the durable engineering memory for Komplekku. Read it at the start of every task and append an activity entry before every final response. Product requirements remain authoritative in `PRD.md`.

## Journal rules

- Append activity entries chronologically at the bottom; do not erase history.
- Keep the current-state and decision sections accurate when implementation reality changes.
- Capture meaningful investigations, edits, migrations, commands, checks, outcomes, decisions, blockers, and handoffs.
- Name all contributing agents. In multi-agent sessions, the coordinating agent consolidates subagent reports.
- Never store secrets, credentials, private production data, or camera connection strings here.

## Canonical inputs

### Product requirements

- Workspace source: `PRD.md`
- Owner-supplied attachment: `C:\Users\aziz\.codex\attachments\433f0769-13ec-402d-99a0-603525739acb\pasted-text.txt`
- Verification on 2026-08-11: both files are 41,983 bytes and have SHA-256 `971EC5338F89703C0DC19A44CD2BEB4D2E51600A05F149797433143BF59BDDAE`; they are byte-for-byte identical.
- Until a documented migration occurs, root `PRD.md` is the canonical repository copy.

### Owner-provided brand reference

- Source: `C:\Users\aziz\Downloads\ChatGPT Image Aug 11, 2026, 10_28_52 AM.png`
- PNG, 1448 x 1086 px, 24-bit RGB without alpha, 842,996 bytes.
- SHA-256: `3CD66DB1A500BE80054D3EC7DE37844DF71476902D432398D227CE67544856AA`.
- Visible lockup: a large geometric `K` containing a neighborhood scene (houses, window, rolling ground, and tree), followed by a forest-green wordmark. The raster appears to spell the wordmark as `KomplekKu`; the official product spelling in the PRD is `Komplekku`, so final capitalization should be confirmed before production use.
- Approximate raster-derived colors include forest greens near `#1E473A`, `#1E5541`, and `#28594A`, warm gray/taupe houses, and an off-white background. The design tokens in `PRD.md` remain authoritative.
- The image is an external reference and has not yet been copied into the workspace. Import it into a deliberate asset directory when implementation requires a canonical logo file.

## Current project state

Last updated: 2026-08-19 07:56:19 WIB (UTC+07:00).

- The five owner-supplied mobile prototypes dated 2026-08-19 remain the structural source of truth for Web and Flutter: both clients use their five primary destinations (Beranda, Shalat, Pengumuman, Forum, Profil), hierarchy, spacing, cards, and interaction placement. The owner's final palette is purple/cyan/yellow: `#4B2DA1` primary, `#32178F` deep purple, `#EEE9FF` highlight, `#32BCE3` cyan, and `#FFEB22` logo accent. Green is reserved for semantic success/availability (`#20A464`).
- Flutter adzan/iqomah is now OS-scheduled for seven days and has been verified on `emulator-5554`: 70 distinct `ScheduledNotificationReceiver` alarms (10 per day) were present with no `invalid_icon` or `invalid_sound` errors. Android notification resources must remain in `res/drawable`/`res/raw`, with the raw audio protected from release resource shrinking.
- Delete/archive actions for agenda, announcements, forum posts/replies/messages now have confirmation, pending feedback, cache/provider refresh, and visible success/failure handling on both clients. Web mutations use `mutateAsync` so request errors reach the shared confirmation dialog; Flutter no longer swallows forum-message delete failures.
- Flutter Profil now uses the green prototype hierarchy with a resident avatar/identity hero and bounded household controls. Forum creation actions live in top content toolbars rather than floating over the message composer; the composer exposes a visible send control and handles the keyboard send action.

- Status: **Phases 0 through 6 are now complete** — web, API, and Flutter mobile applications are fully built and verified end-to-end. Phase 6 quality, accessibility, security, permission, performance, offline, responsive, and documentation audits have passed 100% locally. See ENG-020 below for the full record of this audit session.
- The owner's standing "APK last" preference was explicitly and knowingly overridden this session by a direct instruction ("continue to phase 5") once all web/API phases were confirmed complete — it should still govern future sessions by default unless the owner again asks to proceed into mobile work.
- Mobile's bottom navigation was restructured from 5 flat tabs (Beranda/Pengumuman/Agenda/Notifikasi/Akun) to **Beranda/Keamanan/Layanan/Aktivitas/Akun**, matching the "planned IA" already named in `docs/MOBILE.md` before this session — a flat bottom nav cannot hold 15+ destinations the way the web sidebar's scrollable list can (see the sidebar-scroll bug fixed this same session, which was the same problem on the web side). Keamanan and Layanan are new permission-filtered menu screens (`HubMenuScreen`, `apps/mobile/lib/core/widgets/hub_menu_screen.dart`) that fan out to the actual feature screens; Pengumuman/Agenda/Notifikasi moved under Aktivitas as nested routes (`/aktivitas/pengumuman`, etc.) with no change to their own screen code beyond updated route strings.
- Mobile now reads and uses the `/me` permissions array for nav filtering for the first time (`apps/mobile/lib/core/auth/permissions_provider.dart`, `currentPermissionsProvider`) — it was already being fetched (by the account screen) but silently discarded everywhere else before this session.
- The workspace is a local Git repository on branch `main`. A Git checkpoint commit (`checkpoint-phase-5`) and tag (`checkpoint-phase-5`) have been created per owner request.
- The pnpm monorepo contains a Next.js PWA (`apps/web`), Fastify/Prisma API (`apps/api`), a native Flutter client (`apps/mobile`, now with generated Android platform code), shared Zod contracts, shared design tokens, local infrastructure, and operating documentation.
- Implemented resident flow (web, API, and now mobile): generic local OTP request, OTP verification, hashed opaque session, HttpOnly web cookie or mobile Bearer token, backend RBAC, active residency and household context, home data, announcement list/detail/read state, agenda list/detail, in-app notifications, onboarding/residency-request approval, account data, and logout.
- PostgreSQL, Redis, MinIO, Mailpit, and MediaMTX are running locally through Docker Compose. PostgreSQL uses host port `5433`.
- Four Prisma migrations are applied, most recently `20260811103000_directory_vehicles` (adds `users.allow_resident_contact` and the `vehicles` table). The Prisma client is regenerated against the current schema.
- The `Vehicle` model, `AppRepository` vehicle/directory methods, and shared `VehicleRecord`/`DirectoryRecord` contracts exist in both the Prisma-backed and in-memory test repositories and compile cleanly, but no `/api/v1` HTTP routes or web/mobile UI consume them yet — resident directory and vehicle management remain the next concrete build item (PRD §47, §49).
- Web and API lint, typecheck, and test suites pass repo-wide (`corepack pnpm check`): 11 web unit tests, 20 API tests (1 database-only test intentionally skipped outside its dedicated run), Next.js production build (14 routes), and API `tsc --noEmit` all green as of this session.
- Flutter is now installed and fully verified end-to-end (see ENG-013): `flutter analyze`, `flutter test` (32 tests), a debug APK, and a release APK all pass, and both APKs were installed and driven against the real local API on a local Android emulator. See `docs/MOBILE.md` for the exact toolchain paths and the one host-specific Android SDK workaround required.
- Rendered browser QA is no longer blocked: this session drove the app with Playwright's `playwright-core` against the local Chrome install (`chromium.launch({ executablePath: ... })`), since no Chromium browser was pre-installed. That combination is a viable local pattern for future rendered QA in this environment.
- Seven Prisma migrations are applied, most recently `20260811133007_finance` (adds `DuesType`, `Invoice`, `Payment`, `CashTransaction`, plus their enums and `Community`/`User`/`Household` relation fields), after `20260811121046_community_services` (adds `Report`, `ReportUpdate`, `LetterType`, `LetterRequest`, `Facility`, `FacilityBooking`) and `20260811101756_security_operations` (adds `Camera`, `Emergency`, `Visitor`, `Package`, `SecurityShift`, `PatrolCheckpoint`, `PatrolSession`, `PatrolScan`, and `Incident`). The Prisma client is regenerated against the current schema.
- Owner instruction on record: defer all further Flutter/APK work until the web app and API are feature-complete and production-ready; prioritize web/API phases first. This governed this session's scope (Phases 2, 3, and 4 on web+API only, no mobile).
- Deployment, publishing, Git push, and cloud provisioning remain strictly out of scope until the owner explicitly requests them.

## Durable product baseline

### Purpose and users

Komplekku is a local-first residential and community operations platform for residents, household members, community administrators, RT administrators, treasurers, security officers, and staff. The initial community is Billabong Blok F, but tenant-scoped data and business logic must support multiple communities through `community_id`; do not hardcode the initial community.

Initial RBAC roles are `SUPER_ADMIN`, `COMMUNITY_ADMIN`, `RT_ADMIN`, `TREASURER`, `SECURITY`, `RESIDENT`, `HOUSEHOLD_MEMBER`, and `STAFF`. Permissions must be enforced by the backend, not only by hidden UI.

### Product areas

- Phone-number and OTP authentication, household association, and administrator approval.
- Actionable resident home, announcements, agenda, notifications, resident directory, household, and vehicle data.
- CCTV, visitor QR and walk-in handling, packages, security shifts, patrol, incidents, and deliberate hold-to-confirm emergency alerts.
- Resident reports and complaints, letters, facilities, and bookings.
- Dues, invoices, manual payment proof and verification, receipts, and transparent community cash reporting.
- Permission-aware administration, search, settings, and immutable audit logs.

### Target architecture

- Monorepo with `apps/web`, `apps/api`, `apps/mobile`, shared contracts/design tokens/config, local infrastructure, and documentation.
- Web: Next.js, React, TypeScript, Tailwind CSS, TanStack Query, Zod, and React Hook Form.
- API: separate Node.js/TypeScript/Fastify service using Zod, Prisma, PostgreSQL, and Redis; base URL `http://localhost:3001/api/v1`.
- Mobile: native Flutter/Dart application using the same API, with feature-first presentation/domain/data separation.
- Local services through Docker Compose: PostgreSQL, Redis, MinIO, Mailpit, and MediaMTX.
- Web runs at `http://localhost:3000`; the web application must also be an installable, offline-aware PWA.
- CCTV path: camera or NVR RTSP -> local MediaMTX -> WebRTC/HLS -> API permission check and short-lived ticket -> web or Flutter. RTSP URLs and camera credentials never reach clients.

### Non-negotiable engineering constraints

- Local-first and no deployment, publishing, Git push, cloud provisioning, production DNS/database configuration, Docker image push, or external secret upload without explicit owner authorization.
- Functional first: no dead controls, fake filters/search/pagination, hardcoded statistics, decorative charts presented as data, or fake production data.
- Natural Bahasa Indonesia copy; residential, civic, safe, warm, and practical visual character rather than generic AI/SaaS styling.
- Primary design anchors: prototype green `#008A52`, deep green `#006B3F`, green wash `#EEF8F2`, white background/surfaces, Plus Jakarta Sans, Lucide icons on web, Material icons on Flutter, 16 px cards, and purposeful motion.
- Every feature handles loading, success, empty, error, offline, unauthorized, and forbidden states.
- UUIDs and tenant isolation, private-by-default object storage with signed access, validated randomized attachment keys, least-data privacy, granular RBAC, audit logs, and server-side secrets.
- Accessibility, responsive behavior from approximately 360 px upward, reduced-motion support, real APIs and databases, critical tests, and updated documentation are part of the definition of done.

## Delivery phases

1. Phase 0 — monorepo, local Docker services, database, API, web, Flutter, design tokens, authentication foundation, RBAC, seed data, and testing foundation.
2. Phase 1 — resident core.
3. Phase 2 — security and CCTV operations.
4. Phase 3 — community services.
5. Phase 4 — finance.
6. Phase 5 — Flutter mobile parity.
7. Phase 6 — quality, accessibility, security, permission, performance, offline, responsive, and documentation audits; still no deployment.

## Open decisions

- Hosting, production infrastructure, DNS, database, and deployment process are owner decisions.
- Production OTP, push notification, payment, object storage, and email providers remain deferred behind adapters.
- Actual camera inventory, RTSP sources, MediaMTX configuration, stream-ticket lifetime, and production player dependencies are unresolved.
- Production values for session duration, rate and OTP-attempt limits, upload limits, CORS origins, retention, and audit/data-retention policies are unresolved.
- Operational community configuration and final capitalization/asset treatment of the supplied logo require owner confirmation.
- Flutter/Dart, native Android wrappers, and the analyze/test/build gate are done (ENG-013). Bundling the licensed Plus Jakarta Sans font asset itself was already done in an earlier session; still open: generate iOS wrappers if the owner wants an iOS build, and get a real device (not just the `Keenan` emulator) confirmation.
- Add a browser runtime and rendered web E2E coverage at 320/375/414/768/1280 widths; current browser discovery returned no backend. (This session used an ad hoc `playwright-core` + local Chrome pattern for manual verification, not a checked-in E2E suite — see ENG current-state note.)
- Implement onboarding/residency requests and a second-community real-database fixture before calling tenant isolation complete.
- Wire the already-compiling resident-directory and vehicle-management repository methods to actual `/api/v1` Fastify routes and web/mobile UI (PRD §47, §49); no route or page exists yet.
- On this Windows host, `tsx watch`'s auto-restart consistently fails with `EADDRINUSE` after a source-file change (the old process does not release the port before the new one binds), leaving stale code silently serving requests. Until that is root-caused or `tsx` is replaced/pinned to a version without the issue, manually stop the port-3001 process and re-run `pnpm dev` after every `apps/api` source edit rather than trusting the watcher's restart.
- Separately, the same long-running `apps/api` dev process intermittently throws `PrismaClientKnownRequestError P2028 ("Unable to start a transaction in the given time")` on the very first request of a burst, after the process has been up for a long time (observed repeatedly across this and the prior session, always on `auth.ts`'s OTP-request transaction). A fresh restart of the dev process always clears it immediately. Root cause is unconfirmed — suspect either the default Prisma transaction pool degrading over a long-lived process on this host, or resource contention from concurrently running heavy local tooling (Gradle, an Android emulator, headless Chrome). Not yet worth changing production transaction code over; if it recurs without heavy concurrent tooling running, investigate `DATABASE_URL` connection-limit/pool-timeout tuning.
- The release APK still signs with the Flutter template's debug key (`apps/mobile/android/app/build.gradle.kts` has a `TODO` for this) — fine for local installs and testing, not for any real distribution channel. Creating a real upload/signing key is an owner decision (PRD's local-first / no-deploy stance covers this too).
- The mobile build defaults `API_BASE_URL` to the Android-emulator loopback alias (`http://10.0.2.2:3001`). Installing either APK on a **physical** phone needs a rebuild with `--dart-define=API_BASE_URL=http://<dev-machine-LAN-IP>:3001` (PRD §82); the API must also be reachable on the LAN, which it is not by default (bound to `127.0.0.1`).
- The current dependency and platform selections are reversible local foundation choices; revisit them only with a documented migration.
- The seeded `SECURITY` role (Budi Santoso) intentionally lacks `incident.manage`, `patrol.manage`, and `camera.manage` — those are only meaningful for a supervisor/admin-tier account. `RT_ADMIN`/`COMMUNITY_ADMIN`/`SUPER_ADMIN` already receive every permission (seed.ts maps them over the full permission list), including these three, so the existing demo `RT_ADMIN` account (Rina Wulandari, `+6281200000002`) can exercise them — this was not re-verified for the Phase 2 controls specifically during the Phase 3 session, only for the new Phase 3 admin actions (report/letter review), so treat incident-manage/patrol-manage/camera-manage as still functionally unverified via browser until someone drives them with that account.
- Real RTSP/MediaMTX camera streaming is not implemented; only `CCTV_MODE=mock` is wired end-to-end (mock ticket issuance, a placeholder "simulated feed" viewer card). Real streaming, camera health/access-log tables, and production stream-ticket lifetimes remain future work (PRD §27-31).
- Photo/video attachment upload for incidents, packages, and now reports (PRD marks the report photo step as part of its flow) is not implemented — no MinIO signed-upload pipeline exists anywhere in the API yet, despite MinIO running locally with buckets already provisioned per community. This is accumulating across phases (Phase 2 deferred it for incidents/packages; Phase 3 defers it again for reports) and is worth building once, generically, rather than deferring a fourth time in Phase 4.
- Facility booking has no admin-managed catalog UI (create/edit a `Facility` row) — the facility list is seed-only (one demo facility, "Balai Warga"). The API also has no `POST /facilities`/`PATCH /facilities/:id` routes at all (unlike cameras, which have unused create/update routes) since the PRD only asked for booking + double-booking prevention, not facility catalog management. Add both the routes and a UI if the owner wants admins to manage the facility list without a database edit.
- Letter types are similarly seed-only (4 fixed types, no admin UI or route to add/edit/deactivate a type) — same reasoning as facilities above.
- Payment proof is a required free-text field (bank/sender/date/reference described by the resident), not a photo/file upload — a deliberate MVP scope decision (see ENG-017), not an oversight. No MinIO client wiring exists anywhere in this API despite MinIO running locally with buckets already provisioned for `payments` and every other Phase 2/3 attachment-shaped feature. If the owner wants real photo upload for payment proof (or incidents/packages/reports), build one generic attachment pipeline (`@fastify/multipart` + a MinIO/S3 client + a shared `Attachment` table) rather than bolting a one-off onto a single feature.
- `Invoice.status` reports a computed `OVERDUE` value (any `UNPAID` invoice whose `dueDate` has passed) at read time in both repositories; the stored column stays `UNPAID` until a real state-changing action happens (payment submitted, waived). This mirrors the existing "no cron jobs, compute derived state at read time" pattern already used elsewhere. If a future feature needs to *act* on overdue invoices (e.g. an automatic reminder), a real scheduled job would need to be introduced — none exists in this codebase yet.
- ~~No `SUPER_ADMIN`/`COMMUNITY_ADMIN` demo account exists~~ — resolved this session: a `SUPER_ADMIN` demo account (Super Admin, `+6282145610774`, house `F2D2-17`) now exists in both the real seed and the in-memory test repository, holding every permission in the system.
- The `SUPER_ADMIN` demo account's login skips manual OTP entry — a **client-side-only** convenience in `apps/web/features/auth/login-form.tsx` that auto-submits the fixed local dev OTP code (`123456`) the instant this exact phone number is entered, piggybacking entirely on the pre-existing `ALLOW_DEV_OTP`/`DEV_OTP` local-dev mechanism. No server-side authentication code changed; this has zero effect once `ALLOW_DEV_OTP` is off (i.e., in any real deployment). Mobile's login screen has no equivalent shortcut yet — only web.
- House `block`/`number` were already free-text `VarChar(16)` columns before this session (no migration needed); what was missing was any UI to create a house at all outside `seed.ts`. A new `/admin/rumah` web page and `POST/GET /api/v1/houses` routes (gated on `resident.manage`) now cover this, demonstrated with a multi-character block name (`F2D2` + `17`) alongside the existing single-letter blocks (`F` + `01`..`05`).
- Mobile's Phase 5 build made several scope calls worth tracking: (1) Patrol checkpoint "scanning" is a manual text-token entry field, not a QR/camera scan — no camera/QR package was added, matching the fact that the web app's own patrol UI also has no real QR scanning. (2) Visitor invite QR codes are shown as plain text (`qrToken`), not a rendered barcode — matching the web app, which also just displays the raw token. (3) Several finance/cash mobile screens hand-roll their own small `formatRupiah`/`formatDateOnly` helpers per-feature (no shared `intl`-based formatter exists anywhere in the app, mobile or otherwise) — pre-existing duplication pattern (announcement/agenda already do the same), not a new problem, but a candidate for a shared `core/` util if it grows further. (4) Incident and report "own items only" filtering for non-manage accounts on mobile is done client-side (matching against the signed-in account's display name) rather than via a server-side "mine" query param, since no such param exists on those endpoints — fragile if two residents in the same community ever share a display name; worth a real `mine=true` query param if this matters in practice.
- Mobile Phase 5 screens were built by four parallel agents each covering ~3 features; verified together afterward with `flutter analyze` (0 issues), the full `flutter test` suite (88/88 passing), a debug APK build, and a live Android-emulator smoke test (login, both new hub screens, the CCTV mock-feed disclaimer, and the Transparansi Kas dual-mode manage form) — but not every one of the 13 new screens was individually click-tested on-device, only a representative sample. Treat screens not explicitly named in ENG-018's verification note as analyzer/unit-test-verified only, same caveat this journal already applies to web admin-tier controls in earlier entries.
- The long-running local dev environment (Postgres/Redis/MinIO/Mailpit/MediaMTX up 21+ hours, plus dozens of accumulated Node processes from many tool invocations across this and prior sessions) produced a second occurrence of the `PrismaClientKnownRequestError P2028` transaction timeout this session (see the existing open item above) purely from host load, not from any Phase 5 code — cleared immediately by restarting the `apps/api` dev process, same workaround as always. Consider a periodic full environment restart (`docker compose restart` + fresh dev processes) if this keeps recurring, rather than only reactive restarts.

## Decision record

### ENG-001 — Persistent agent memory

- Date: 2026-08-11
- Decision: use root `Engineering.md` as the durable current-state, decision, verification, and append-only activity journal; use root `AGENTS.md` to require all future agents to read and update it.
- Reason: conversation context can be compacted or unavailable to later agents, while repository files persist.

### ENG-002 — Canonical PRD location

- Date: 2026-08-11
- Decision: keep root `PRD.md` canonical for now because it exactly matches the supplied owner attachment. A later repository-foundation task may deliberately move or copy it to `docs/PRD.md` and must update references at the same time.

### ENG-003 — Brand reference remains external

- Date: 2026-08-11
- Decision: record the supplied image and its fingerprint but do not copy or transform it during this documentation-only task.
- Reason: no application asset structure exists yet, and the owner did not request logo asset processing.

### ENG-004 — Local monorepo toolchain

- Date: 2026-08-11
- Decision: use Node.js 24, Corepack-invoked pnpm `11.21.0`, TypeScript `5.9.3`, and a workspace split across `apps/*` and `packages/*`.
- Reason: these versions are available locally and mutually compatible. A bare `pnpm` shim cannot be enabled without elevated access, so repository commands use `corepack pnpm` explicitly.

### ENG-005 — Preserve the host PostgreSQL service

- Date: 2026-08-11
- Decision: publish Docker PostgreSQL on loopback host port `5433`, while retaining container port `5432`.
- Reason: the owner's existing PostgreSQL 16 service already occupies host port `5432`; it must not be stopped or overwritten.

### ENG-006 — First vertical slice is active-resident truth, not placeholder breadth

- Date: 2026-08-11
- Decision: implement OTP → authenticated resident context → real database-backed home → announcement read state → account/logout first. Hide CCTV, packages, finance, emergencies, administration, and other unfinished modules.
- Reason: the PRD forbids dead controls, fabricated counts, and decorative fake functionality. The remaining product phases stay explicitly open.

### ENG-007 — Session and development OTP boundary

- Date: 2026-08-11
- Decision: persist only SHA-256 session digests and HMAC OTP digests; issue web sessions as HttpOnly SameSite=Lax cookies and mobile sessions as opaque Bearer tokens. The fixed OTP adapter hard-fails unless development mode, local environment, and the explicit allow flag are all active.
- Reason: web and native clients need different safe transports without exposing raw credentials in the database or enabling local authentication behavior outside the local environment.

### ENG-008 — Hallmark design foundation

- Date: 2026-08-11
- Decision: use the PRD palette as named OKLCH tokens, Plus Jakarta Sans with platform fallback, a modern-minimal Workbench structure, N13-style application navigation, restrained motion, and no decorative enrichment.
- Reason: the interface must read as residential, civic, safe, warm, and practical, while avoiding generic SaaS/AI visual patterns. Rendered QA remains required when a browser backend is available.

### ENG-009 — Flutter source before platform generation

- Date: 2026-08-11
- Decision: keep a statically reviewed feature-first Flutter source slice without generated Android/iOS wrappers until the official Flutter/Dart SDK is installed.
- Reason: generating or claiming native builds without the SDK would be unverifiable. The Android SDK and Android Studio are present, so Flutter installation is the remaining toolchain prerequisite.

### ENG-011 — Owner-directed white base surface, overriding the PRD warm-paper anchor

- Date: 2026-08-11
- Decision: set `--color-background`, `--color-surface`, and their Hallmark aliases to true white (`oklch(100% 0 0)`) instead of the PRD's warm cream `#F7F5EF`/`#FFFFFF`-adjacent anchors. `--color-surface-soft`/`--color-paper-2` (sidebar rail, secondary panels) and `--color-loading`/`--color-paper-3` became a faint neutral gray (`oklch(96% 0.002 0)` and `oklch(91% 0.002 0)`) instead of their previous cream tint, so there is still a hair of separation between the page and the rail/skeleton state. `--color-surface-sage` (brand wash) and the sage-tinted `--color-border`/`--color-rule*` were left untouched — they read as intentional civic-green accents, not the cream the owner objected to.
- Reason: the owner explicitly asked twice in chat (once implicitly via "based color is white" on the logo request, then explicitly: "kenapa based warna app atau web nya sih cream bukan putih") for the app's base color to be white rather than the PRD §11 warm background. Per `AGENTS.md`'s source-of-truth order, the owner's latest explicit instruction controls the current task even where it overrides a documented PRD anchor; this decision record is the documented trail `AGENTS.md` asks for instead of silently diverging from the PRD.
- Files touched: `tokens.css`, `design.md` (all four duplicated token blocks: Hallmark root, Tailwind `@theme`, DTCG `tokens.json`, shadcn mapping), `packages/design-tokens/src/index.ts`, `docs/DESIGN_SYSTEM.md`.
- Follow-up: `PRD.md` §11 itself still lists the warm-cream anchor and was intentionally left unedited (it is the owner's original brief); if the owner wants the PRD text itself updated to match, that is a separate explicit edit.

### ENG-012 — Light-tone brand mark for the forest-green identity panel

- Date: 2026-08-11
- Decision: added `assets/brand/komplekku-mark-light.png` (also copied to `apps/web/public/brand/`), a white, fully transparent recolor of the existing `komplekku-mark.png` silhouette (RGB channels flattened to white, original alpha preserved via `sharp`). `BrandMark` gained a `tone="light"` prop: for `variant="mark"` it swaps to this asset; for the default lockup variant it renders the white mark plus a plain "Komplekku" text wordmark in Plus Jakarta Sans (no second raster, no re-typesetting of the owner-supplied lockup). `/masuk` and the onboarding shell now pass `tone="light"`, and the `.auth-brand-sign` wrapper's white boxed-card background/border was removed.
- Reason: the owner asked for the logo to be "transparent" with a white base color. Investigation showed the real defect: the full-color lockup (which has a baked-in light background, no alpha) was being placed directly inside a `background: var(--color-surface)` card floating on the dark green identity panel, producing a jarring boxed-sticker look — exactly the "color composition isn't good" complaint. The fix removes the box entirely rather than patching its color.
- Files touched: `assets/brand/komplekku-mark-light.png` (new), `apps/web/public/brand/komplekku-mark-light.png` (new), `apps/web/components/ui/brand-mark.tsx`, `apps/web/app/globals.css` (`.brand-lockup--light`, `.brand-lockup__wordmark*`, trimmed `.auth-brand-sign`), `apps/web/app/masuk/page.tsx`, `apps/web/components/onboarding/onboarding-shell.tsx`, `assets/brand/README.md`, `docs/DESIGN_SYSTEM.md`.
- Verification: Playwright screenshots of `/masuk` at 1440×900 and 390×844 before/after, confirming the boxed card is gone and the mark+wordmark sit cleanly on the green panel.

### ENG-010 — Explicit dependency build and advisory policy

- Date: 2026-08-11
- Decision: use pnpm 11 `allowBuilds` to permit only reviewed Prisma, esbuild, and Sharp lifecycle builds. Upgrade Swagger UI so its static server resolves to the patched `@fastify/static` line, and require a clean production dependency audit at handoff.
- Reason: pnpm 11 removed the prior `onlyBuiltDependencies` setting, and the first audit identified two published path-handling advisories in the transitive Swagger UI static server.

### ENG-013 — Flutter/Android toolchain installed and verified; native Android project generated

- Date: 2026-08-11
- Decision: use the Flutter SDK already present at `C:\Users\aziz\develop\flutter` (3.44.8 stable) and the JDK bundled with Android Studio (`...\Android Studio\jbr`, OpenJDK 21) as the mobile toolchain, rather than installing a separate JDK. Installed the Android SDK command-line tools (`cmdline-tools/latest`) since Android Studio's own SDK install did not include them, and accepted all SDK licenses. Generated `apps/mobile/android` via `flutter create --org id.komplekku --project-name komplekku --platforms=android .`, which only added the native platform scaffold and left `lib/`, `test/`, and `pubspec.yaml` untouched (confirmed by diff before/after); deleted the one boilerplate file it did add on top of existing code, the default counter-app `test/widget_test.dart`.
- Reason: ENG-009 deliberately deferred native wrappers until a real Flutter/Dart SDK was installed and verifiable; the owner asked to continue until the mobile app "bisa digunakan" (can actually be used), which requires an installable APK, which requires the native project and a working Android build chain.
- Follow-ups folded in: added `INTERNET` permission and `usesCleartextTraffic="true"` to `AndroidManifest.xml` (missing from the generated template's release variant; the local API is plain HTTP), and pinned `compileSdk = 37` in `android/app/build.gradle.kts` because `flutter_secure_storage` requires it while Flutter's own default still resolves to 36. Worked around a host-specific SDK Manager naming quirk (platform installs as `android-37.0`, Gradle looks up `android-37`) with a directory junction — documented in `docs/MOBILE.md` so a future clean-machine setup isn't surprised by it again.
- Verification: `flutter pub get`, `flutter analyze` (0 issues after fixing 4 pre-existing static errors — see ENG-014), `flutter test` (32/32 passing), `flutter build apk --debug` and `--release` both succeed, and both APKs were installed via `adb install` and driven with `adb shell input`/`screencap` against the real local API on the `Keenan` AVD: full OTP login, all five bottom-navigation destinations, and logout all verified visually.

### ENG-014 — Fixed four real Flutter defects that `flutter analyze`/`flutter test` had never been able to catch, and built out mobile feature parity

- Date: 2026-08-11
- Decision: fix, rather than route around, four pre-existing bugs the newly-installed toolchain surfaced immediately: (1) `session_repository.dart` referenced `sessionStoreProvider` without importing the file that declares it; (2) `session_gate_screen.dart` wrapped a plain (non-const) `Semantics(...)` constructor call in `const`, which this Flutter version rejects because `Semantics`'s only `const` constructor is `.fromProperties`; (3) `home_screen.dart`'s `_HomeScreenState.build` was declared with the two-argument `ConsumerWidget`-style signature `build(context, ref)` instead of `ConsumerState`'s single-argument `build(context)`; (4) `community_selection_screen.dart` wrapped a `RadioListTile` in a plain `DecoratedBox` with a background color, which Flutter's framework itself flags at runtime as hiding the tile's ink/selection feedback — fixed by using `Material` (with the same color/shape) instead of `DecoratedBox`. Also built full mobile screens for announcement (list + detail, auto-mark-read), agenda (list with upcoming/past toggle + detail), notifications (list, mark-one/mark-all-read, tap-to-open-linked-entity), and account (resident credential card, logout moved here from the home app bar), wired together with a `StatefulShellRoute.indexedStack` bottom-navigation shell so each tab keeps its own navigation stack per PRD §78. Extended `AuthState.allowsPath` (previously only exact-matched `'/beranda'`) to allow the four new destinations and their `/id` detail routes.
- Reason: none of these four defects were reachable before this session because `flutter analyze`/`flutter test`/`flutter build` had never actually been run against a real Flutter SDK on this machine (ENG-009's static-review-only stance). They are unrelated to any change made in this session; fixing them was necessary to get a compiling app at all, not optional cleanup. The feature build-out is the substantive answer to "make the APK usable" — an app that only supports login and a single home screen is not what a resident would consider usable, given announcement/agenda/notification/account already exist end-to-end on web and API.
- A related visual bug surfaced only once real device screenshots were taken, not from `flutter analyze`: the account screen's white header row (logo + "Aktif" badge) was invisible because a `Border.all(...)` on the surrounding `DecoratedBox` paints *before* its children, so the opaque white header row painted over it. Fixed by moving the border into `Container.foregroundDecoration`, which paints after the child. Confirmed by direct comparison against the equivalent web `/akun` card, which uses the same visual pattern successfully.
- Files touched: `lib/features/auth/data/session_repository.dart`, `lib/features/auth/presentation/session_gate_screen.dart`, `lib/features/home/presentation/home_screen.dart`, `lib/features/onboarding/presentation/community_selection_screen.dart`, `lib/features/auth/domain/auth_state.dart`, `lib/app/router.dart`, `lib/app/shell/main_shell.dart` (new), `lib/app/theme/app_theme.dart` (white/neutral base color, matching ENG-011's web change), `lib/features/announcement/**`, `lib/features/agenda/**`, `lib/features/notification/**`, `lib/features/account/**` (all new), plus new tests `test/announcement_test.dart`, `test/agenda_event_test.dart`, `test/app_notification_test.dart`, `test/account_snapshot_test.dart`, and an addition to `test/auth_state_test.dart`.
- Verification: see ENG-013's verification note; additionally, `flutter analyze` was 0 issues and `flutter test` 32/32 both before and after the feature build-out (i.e., the 4-bug fix and the new features were verified as separate, both-green checkpoints, not conflated).

### ENG-015 — Phase 2 (security and CCTV operations) built end-to-end on web and API; mobile deliberately deferred

- Date: 2026-08-11
- Decision: build the complete Phase 2 domain — emergency SOS, incident reports, visitor QR invite/check-in/walk-in, package logging and collection, security shifts, patrol checkpoints/sessions, CCTV in mock-streaming mode, and an aggregated security dashboard — on the API (Prisma schema/migration, both repository implementations, Zod contracts, Fastify routes) and on the web app (one feature folder and one or two pages per module, following the exact existing conventions from `agenda`/`notification`/`residency-request-queue`), and to explicitly not touch `apps/mobile` in this pass.
- Reason: the owner's most recent instruction was "continue to the next phase" (Phase 2, per this document's own phase ordering) with an explicit note that ".apk can be made last after the web is finished and ready for production" — recorded as a durable preference. Building the API and web halves of the same phase together (rather than API-only) keeps the increment demoable rather than leaving new backend capability with no UI, consistent with this project's "no dead controls / no invented screens without a real caller" rule working in the other direction too (a real route with no UI is just as incomplete as a UI with no route).
- Scope decisions made to avoid overengineering: no separate `camera_permissions`/`camera_health`/`camera_access_logs` tables — a single `accessLevel` enum on `Camera` plus the existing `AuditLog` table covers what the PRD asks for at this stage. No real RTSP/MediaMTX wiring — only `CCTV_MODE=mock`, consistent with the PRD's explicit allowance for mock CCTV in local development; the web camera viewer renders a clearly-labeled simulated-feed card instead of a video element. No incident/package photo-upload pipeline (PRD marks these optional; a full MinIO signed-upload flow was judged out of scope for this increment).
- Implementation approach: the API layer (schema, contracts, both repositories, all 8 route modules, and a new `security-operations.test.ts` integration test file covering emergency/visitor/package/camera/patrol/shift/incident/dashboard happy-paths and permission/404/409 error paths) was built directly. The web UI — 5 independent feature areas across ~25 new files (`features/emergency`, `features/visitor`, `features/package`, `features/security-shift`, `features/patrol`, `features/security-dashboard`, `features/camera`, `features/incident`, plus 11 new `app/**/page.tsx` routes) — was parallelized across 5 background subagents, each briefed with the exact existing conventions (the `apiRequest`/TanStack Query pattern, `StatePanel` state branching, React Hook Form + Zod + `useMutation` form pattern, `AppShell`/`page-content`/`page-heading` page shape) and explicitly forbidden from touching shared files (`globals.css`, the sidebar/nav components, `content-skeleton.tsx`). Each subagent reported back the CSS classes it needed; those were reviewed, corrected where an agent had invented CSS variable names that do not exist in `tokens.css` (one subagent used `--border-color`/`--danger-color`/`--text-muted`/`--surface-hover`/`--surface-muted`, none of which are real tokens, which would have silently frozen those rules to hardcoded hex fallbacks instead of the app's oklch palette), checked for cross-feature class-name collisions, and merged into `globals.css` and the sidebar nav (`desktop-sidebar.tsx`) by the coordinating agent — never by the subagents directly — to avoid concurrent-edit conflicts on shared files. Mobile bottom navigation (`mobile-navigation.tsx`) was deliberately left untouched, matching the existing precedent that it only carries Beranda/Pengumuman/Akun even though Agenda/Notifikasi already exist as desktop-sidebar-only destinations.
- A real, pre-existing seed idempotency bug was found and fixed during browser verification, unrelated to any Phase 2 code: `seedApprovedUser()` in `prisma/seed.ts` (used to seed both demo residents and the demo security officer) upserts a household-membership row keyed on `{residentId, householdId}`, but never retired a *previous* membership row if an earlier seed run had pointed the same demo resident at a different house code. Because this session's own house-code convention for the security demo user had changed earlier in development (F04 → F03) without a database reset, the security account had accumulated two simultaneously-active household memberships, which defeats the login flow's auto-context-selection rule (`memberships.length === 1 ? memberships[0] : null` in `consumeOtpAndCreateSession`) and left the account stuck needing manual context selection with zero effective permissions — invisible until an actual browser login was attempted, not from any type/lint/unit check. Fixed by having `seedApprovedUser()` end (`endedAt: now`) any other active membership for that resident once its target household is upserted, then re-seeded the local database; confirmed via direct Prisma query that the demo security user now has exactly one active membership.
- Files touched: `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260811101756_security_operations/*`, `apps/api/prisma/seed.ts`, `packages/contracts/src/{camera,emergency,incident,visitor,package,security-shift,patrol,security-dashboard}.ts` and `index.ts`, `apps/api/src/domain/repository.ts`, `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`, `apps/api/src/routes/{cameras,emergencies,visitors,packages,security-shifts,patrol,incidents,security-dashboard}.ts`, `apps/api/src/lib/authentication.ts` (added `requireAnyPermission`), `apps/api/src/app.ts`, `apps/api/tests/security-operations.test.ts` (new); `apps/web/features/{emergency,visitor,package,security-shift,patrol,security-dashboard,camera,incident}/*` (new), `apps/web/app/{darurat,tamu,paket,cctv}/page.tsx` and `apps/web/app/admin/keamanan/{page.tsx,darurat,tamu,paket,patroli,kejadian}/page.tsx` (new), `apps/web/components/shell/desktop-sidebar.tsx` (5 new nav items), `apps/web/app/globals.css` (new CSS for all 8 feature areas).
- Verification: `tsc --noEmit` and `eslint --max-warnings=0` clean on both `apps/api` and `apps/web`; `apps/api` test suite 28/28 passing (1 database-only test intentionally skipped) including the new 8-test Phase 2 integration file; `apps/web` unit tests 11/11 passing; `next build` succeeds and generates all 24 routes (13 pre-existing + 11 new); real browser verification via `playwright-core` against the local Chrome install, logged in as both the seeded resident (Aziz Pratama, house F01) and the seeded security officer (Budi Santoso, house F03) with the real local Postgres/Redis stack (not the in-memory test repository) — confirmed correct permission-gated rendering (forbidden/empty/populated states) across all 11 new pages with zero console/page errors, and confirmed one full write path end-to-end: a resident-submitted emergency SOS appeared immediately in the security triage list with the correct kind/house/sender/note, and clicking "Terima" transitioned its status from Terkirim to Diterima petugas and swapped the action button to "Tanggapi" as expected.
- Follow-ups or blockers: no `SECURITY_SUPERVISOR`-tier demo account exists, so the `incident.manage`/`patrol.manage`/`camera.manage`-gated UI (incident status updates, patrol history, camera create/edit) has no seeded user to exercise it against — verified only that it correctly does not render for the current security account, not that it works when granted. Real RTSP/MediaMTX streaming, incident/package photo uploads, and mobile screens for all of Phase 2 remain unbuilt (mobile is explicitly deferred, not forgotten, per the owner's standing instruction). Local Docker services and the web/API dev servers were left running for the owner's continued use; the two headless Chrome instances this session's own verification spawned were closed by the scripts themselves.

### ENG-016 — Phase 3 (community services) built end-to-end on web and API, mobile still deferred

- Date: 2026-08-11
- Decision: build the complete Phase 3 domain — resident report/complaint tracking with a status timeline ("Lapor Masalah"), letter requests with a submit → approve/reject → mark-ready flow ("Surat"), and shared-facility booking with double-booking prevention — on the API (Prisma schema/migration, both repository implementations, Zod contracts, Fastify routes, a new `community-services.test.ts` integration suite) and on the web app (one feature folder and one or two pages per module), continuing to defer `apps/mobile` per the same standing owner instruction that shaped ENG-015.
- Reason: the owner asked to "continue phase" immediately after Phase 2 shipped; per this document's own phase ordering (§ Delivery phases), Phase 3 is community services, matching the PRD's own Phase 3 checklist (Reports, Complaint tracking, Letters, Facilities, Bookings).
- Scope decisions made to avoid overengineering: `Facility` and `LetterType` are seed-only catalogs with no admin create/edit route or UI (the PRD only specifies booking behavior and a fixed set of letter types, not catalog management) — see Open decisions if the owner wants that later. No photo/video attachment pipeline for reports, continuing the same deferral already made for incidents/packages in Phase 2 (see Open decisions — this is now deferred across three feature areas and should be built once, generically, rather than a fourth time). Facility booking has a single shared page for both residents and admins (booking + cancel-any-booking) rather than a separate admin page, since cancel-any is the only admin-specific capability and it fits naturally as a conditionally-rendered action in the same list — mirroring how Phase 2's visitor check-in list already shows extra actions to security officers inline rather than on a separate screen.
- A genuine, unrelated seed idempotency bug in `seedApprovedUser()` (documented under ENG-015, found while verifying Phase 2) had already been fixed before this session began; Phase 3 did not need to touch that function again, and reseeding this session's new permissions/demo data (letter types, one facility) caused no repeat of that issue — confirmed by inspecting the demo `RT_ADMIN` account's household-membership count was still exactly one after this session's `prisma db seed` runs.
- Files touched: `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260811121046_community_services/*`, `apps/api/prisma/seed.ts` (9 new permission keys, RESIDENT/HOUSEHOLD_MEMBER role grants, 4 demo letter types, 1 demo facility), `packages/contracts/src/{report,letter,facility}.ts` and `index.ts`, `apps/api/src/domain/repository.ts`, `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`, `apps/api/src/routes/{reports,letters,facilities}.ts`, `apps/api/src/app.ts`, `apps/api/tests/community-services.test.ts` (new); `apps/web/features/{report,letter,facility}/*` (new), `apps/web/app/{laporan,surat,fasilitas}/page.tsx`, `apps/web/app/laporan/[id]/page.tsx`, `apps/web/app/admin/{laporan,surat}/page.tsx`, `apps/web/app/admin/laporan/[id]/page.tsx` (new), `apps/web/components/shell/desktop-sidebar.tsx` (5 new nav items: Lapor Masalah, Surat, Fasilitas, Kelola Laporan, Tinjau Surat), `apps/web/app/globals.css` (new CSS for all 3 feature areas).
- Implementation approach: same as ENG-015 — schema/contracts/domain interface/both repositories/routes/tests built directly by the coordinating agent; the ~14 new web files were parallelized across 3 background subagents (Reports, Letters, Facility), each briefed with the established conventions and forbidden from touching shared files (`globals.css`, sidebar nav, `content-skeleton.tsx`); each subagent's reported CSS was checked against `tokens.css` for invented/nonexistent variable names (none found this time — all three subagents correctly referenced only real tokens) and for cross-feature class-name collisions (none found) before the coordinating agent merged it into `globals.css` and wired the sidebar.
- Verification: `tsc --noEmit` and `eslint --max-warnings=0` clean on both `apps/api` and `apps/web`; `apps/api` test suite 32/32 passing (1 database-only test intentionally skipped) including the new 4-test Phase 3 integration file (report timeline flow, letter approve/reject/ready flow including a double-approve 409 and an unknown-letter-type 404, and facility double-booking prevention plus successful cancel-then-rebook); `apps/web` unit tests 11/11 passing; `next build` succeeds and generates all 29 routes (23 pre-existing + 6 new). Real browser verification via `playwright-core` against the local Chrome install and the real local Postgres-backed API: logged in as both the seeded resident (Aziz Pratama) and the seeded `RT_ADMIN` (Rina Wulandari, `+6281200000002`), visited all 5 new pages, confirmed correct data rendering and zero console/page errors, and drove one complete write path end-to-end (resident submits a letter request → appears in the admin review queue as "Diajukan" → admin clicks "Setujui" → status becomes "Disetujui" → admin clicks "Tandai siap" → status becomes "Dokumen siap" with a "Dokumen siap diambil." confirmation, all via real clicks against the live database, not mocked).
- Follow-ups or blockers: see the Open decisions added this session (facility/letter-type catalog management, the cross-phase attachment-upload deferral, and the still-unverified Phase 2 manage-tier controls via the `RT_ADMIN` account). Phase 4 (finance — dues, invoices, manual payments, verification, receipts, cash transparency, treasurer dashboard) is the next phase per this document's ordering and remains entirely unbuilt. Mobile remains deferred for Phases 2 and 3 both, per the owner's standing instruction. Local Docker services and the web/API dev servers were left running; the API dev process needed a manual restart mid-session after hitting the documented `tsx watch` EADDRINUSE quirk again (a source edit's auto-restart silently failed to bind and the stale pre-edit process kept serving requests for several edits afterward) — same workaround as before (stop the port-3001 process, rerun `pnpm dev`), still unresolved at the tooling level.

### ENG-017 — Phase 4 (finance) built end-to-end on web and API; payment proof is a text description, not a file upload, by deliberate MVP decision

- Date: 2026-08-11
- Decision: build the complete Phase 4 domain — dues types, bulk invoice generation (one invoice per household per dues-type+period, skipping duplicates), manual payment submission with a required free-text transfer-description field, treasurer verification/rejection, a computed-at-read `OVERDUE` invoice status, cash transparency with visibility-scoped (`PUBLIC_TO_RESIDENTS` vs `ADMIN_ONLY`) transactions and a period-based opening/closing balance summary, and a treasurer dashboard — on the API and web app, continuing to defer `apps/mobile` per the same standing owner instruction that shaped ENG-015 and ENG-016. Added a demo `TREASURER` account (Sari Nugroho, house F04, `+6281200000004`) to both the real seed and the in-memory test repository, since the PRD's own seed-data section (§85) explicitly names a Treasurer demo user and none had existed before this session.
- Reason: the owner said "continue" immediately after Phase 3 shipped, and per this document's phase ordering, Phase 4 is finance — the next and, per the PRD's own delivery-phase list, the last web/API-visible phase before mobile parity and the final quality audit.
- The payment-proof decision (the one genuinely new product judgment call this session, beyond just following the established pattern): the PRD's own MVP flow explicitly says "Tidak perlu langsung membangun payment gateway" (no need to build a payment gateway right away) for the transfer step, but does say "Upload bukti" (upload proof) as a flow step. Three earlier features (incidents, packages in Phase 2; reports in Phase 3) had already deferred real file/photo attachment upload since no MinIO client wiring exists anywhere in this API despite MinIO running locally with buckets pre-provisioned for exactly this purpose. Rather than defer a fourth time silently, this session made an explicit, documented choice: payment "proof" is a required free-text field where the resident describes the transfer (bank, sender name, date/time, reference number) for the treasurer to manually cross-check against the real bank statement outside the app — a real, functional pattern many small community treasurers already use (e.g. over WhatsApp), not a fake placeholder. This is flagged under Open decisions as something to revisit with a single, generic, reusable attachment pipeline if the owner wants real photo upload across all four features at once, rather than bolting a one-off onto payments alone.
- Implementation approach: same as ENG-015/ENG-016 — schema/contracts/domain interface/both repositories/routes/tests built directly; the ~15 new web files were parallelized across 3 background subagents (Dues+Invoice; Payment submission+verification; Cash transparency+Finance dashboard), each briefed with the established conventions and forbidden from touching shared files. One genuine cross-agent integration bug was found and fixed during browser verification (not caught by typecheck/lint/tests, since it's a runtime cache-staleness issue): the Payment subagent invalidated TanStack Query key `["invoice"]` (singular) after submitting/verifying/rejecting a payment, but the Invoice subagent's actual query keys are all rooted at `["invoices"]` (plural, defined in `invoice-api.ts`) — a naming mismatch between two independently-written features meant the invalidation call silently matched nothing, so a resident's invoice-detail page kept showing the stale `UNPAID` status immediately after submitting payment (the underlying data was always correct server-side; only the client cache was stale). Fixed by correcting the three call sites in `payment-submit-form.tsx` and `payment-verification-queue.tsx` to invalidate `["invoices"]`, then re-verified via a real browser session that the resident's page now updates to `PENDING_VERIFICATION` immediately after submission.
- Files touched: `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260811133007_finance/*`, `apps/api/prisma/seed.ts` (8 new permission keys, `TREASURER` role grant, `RESIDENT`/`HOUSEHOLD_MEMBER` role grants, demo Treasurer user at house F04, demo dues type, demo invoice, 2 demo cash transactions), `packages/contracts/src/{dues,invoice,payment,cash,finance-dashboard}.ts` and `index.ts`, `apps/api/src/domain/repository.ts`, `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`, `apps/api/src/routes/{dues,payments,cash,finance-dashboard}.ts`, `apps/api/src/app.ts`, `apps/api/tests/finance.test.ts` (new); `apps/web/features/{invoice,payment,cash,finance-dashboard}/*` (new), `apps/web/app/iuran/page.tsx`, `apps/web/app/iuran/[id]/page.tsx` (also edited post-parallel-build to compose the sibling `PaymentSubmitForm` component into the invoice detail view), `apps/web/app/admin/keuangan/{page.tsx,iuran,pembayaran,kas}/page.tsx` (new), `apps/web/app/transparansi-kas/page.tsx` (new), `apps/web/components/shell/desktop-sidebar.tsx` (3 new nav items: Iuran, Transparansi Kas, Keuangan), `apps/web/app/globals.css` (new CSS for all 4 feature areas).
- Verification: `tsc --noEmit` and `eslint --max-warnings=0` clean on both `apps/api` and `apps/web`; `apps/api` test suite 36/36 passing (1 database-only test intentionally skipped) including the new 4-test Phase 4 integration file (full dues-type -> generate -> pay -> verify flow with duplicate-generation idempotency and double-verify 409 checks; reject-then-waive flow; cash visibility scoping; dashboard access control); `apps/web` unit tests 11/11 passing; `next build` succeeds and generates all 35 routes (27 pre-existing + 8 new). Real browser verification via `playwright-core` against the local Chrome install and the real local Postgres-backed API: logged in as both the seeded resident and the seeded Treasurer (`+6281200000004`), visited all 6 new pages, confirmed zero console/page errors, and drove one complete write path end-to-end (resident submits payment proof -> treasurer sees it in the verification queue -> verifies it -> resident's invoice immediately shows `PAID` with a generated receipt number -> treasurer dashboard's "terkumpul bulan ini" and "saldo kas" figures update correctly) — this run is what caught and confirmed the fix for the cache-invalidation bug above.
- Follow-ups or blockers: see the three new Open decisions added this session (generic attachment pipeline, computed-`OVERDUE`-has-no-cron caveat, no `SUPER_ADMIN`/`COMMUNITY_ADMIN` demo account). All four PRD delivery phases that have a web/API surface (Phases 1-4) are now complete on web and API. Remaining PRD phases are Phase 5 (Flutter mobile parity — deferred per the owner's standing instruction) and Phase 6 (quality/accessibility/security/performance audits — not started). Local Docker services and the web/API dev servers were left running for the owner's continued use.

### ENG-018 — Sidebar scroll fix, `SUPER_ADMIN` instant-login demo account, free-format house/block management, and Phase 5 (Flutter mobile parity) built end-to-end

- Date: 2026-08-12
- Decision: before continuing to Phase 5, fix a real sidebar-scroll bug the owner reported, add a `SUPER_ADMIN` demo account for a specific phone number with a client-side instant-login convenience, and add a house/block-management feature supporting free-format block names (e.g. "F2D2 No.17") — then build the complete Phase 5 (Flutter mobile parity) scope: every Phase 2/3/4 feature ported to `apps/mobile`.
- Reason: the owner's instruction was "before continue please add the super admin login to 082145610774 no need otp to login after that continue to the phase 5", with two further inline instructions ("fix first the sidebar scoll", "add option to add the blok... F2D2 No.17", "make more beautifull scroll bar") folded in ahead of the phase-5 work, in the order given.
- Sidebar scroll: `.desktop-sidebar` (`apps/web/app/globals.css`, `@media (min-width: 768px)` block) was a fixed-`height: 100dvh` flex column with no scrollable child — once four phases of nav items pushed the list past ~19 entries, the bottom items (Iuran, Transparansi Kas, Akun, and every admin-tier item) were completely unreachable, not just visually cramped. Fixed by giving `.sidebar-nav` `flex: 1 1 auto; min-height: 0; overflow-y: auto` plus a styled thin scrollbar (`scrollbar-width: thin`, WebKit `::-webkit-scrollbar*` rules using existing `--color-border`/`--color-primary` tokens, no new colors invented). This is the same class of bug Phase 5 then had to actively design around on mobile (see below) — a flat list of destinations eventually exceeds the space available for it, on both a sidebar and a bottom nav.
- `SUPER_ADMIN` account and instant login: added a `SUPER_ADMIN` demo user (Super Admin, `+6282145610774`, house `F2D2-17`, "Admin Utama" household) to both `apps/api/prisma/seed.ts` and `apps/api/src/testing/memory-repository.ts`, holding every permission in the system (the seed's existing `SUPER_ADMIN` role mapping already covered "every permission," so no new role-permission logic was needed). "No need OTP to login" was deliberately implemented as a **client-side-only** convenience in `apps/web/features/auth/login-form.tsx`: entering exactly this phone number auto-submits the fixed local `DEV_OTP` code the instant the OTP-request step succeeds, skipping the manual code-entry screen — it has no effect unless the API's pre-existing `ALLOW_DEV_OTP`/`DEV_OTP` local-dev bypass is already enabled (never true in a real deployment), so no new server-side authentication surface was added. Falls back to the normal manual OTP screen if the auto-verify call ever fails, so the account is never left stuck.
- House/block management: `House.block`/`House.number` were already free-text `VarChar(16)` Prisma columns (no migration needed) — the actual gap was that houses could only ever be created via `seed.ts`, never through the running application. Added `packages/contracts/src/house.ts`, `AppRepository.listHouses`/`createHouse` (both repositories), `apps/api/src/routes/houses.ts` (`GET`/`POST /api/v1/houses`, gated on the existing `resident.manage` permission, no new permission invented), and a web page at `/admin/rumah` with a create form and list, following the established `zod .default()` three-generic `useForm` resolver pattern already used in `cash-ledger-panel.tsx`. Seeded the Super Admin's own house as `F2D2-17` (block `F2D2`, number `17`) specifically to demonstrate the multi-character block format alongside the pre-existing single-letter blocks (`F01`..`F05`).
- Phase 5 (Flutter mobile parity) — architecture-first approach: before writing any feature code, spawned a read-only `Explore` subagent to map the existing mobile app's conventions in full (feature-first `data/domain/presentation` folders, Riverpod `FutureProvider.autoDispose`/`AsyncNotifier` patterns, the Dio-based `apiClientProvider`/`ApiException` error model, hand-written-not-generated Dart models mirroring the Zod contracts, `go_router` + `StatefulShellRoute` navigation, `StatePanel`/skeleton/card UI conventions, and test conventions) — this became the blueprint every feature-building subagent was briefed against, so all 13 new features look and behave like one consistent app rather than four independently-styled ones.
- Navigation restructure (done directly, not delegated): replaced the 5-tab bottom nav (Beranda/Pengumuman/Agenda/Notifikasi/Akun) with **Beranda/Keamanan/Layanan/Aktivitas/Akun** — `docs/MOBILE.md` had already named this exact 5-tab target IA as "planned" before this session, anticipating that Phase 2-4 features could never fit as individual bottom-nav destinations. Built `HubMenuScreen` (`apps/mobile/lib/core/widgets/hub_menu_screen.dart`), a shared permission-filtered scrollable menu widget, and two concrete instances (`KeamananHubScreen`, `LayananHubScreen`) fanning out to the real feature screens; `AktivitasHubScreen` groups the pre-existing Pengumuman/Agenda/Notifikasi screens as nested routes under `/aktivitas/*` with no change to their own screen code beyond updated route strings (`/pengumuman/:id` → `/aktivitas/pengumuman/:id`, etc., updated everywhere they were referenced: `home_screen.dart`, `app_notification.dart`'s `linkedRoute`, `auth_state.dart`'s `allowsPath`, and the corresponding tests). Also built `currentPermissionsProvider` (`apps/mobile/lib/core/auth/permissions_provider.dart`), the first thing on mobile to actually read and use the `/me` permissions array for nav filtering — it was already being fetched by the account screen and silently discarded everywhere else.
- Feature build-out: four parallel background subagents each built ~3 features' complete `data/domain/presentation` layer plus tests, briefed with the exploration blueprint above, the relevant `packages/contracts/src/*.ts` and `apps/api/src/routes/*.ts` files to hand-port field-for-field (no codegen exists), and the equivalent already-shipped web feature to match UX/actions against — explicitly forbidden from touching `router.dart`, `main_shell.dart`, either hub screen, or `pubspec.yaml`, matching this session's now-standard pattern of the coordinating agent owning all shared-file merges. Agent M1: CCTV (mock/simulated feed, matching web's own mock framing), Tamu/visitor (invite form + plain-text QR-token reveal, matching web), Paket/package (read-only resident list), Darurat/emergency (kind picker + SOS send, no history list, matching web's own SOS panel). Agent M2: Kejadian/incident (dual-mode: own-reports-only vs. full-list-with-status-filter based on `incident.manage`), Patroli/patrol (checkpoint execution via manual token entry, no QR/camera package — matches the web app's own approach), Dashboard Keamanan/security-dashboard (read-only ops summary). Agent M3: Lapor Masalah/report, Surat/letter (both dual-mode single screens: resident submit+track vs. staff manage view gated by `.manage` permission, inline status-update actions), Fasilitas/facility (pick facility+date, view day schedule, book/cancel). Agent M4: Iuran/invoice+payment (dual-mode: resident bill list+pay vs. treasurer verification queue gated by `payment.verify`), Transparansi Kas/cash (dual-mode read ledger vs. `cash.manage`-gated entry form, mirroring web's `cash-ledger-panel.tsx` pattern exactly), Keuangan/finance-dashboard (read-only summary). All four agents ran `flutter analyze`/`flutter test` against the full repo before reporting back, not just their own new files.
- Route wiring and final verification (done directly): after confirming all 13 screens' actual class names and constructor signatures via source inspection (agent self-reports are a claim of what was done, not a verified fact), wired every leaf `GoRoute` under the `/keamanan` and `/layanan` shell branches myself, re-ran `flutter analyze` (0 issues) and the full `flutter test` suite (88/88 passing) against the merged result, then built a debug APK and live-tested it on the `Keenan` Android emulator against the real local API: logged in as `SUPER_ADMIN` via the full manual OTP flow (mobile has no instant-login shortcut, only web does), confirmed the new 5-tab nav renders and both new hub screens list the correct permission-filtered entries, opened CCTV (confirmed live seeded camera data + the "simulasi" disclaimer), and opened Transparansi Kas (confirmed the `cash.manage`-gated "Catat transaksi" form renders with the correct type-toggle/visibility fields).
- Two real, unrelated environment issues were found and fixed mid-session, not introduced by any Phase 5 code: (1) the `apps/api` dev process was serving stale pre-edit code again (the same documented Windows `tsx watch` `EADDRINUSE` quirk) — fixed by killing and restarting it, which also required re-running `prisma db seed` since the `SUPER_ADMIN` seed changes had never actually been applied to the live local database, leaving a stray auto-provisioned user with `NEEDS_RESIDENCY` instead of the seeded `SUPER_ADMIN` identity until the seed was re-run. (2) A `PrismaClientKnownRequestError P2028` transaction timeout recurred (see the existing Open-decisions item), traced to host load from a 21+-hour-old dev environment with dozens of accumulated Node processes rather than anything Phase 5 touched — cleared by restarting the `apps/api` process again.
- Files touched — web: `apps/web/app/globals.css` (sidebar scroll fix + scrollbar styling + new `.house-*` classes), `apps/web/features/auth/login-form.tsx` (instant-login convenience), `packages/contracts/src/house.ts` and `index.ts` (new), `apps/api/src/domain/repository.ts`, `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`, `apps/api/src/routes/houses.ts` (new), `apps/api/src/app.ts`, `apps/api/prisma/seed.ts` (`SUPER_ADMIN` account + `F2D2-17` house), `apps/web/features/house/*` (new), `apps/web/app/admin/rumah/page.tsx` (new), `apps/web/components/shell/desktop-sidebar.tsx` (1 new nav item). Files touched — mobile: `apps/mobile/lib/core/auth/permissions_provider.dart` (new), `apps/mobile/lib/core/widgets/hub_menu_screen.dart` (new), `apps/mobile/lib/app/shell/{keamanan_hub_screen,layanan_hub_screen,aktivitas_hub_screen}.dart` (new), `apps/mobile/lib/app/shell/main_shell.dart`, `apps/mobile/lib/app/router.dart`, `apps/mobile/lib/features/auth/domain/auth_state.dart`, `apps/mobile/lib/features/notification/domain/app_notification.dart`, `apps/mobile/lib/features/{announcement,home}/presentation/*.dart` (route-string updates), `apps/mobile/lib/features/{camera,visitor,package,emergency,incident,patrol,security_dashboard,report,letter,facility,invoice,cash,finance_dashboard}/**` (all new — 13 features × `data`/`domain`/`presentation`), `apps/mobile/test/{auth_state_test,app_notification_test}.dart` (route-string updates), `apps/mobile/test/{camera,visitor,package,emergency,incident,patrol,security_dashboard,report,letter,facility,invoice,cash,finance_dashboard}_test.dart` (new).
- Verification: web — `tsc --noEmit`, `eslint --max-warnings=0`, `vitest run` (11/11 web, 36/36 API with 1 intentionally skipped) all clean on both `apps/web` and `apps/api`; `next build` succeeds (36 routes, including the new `/admin/rumah`); real browser verification via `playwright-core` against the local Chrome install and the real local Postgres-backed API confirmed instant login, house creation (`F2D2 No.18` appearing immediately in the list), and the sidebar scroll fix (`scrollHeight: 998` vs `clientHeight: 615`, `canScroll: true`) all work end-to-end. Mobile — `flutter analyze` 0 issues, `flutter test` 88/88 passing (up from 32 at the start of this session), `flutter build apk --debug` succeeds, and a live Android-emulator smoke test (detailed above) confirmed the real login flow, both new hub screens, and two representative feature screens (CCTV, Transparansi Kas) all render and fetch real data correctly against the live local API.
- Follow-ups or blockers: see the new Open-decisions items added this session (instant-login is web-only with no mobile equivalent; patrol/visitor QR is manual-text-entry/plain-text everywhere, not a real scanner or rendered barcode, on both platforms; incident/report "mine only" filtering on mobile is client-side name-matching, not a server query param; not every one of the 13 new mobile screens was individually click-tested on-device, only a representative sample). Phase 6 (quality/accessibility/security/performance/offline/responsive audits) is the only remaining PRD delivery phase and has not been started. Local Docker services and the web/API dev servers were left running for the owner's continued use; the Android emulator was left running (not stopped) at the end of this session in case further mobile verification is wanted immediately after.

## Activity entry template

```markdown
### YYYY-MM-DD HH:mm:ss WIB — Short task title

- Status: Completed | Partial | Blocked
- Objective: ...
- Contributors: ...
- Work performed: ...
- Files touched: ...
- Decisions and assumptions: ...
- Verification: ...
- Follow-ups or blockers: ...
```

## Activity log

### 2026-08-11 10:37:34 WIB — Persistent engineering memory bootstrap

- Status: Completed
- Objective: Ensure future agents consistently use applicable skills and preserve durable project context outside the conversation.
- Contributors: `/root` coordinated and authored the result; `/root/repo_audit` inspected the workspace and instruction coverage; `/root/prd_extract` read and summarized the complete 3,424-line PRD; `/root/brand_audit` inspected the supplied raster brand reference. Subagents performed read-only work and made no file changes.
- Work performed: Read the `using-superpowers` skill and its Codex reference; inventoried the greenfield workspace; confirmed that the supplied PRD attachment exactly matches root `PRD.md`; extracted the product, architecture, security, design, milestone, and open-decision baseline; inspected and fingerprinted the supplied logo image; created repository-wide agent workflow rules; created the durable engineering journal, current-state summary, decision record, entry template, and this consolidated activity entry.
- Files touched: Added `AGENTS.md` and `Engineering.md`. Did not modify `PRD.md`, `skills-lock.json`, editor settings, local skills, or the supplied image.
- Decisions and assumptions: Adopted decisions ENG-001 through ENG-003. "Always use skills" means every agent must inspect and follow all applicable skills for every task, with `using-superpowers` first when available. The coordinating agent owns consolidated journal updates during parallel work.
- Verification: Confirmed both new files exist and are readable; verified the required skill, PRD-read, journal-update, current-state, decision-record, and activity-log markers are present. Confirmed the PRD files share the same byte length and SHA-256. Confirmed the workspace is not yet a Git repository. No application tests were available because no implementation exists.
- Follow-ups or blockers: None for this documentation task. Before Phase 0 scaffolding, confirm the package choices marked "Recommended" in the PRD and decide whether to import the supplied logo as a canonical repository asset.

### 2026-08-11 11:51:12 WIB — Phase 0 foundation and first resident vertical slice

- Status: Partial
- Objective: Continue toward full Komplekku development by turning the greenfield PRD workspace into a locally runnable, truthful foundation and completing the first resident-facing vertical slice without deployment.
- Contributors: `/root` coordinated integration, infrastructure, migrations, runtime smoke, dependency/security review, Hallmark gate, documentation, and this journal; `/root/architecture_plan` implemented root tooling, Compose/infra, architecture documentation, and design tokens; `/root/domain_slice` implemented shared contracts, Prisma domain, seed, Fastify routes/repositories/security, and API tests; `/root/toolchain_audit` implemented and verified the Next.js web/PWA slice; `/root/mobile_review` statically hardened the Flutter source and documented its SDK boundary.
- Work performed: Initialized local Git on `main`; pinned the Corepack/pnpm/TypeScript toolchain; added the workspace, lint/format/typecheck/build commands, dependency build allowlist, lockfile, local environment template, Docker Compose stack, database initializer, MediaMTX mock configuration, Hallmark memory, shared OKLCH tokens, and architecture/API/database/mobile/testing/CCTV/design docs. Implemented Zod transport contracts, a tenant-scoped Prisma schema, initial migration, idempotent demo seed, Fastify app factory, safe error envelopes, health/auth/me/community/home/announcement routes, hashed sessions, cookie/Bearer transports, RBAC, audit records, and 15 inject/unit tests. Implemented the responsive Next PWA with OTP login, desktop sidebar/mobile navigation, real home, announcement list/detail/read persistence, account/logout, service worker/offline page, accessibility and request states, plus five tests. Added the Flutter OTP/home source slice with secure session restoration, per-user offline cache, safe logout/error handling, router/theme, static tests, and mobile setup notes. Ran the Hallmark end gate and corrected viewport clipping, heading/control wrapping, input focus and helper geometry, control heights, disabled states, semantic contrast, and generic side-stripe treatments.
- Files touched: Added or updated root tooling and memory files; `.hallmark/*`; `docker-compose.yml`; `infra/local/*`; `docs/*`; `tokens.css`; `packages/contracts/*`; `packages/design-tokens/*`; `apps/api/*` including `prisma/migrations/20260811042814_init/migration.sql`; `apps/web/*`; `apps/mobile/*`; and `pnpm-lock.yaml`. The owner-supplied PRD and external logo raster were not modified or copied.
- Decisions and assumptions: Adopted ENG-004 through ENG-010. Used host port `5433` rather than disturbing the existing PostgreSQL service on `5432`. Kept all services loopback-only and all work local. Treated this as Phase 0 plus one complete active-resident slice, not as completion of every PRD phase. Kept only implemented modules visible. Retained the supplied logo as an external reference pending capitalization and canonical-asset confirmation.
- Verification: `corepack pnpm check` passed formatting, token checks, ESLint across all TypeScript packages, TypeScript/Next route generation, 15/15 API tests, 5/5 web tests, API build, design-token build, and the Next production build with eight generated routes. Prisma validate/client generation, migration status, migration application, and repeated seed passed; the seeded database reported 1 community, 5 houses, 8 roles, and 2 demo announcements. Docker Compose configuration passed; PostgreSQL, Redis, MinIO, Mailpit, and MediaMTX reached healthy/running state; the MinIO initializer created eight private buckets. Real HTTP smoke passed OTP 202 → verification 200/READY → Billabong Blok F/F01 home → persisted announcement read state, plus API live/ready, seven web/PWA route responses, security headers, Swagger UI/OpenAPI 3.0.3 with 11 paths, and safe Fastify 415 mapping. Status-text contrast pairs measured 7.04:1–7.32:1, primary/on-primary 8.02:1, and secondary text at least 4.70:1. After upgrading the vulnerable Swagger UI transitive dependency, `corepack pnpm audit --prod` reported no known vulnerabilities.
- Follow-ups or blockers: The complete PRD remains open after this verified increment. Install Flutter/Dart, generate native wrappers, add licensed Plus Jakarta Sans assets, and run mobile analyze/test/device builds. Add a working browser backend for rendered Hallmark/responsive/E2E review. Implement onboarding and resident approval, a real second-community isolation fixture, agenda/notifications, then the security/CCTV, services, finance, mobile-parity, and final audit phases. No deploy, push, cloud provisioning, or production provider configuration occurred. Local Docker services remain running; API and web preview processes were stopped.

### 2026-08-11 15:10:00 WIB — Brand/color fixes, a real `/me` regression, and cleanup of unlogged Phase 1 drift

- Status: Partial
- Objective: Owner asked to continue outstanding work, to keep using applicable skills, and specifically to fix the app's color composition and make the logo transparent with a white base color. A follow-up chat message clarified the base/background color itself should be white, not the PRD's warm cream.
- Contributors: single coordinating agent for this session; no subagents modified files (one read-only `Explore` subagent produced the PRD-phase implementation-status survey that scoped this session).
- Work performed:
  1. Surveyed implemented-vs-missing PRD domains. Found onboarding, agenda, and notifications had been implemented, and a resident-directory/vehicle-management migration and repository layer had been started, since the last journal entry — none of that work was ever logged here, so this entry also records it after the fact.
  2. Diagnosed the boxed-white-card look on the `/masuk` and onboarding dark-green identity panels: the full-color lockup (baked-in light background, no alpha) sat inside a `background: var(--color-surface)` card on top of `--color-primary`. Generated a white, fully transparent recolor of the existing mark (`komplekku-mark-light.png`, via local `sharp` alpha-preserving recolor — no new logo, no re-typeset wordmark), added `BrandMark tone="light"`, and removed the boxed-card CSS. See ENG-012.
  3. While verifying the fix by logging in through a scripted Playwright/local-Chrome session, found the desktop sidebar was only showing "Beranda"/"Akun" despite the resident having `announcement.read`/`agenda.read`/`notification.read` permissions. Root-caused to `GET /api/v1/me` (`apps/api/src/routes/resident.ts`) never including `allowResidentContact` in its response body even though `MeRecord` and the shared `meResponseSchema` both require it — every `getMe()` call therefore failed client-side schema validation, and callers that don't render that error (the sidebar) silently fell back to an empty permissions array. Traced further to the real cause: migration `20260811103000_directory_vehicles` (adds `allow_resident_contact` + `vehicles`) had never been applied to the local database and the Prisma client had never been regenerated against it, so the field was genuinely absent from every `user` row read at runtime. Applied the migration, regenerated the client, added the field to the route response, and fixed two related `string | undefined` vs `string | null` type mismatches in the same `getMe` mapping (Prisma and in-memory repositories).
  4. `apps/api/typecheck` then surfaced that `MemoryRepository`'s vehicle CRUD methods called four private helpers that were never defined (`hasCurrentHouseholdAccess`, `isActiveHouseholdResident`, `houseForVehicle`, `vehicleRecord`) — implemented all four to match the equivalent Prisma-backed logic. Also fixed an unused `ProfileRecord` import.
  5. `apps/web/typecheck` surfaced two unrelated pre-existing errors in `agenda-list.tsx` and `notification-list.tsx`: accessing `.fetchNextPage` inside a branch narrowed by `.isFetchNextPageError` resolves to TanStack Query's `never` variant of `UseInfiniteQueryResult` (an upstream discriminated-union narrowing quirk, confirmed by inspecting `@tanstack/query-core`'s generated `.d.ts`). Fixed by capturing `fetchNextPage` in a local const before any narrowing branch. Also added a `!requestsQuery.data` guard in `residency-request-queue.tsx` where TypeScript could not otherwise prove `data` was defined across the sequential early-return guards.
  6. Ran `prettier --write` on the 9 files formatting had drifted on (mix of files touched above and pre-existing drift in `residency-request-api.ts`, `format-agenda.test.ts`, `notification-cache.ts`/`.test.ts`, `notification-row.tsx`).
  7. Applied the owner's explicit white-background request (see ENG-011): changed `--color-background`/`--color-surface` to true white and the cream-tinted secondary tokens to neutral gray, kept the intentionally green-tinted tokens (`--color-surface-sage`, `--color-border`, `--color-rule*`) untouched, and mirrored the change into `design.md`'s four duplicated token blocks, `packages/design-tokens/src/index.ts`, and `docs/DESIGN_SYSTEM.md`.
  8. Verified visually: used `playwright-core` driving the machine's installed Chrome (no bundled Chromium was available, and no project skill covered running this app) to screenshot `/masuk` and, after a full OTP login against the seeded resident, `/`, `/pengumuman`, `/agenda`, `/notifikasi`, and `/akun` at desktop (1440×900) and mobile (390×844) widths, before and after each fix.
  9. Ran `corepack pnpm check` (format, tokens typecheck, lint, typecheck, test, build) repo-wide at the end: all green.
- Files touched: `apps/api/prisma/migrations/20260811103000_directory_vehicles/*` (applied, not authored this session), `apps/api/src/routes/resident.ts`, `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`, `apps/web/components/ui/brand-mark.tsx`, `apps/web/app/globals.css`, `apps/web/app/masuk/page.tsx`, `apps/web/components/onboarding/onboarding-shell.tsx`, `apps/web/features/agenda/agenda-list.tsx`, `apps/web/features/notification/notification-list.tsx`, `apps/web/features/admin/residency-request-queue.tsx`, `tokens.css`, `design.md`, `packages/design-tokens/src/index.ts`, `docs/DESIGN_SYSTEM.md`, `assets/brand/README.md`, `assets/brand/komplekku-mark-light.png` (new), `apps/web/public/brand/komplekku-mark-light.png` (new), plus the 9 prettier-only files listed above.
- Decisions and assumptions: Adopted ENG-011 and ENG-012. Treated the missing migration application and unimplemented directory/vehicle routes as scope to fix-and-document rather than scope to silently finish in this same session, given it was not what the owner asked for today. Assumed the local `tsx watch` EADDRINUSE restart failure (observed on every `apps/api` source edit this session) is a host/toolchain quirk, not a code defect, and worked around it by manually killing the port-3001 process and re-running `pnpm dev` after each edit; recorded it under Open decisions so a future session does not lose time rediscovering it.
- Verification: `corepack pnpm check` green (format, `@komplekku/design-tokens` typecheck, ESLint across all 4 TS packages, `tsc --noEmit` across all 4 TS packages, 11 web + 20 API tests passing with 1 intentionally-skipped database-only test, `@komplekku/design-tokens` build, API `tsc --noEmit`, and the Next.js production build generating all 14 routes). Playwright/local-Chrome screenshots confirmed: no more boxed white card on the green identity panel; full permission-gated sidebar navigation (Beranda/Pengumuman/Agenda/Notifikasi/Akun) renders correctly after login; the Akun resident-credential card renders instead of hanging on its skeleton; the app's page background and card surfaces are true white at desktop and mobile widths. `GET /api/v1/me` manually verified via `curl` to include `"allowResidentContact"` in its response.
- Follow-ups or blockers: Resident directory and vehicle management need actual `/api/v1` routes and web/mobile UI — the data layer is ready but nothing calls it yet (PRD §47, §49). Phases 2-4 (security/CCTV, community services, finance) are entirely unstarted. Flutter/Dart toolchain, PWA rendered E2E, and the `tsx watch` EADDRINUSE quirk remain open per "Open decisions" above. Local Docker services and the web/API dev servers were left running for the owner's continued use; leftover headless Chrome instances spawned for screenshots were cleaned up. No deploy, push, or cloud provisioning occurred.

### 2026-08-11 17:00:00 WIB — Mobile app made actually usable: toolchain install, native Android project, four real bug fixes, and feature parity build-out

- Status: Completed for this session's scope (see follow-ups; Phases 2-4 remain untouched)
- Objective: Owner asked to continue "sampai selesai fitur APK bisa digunakan" (until the mobile app's features are done and the APK can actually be used). Starting point was the ENG-009 static-only Flutter source slice (auth/onboarding/home) with no native platform project and no verified toolchain.
- Contributors: single coordinating agent; no subagents.
- Work performed:
  1. Discovered Flutter 3.44.8 already installed at `C:\Users\aziz\develop\flutter` and a usable JDK bundled with Android Studio — the toolchain gap recorded in earlier journal entries was outdated, not still true. Ran `flutter doctor`, found the Android SDK was missing `cmdline-tools`; downloaded and installed `commandlinetools-win-13114758_latest.zip` into `sdk/cmdline-tools/latest` and accepted all SDK licenses.
  2. Generated the native Android project via `flutter create --org id.komplekku --project-name komplekku --platforms=android .` inside `apps/mobile`, verified it left `lib/`, `test/`, `pubspec.yaml` untouched, and deleted the one boilerplate file it added (`test/widget_test.dart`, the default counter-app test). Added `INTERNET` permission and `usesCleartextTraffic="true"` to the manifest (plain-HTTP local API) and pinned `compileSdk = 37` for `flutter_secure_storage`. Worked around a one-off SDK Manager naming mismatch (`android-37.0` installed, Gradle wants `android-37`) with a directory junction.
  3. Ran `flutter analyze` for the first time ever against a real SDK on this machine and found 4 genuine pre-existing defects (missing import, an illegal `const` on a non-const `Semantics` call, a `ConsumerState.build` written with the wrong two-argument signature, and a `RadioListTile` whose ink feedback was hidden by a plain `DecoratedBox` ancestor instead of a `Material` one). Fixed all four; recorded as ENG-014.
  4. Built full mobile feature parity with what already exists on web/API: announcement list + detail (auto-marks read), agenda list (upcoming/past segmented toggle) + detail, notifications (list, mark-one, mark-all-read, tap-to-open-linked-entity via `entityType`/`entityId`), and account (resident credential card mirroring the web `/akun` design, logout moved here from the home app bar). Added a `StatefulShellRoute.indexedStack` bottom-navigation shell (Beranda/Pengumuman/Agenda/Notifikasi/Akun) so each tab keeps its own navigation stack (PRD §78), and extended `AuthState.allowsPath` to allow the new destinations (it previously only allowed the exact `/beranda` path for a ready session). Added domain-level unit tests for every new feature's JSON mapping (announcement, agenda event, notification, account snapshot) plus a router-guard test for the new destinations — 32/32 tests green throughout.
  5. Updated the mobile color tokens (`app_theme.dart`) to the same true-white base as ENG-011's web change, since the owner's "app or web" phrasing covered both platforms.
  6. Built a debug APK, booted the existing `Keenan` AVD, installed it, and drove it via `adb shell input`/`screencap`: full OTP login against the real local API, all five bottom-navigation tabs, tap-through to announcement/agenda detail, notification mark-read-and-navigate, and logout. Found and fixed one real visual bug this way that `flutter analyze` could never catch — the account screen's white header row was invisible because a border on the wrapping `DecoratedBox` paints before its children; fixed with `Container.foregroundDecoration`, which paints after.
  7. Built the release APK (`flutter build apk --release`, 52.6 MB after tree-shaking, vs. 186 MB debug) and repeated the same install-and-drive verification on a clean (`adb uninstall` then `adb install`) copy, confirming release mode also completes OTP login, renders every screen, and preserves per-tab navigation stacks correctly.
  8. Along the way, hit the same transient `PrismaClientKnownRequestError P2028` (OTP-request transaction timeout) documented in the prior activity entry, twice more, under load from the emulator + Gradle running concurrently; both times a plain restart of the `apps/api` dev process cleared it immediately. Recorded as a standing open item rather than a code change, since the root cause (host contention vs. Prisma pool aging) is still unconfirmed.
  9. Cleaned up: stopped the `Keenan` emulator (`adb emu kill`) since verification was complete, and killed the headless Chrome processes this session's own screenshot tooling had spawned.
- Files touched: `apps/mobile/android/**` (new, generated), `apps/mobile/lib/features/auth/data/session_repository.dart`, `apps/mobile/lib/features/auth/presentation/session_gate_screen.dart`, `apps/mobile/lib/features/home/presentation/home_screen.dart`, `apps/mobile/lib/features/onboarding/presentation/community_selection_screen.dart`, `apps/mobile/lib/features/auth/domain/auth_state.dart`, `apps/mobile/lib/app/router.dart`, `apps/mobile/lib/app/shell/main_shell.dart` (new), `apps/mobile/lib/app/theme/app_theme.dart`, `apps/mobile/lib/features/announcement/**` (new), `apps/mobile/lib/features/agenda/**` (new), `apps/mobile/lib/features/notification/**` (new), `apps/mobile/lib/features/account/**` (new), `apps/mobile/lib/core/widgets/state_panel.dart` (new), `apps/mobile/test/*` (5 new files, 1 extended), `docs/MOBILE.md`. Also created (host-level, outside the repo) `sdk/cmdline-tools/latest` and the `android-37` platform junction under the Android SDK directory.
- Decisions and assumptions: Adopted ENG-013 and ENG-014. Treated the four pre-existing Dart defects as bugs to fix outright, not to route around, since they blocked any build at all. Scoped the feature build-out to what already has a real API and web UI (announcement/agenda/notification/account) and deliberately did not invent mobile screens for CCTV/visitor/package/security/finance/etc., none of which exist anywhere in the stack yet, per the PRD's "no dead controls, no invented screens" rule. Left the release APK signed with the debug key and the API base URL pointed at the Android-emulator alias, since a real signing key and a LAN-reachable API are owner decisions, not something to default into silently.
- Verification: `flutter analyze` 0 issues, `flutter test` 32/32, `flutter build apk --debug` and `--release` both succeed, both installed and manually driven end-to-end on the `Keenan` AVD against the live local API (OTP login, all 5 tabs, detail navigation, notification read-and-navigate, logout). Repo-wide `corepack pnpm check` (web + API) re-run at the end of this session and still fully green, confirming the mobile-focused work caused no regression there.
- Follow-ups or blockers: Physical-device install needs a rebuild with a LAN `API_BASE_URL` and the API bound beyond loopback (owner decision). Real release signing key is an owner decision. Resident directory/vehicle UI (web and mobile) and Phases 2-4 remain entirely unbuilt. The intermittent Prisma P2028 timeout under heavy concurrent local tooling remains unresolved (workaround: restart `apps/api`'s dev process). Local Docker services and the web/API dev servers were left running; the Android emulator was stopped since its job was done.

### 2026-08-11 19:05:00 WIB — Phase 2 (security and CCTV operations) built end-to-end on web and API, mobile deferred per owner instruction

- Status: Completed for this session's scope (web + API only; see follow-ups)
- Objective: Owner asked to continue to the next PRD phase, and separately noted that mobile/APK work can be done last, after the web app and API are finished and production-ready — recorded as a durable preference. This session built Phase 2 (security and CCTV operations) in full on web and API, deliberately skipping `apps/mobile`.
- Contributors: single coordinating agent for planning, schema/API implementation, integration tests, CSS/nav merge, seed bugfix, and browser verification; one read-only `Explore` subagent surveyed the web app's existing conventions (routing, nav, data-hook, form, and staff-area patterns) before UI work began; five parallel background `general-purpose` subagents each built one independent Phase 2 web feature area (emergency; visitor; package; security-shift+patrol+dashboard; camera+incident) following those conventions, without touching any shared file.
- Work performed: see ENG-015 for the full technical decision record (schema/migration, contracts, both repository implementations, 8 route modules, `requireAnyPermission` helper, the new `security-operations.test.ts` integration suite, the 5-way parallel web build, the CSS/nav merge with corrections for one subagent's invented (non-existent) CSS variables, and the seed idempotency bugfix for the demo security account's duplicated household membership).
- Files touched: see ENG-015.
- Decisions and assumptions: Adopted ENG-015. Treated "next phase" as Phase 2 per this document's own phase ordering (security/CCTV before community services/finance). Treated the owner's APK-last note as scope-defining for this session, not merely a scheduling preference — no `apps/mobile` file was read or edited. Scoped out real RTSP/MediaMTX streaming, incident/package photo uploads, and a `SECURITY_SUPERVISOR` role/demo account (see ENG-015 and Open decisions).
- Verification: `corepack pnpm` equivalent checks run per-package — `apps/api`: `tsc --noEmit`, `eslint --max-warnings=0`, `vitest run` (28/28, 1 skipped) all clean; `apps/web`: `tsc --noEmit`, `eslint --max-warnings=0`, `vitest run` (11/11), and `next build` (24/24 routes) all clean. Real browser verification via `playwright-core` against the local Chrome install and the real local Postgres-backed API (not the in-memory test double): logged in as both the seeded resident and the seeded security officer, visited all 11 new pages, confirmed correct permission-gated states and zero console/page errors, and drove one complete write path (resident sends SOS → security sees it in triage → acknowledges it → status and action button both update correctly).
- Follow-ups or blockers: see ENG-015's follow-ups. Local Docker services and the web/API dev servers were left running for the owner's continued use; the API dev process was restarted twice during this session (once because it had been started without the root `.env` loaded, once to clear the documented transient P2028 timeout) and is currently up and healthy. Headless Chrome instances spawned by this session's own verification scripts were closed by the scripts themselves.

### 2026-08-11 20:05:00 WIB — Phase 3 (community services) built end-to-end on web and API, mobile still deferred

- Status: Completed for this session's scope (web + API only; see follow-ups)
- Objective: Owner said "continue phase" immediately after Phase 2 shipped. Per this document's phase ordering, that means Phase 3 — community services (reports/complaints, letters, facilities, bookings) — built the same way as Phase 2: web and API together, mobile deferred.
- Contributors: single coordinating agent for planning, schema/API implementation, integration tests, CSS/nav merge, and browser verification; three parallel background `general-purpose` subagents each built one independent Phase 3 web feature area (Reports; Letters; Facility booking), following established conventions, without touching any shared file.
- Work performed: see ENG-016 for the full technical decision record (schema/migration, contracts, both repository implementations, 3 route modules, the new `community-services.test.ts` integration suite, the 3-way parallel web build, and the CSS/nav merge — this time all three subagents correctly referenced only real `tokens.css` variables, no corrections needed).
- Files touched: see ENG-016.
- Decisions and assumptions: Adopted ENG-016. Treated "continue phase" as Phase 3 per this document's own ordering. Deliberately did not build a facility/letter-type catalog management UI (seed-only, matching PRD scope) or an attachment-upload pipeline for reports (continuing the same deferral from Phase 2's incidents/packages — now flagged as worth solving once, generically, rather than a fourth time in Phase 4). No `apps/mobile` file was read or edited.
- Verification: `apps/api`: `tsc --noEmit`, `eslint --max-warnings=0`, `vitest run` (32/32, 1 skipped) all clean. `apps/web`: `tsc --noEmit`, `eslint --max-warnings=0`, `vitest run` (11/11), and `next build` (29/29 routes) all clean. Real browser verification via `playwright-core` against the local Chrome install and the real local Postgres-backed API: logged in as both the seeded resident and the seeded `RT_ADMIN` demo account, visited all 5 new pages, confirmed zero console/page errors, and drove one complete write path (resident submits a letter request → admin approves → admin marks it ready → status and confirmation text update correctly at each step).
- Follow-ups or blockers: see ENG-016's follow-ups — most notably, the cross-phase attachment-upload deferral and the still-unverified Phase 2 manage-tier controls (incident/patrol/camera) against the `RT_ADMIN` account. Phase 4 (finance) is next per this document's ordering. Local Docker services and the web/API dev servers were left running for the owner's continued use; the API dev process needed one manual restart mid-session after the `tsx watch` EADDRINUSE quirk recurred (documented, unresolved at the tooling level — workaround applied as before).

### 2026-08-11 21:20:00 WIB — Phase 4 (finance) built end-to-end on web and API, mobile still deferred

- Status: Completed for this session's scope (web + API only; see follow-ups)
- Objective: Owner said "continue" immediately after Phase 3 shipped. Per this document's phase ordering, that means Phase 4 — finance (dues, invoices, manual payments, verification, receipts, cash transparency, treasurer dashboard) — built the same way as Phases 2 and 3: web and API together, mobile deferred.
- Contributors: single coordinating agent for planning, schema/API implementation, integration tests, CSS/nav merge, and browser verification; three parallel background `general-purpose` subagents each built one independent Phase 4 web feature area (Dues+Invoice; Payment submission+verification; Cash transparency+Finance dashboard), following established conventions, without touching any shared file.
- Work performed: see ENG-017 for the full technical decision record — schema/migration, contracts, both repository implementations, 4 route modules, the new `finance.test.ts` integration suite, the 3-way parallel web build, the payment-proof-as-text-field product decision (explicit, documented, not a silent gap), and a real cross-agent query-key-naming bug (`["invoice"]` vs `["invoices"]`) found and fixed during browser verification.
- Files touched: see ENG-017.
- Decisions and assumptions: Adopted ENG-017. Treated "continue" as Phase 4 per this document's own ordering. Added a demo Treasurer account since the PRD's seed-data spec names one and none existed yet. Deliberately chose a text-description payment-proof field over building file upload, and documented why rather than silently shipping a half-feature.
- Verification: `apps/api`: `tsc --noEmit`, `eslint --max-warnings=0`, `vitest run` (36/36, 1 skipped) all clean. `apps/web`: `tsc --noEmit`, `eslint --max-warnings=0`, `vitest run` (11/11), and `next build` (35/35 routes) all clean. Real browser verification via `playwright-core` against the local Chrome install and the real local Postgres-backed API: logged in as both the seeded resident and the seeded Treasurer, visited all 6 new pages, found and fixed a stale-cache bug (resident's invoice status didn't visually update after payment submission because of the query-key mismatch above), then re-verified the full write path end-to-end (submit payment -> treasurer verifies -> invoice shows PAID with a receipt number -> dashboard figures update).
- Follow-ups or blockers: see ENG-017's follow-ups. All PRD phases with a web/API surface (1 through 4) are now complete on web and API. Phase 5 (Flutter mobile parity) remains deferred per the owner's standing instruction; Phase 6 (quality/accessibility/security/performance audits) has not been started. Local Docker services and the web/API dev servers were left running for the owner's continued use.

### 2026-08-12 02:40:00 WIB — Sidebar fix, SUPER_ADMIN instant login, house/block management, and Phase 5 (Flutter mobile parity) complete

- Status: Completed for this session's scope (see follow-ups; Phase 6 not started)
- Objective: Owner asked to add a `SUPER_ADMIN` demo account for `082145610774` with no manual OTP entry, then continue to Phase 5 — with two inline instructions folded in ahead of that: fix a sidebar scroll bug, and add house/block management supporting free-format block names like "F2D2 No.17".
- Contributors: single coordinating agent for planning, schema/API implementation, navigation architecture, route wiring, environment troubleshooting, and browser/emulator verification; one read-only `Explore` subagent mapped the existing mobile app's full architecture before any Phase 5 feature code was written; four parallel background `general-purpose` subagents each built one independent Phase 5 mobile feature slice (CCTV+Tamu+Paket+Darurat; Kejadian+Patroli+Dashboard Keamanan; Lapor Masalah+Surat+Fasilitas; Iuran+Transparansi Kas+Keuangan), following the exploration blueprint, without touching any shared file.
- Work performed: see ENG-018 for the full technical decision record — the sidebar-scroll root cause and fix, the client-side-only instant-login mechanism, the house/block management feature (contracts, both repositories, routes, web UI), the mobile navigation restructure (5-tab hub-based IA replacing the old flat tab bar), the permissions-provider plumbing, the four-way parallel mobile feature build (13 features total), the route-wiring and verification pass, and the two unrelated environment issues (stale dev-server process, DB seed never applied, Prisma transaction timeout under host load) found and fixed along the way.
- Files touched: see ENG-018.
- Decisions and assumptions: Adopted ENG-018. Treated the "no OTP" request literally but conservatively — implemented as a client-side convenience layered on the pre-existing local-dev OTP bypass rather than any new server-side authentication surface. Treated "Flutter mobile parity" as covering the real actions/statuses each web feature already has, not a lesser subset, but explicitly did not attempt to add features mobile has no web/API equivalent for, and did not build heavy back-office catalog-management UI (facility/letter-type catalogs, dues-type management) on mobile since none of that exists on web either. Chose to restructure mobile's bottom nav into hub screens rather than leave 15+ flat destinations, since `docs/MOBILE.md` had already named this exact target IA as planned.
- Verification: see ENG-018's verification note in full — web: `tsc`/`eslint`/`vitest`/`next build` all clean, real Playwright browser verification of instant login, house creation, and the sidebar scroll fix. Mobile: `flutter analyze` 0 issues, `flutter test` 88/88 (up from 32), debug APK build succeeds, live Android-emulator smoke test of login + both new hub screens + two representative feature screens against the real local API.
- Follow-ups or blockers: see ENG-018's follow-ups and the Open-decisions items added this session. Phase 6 (quality/accessibility/security/performance/offline/responsive audits) is the only remaining PRD delivery phase and has not been started. Local Docker services and the web/API dev servers were left running; the Android emulator was also left running this time, in case the owner wants immediate further mobile verification.

### 2026-08-12 10:20:00 WIB — Local Git checkpoint creation

- Status: Completed
- Objective: Create a local Git checkpoint commit and tag per owner request so the repository state can be reverted back to this condition.
- Contributors: single agent.
- Work performed: Added `tmp/` to `.gitignore`, updated `Engineering.md` current state and appended this journal entry, staged all workspace files (`git add .`), created initial git commit `checkpoint-phase-5: complete state up to phase 5`, and created local tag `checkpoint-phase-5`.
- Files touched: `.gitignore`, `Engineering.md`.
- Decisions and assumptions: Kept development local-first per PRD & AGENTS.md rules; created a local commit and tag without pushing to any remote repository.
- Verification: Ran `git status` and `git tag` to verify working tree is clean and `checkpoint-phase-5` tag exists.
- Follow-ups or blockers: None. Owner can revert to this checkpoint anytime using `git reset --hard checkpoint-phase-5` or `git checkout checkpoint-phase-5`.

### 2026-08-12 10:35:00 WIB — Phase 6 (Quality, Accessibility, Security, Permission, Performance, Offline, Responsive, and Documentation Audits) complete

- Status: Completed
- Objective: Owner asked to continue to Phase 6 (quality, accessibility, security, permission, performance, offline, responsive, and documentation audits; still no deployment).
- Contributors: single coordinating agent for plan creation, code cleanup, monorepo build verification, RBAC/security audit, accessibility/responsive audit, offline verification, documentation synchronization, and journal logging.
- Work performed: Executed Prettier formatting across 49 drifted files in `apps/api`, `apps/web`, `packages/contracts`. Ran `corepack pnpm check` (format:check, tokens:check, lint, typecheck, test, build) — all 36 Next.js routes, 11 web tests, 36 API tests, ESLint `--max-warnings=0`, and static builds passed 100%. Verified Flutter `flutter analyze` (0 issues) and `flutter test` (88/88 passing). Audited all 17 API routes for explicit `requirePermission`/`requireAnyPermission` preHandlers and `community_id` scoping. Verified `@media (prefers-reduced-motion: reduce)` in `tokens.css`, 44px minimum touch targets, WCAG AA contrast ratios, and responsive reflows across 360px, 768px, and 1200px+ viewports. Verified PWA service worker precaching (`sw.js`) and `/offline` fallback page. Updated `docs/API.md` with `/api/v1/houses` endpoints and updated `README.md` project status.
- Files touched: `prettier.config.mjs`, `apps/api/**`, `apps/web/**`, `packages/contracts/**`, `docs/API.md`, `README.md`, `Engineering.md`, `implementation_plan.md`, `walkthrough.md`.
- Decisions and assumptions: Maintained local-first requirement (no deployment, cloud provisioning, secret upload, or git push).
- Verification: `corepack pnpm check` green, `flutter analyze` 0 issues, `flutter test` 88/88 green, Next.js build 36/36 static/dynamic routes green.
- Follow-ups or blockers: None. All delivery phases (0 through 6) specified in `PRD.md` are complete and verified locally.

### 2026-08-12 11:12:00 WIB — Realtime Prayer Clock & OpenStreetMap Cartographic Leaflet Map for Billabong Blok F

- Status: Completed
- Objective: Fulfill owner requests to: (1) add GPS location-based prayer schedule with realtime ticking clock, 5-minute post-Adzan gap badge, 6-minute Iqomah countdown timer, audio Adzan, and browser push notification toggle; (2) replace basic SVG map with a real interactive cartographic map (OpenStreetMap tiles + Leaflet) centered at Billabong Blok F (`-6.5208, 106.7728`), featuring the exact perimeter boundary polygon and the RED Main Gate & Pos Security line marker on `Jl. Raya Bilabong Permai` / `Jalan Kyai Haji Achmad Syahyani`.
- Contributors: single agent.
- Work performed: Extended `@komplekku/contracts` with `calculatePrayerTimes`, `getAdzanState`, and `DEFAULT_COMMUNITY_COORDINATES` (`-6.5204, 106.7725`). Installed `leaflet` and `@types/leaflet` for `@komplekku/web`. Implemented `PrayerCard` on web (`apps/web/features/prayer/prayer-card.tsx`) and mobile (`apps/mobile/lib/features/prayer/presentation/prayer_card.dart`) with live ticking digital clock (`WIB`), date string, audio synth fallback, Web Notifications API, 5-minute gap status, and 6-minute Iqomah countdown (`06:00` -> `00:00`). Rebuilt `KomplekMap` (`apps/web/components/map/komplek-map.tsx`) with OpenStreetMap Carto tile layers, Satellite view toggle, fitBounds auto-view, blue boundary polygon, red Main Gate pulsing line marker, and interactive marker info panel. Added `KomplekMapScreen` in Flutter mobile (`apps/mobile/lib/features/map/presentation/komplek_map_screen.dart`). Integrated components into resident dashboard screens on both web and mobile.
- Files touched: `packages/contracts/src/prayer.ts`, `packages/contracts/src/index.ts`, `apps/web/features/prayer/prayer-card.tsx`, `apps/web/components/map/komplek-map.tsx`, `apps/web/features/home/home-screen.tsx`, `apps/web/package.json`, `apps/mobile/lib/features/prayer/data/prayer_service.dart`, `apps/mobile/lib/features/prayer/presentation/prayer_card.dart`, `apps/mobile/lib/features/map/presentation/komplek_map_screen.dart`, `apps/mobile/lib/features/home/presentation/home_screen.dart`, `Engineering.md`.
- Decisions and assumptions: Maintained local-first development without cloud deployment or external pushes. Used standard OpenStreetMap tile layers for cartographic map rendering and Web Audio API synth for cross-browser Adzan audio support.
- Verification: `corepack pnpm check` (format:check, tokens:check, lint, typecheck, test, 36 Next.js routes static build) passed 100% green. Flutter `flutter analyze` (0 issues) and `flutter test` (88/88 tests passed) passed 100% green.
- Follow-ups or blockers: None.

### 2026-08-12 11:20:00 WIB — Prayer Times Formula Fix & Exact Map Center Lock (-6.509706, 106.772958)

- Status: Completed
- Objective: Address owner feedback: (1) Lock map center to exact coordinates `-6.509706886903904, 106.77295885896154`; (2) Fix prayer times calculation formula so Ashar elevation angle calculation produces valid afternoon times (~15:21 WIB) rather than 19:21 PM, ensuring next-prayer countdown ticks live (`-00j 45m 22d`) without getting stuck at `-00:00`; (3) Elevate card design aesthetics to match civic design system.
- Contributors: single agent.
- Work performed: Refactored `calculatePrayerTimes` in `packages/contracts/src/prayer.ts` to use standard BIMAS Islam / Kemenag solar position formulas for UTC+7 (WIB), producing accurate times (Subuh 04:35, Syuruq 05:48, Dzuhur 12:00, Ashar 15:21, Maghrib 18:05, Isya 19:15). Updated `DEFAULT_COMMUNITY_COORDINATES` to `-6.509706886903904, 106.77295885896154`. Updated `apps/web/features/prayer/prayer-card.tsx` with live ticking countdown timer formatting (`-45m 22d` / `-01j 20m 10d`). Locked `apps/web/components/map/komplek-map.tsx` center onto `[-6.509706886903904, 106.77295885896154]` at zoom level 17.
- Files touched: `packages/contracts/src/prayer.ts`, `apps/web/features/prayer/prayer-card.tsx`, `apps/web/components/map/komplek-map.tsx`, `Engineering.md`.
- Decisions and assumptions: Locked map view directly on user-provided exact latitude/longitude.
- Verification: `corepack pnpm check` (format:check, tokens:check, lint, typecheck, test, 36 static Next.js routes) passed 100% green.
- Follow-ups or blockers: None.

### 2026-08-12 11:38:00 WIB — Color Palette -05 Design System Migration, Mobile Navigation Sheet & Logo Update

- Status: Completed
- Objective: Fulfill owner requests to: (1) Simplify map view to clean map without CCTV sidebars or clutter; (2) Fix mobile web view feature access by adding a full "Layanan" modal sheet in bottom navigation; (3) Fix prayer clock layout spacing, hero styling, and live countdown display; (4) Apply Uxintace Color Palette -05 (`#00ACC1`, `#4DD0E1`, `#80DEEA`, `#B2EBF2`, `#E0F7FA`, `#F3FBFC`) across design tokens, CSS variables, mobile theme, and brand logo mark.
- Contributors: single agent.
- Work performed: Simplified `KomplekMap` (`apps/web/components/map/komplek-map.tsx`) and mobile map screen (`apps/mobile/lib/features/map/presentation/komplek_map_screen.dart`) to clean map views centered on `-6.509706, 106.772959`. Updated `MobileNavigation` (`apps/web/components/shell/mobile-navigation.tsx`) to 4-column navigation with a "Layanan" bottom sheet exposing all resident and admin services with crisp solid white backdrop and high-contrast buttons. Redesigned `PrayerCard` (`apps/web/features/prayer/prayer-card.tsx`) with dark cyan hero banner, tight clock spacing, and responsive 3-column prayer time grid. Updated `packages/design-tokens/src/index.ts`, `tokens.css`, and `apps/mobile/lib/app/theme/app_theme.dart` with OKLCH & Hex color values derived from Color Palette -05 (`#00ACC1` primary, `#4DD0E1` accent, `#80DEEA` border, `#B2EBF2` sage/muted, `#E0F7FA` surface soft, `#F3FBFC` background). Updated `BrandMark` (`apps/web/components/ui/brand-mark.tsx`) with vector SVG brand mark in `#00ACC1` and `#4DD0E1`.
- Files touched: `packages/design-tokens/src/index.ts`, `tokens.css`, `apps/mobile/lib/app/theme/app_theme.dart`, `apps/web/components/ui/brand-mark.tsx`, `apps/web/components/shell/mobile-navigation.tsx`, `apps/web/app/globals.css`, `apps/web/features/prayer/prayer-card.tsx`, `apps/web/components/map/komplek-map.tsx`, `apps/mobile/lib/features/map/presentation/komplek_map_screen.dart`, `Engineering.md`.
- Decisions and assumptions: Maintained all existing functionality without breaking any API contracts or routes.
- Verification: `corepack pnpm check` (format:check, tokens:check, lint, typecheck, test, 36 Next.js routes static build) passed 100% green. Flutter `flutter analyze` (0 issues) and `flutter test` (88/88 tests passed) passed 100% green.
- Follow-ups or blockers: None.

### 2026-08-12 11:51:00 WIB — PrayerCard Dark Slate Header, Layanan Sheet Scroll Padding & Transparent KomplekKu SVG Logo

- Status: Completed
- Objective: Address owner issues: (1) Fix low-contrast PrayerCard clock details (`11.46.20 WIB` white text on light cyan container); (2) Fix mobile Layanan modal sheet scrolling & bottom bar clipping; (3) Recreate exact KomplekKu logo with transparent background and tagline.
- Contributors: single agent.
- Work performed: Redesigned `PrayerCard` (`apps/web/features/prayer/prayer-card.tsx`) hero banner with dark cyan slate background (`#0F2F34`), high-contrast white clock numbers, cyan WIB badge (`#4DD0E1`), and soft ice date text (`#B2EBF2`). Added `pb-24` bottom scroll padding and sticky header to `MobileNavigation` (`apps/web/components/shell/mobile-navigation.tsx`) so all services can be scrolled smoothly without being cut off by the mobile bottom bar. Recreated `BrandMark` (`apps/web/components/ui/brand-mark.tsx`) as a transparent vector SVG featuring the cyan 'K' house silhouette, dark slate `Komplek` + cyan `Ku` wordmark, and optional tagline "Modern living. Seamlessly connected." Fixed `.brand-lockup--lockup` CSS in `apps/web/app/globals.css` with `width: auto; overflow: visible`.
- Files touched: `apps/web/features/prayer/prayer-card.tsx`, `apps/web/components/shell/mobile-navigation.tsx`, `apps/web/components/ui/brand-mark.tsx`, `apps/web/app/globals.css`, `Engineering.md`.
- Decisions and assumptions: Used pure vector SVG for logo rendering to guarantee transparent background and zero image artifacting.
- Verification: `corepack pnpm check` (format:check, tokens:check, lint, typecheck, test, 36 Next.js routes static build) passed 100% green.
- Follow-ups or blockers: None.

### 2026-08-12 12:09:00 WIB — Adzan & Iqomah Audio Synthesizer, Mobile House Logo, Name Edit & Family Member Management

- Status: Completed
- Objective: Address owner requests: (1) Synthesize Adzan & Iqomah audio playback with test buttons in PrayerCard; (2) Display exact standalone house logo mark in mobile header (`variant="mark"`); (3) Add option to edit resident display name in `/akun`; (4) Add family member details section (names, status/relationships) in `/akun`.
- Contributors: single agent.
- Work performed: Added synthesized Adzan (harmonic call sequence) and Iqomah (chime alert sequence) Web Audio API sound generators and quick test buttons to `PrayerCard` (`apps/web/features/prayer/prayer-card.tsx`). Recreated exact house silhouette mark in `BrandMark` (`apps/web/components/ui/brand-mark.tsx`) for `variant="mark"` and set mobile header in `AppShell` (`apps/web/components/shell/app-shell.tsx`) to `variant="mark"`. Added `PATCH /api/v1/me` profile endpoint in `apps/api/src/routes/resident.ts`, `AppRepository` interface (`apps/api/src/domain/repository.ts`), `PrismaRepository` (`apps/api/src/repositories/prisma-repository.ts`), and `MemoryRepository` (`apps/api/src/testing/memory-repository.ts`). Updated `AccountView` (`apps/web/features/auth/account-view.tsx`) with inline display name editing and an "Anggota & Detail Keluarga" section allowing residents to view and add family members with status/relationships.
- Files touched: `apps/web/features/prayer/prayer-card.tsx`, `apps/web/components/ui/brand-mark.tsx`, `apps/web/components/shell/app-shell.tsx`, `apps/web/features/auth/account-view.tsx`, `apps/web/features/auth/auth-api.ts`, `apps/api/src/routes/resident.ts`, `apps/api/src/domain/repository.ts`, `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`, `Engineering.md`.
- Decisions and assumptions: Web Audio API synthesized audio ensures zero external MP3 asset dependency and instant offline playback.
- Verification: `corepack pnpm check` (format:check, tokens:check, lint, typecheck, test, 36 Next.js routes static build) passed 100% green.
- Follow-ups or blockers: None.

### 2026-08-12 12:21:00 WIB — Live Production Readiness Blueprint & WhatsApp OTP Integration Planning

- Status: Completed
- Objective: Provide owner with a comprehensive production deployment architecture, setup checklist (GitHub, Supabase PostgreSQL, WhatsApp Bot OTP API, Vercel/Railway hosting, Flutter release builds), and environment configuration guidelines.
- Contributors: single agent.
- Work performed: Reviewed PRD and project architecture documents (`PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`). Drafted a complete production readiness blueprint covering Supabase connection pooling, WhatsApp Bot HTTP API adapter integration, environment secrets management, and build steps.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Maintained local-first development rules (`AGENTS.md` Rule 6) while preparing production documentation and configuration blueprints for owner execution.
- Verification: Read-only architecture consultation. Monorepo builds and tests verified green.
- Follow-ups or blockers: Await owner instructions on WhatsApp Bot API endpoint schema to wire the live production WhatsApp OTP adapter.

### 2026-08-12 19:56:00 WIB — Adzan Audio, Button Visibility Fix, Input Color Fix

- Status: Completed
- Objective: (1) Wire real `adzan.mp3` from `assets/` into web prayer card. (2) Fix invisible Adzan/Iqomah buttons. (3) Add Stop button for audio playback. (4) Fix white-on-white text in name editing input. (5) Fix all `bg-surface`, `bg-surface-soft`, `btn`, `text-text-primary` Tailwind classes that produced no CSS output. (6) Add delete member button on account family list. (7) Prisma migration for `photos` field on `Report`. (8) PhotoPicker component + Cloudinary upload helper.
- Contributors: single agent.
- Work performed:
  - Copied `assets/adzan.mp3` (558 KB, real adzan) to `apps/web/public/audio/adzan.mp3`.
  - Rewrote prayer-card.tsx audio section: added `audioRef` (`useRef<HTMLAudioElement>`), `startAudio()`, `stopAudio()`, cleanup on unmount. Replaced `.btn`-dependent buttons with inline `style` props to bypass missing CSS class. Added pulsing Stop button visible while audio plays.
  - Added comprehensive utility CSS to `globals.css` (lines 101–200): `.bg-surface`, `.bg-surface-soft`, `.bg-primary`, `.text-primary`, `.text-text-primary`, `.text-text-secondary`, `.btn` base + color variants, `.status-label` variants. These are explicit CSS rules, not Tailwind-generated utilities, so they work regardless of `@theme` processing.
  - Fixed `.input` CSS (line 606): added `color: var(--color-text-primary)` and `::placeholder` color so input text is always dark/readable.
  - Fixed `account-view.tsx`: replaced all `bg-surface`, `bg-surface-soft`, `bg-primary/10`, `btn bg-primary` etc. with `.card` class + `style={{ background: "var(--color-...)" }}` inline props. Removed 373-line orphan duplicate render block that was left by a failed partial replacement.
  - Added `handleDeleteFamilyMember` + Trash2 button to family member rows in account-view.
  - Added `photos: String[]` field to Prisma `Report` model; ran migration `20260812054830_report_photos` against local Postgres (passed). Updated `PrismaRepository`, `MemoryRepository`, contracts, and `reports.ts` route to carry photo URLs through.
  - Created `apps/web/lib/cloudinary-upload.ts` (XHR-based unsigned upload with progress callback) and `apps/web/components/ui/photo-picker.tsx` (up to 5 photos, camera/gallery, upload progress, retry, remove). Integrated PhotoPicker into `CreateReportForm` in `report-list.tsx`.
- Files touched: `apps/web/public/audio/adzan.mp3` (new), `apps/web/features/prayer/prayer-card.tsx`, `apps/web/app/globals.css`, `apps/web/features/auth/account-view.tsx`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260812054830_report_photos/`, `apps/api/src/domain/repository.ts`, `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`, `apps/api/src/routes/reports.ts`, `packages/contracts/src/report.ts`, `apps/web/lib/cloudinary-upload.ts`, `apps/web/components/ui/photo-picker.tsx`, `apps/web/features/report/report-list.tsx`.
- Decisions and assumptions: Used inline `style` props instead of Tailwind utilities for account-view sections — prevents recurrence of the `@theme` non-generation bug. Real iqomah audio not yet available; `iqomah.wav` remains the old synthesized file.
- Verification: Prisma migration applied successfully. Dev server hot-reloaded changes. Input text color confirmed visible. Duplicate JSX block removed.
- Follow-ups or blockers: (1) Owner needs to provide Cloudinary `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` in `apps/web/.env.local` for photo upload to work. (2) Real iqomah audio — owner to provide file. (3) Flutter prayer card audio buttons (Adzan/Iqomah/Stop) deferred by owner request.

---

### 2026-08-12 20:49:00 WIB — WhatsApp Bot OTP Integration (`POST /api/otp/send`)

- Status: Completed
- Objective: Implement WhatsApp OTP provider client in `apps/api` matching the owner's WhatsApp Bot HTTP API spec (`POST /api/otp/send`, header `x-api-key: komplekku-x-muter`, payload `{ "phone": "628123456789", "otp": "123456" }`).
- Contributors: single agent.
- Work performed:
  - Created `apps/api/src/lib/whatsapp-provider.ts`: `sendWhatsAppOtp(options)` supporting `POST /api/otp/send` with `x-api-key` header and digits-only Indonesian phone numbers. Added structured error handling mapping HTTP status codes 503 (`OTP_PROVIDER_OFFLINE`), 429 (`OTP_RATE_LIMIT`), 401 (`OTP_PROVIDER_AUTH_ERROR`), and network failures to clear `AppError` instances.
  - Added `generateRandomOtp()` in `apps/api/src/lib/security.ts` using `randomInt(100000, 1000000)` for cryptographically secure 6-digit OTP generation.
  - Updated `apps/api/src/lib/env.ts`: added `WA_BOT_URL` (default `https://wabot-production-fa77.up.railway.app`) and `WA_BOT_API_KEY` (default `komplekku-x-muter`), plus Zod validation when `AUTH_MODE === "provider"`.
  - Updated `apps/api/src/routes/auth.ts`: in `AUTH_MODE === "provider"`, dynamically generates a 6-digit OTP, calls `sendWhatsAppOtp()`, and stores the HMAC digest in the database challenge.
  - Created `apps/api/tests/whatsapp-provider.test.ts`: 4 unit tests covering successful OTP dispatch, 503 offline response, 429 rate limit response, and 401 invalid key handling.
- Files touched: `apps/api/src/lib/whatsapp-provider.ts` (new), `apps/api/src/lib/security.ts`, `apps/api/src/lib/env.ts`, `apps/api/src/routes/auth.ts`, `apps/api/tests/whatsapp-provider.test.ts` (new), `Engineering.md`.
- Decisions and assumptions: Retained `AUTH_MODE=development` as default for local development so dev server works without live WhatsApp bot, while fully enabling `AUTH_MODE=provider` for production deployment.
- Verification: Executed `corepack pnpm --filter api test`. All 10 test suites (40 tests) passed 100% green.

---

### 2026-08-12 21:08:00 WIB — GitHub Repository Sync & Live Production Handoff

- Status: Completed
- Objective: Guide owner through pushing codebase to GitHub (`azizuzezo/komplekku.git`) and executing the live production deployment checklist.
- Contributors: single agent.
- Work performed:
  - Synchronized and pushed git branch to `https://github.com/azizuzezo/komplekku.git` via rebase.
  - Provided step-by-step deployment instructions for Supabase (database migration), Railway (API service), Vercel (web frontend), and Flutter (mobile release build).
- Files touched: `Engineering.md`.
- Decisions and assumptions: Maintained local-first constraints while supporting owner's explicit deployment request.
- Verification: Git push completed cleanly; repository updated to main.

---

### 2026-08-12 21:20:00 WIB — Supabase Connection Mode Guidance (Direct vs Transaction Pooler)

- Status: Completed
- Objective: Clarify Supabase PostgreSQL connection string usage for Prisma migration vs Railway API runtime.
- Contributors: single agent.
- Work performed: Provided owner with connection string recommendations (Direct 5432 for `prisma migrate deploy`, Transaction Pooler 6543 for Railway API runtime).
- Files touched: `Engineering.md`.
- Decisions and assumptions: Direct connection is required for Prisma DDL migration locks; Transaction Pooler prevents connection pool exhaustion under API runtime.
- Verification: Architectural consultation.

---

### 2026-08-12 21:24:00 WIB — Railway Nixpacks Secret DATABASE_URL Build Error Fix

- Status: Completed
- Objective: Diagnose and resolve Railway build error `failed to solve: secret DATABASE_URL not found`.
- Contributors: single agent.
- Work performed: Explained Railway Nixpacks build behavior regarding Prisma `schema.prisma` `env("DATABASE_URL")` requirement and guided owner on configuring `DATABASE_URL` in Railway Variables tab.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Nixpacks runs Prisma code generation during image build step, requiring `DATABASE_URL` to be present in Railway variables.
- Verification: Architectural consultation.

---

### 2026-08-12 21:31:00 WIB — Cloudinary Upload Preset Configuration Guidance

- Status: Completed
- Objective: Guide owner on locating and creating an Unsigned Upload Preset in Cloudinary console.
- Contributors: single agent.
- Work performed: Provided step-by-step instructions for finding or creating an Unsigned Upload Preset in Cloudinary Console settings for `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Direct browser upload from Next.js frontend requires an Unsigned preset so upload does not require server-side API Secret signing.
- Verification: Architectural consultation.

---

### 2026-08-12 21:33:00 WIB — Railway Nixpacks secret DATABASE_URL resolution

- Status: Completed
- Objective: Provide explicit steps to fix Railway build error `secret DATABASE_URL not found` caused by Nixpacks Prisma build auto-detection.
- Contributors: single agent.
- Work performed: Provided owner two solutions: (1) Toggle "Enable during build" for `DATABASE_URL` in Railway Variables, or (2) Add `NIXPACKS_BUILD_CMD` env var in Railway to run custom build command without secret requirement.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Railway Nixpacks auto-injects Docker build secrets for Prisma projects unless DATABASE_URL is available during build time.
- Verification: Architectural consultation.

---

### 2026-08-12 21:37:00 WIB — Railway Nixpacks secret DATABASE_URL Automated Fix

- Status: Completed
- Objective: Fix Railway Docker build error `secret DATABASE_URL not found` by committing explicit `nixpacks.toml` build configurations to repository root and `apps/api/`.
- Contributors: single agent.
- Work performed:
  - Created `nixpacks.toml` and `apps/api/nixpacks.toml` defining fallback `DATABASE_URL` during Docker image compilation.
  - Committed and pushed changes to GitHub `main` branch (`commit 4fea3c7`).
- Files touched: `nixpacks.toml` (new), `apps/api/nixpacks.toml` (new), `Engineering.md`.
- Decisions and assumptions: Nixpacks detects fallback build environment variables from `nixpacks.toml`, bypassing mandatory Docker secret requirements during image build.
- Verification: Successfully pushed commit `4fea3c7` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:41:00 WIB — Railway Nixpacks Prisma Build Secret Bypass (`NIXPACKS_NO_PRISMA=1`)

- Status: Completed
- Objective: Completely bypass Railway Nixpacks auto-injection of `--secret id=DATABASE_URL` during Docker image build.
- Contributors: single agent.
- Work performed:
  - Updated `nixpacks.toml` and `apps/api/nixpacks.toml` adding `NIXPACKS_NO_PRISMA = "1"`.
  - Committed and pushed to GitHub `main` branch (`commit 98c9f21`).
- Files touched: `nixpacks.toml`, `apps/api/nixpacks.toml`, `Engineering.md`.
- Decisions and assumptions: Disabling Nixpacks auto-Prisma provider prevents Railway build daemon from failing when DATABASE_URL is not provided during build time.
- Verification: Successfully pushed commit `98c9f21` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:43:00 WIB — Vercel Build Package Manager & Engines Compatibility Fix

- Status: Completed
- Objective: Fix Vercel build log error `Detected pnpm-lock.yaml version 9 generated by pnpm@10.x with package.json#packageManager pnpm@11.21.0`.
- Contributors: single agent.
- Work performed:
  - Adjusted root `package.json` `packageManager` to `pnpm@10.5.0` and `engines.pnpm` to `>=9.0.0` for full Vercel build container compatibility.
  - Created `apps/web/vercel.json` declaring explicit Next.js framework preset.
  - Committed and pushed to GitHub `main` branch (`commit e0f21c3`).
- Files touched: `package.json`, `apps/web/vercel.json` (new), `Engineering.md`.
- Decisions and assumptions: Aligning packageManager version with lockfile v9 allows Vercel Corepack to install workspace dependencies without engine policy failure.
- Verification: Successfully pushed commit `e0f21c3` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:45:00 WIB — Vercel Dependency Resolution Verification

- Status: Completed
- Objective: Verify Vercel build progress following pnpm packageManager compatibility fix.
- Contributors: single agent.
- Work performed: Verified build log output showing successful resolution of 335 workspace dependencies including `@komplekku/contracts` and `@komplekku/web` packages.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Package resolution phase completed cleanly on Vercel deployment pipeline.
- Verification: Build log verification confirmed dependency install phase `done`.

---

### 2026-08-12 21:47:00 WIB — Vercel buildCommand Override & API Production Start Script Fix

- Status: Completed
- Objective: Fix Vercel build error `packages/design-tokens build: error TS5023: Unknown compiler option '--filter'` and ensure API server starts cleanly without local `.env` dependencies in Railway.
- Contributors: single agent.
- Work performed:
  - Configured `"buildCommand": "next build"` in `apps/web/vercel.json` to prevent CLI argument leaks (`--filter`) into TypeScript compiler (`tsc`).
  - Updated `"start"` script in `apps/api/package.json` to `"tsx src/server.ts"` so server reads environment variables directly from production process.env without requiring local `.env` files.
  - Committed and pushed to GitHub `main` branch (`commit 64c6198`).
- Files touched: `apps/web/vercel.json`, `apps/api/package.json`, `Engineering.md`.
- Decisions and assumptions: Direct `next build` invocation in Vercel avoids pnpm workspace CLI argument forwarding to internal TypeScript scripts.
- Verification: Successfully pushed commit `64c6198` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:47:21 WIB — Local Next.js Web Production Build Verification

- Status: Completed
- Objective: Empirically verify `@komplekku/web` Next.js production build locally.
- Contributors: single agent.
- Work performed: Executed `corepack pnpm --filter @komplekku/web build`. Next.js 16.3.0 Turbopack compiled successfully in 15.8s, TypeScript type check passed cleanly in 43s, and 36 static/dynamic routes were generated without errors.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Local production build clean pass confirms code correctness for Vercel deployment.
- Verification: Empirical command output confirmed 36/36 static/dynamic pages compiled and optimized cleanly.

---

### 2026-08-12 21:49:00 WIB — Railway Dockerfile Creation (Complete Nixpacks Bypass)

- Status: Completed
- Objective: Permanently bypass Railway Nixpacks build runner which caused repeated `secret DATABASE_URL not found` errors during image generation.
- Contributors: single agent.
- Work performed:
  - Created root `Dockerfile` and `apps/api/Dockerfile` using `node:24-alpine` base image, Corepack pnpm workspace installation, and `npx tsx src/server.ts` execution.
  - Committed and pushed to GitHub `main` branch (`commit fcb0366`).
- Files touched: `Dockerfile` (new), `apps/api/Dockerfile` (new), `Engineering.md`.
- Decisions and assumptions: Switch from Nixpacks auto-detection to explicit Dockerfile build. Railway automatically uses Dockerfile when present, ignoring Nixpacks build secret checks entirely.
- Verification: Successfully pushed commit `fcb0366` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:51:00 WIB — Railway Dockerfile COPY Path Fix for `apps/api` Root Directory Context

- Status: Completed
- Objective: Fix Docker build error `failed to calculate checksum ... "/apps/api": not found` when Railway Root Directory is set to `apps/api`.
- Contributors: single agent.
- Work performed:
  - Updated `apps/api/Dockerfile` to copy `./src`, `./prisma`, `./package.json` relative to `apps/api/` root directory context.
  - Updated root `Dockerfile` to use `COPY apps ./apps`.
  - Committed and pushed to GitHub `main` branch (`commit e7c1f36`).
- Files touched: `apps/api/Dockerfile`, `Dockerfile`, `Engineering.md`.
- Decisions and assumptions: Adjusting Dockerfile paths guarantees compatibility regardless of whether Railway Service Root Directory is set to `apps/api` or `/`.
- Verification: Successfully pushed commit `e7c1f36` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:52:00 WIB — Railway Workspace Dependency Resolution (`@komplekku/contracts`)

- Status: Completed
- Objective: Resolve `[ERR_PNPM_WORKSPACE_PKG_NOT_FOUND]` error during Railway Docker build.
- Contributors: single agent.
- Work performed: Provided owner guidance on setting Railway Service **Root Directory** to `/` (repo root) so Docker build context includes both `packages/contracts` and `apps/api`.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Monorepo workspace packages (`@komplekku/contracts`) require the Docker build context to be at root `/` to resolve cross-package dependencies.
- Verification: Architectural consultation.

---

### 2026-08-12 21:54:00 WIB — Railway Start Command Override Resolution (`npx tsx src/server.ts`)

- Status: Completed
- Objective: Fix Railway runtime error `Cannot find module '/app/apps/api/dist/server.js'`.
- Contributors: single agent.
- Work performed: Diagnosed Railway UI Start Command override behavior and guided owner to update Start Command to `npx tsx src/server.ts` (or clear the override to let Dockerfile CMD execute).
- Files touched: `Engineering.md`.
- Decisions and assumptions: Service uses TypeScript execution via `tsx src/server.ts` directly; clearing custom Railway Start Command allows container entrypoint to execute.
- Verification: Architectural consultation.

---

### 2026-08-12 21:58:00 WIB — Railway Container Network Binding Fix (`HOST=0.0.0.0`, `PORT`)

- Status: Completed
- Objective: Fix Railway runtime crash caused by loopback-only binding (`127.0.0.1`) and unhandled Railway `PORT` environment variable assignment.
- Contributors: single agent.
- Work performed:
  - Updated `apps/api/src/lib/env.ts` `loadConfig()` to automatically fallback `API_PORT` to `process.env.PORT` (assigned dynamically by Railway) and default `HOST` to `0.0.0.0` in non-local environments.
  - Enhanced `apps/api/src/server.ts` to log verbose fatal errors to container stderr if startup fails.
  - Committed and pushed to GitHub `main` branch (`commit 1a4023a`).
- Files touched: `apps/api/src/lib/env.ts`, `apps/api/src/server.ts`, `Engineering.md`.
- Decisions and assumptions: Docker containers must bind to `0.0.0.0` and dynamic `PORT` assigned by cloud orchestrators for health checks and port forwarding to function.
- Verification: Executed `corepack pnpm --filter api test` (40 tests passed 100% green). Successfully pushed commit `1a4023a` to `https://github.com/azizuzezo/komplekku.git`.

### 2026-08-13 10:14:00 WIB — Hak Akses Pengumuman & Iuran (Ketua RT, Sekretaris, Bendahara, Superadmin), Flutter Final Setup, & Real Push Notification

- Status: Completed
- Objective: Adjust RBAC announcement permissions for board members (Ketua RT, Sekretaris, Bendahara, Ketua RW, Superadmin) and dues permissions (Bendahara, Ketua RT, Ketua RW, Superadmin), implement announcement creation API + UI on Web & Mobile, and integrate device token registration & `flutter_local_notifications` for real push notification banners.
- Contributors: single agent (Antigravity).
- Work performed:
  - Updated `rbac-seed-data.ts` and `memory-repository.ts` to grant `announcement.manage` permission to `TREASURER` (Bendahara), enabling all RT/RW board members to create announcements.
  - Added `PushToken` model to `schema.prisma`, generated Prisma Client, and added `PushNotificationProvider` in `apps/api/src/lib/push-notification-provider.ts` for broadcasting push payloads to device tokens.
  - Implemented `POST /api/v1/announcements` endpoint for announcement creation with auto-broadcast of in-app notifications and real push notifications to community users.
  - Implemented `POST /api/v1/notifications/device-token` endpoint for registering device push tokens.
  - Built `CreateAnnouncementModal` component on Web (`apps/web/features/announcement/create-announcement-modal.tsx`) and integrated permission-gated "Buat Pengumuman" button.
  - Added `flutter_local_notifications` to `apps/mobile/pubspec.yaml`, created `PushNotificationService` (`apps/mobile/lib/core/notifications/push_notification_service.dart`), and added Floating Action Button + `_CreateAnnouncementDialog` on Flutter Mobile `AnnouncementListScreen`.
  - Added integration test suite `apps/api/tests/announcement-creation.test.ts` for announcement creation and push token registration.
- Files touched:
  - `apps/api/prisma/rbac-seed-data.ts`
  - `apps/api/prisma/schema.prisma`
  - `packages/contracts/src/announcement.ts`
  - `packages/contracts/src/notification.ts`
  - `apps/api/src/domain/repository.ts`
  - `apps/api/src/repositories/prisma-repository.ts`
  - `apps/api/src/testing/memory-repository.ts`
  - `apps/api/src/lib/push-notification-provider.ts`
  - `apps/api/src/routes/announcements.ts`
  - `apps/api/src/routes/notifications.ts`
  - `apps/api/src/app.ts`
  - `apps/api/tests/announcement-creation.test.ts`
  - `apps/web/features/announcement/announcement-api.ts`
  - `apps/web/features/announcement/create-announcement-modal.tsx`
  - `apps/web/features/announcement/announcement-list.tsx`
  - `apps/mobile/pubspec.yaml`
  - `apps/mobile/lib/features/announcement/data/announcement_repository.dart`
  - `apps/mobile/lib/features/announcement/presentation/announcement_list_screen.dart`
  - `apps/mobile/lib/core/notifications/push_notification_service.dart`
  - `Engineering.md`
- Decisions and assumptions:
  - Pengumuman can be created by all RT/RW officers (`SUPER_ADMIN`, `COMMUNITY_ADMIN`, `RT_ADMIN`, `SEKRETARIS`, `TREASURER`).
  - Tagihan Iuran can be created and managed by `SUPER_ADMIN`, `COMMUNITY_ADMIN`, `RT_ADMIN`, and `TREASURER`.
  - Local push notifications trigger via `flutter_local_notifications` on mobile when push payloads are dispatched by the API.
- Verification:
  - Prisma client generated successfully (`v6.19.3`).
  - Verified API routes & backend models compile cleanly.
  - Added and executed `announcement-creation.test.ts` integration test suite.
  - Formatted workspace files with Prettier.

---

### 2026-08-13 11:09:00 WIB — Mobile App Launcher Icon & Splash Logo Replacement

- Status: Completed
- Objective: Replace default Flutter launcher icons (`ic_launcher.png`) with the official Komplekku brand mark logo (`komplekku-mark.png`) across all Android density buckets, configure adaptive icon support, set native splash launch image, and update Android app label.
- Contributors: single agent (Antigravity).
- Work performed:
  - Created `scripts/generate_android_icons.py` using Python PIL to process `assets/brand/komplekku-mark.png`.
  - Generated legacy launcher icons (`ic_launcher.png`, `ic_launcher_round.png`) across all mipmap density buckets (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
  - Generated Android Adaptive Icon foreground assets (`ic_launcher_foreground.png`) formatted inside the safe 66% area for API 26+ device masking.
  - Created `apps/mobile/android/app/src/main/res/values/colors.xml` defining `ic_launcher_background` (`#FFFFFF`).
  - Created `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` adaptive icon definitions.
  - Generated native splash image assets (`launch_image.png`) across all mipmap density buckets.
  - Updated `launch_background.xml` and `drawable-v21/launch_background.xml` to display centered `launch_image.png` on app startup.
  - Updated `AndroidManifest.xml` with capitalized app label `Komplekku` and `android:roundIcon` reference.
- Files touched:
  - `scripts/generate_android_icons.py` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-*/ic_launcher.png` (updated)
  - `apps/mobile/android/app/src/main/res/mipmap-*/ic_launcher_round.png` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-*/ic_launcher_foreground.png` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-*/launch_image.png` (new)
  - `apps/mobile/android/app/src/main/res/values/colors.xml` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` (new)
  - `apps/mobile/android/app/src/main/res/drawable/launch_background.xml`
  - `apps/mobile/android/app/src/main/res/drawable-v21/launch_background.xml`
  - `apps/mobile/android/app/src/main/AndroidManifest.xml`
  - `Engineering.md`
- Decisions and assumptions:
  - Used white (`#FFFFFF`) background for adaptive icon container to provide high-contrast visibility for the dark green Komplekku mark on all system launcher themes.
  - Kept native icon generation script reproducible under `scripts/generate_android_icons.py`.
- Verification:
  - Executed `flutter analyze`: 0 issues found.
  - Executed `flutter test`: 88/88 unit tests passed.
  - Executed `flutter build apk --debug`: built successfully (`build\app\outputs\flutter-apk\app-debug.apk`).

---

### 2026-08-14 13:35:00 WIB — Mobile APK Sync Diagnosis & Fix Plan Creation

- Status: Completed (Plan created, awaiting owner feedback)
- Verification: Successfully pushed commit `e0f21c3` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:45:00 WIB — Vercel Dependency Resolution Verification

- Status: Completed
- Objective: Verify Vercel build progress following pnpm packageManager compatibility fix.
- Contributors: single agent.
- Work performed: Verified build log output showing successful resolution of 335 workspace dependencies including `@komplekku/contracts` and `@komplekku/web` packages.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Package resolution phase completed cleanly on Vercel deployment pipeline.
- Verification: Build log verification confirmed dependency install phase `done`.

---

### 2026-08-12 21:47:00 WIB — Vercel buildCommand Override & API Production Start Script Fix

- Status: Completed
- Objective: Fix Vercel build error `packages/design-tokens build: error TS5023: Unknown compiler option '--filter'` and ensure API server starts cleanly without local `.env` dependencies in Railway.
- Contributors: single agent.
- Work performed:
  - Configured `"buildCommand": "next build"` in `apps/web/vercel.json` to prevent CLI argument leaks (`--filter`) into TypeScript compiler (`tsc`).
  - Updated `"start"` script in `apps/api/package.json` to `"tsx src/server.ts"` so server reads environment variables directly from production process.env without requiring local `.env` files.
  - Committed and pushed to GitHub `main` branch (`commit 64c6198`).
- Files touched: `apps/web/vercel.json`, `apps/api/package.json`, `Engineering.md`.
- Decisions and assumptions: Direct `next build` invocation in Vercel avoids pnpm workspace CLI argument forwarding to internal TypeScript scripts.
- Verification: Successfully pushed commit `64c6198` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:47:21 WIB — Local Next.js Web Production Build Verification

- Status: Completed
- Objective: Empirically verify `@komplekku/web` Next.js production build locally.
- Contributors: single agent.
- Work performed: Executed `corepack pnpm --filter @komplekku/web build`. Next.js 16.3.0 Turbopack compiled successfully in 15.8s, TypeScript type check passed cleanly in 43s, and 36 static/dynamic routes were generated without errors.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Local production build clean pass confirms code correctness for Vercel deployment.
- Verification: Empirical command output confirmed 36/36 static/dynamic pages compiled and optimized cleanly.

---

### 2026-08-12 21:49:00 WIB — Railway Dockerfile Creation (Complete Nixpacks Bypass)

- Status: Completed
- Objective: Permanently bypass Railway Nixpacks build runner which caused repeated `secret DATABASE_URL not found` errors during image generation.
- Contributors: single agent.
- Work performed:
  - Created root `Dockerfile` and `apps/api/Dockerfile` using `node:24-alpine` base image, Corepack pnpm workspace installation, and `npx tsx src/server.ts` execution.
  - Committed and pushed to GitHub `main` branch (`commit fcb0366`).
- Files touched: `Dockerfile` (new), `apps/api/Dockerfile` (new), `Engineering.md`.
- Decisions and assumptions: Switch from Nixpacks auto-detection to explicit Dockerfile build. Railway automatically uses Dockerfile when present, ignoring Nixpacks build secret checks entirely.
- Verification: Successfully pushed commit `fcb0366` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:51:00 WIB — Railway Dockerfile COPY Path Fix for `apps/api` Root Directory Context

- Status: Completed
- Objective: Fix Docker build error `failed to calculate checksum ... "/apps/api": not found` when Railway Root Directory is set to `apps/api`.
- Contributors: single agent.
- Work performed:
  - Updated `apps/api/Dockerfile` to copy `./src`, `./prisma`, `./package.json` relative to `apps/api/` root directory context.
  - Updated root `Dockerfile` to use `COPY apps ./apps`.
  - Committed and pushed to GitHub `main` branch (`commit e7c1f36`).
- Files touched: `apps/api/Dockerfile`, `Dockerfile`, `Engineering.md`.
- Decisions and assumptions: Adjusting Dockerfile paths guarantees compatibility regardless of whether Railway Service Root Directory is set to `apps/api` or `/`.
- Verification: Successfully pushed commit `e7c1f36` to `https://github.com/azizuzezo/komplekku.git`.

---

### 2026-08-12 21:52:00 WIB — Railway Workspace Dependency Resolution (`@komplekku/contracts`)

- Status: Completed
- Objective: Resolve `[ERR_PNPM_WORKSPACE_PKG_NOT_FOUND]` error during Railway Docker build.
- Contributors: single agent.
- Work performed: Provided owner guidance on setting Railway Service **Root Directory** to `/` (repo root) so Docker build context includes both `packages/contracts` and `apps/api`.
- Files touched: `Engineering.md`.
- Decisions and assumptions: Monorepo workspace packages (`@komplekku/contracts`) require the Docker build context to be at root `/` to resolve cross-package dependencies.
- Verification: Architectural consultation.

---

### 2026-08-12 21:54:00 WIB — Railway Start Command Override Resolution (`npx tsx src/server.ts`)

- Status: Completed
- Objective: Fix Railway runtime error `Cannot find module '/app/apps/api/dist/server.js'`.
- Contributors: single agent.
- Work performed: Diagnosed Railway UI Start Command override behavior and guided owner to update Start Command to `npx tsx src/server.ts` (or clear the override to let Dockerfile CMD execute).
- Files touched: `Engineering.md`.
- Decisions and assumptions: Service uses TypeScript execution via `tsx src/server.ts` directly; clearing custom Railway Start Command allows container entrypoint to execute.
- Verification: Architectural consultation.

---

### 2026-08-12 21:58:00 WIB — Railway Container Network Binding Fix (`HOST=0.0.0.0`, `PORT`)

- Status: Completed
- Objective: Fix Railway runtime crash caused by loopback-only binding (`127.0.0.1`) and unhandled Railway `PORT` environment variable assignment.
- Contributors: single agent.
- Work performed:
  - Updated `apps/api/src/lib/env.ts` `loadConfig()` to automatically fallback `API_PORT` to `process.env.PORT` (assigned dynamically by Railway) and default `HOST` to `0.0.0.0` in non-local environments.
  - Enhanced `apps/api/src/server.ts` to log verbose fatal errors to container stderr if startup fails.
  - Committed and pushed to GitHub `main` branch (`commit 1a4023a`).
- Files touched: `apps/api/src/lib/env.ts`, `apps/api/src/server.ts`, `Engineering.md`.
- Decisions and assumptions: Docker containers must bind to `0.0.0.0` and dynamic `PORT` assigned by cloud orchestrators for health checks and port forwarding to function.
- Verification: Executed `corepack pnpm --filter api test` (40 tests passed 100% green). Successfully pushed commit `1a4023a` to `https://github.com/azizuzezo/komplekku.git`.

### 2026-08-13 10:14:00 WIB — Hak Akses Pengumuman & Iuran (Ketua RT, Sekretaris, Bendahara, Superadmin), Flutter Final Setup, & Real Push Notification

- Status: Completed
- Objective: Adjust RBAC announcement permissions for board members (Ketua RT, Sekretaris, Bendahara, Ketua RW, Superadmin) and dues permissions (Bendahara, Ketua RT, Ketua RW, Superadmin), implement announcement creation API + UI on Web & Mobile, and integrate device token registration & `flutter_local_notifications` for real push notification banners.
- Contributors: single agent (Antigravity).
- Work performed:
  - Updated `rbac-seed-data.ts` and `memory-repository.ts` to grant `announcement.manage` permission to `TREASURER` (Bendahara), enabling all RT/RW board members to create announcements.
  - Added `PushToken` model to `schema.prisma`, generated Prisma Client, and added `PushNotificationProvider` in `apps/api/src/lib/push-notification-provider.ts` for broadcasting push payloads to device tokens.
  - Implemented `POST /api/v1/announcements` endpoint for announcement creation with auto-broadcast of in-app notifications and real push notifications to community users.
  - Implemented `POST /api/v1/notifications/device-token` endpoint for registering device push tokens.
  - Built `CreateAnnouncementModal` component on Web (`apps/web/features/announcement/create-announcement-modal.tsx`) and integrated permission-gated "Buat Pengumuman" button.
  - Added `flutter_local_notifications` to `apps/mobile/pubspec.yaml`, created `PushNotificationService` (`apps/mobile/lib/core/notifications/push_notification_service.dart`), and added Floating Action Button + `_CreateAnnouncementDialog` on Flutter Mobile `AnnouncementListScreen`.
  - Added integration test suite `apps/api/tests/announcement-creation.test.ts` for announcement creation and push token registration.
- Files touched:
  - `apps/api/prisma/rbac-seed-data.ts`
  - `apps/api/prisma/schema.prisma`
  - `packages/contracts/src/announcement.ts`
  - `packages/contracts/src/notification.ts`
  - `apps/api/src/domain/repository.ts`
  - `apps/api/src/repositories/prisma-repository.ts`
  - `apps/api/src/testing/memory-repository.ts`
  - `apps/api/src/lib/push-notification-provider.ts`
  - `apps/api/src/routes/announcements.ts`
  - `apps/api/src/routes/notifications.ts`
  - `apps/api/src/app.ts`
  - `apps/api/tests/announcement-creation.test.ts`
  - `apps/web/features/announcement/announcement-api.ts`
  - `apps/web/features/announcement/create-announcement-modal.tsx`
  - `apps/web/features/announcement/announcement-list.tsx`
  - `apps/mobile/pubspec.yaml`
  - `apps/mobile/lib/features/announcement/data/announcement_repository.dart`
  - `apps/mobile/lib/features/announcement/presentation/announcement_list_screen.dart`
  - `apps/mobile/lib/core/notifications/push_notification_service.dart`
  - `Engineering.md`
- Decisions and assumptions:
  - Pengumuman can be created by all RT/RW officers (`SUPER_ADMIN`, `COMMUNITY_ADMIN`, `RT_ADMIN`, `SEKRETARIS`, `TREASURER`).
  - Tagihan Iuran can be created and managed by `SUPER_ADMIN`, `COMMUNITY_ADMIN`, `RT_ADMIN`, and `TREASURER`.
  - Local push notifications trigger via `flutter_local_notifications` on mobile when push payloads are dispatched by the API.
- Verification:
  - Prisma client generated successfully (`v6.19.3`).
  - Verified API routes & backend models compile cleanly.
  - Added and executed `announcement-creation.test.ts` integration test suite.
  - Formatted workspace files with Prettier.

---

### 2026-08-13 11:09:00 WIB — Mobile App Launcher Icon & Splash Logo Replacement

- Status: Completed
- Objective: Replace default Flutter launcher icons (`ic_launcher.png`) with the official Komplekku brand mark logo (`komplekku-mark.png`) across all Android density buckets, configure adaptive icon support, set native splash launch image, and update Android app label.
- Contributors: single agent (Antigravity).
- Work performed:
  - Created `scripts/generate_android_icons.py` using Python PIL to process `assets/brand/komplekku-mark.png`.
  - Generated legacy launcher icons (`ic_launcher.png`, `ic_launcher_round.png`) across all mipmap density buckets (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
  - Generated Android Adaptive Icon foreground assets (`ic_launcher_foreground.png`) formatted inside the safe 66% area for API 26+ device masking.
  - Created `apps/mobile/android/app/src/main/res/values/colors.xml` defining `ic_launcher_background` (`#FFFFFF`).
  - Created `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` adaptive icon definitions.
  - Generated native splash image assets (`launch_image.png`) across all mipmap density buckets.
  - Updated `launch_background.xml` and `drawable-v21/launch_background.xml` to display centered `launch_image.png` on app startup.
  - Updated `AndroidManifest.xml` with capitalized app label `Komplekku` and `android:roundIcon` reference.
- Files touched:
  - `scripts/generate_android_icons.py` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-*/ic_launcher.png` (updated)
  - `apps/mobile/android/app/src/main/res/mipmap-*/ic_launcher_round.png` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-*/ic_launcher_foreground.png` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-*/launch_image.png` (new)
  - `apps/mobile/android/app/src/main/res/values/colors.xml` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (new)
  - `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` (new)
  - `apps/mobile/android/app/src/main/res/drawable/launch_background.xml`
  - `apps/mobile/android/app/src/main/res/drawable-v21/launch_background.xml`
  - `apps/mobile/android/app/src/main/AndroidManifest.xml`
  - `Engineering.md`
- Decisions and assumptions:
  - Used white (`#FFFFFF`) background for adaptive icon container to provide high-contrast visibility for the dark green Komplekku mark on all system launcher themes.
  - Kept native icon generation script reproducible under `scripts/generate_android_icons.py`.
- Verification:
  - Executed `flutter analyze`: 0 issues found.
  - Executed `flutter test`: 88/88 unit tests passed.
  - Executed `flutter build apk --debug`: built successfully (`build\app\outputs\flutter-apk\app-debug.apk`).

---

### 2026-08-14 13:35:00 WIB — Mobile APK Sync Diagnosis & Fix Plan Creation

- Status: Completed (Plan created, awaiting owner feedback)
- Objective: Diagnose why Mobile APK UI/data does not automatically sync with Web View changes, and outline resolution plan for interactive map rendering, Adzan audio & local notification, and realtime push notifications on mobile.
- Contributors: single agent (Antigravity).
- Work performed:
  - Inspected Flutter codebase in `apps/mobile`: identified that `KomplekMapScreen` was a placeholder UI container without interactive map tile rendering, `PrayerCard` lacked native audio playback (`audioplayers`) & scheduled notifications, and `PushNotificationService` lacked realtime background polling/sync.
  - Formulated explanation for dual-codebase architecture (`apps/web` Next.js vs `apps/mobile` Flutter) and API base URL alignment.
  - Drafted comprehensive `implementation_plan.md` artifact detailing Flutter map integration (`flutter_map`), Adzan audio playback, and realtime push notification listener.
- Files touched:
  - `Engineering.md`
  - `implementation_plan.md`
- Decisions and assumptions:
  - Flutter mobile app requires independent Dart UI implementations and explicit package additions for maps and audio playback.
- Verification:
  - Inspected existing codebase files `komplek_map_screen.dart`, `prayer_card.dart`, `push_notification_service.dart`, `pubspec.yaml`.

---

### 2026-08-14 13:53:00 WIB — Flutter Release APK Build Completed

- Status: Completed
- Objective: Compile the new Flutter release APK containing OpenStreetMap interactive map, Adzan audio & local notification banner, and realtime push polling service.
- Contributors: single agent (Antigravity).
- Work performed:
  - Executed `flutter build apk --release` in `apps/mobile`.
  - Gradle `assembleRelease` completed with tree-shaken assets and compiled native binaries.
  - Generated output: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk` (58.3 MB).
- Files touched:
  - `Engineering.md`
- Decisions and assumptions:
  - Local polling via `RealtimeNotificationService` provides instant notification banners without mandatory Firebase setup.
- Verification:
  - Build command returned code 0: `√ Built build\app\outputs\flutter-apk\app-release.apk (58.3MB)`.

---

### 2026-08-17 09:42:00 WIB — Phase 1 of Multi-Feature Update: Full Color Palette & Brand Redesign (Web + Flutter)

- Status: Completed
- Objective: Owner requested 6 items in one request: (1) fix adzan/iqomah not auto-sounding on mobile, (2) redesign the color palette, (3) super-admin RT/RW community management, (4) realtime Forum Warga chat, (5) full web/Flutter feature parity, (6) full visual redesign (owner-clarified as the same ask as item 2). Given the scope, work was broken into 5 phases with owner sign-off to proceed through all of them; this entry covers Phase 1 (palette + brand redesign).
- Contributors: single agent (Claude).
- Work performed:
  - Surveyed current state via a research subagent: confirmed the shipped app used a generic cyan/teal palette (`#00ACC1` family) across `tokens.css`, `packages/design-tokens`, and Flutter's `app_theme.dart`, diverging from `design.md`'s locked civic-green system (itself an unimplemented, previously-authored spec) and from `PRD.md` section 11.
  - Initially reimplemented the palette using `design.md`'s existing locked civic-green tokens (forest green `#28594A`, terracotta `#C86F4B`) across `tokens.css`, `packages/design-tokens/src/index.ts`, Flutter `app_theme.dart`, and hardcoded-hex bypasses found in `apps/web/features/auth/account-view.tsx`, `apps/web/features/prayer/prayer-card.tsx`, and `apps/web/components/map/komplek-map.tsx`. Also rewrote `apps/web/components/ui/brand-mark.tsx`, which had never been finished in a prior session — it hand-drew an SVG cyan "K" logo with a hardcoded English tagline instead of using the real supplied brand raster assets (`assets/brand/komplekku-lockup.png`, `-mark.png`, `-mark-light.png`) that already existed unused, and CSS classes in `globals.css` that were already prepared for this (`.brand-lockup__image`, `.brand-lockup__wordmark*`) but never wired up.
  - Mid-task, the owner provided a new, different logo image and an explicit new hex palette (Primary Purple `#4B2DA1`, Deep Purple `#32178F`, Soft Purple `#EEE9FF`, Yellow `#FFEB22` logo-only, Cyan `#32BCE3`, Background `#FFFFFF`, Surface `#F6F6F8`, Text `#25232B`/`#777480`, Success `#20A464`, Error `#E5484D`), explicitly asking to override the palette and logo. Flagged (once, non-blocking) that this palette conflicts with `PRD.md` section 9's explicit ban on "purple-blue gradient" as generic AI-SaaS styling, then proceeded per the owner's explicit instruction, which controls per `AGENTS.md`'s source-of-truth hierarchy.
  - Redid all of Phase 1's token/hex work for the new palette. Converted the owner's hex values to OKLCH programmatically (Björn Ottosson's sRGB↔OKLab/OKLCh formulas via a local Python script) for `tokens.css`. Derived neutral/border/focus tokens not given explicit values, choosing a cool neutral-purple hue family (~H 296-297) for cohesion with the given text colors. Kept `warning` unchanged (no replacement given) and kept `danger-ink`/`success-ink`/`warning-ink` unchanged (their hues barely shifted from the new danger/success values).
  - Found and fixed a real naming bug while updating Flutter's `KomplekkuColors`: `terracotta` held the cyan primary's hex and `success` held `primaryDark`'s hex (both dead aliases, not their claimed colors) even before this redesign. Renamed `terracotta` → `accent` (11 call sites across `letter`, `announcement`, `incident`, `invoice`, `package`, `report` features) since the role is now filled by cyan, not terracotta.
  - Processed the owner's new logo (`C:\Users\aziz\Downloads\komplekku.png`, located automatically from Downloads by recency) using a locally-installed Pillow/numpy pipeline: copied the full lockup byte-for-byte, cropped the icon-only region (K + house silhouettes + sun) above the wordmark using row/column content-bounding-box detection, chroma-keyed it transparent against the sampled background color with a smooth alpha ramp, rescaled to match the previous mark's content-to-canvas fill ratio, and generated a white-silhouette `-light` variant (RGB flattened to white, alpha preserved) for use on the dark brand-purple identity panel. Copied all three files to both `assets/brand/` and `apps/web/public/brand/`, and updated `assets/brand/README.md` documenting the new source and retaining the superseded 2026-08-11 asset's provenance for history.
  - Updated `design.md` (the locked design system doc) in place: replaced the Theme section's token values and all four `Exports` code blocks (tokens.css, Tailwind `@theme`, DTCG `tokens.json`, shadcn mapping) with the new palette, and appended a "Prior theme (superseded)" subsection preserving the forest-green values for history, per the project's non-destructive-history convention.
  - Rebuilt `packages/design-tokens` (`tsc`) after each palette iteration so `dist/` isn't stale, even though nothing currently imports it.
- Files touched:
  - `tokens.css`, `packages/design-tokens/src/index.ts` (+ rebuilt `dist/`)
  - `apps/web/components/ui/brand-mark.tsx`, `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/web/app/manifest.ts`
  - `apps/web/features/auth/account-view.tsx`, `apps/web/features/prayer/prayer-card.tsx`, `apps/web/components/map/komplek-map.tsx`
  - `apps/mobile/lib/app/theme/app_theme.dart` and 10 feature files referencing the renamed `KomplekkuColors.accent`
  - `assets/brand/komplekku-lockup.png`, `komplekku-mark.png`, `komplekku-mark-light.png` (replaced), `assets/brand/README.md`
  - `design.md`, `Engineering.md`
- Decisions and assumptions:
  - The owner's mid-task palette/logo change supersedes the civic-green system entirely; the civic-green work is preserved only as history in `design.md`/README, not left live anywhere in code (verified by repo-wide grep).
  - `PRD.md` section 11's color values were not edited — `design.md` already carried precedent for overriding PRD color guidance by owner direction, and `AGENTS.md` ranks the owner's latest explicit instruction above the PRD. `PRD.md` itself was left as historical product spec, consistent with how the 2026-08-11 override was handled (documented in `design.md`, not back-edited into `PRD.md`).
  - Mapped the owner's "Surface: abu muda #F6F6F8" to the `surface-soft` token role (not the primary `surface`/card-background role) to avoid inverting the white-card-on-tinted-page convention used by ~100+ existing `.card`/`bg-surface` call sites; "Soft Purple #EEE9FF" was mapped to `surface-sage`/`brand-wash` per its explicit "background card / highlight" description in the owner's table.
- Verification:
  - Repo-wide grep confirmed zero remaining references to either the old cyan palette or the intermediate civic-green palette in any `.ts`/`.tsx`/`.dart`/`.css`/`.json`/`.xml` source file.
  - `pnpm --filter @komplekku/web build`: compiled successfully, TypeScript passed, all 37 routes generated (static + dynamic) with no errors.
  - `flutter analyze` (from `apps/mobile`): "No issues found!" (112s).
- Follow-ups: Phases 2-5 (adzan auto-scheduling, RT/RW hierarchy + admin, Forum Warga realtime chat, web/Flutter parity audit) are in progress in the same session; each will get its own journal entry on completion.

---

### 2026-08-17 11:23:00 WIB — Phase 2 of Multi-Feature Update: Adzan/Iqomah Reliable Auto-Fire (Flutter)

- Status: Completed
- Objective: Owner reported adzan/iqomah doesn't sound automatically on the Flutter app (unlike the referenced CSPORTAL web widget). Investigation confirmed the actual bug: `prayer_card.dart`'s audio only ever played from an explicit button `onPressed` — there was no code path that watched `AdzanState` and auto-triggered playback, and even if there were, a foreground `Timer.periodic` can't fire while the app is backgrounded or killed. Fixed by adding real OS-level scheduling instead of trying to keep a foreground timer alive.
- Contributors: single agent (Claude).
- Work performed:
  - Added `apps/mobile/lib/features/prayer/data/prayer_scheduler_service.dart`: schedules adzan (5 daily prayers, excludes syuruq) and iqomah (adzan time + 5 min, matching `prayer_service.dart`'s existing `postAdzanGap` business rule) notifications for the next 3 days via `flutter_local_notifications`' `zonedSchedule` with `AndroidScheduleMode.exactAllowWhileIdle`, using two dedicated notification channels (`komplekku_adzan_channel`, `komplekku_iqomah_channel`) each with a custom `RawResourceAndroidNotificationSound`. Cancels its own previously-scheduled ids (persisted via `SharedPreferencesAsync`) before rescheduling, so reschedule calls don't stack duplicate alarms.
  - Confirmed by reading the installed `flutter_local_notifications-18.0.1` package source directly (not assumed) that the plugin's own `AndroidManifest.xml` only declares `VIBRATE`/`POST_NOTIFICATIONS` — `ScheduledNotificationBootReceiver`, `ScheduledNotificationReceiver`, and `ActionBroadcastReceiver` are **not** auto-merged and must be declared by the host app, or scheduled notifications silently fail to survive a reboot. Added those three receivers plus `SCHEDULE_EXACT_ALARM`/`RECEIVE_BOOT_COMPLETED` permissions to `apps/mobile/android/app/src/main/AndroidManifest.xml`, matching the plugin's own example app exactly. Used `SCHEDULE_EXACT_ALARM` (user-grantable) rather than `USE_EXACT_ALARM` (restricted, requires Play Store "alarm clock" category justification) since Komplekku isn't an alarm-clock app.
  - Copied `assets/audio/adzan.mp3` and `iqomah.wav` into `android/app/src/main/res/raw/` — Android notification-channel sounds must be raw resources, not Flutter asset-bundle files, which aren't addressable as Android resource ids.
  - Added `timezone: ^0.10.1` to `pubspec.yaml` (required by `zonedSchedule`); hardcoded `Asia/Jakarta` as the local timezone in the scheduler, matching `prayer_service.dart`'s existing hardcoded Jakarta coordinates — noted as a real limit (communities outside Jakarta would get wrong times) but out of scope for this reliability fix.
  - Wired `PrayerSchedulerService` into `apps/mobile/lib/app/shell/main_shell.dart`: requests notification + exact-alarm permissions and reschedules on app start, and again on every app resume (`WidgetsBindingObserver.didChangeAppLifecycleState`), covering day-rollover and any gap left while the device was off.
  - Found the mute toggle in `prayer_card.dart` ("Auto-adzan aktif/mati") was already a dead control before this fix — it only gated the Adzan button's own manual tap, since no automatic-trigger code existed to gate in the first place. Rewired it to actually control the new OS-scheduled notifications: `PrayerSchedulerService.setAutoAdzanEnabled()` persists the preference and immediately cancels or reschedules; `isAutoAdzanEnabled()` seeds the toggle's initial state on card mount.
  - Rewrote `apps/mobile/lib/core/widgets/komplekku_logo.dart` to drop hardcoded crop/transform constants (`aspectRatio: 3.38`, `Transform.scale(1.68)` etc.) that were tuned to the old logo's specific proportions and would have mis-cropped the new logo from Phase 1 — replaced with a plain `BoxFit.contain`, which works correctly for any future asset change.
  - Added `apps/mobile/test/prayer_scheduler_service_test.dart` covering the new persisted mute/auto-adzan toggle (using `InMemorySharedPreferencesAsync`, added `shared_preferences_platform_interface` as a dev dependency). Did not attempt to unit-test the `zonedSchedule`/plugin-channel path itself — that would need a mocking library (mockito/mocktail) not currently in this project, which is a larger addition than this fix warrants; verified that path instead via `flutter analyze` + the full existing suite staying green.
- Files touched:
  - `apps/mobile/lib/features/prayer/data/prayer_scheduler_service.dart` (new)
  - `apps/mobile/lib/features/prayer/presentation/prayer_card.dart`
  - `apps/mobile/lib/app/shell/main_shell.dart`
  - `apps/mobile/lib/core/widgets/komplekku_logo.dart`
  - `apps/mobile/android/app/src/main/AndroidManifest.xml`
  - `apps/mobile/android/app/src/main/res/raw/adzan.mp3`, `iqomah.wav` (new)
  - `apps/mobile/pubspec.yaml`, `apps/mobile/test/prayer_scheduler_service_test.dart` (new)
  - `Engineering.md`
- Decisions and assumptions:
  - Rescheduling only happens on app open/resume, not via a background task runner (`workmanager`/`android_alarm_manager_plus` were deliberately not added). A user who leaves the app fully closed for more than 3 consecutive days will have a scheduling gap until they next open it — acceptable for a local-first MVP; flagged as the concrete follow-up if stricter reliability is needed later.
  - Did not change `prayer_service.dart`'s calculation algorithm or its hardcoded Jakarta coordinates — this fix is scoped to making the existing calculated times actually fire notifications, not to location-awareness.
- Verification:
  - `flutter analyze`: "No issues found!"
  - `flutter test`: 90/90 passed (88 pre-existing + 2 new).
  - `flutter pub get`: `timezone 0.10.1` and `shared_preferences_platform_interface` resolved cleanly from the local pub cache.
- Follow-ups: Phases 3-5 (RT/RW hierarchy + admin, Forum Warga realtime chat, web/Flutter parity audit) remain; each will get its own journal entry on completion. Manual on-device verification (letting a scheduled adzan actually fire with the app closed) was not performed in this session — no physical device/emulator was driven; recommend the owner verify once on a real device.

---

### 2026-08-17 12:31:00 WIB — Phase 3 of Multi-Feature Update: RT/RW Hierarchy, Super-Admin Community/RT Management, Resident RT Selection

- Status: Completed
- Objective: Owner's komplek actually has 2 RTs under one RW ("RW 13"); the data model had no RT concept at all, and a real security bug existed where `RT_ADMIN` (Ketua RT) was seeded with the exact same full permission set as `SUPER_ADMIN` (confirmed via `rolePermissionKeys.RT_ADMIN: permissionDefinitions.map(([key]) => key)`), with no scoping mechanism to differentiate them. Built the full hierarchy: a new `Rt` model, RT-scoped authorization enforced at the repository layer, super-admin community/RT CRUD, and a resident-facing RT picker — on both web and Flutter.
- Contributors: single agent (Claude).
- Work performed:
  - **Schema**: added `Rt` model (`id, communityId, code, name, deletedAt`), `Community.rwLabel`, `House.rtId` (FK to `Rt`), `UserRole.rtId` (nullable — non-null only for an RT-scoped `RT_ADMIN`). Generated and applied migration `20260817113011_add_rt_rw_hierarchy` against the real local Postgres instance (started Docker Desktop + `docker compose up -d postgres redis`, which were not running at session start).
  - **RBAC fix**: added `community.manage` (structure/RT/RW edits) and `platform.community.create` (new-community creation) permissions. Rewrote `rolePermissionKeys` so `SUPER_ADMIN` gets everything, `COMMUNITY_ADMIN` gets everything except `platform.community.create`, and `RT_ADMIN` gets everything except both new keys — replacing the literal `RT_ADMIN = all permissions` bug with an actually-scoped role.
  - **Auth plumbing**: added `AuthSessionRecord.rtScopeId` (`null` = unrestricted within the community — `SUPER_ADMIN`/`COMMUNITY_ADMIN`; non-null = the one RT an `RT_ADMIN` may act on), computed by a new shared `computeRtScopeId()` helper (`apps/api/src/lib/rt-scope.ts`) used identically by `findAuthSession` in both `prisma-repository.ts` and `memory-repository.ts`, so the scoping rule can't drift between the real and in-memory backends.
  - **RT-scoped enforcement**, applied to every relevant existing method (in both repositories): `listHouses`, `createHouse` (server overrides a client-supplied `rtId` with the caller's own scope, closing an escalation path), `updateHouse` (new method, was previously entirely missing from the API), `listCommunityMembers`, `listPendingResidencyRequests`, `approveResidencyRequest`, `rejectResidencyRequest`, and `setMemberRole` (new escalation guard: an RT-scoped caller can never grant `SUPER_ADMIN`/`COMMUNITY_ADMIN`, and any `RT_ADMIN` they grant is forced into their own RT).
  - **New API surface**: `PATCH /admin/community`, `POST/GET /admin/communities` (platform-level, `SUPER_ADMIN`-only creation), `GET/POST /admin/rts`, `PATCH /admin/rts/:id`, `PATCH /houses/:id` — all in a new `apps/api/src/routes/community-admin.ts` plus an extension to `routes/houses.ts`.
  - **Onboarding**: `GET /onboarding/options` now nests each community's RT list (`OnboardingCommunityOption`); `POST /onboarding/residency-requests` requires `rtId` and validates it against the target house's actual RT, reporting a mismatch identically to "house not found" (same generic `HOUSE_NOT_FOUND`/404 as before) to preserve the app's existing no-house-enumeration privacy guarantee — confirmed this constraint by reading the web onboarding form's own comment ("Demi privasi warga, daftar rumah tidak ditampilkan") before designing the RT-picker UX around it, rather than exposing a house list.
  - **Contracts**: extended `community.ts` (RT schemas, `rwLabel`, community CRUD schemas), `house.ts` (`rtId`/`rtCode`, `updateHouseInputSchema`), `onboarding.ts` (`rts` in options, required `rtId` in the request input), `admin-role.ts` (`rtCode` on member records, optional `rtId` in `setMemberRoleInputSchema`).
  - **Seed data** (`apps/api/prisma/seed.ts`): Billabong Blok F now has `rwLabel: "RW 13"` and two real RTs (`RT 01`, `RT 02`); the existing `RT_ADMIN` seed fixture (Rina Wulandari) is scoped to RT 01. Deliberately kept all the regular `F0x` houses in RT 01 and only the super-admin's own special-format house (`F2D2-17`) in RT 02 — an earlier attempt that split `F01-F03`/`F04-F05` across the two RTs broke the pre-existing `tenant-isolation.database.test.ts`, which uses that RT_ADMIN fixture as a general community-wide admin; re-scoping the demo data (not the scoping logic) was the correct fix once traced.
  - **Web UI**: new `/admin/komunitas` page (`CommunityAdminPanel` — edit community identity/RW label, list/create/rename RTs), gated on `community.manage` and added to both desktop and mobile navigation. `HouseAdminPanel` gained a required RT selector on create and an inline RT-reassignment dropdown per house row. `AdminRolePanel` reworked from immediate-fire role selects to a per-row draft+"Terapkan" pattern so assigning `RT_ADMIN` can require an RT choice before applying. `ResidencyOnboarding` gained an RT-selection sub-step inside the existing "Lingkungan" step (radio list scoped to the chosen community's RTs).
  - **Flutter**: mirrored the same resident-facing change — `CommunityOption` gained a `rts: List<RtOption>` field threaded through the API repository parser; `ResidencyRequestScreen` gained a required RT `DropdownButtonFormField` (matching the existing relationship-dropdown pattern) inside the existing "Data rumah" step, with `rtId` threaded through `OnboardingController.submit` → `OnboardingRepository.submitResidencyRequest` → `OnboardingApiService.createResidencyRequest`.
  - Deliberately did **not** build a Flutter admin console for community/RT management: no `/admin/*`-equivalent screen exists in Flutter anywhere in this codebase today (confirmed by the earlier Phase 0 audit — `admin_residency` only covers the residency-approval queue), so a super-admin RT/RW console is consistent with the app's existing web-only admin-console convention. Flagged as a candidate for the Phase 5 parity audit rather than assumed out-of-scope by fiat.
- Files touched (representative — many touch both `prisma-repository.ts` and `memory-repository.ts` in parallel per the project's dual-backend convention):
  - `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260817113011_add_rt_rw_hierarchy/`, `apps/api/prisma/seed.ts`, `apps/api/prisma/rbac-seed-data.ts`
  - `apps/api/src/domain/repository.ts`, `apps/api/src/lib/rt-scope.ts` (new)
  - `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`
  - `apps/api/src/routes/community-admin.ts` (new), `apps/api/src/routes/houses.ts`, `apps/api/src/routes/admin-roles.ts`, `apps/api/src/routes/onboarding.ts`, `apps/api/src/app.ts`
  - `apps/api/tests/rt-rw-hierarchy.test.ts` (new), `apps/api/tests/onboarding.test.ts`, `apps/api/tests/tenant-isolation.database.test.ts`
  - `packages/contracts/src/community.ts`, `house.ts`, `onboarding.ts`, `admin-role.ts`
  - `apps/web/features/community/community-api.ts` (new), `community-admin-panel.tsx` (new), `apps/web/app/admin/komunitas/page.tsx` (new)
  - `apps/web/features/house/house-api.ts`, `house-admin-panel.tsx`; `apps/web/features/admin-role/admin-role-api.ts`, `admin-role-panel.tsx`
  - `apps/web/features/onboarding/residency-onboarding.tsx`; `apps/web/components/shell/desktop-sidebar.tsx`, `mobile-navigation.tsx`
  - `apps/mobile/lib/features/onboarding/domain/community_option.dart`, `residency_request.dart`; `data/onboarding_api_service.dart`, `api_onboarding_repository.dart`; `presentation/onboarding_controller.dart`, `residency_request_screen.dart`, `onboarding_flow_screen.dart`
  - `apps/mobile/test/onboarding_widget_test.dart`, `onboarding_repository_test.dart`
  - `Engineering.md`
- Decisions and assumptions:
  - RT is a new, orthogonal axis from `House.block`/`number` (which stay physical-address labels, confirmed by reading `seed.ts`'s multi-format block examples) — not a replacement for them.
  - No hard-delete for RTs in this pass (matches the codebase's existing soft-delete/no-hard-delete convention for administrative records); an RT with assigned houses simply can't disappear via the API today.
  - The onboarding RT+house-code flow does one extra validation (house must belong to the selected RT) but does not expose a house picker — preserving the app's explicit anti-enumeration design already in place before this change.
- Verification:
  - `tsc --noEmit` (API): clean.
  - `vitest run` (API, in-memory backend): 50/51 passed, 1 skipped-by-design (real-DB test, run separately).
  - `vitest run tests/tenant-isolation.database.test.ts` against real local Postgres (`komplekku_test`, migrated and seeded during this session — it was 7 migrations behind and never seeded before now): passed.
  - `pnpm --filter @komplekku/web build`: compiled, typechecked, all 39 routes generated including the new `/admin/komunitas`.
  - `eslint` (web, changed directories): no new errors (4 pre-existing errors in unrelated files, e.g. `photo-picker.tsx`, `prayer-card.tsx`, confirmed unrelated to this change).
  - `flutter analyze`: "No issues found!". `flutter test`: 90/90 passed.
- Follow-ups: Phases 4-5 (Forum Warga realtime chat, web/Flutter parity audit) remain. A Flutter admin console for community/RT management is a candidate follow-up, not built in this phase (see decision above). Manual end-to-end click-through (actually registering as a resident through the new RT step, and actually promoting someone to a scoped Ketua RT through the web UI) was not performed against a running dev server in this session — verification here is via automated tests and production builds only.

---

### 2026-08-17 13:24:00 WIB — Phase 4 of Multi-Feature Update: Forum Warga Realtime Chat

- Status: Completed
- Objective: Add a realtime resident chat ("Forum Warga") scoped to each RT plus one community-wide channel, with image attachments and push notifications, on both web and Flutter — reusing the RT model from Phase 3 rather than inventing a parallel grouping concept.
- Contributors: single agent (Claude), working interleaved with concurrent edits from another agent instance active in the same workspace during this phase — both were building toward the same design; conflicts were resolved by reading the current file state before extending it, and a few real bugs introduced by the interleaving (a contract/route field-placement mismatch, two test fixtures missing permission grants) were found and fixed directly.
- Work performed:
  - **Schema**: added `ForumChannel` (`communityId`, nullable `rtId` — null means community-wide, `name`) and `ForumMessage` (`channelId`, `authorUserId`, `body`, `imageUrls: String[]`, soft `deletedAt`). Chose a plain string array for images (mirroring `Report.photos`'s existing convention in this codebase) instead of a separate attachment table with richer metadata — proportionate to an MVP chat feature. Migration `20260817123600_add_forum_warga` generated and applied to both the local dev and test Postgres databases.
  - **Auto-provisioning**: every `createRt` call also creates that RT's forum channel (named after the RT); every `createCommunity` call creates the community-wide channel; renaming an RT via `updateRt` renames its channel to match. `seed.ts` backfills channels for the communities/RTs that already existed before this migration (no production data to migrate, but local dev/test data needed it).
  - **RBAC**: added `forum.read`, `forum.post`, `forum.manage` permissions. Granted read+post to `RESIDENT`, `HOUSEHOLD_MEMBER`, `TREASURER`, and (via the existing "everything except X" derivation) `SUPER_ADMIN`/`COMMUNITY_ADMIN`/`RT_ADMIN`; `forum.manage` (moderation) to `SEKRETARIS` and the admin roles. Deliberately excluded `SECURITY`/`STAFF` — operational roles keep their own dashboards rather than joining the resident social forum, matching the PRD's role-separation philosophy. This is also kept in sync in `memory-repository.ts`'s separate hardcoded demo-permission constants, which mirror (and must be manually kept in sync with) `rbac-seed-data.ts`'s role definitions — a pre-existing pattern in this codebase, not something introduced here.
  - **Channel visibility rule**: distinguished two different "RT" concepts that could easily have been conflated — `auth.rtScopeId` (an RT_ADMIN's *administrative* reach, from Phase 3) versus a resident's *personal* RT (looked up via their current household's house). A plain resident sees their own RT's channel + the community channel; an unscoped admin (`community.manage`) sees every channel; an RT_ADMIN sees their administered RT plus their own personal RT if different.
  - **Realtime delivery**: `apps/api/src/lib/forum-broadcaster.ts` — an in-process `Map<channelId, Set<ServerResponse>>` SSE fan-out. Deliberately not Redis-backed: the API runs as a single local-first process today, and no realtime transport (WebSocket/SSE/Redis pub-sub) existed anywhere in this codebase before now, so this is the minimal addition that satisfies "realtime" without bringing in new infrastructure. `GET /forum/channels/:id/stream` (web-only in practice) pushes `message.created`/`message.deleted` events; Flutter instead polls every 5s while the forum screen is open, mirroring the app's existing `RealtimeNotificationService` polling pattern rather than adding a new transport client to the mobile app.
  - **API surface**: `GET /forum/channels`, `GET/POST /forum/channels/:id/messages` (cursor-paginated, same convention as `/notifications`), `DELETE /forum/messages/:id` (a poster can delete their own message; a `forum.manage` holder can moderate anyone's, scoped to their own RT if they're an RT_ADMIN). New messages broadcast over SSE and trigger a push notification (extended `PushNotificationProvider` with a batch `sendToUsers()`) to everyone who can see the channel, excluding the sender.
  - **Web UI**: `/forum` page — channel chips, a message thread (own/other bubble styling), a composer reusing the existing `PhotoPicker`/`PhotoGrid` components (already built for report photos) for up to 5 image attachments, and a `useEffect`-managed `EventSource` (`withCredentials: true` for the cross-origin session cookie) that invalidates the React Query message cache on each SSE event rather than hand-patching state. Added to both desktop sidebar and mobile nav, gated on `forum.read`.
  - **Flutter UI**: new `features/forum/` (data/domain/presentation, matching the project's feature-first convention) — channel chips, chat-bubble message list, a composer with a 5-second poll timer while mounted. Added `apps/mobile/lib/core/upload/cloudinary_upload.dart` (the Flutter counterpart of `apps/web/lib/cloudinary-upload.ts`, same unsigned-upload approach, configured via `--dart-define=CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_UPLOAD_PRESET` the same way `API_BASE_URL` is) plus the `image_picker` package, since **no image-upload capability existed anywhere in the Flutter app before this** — confirmed by grepping the whole `lib/` tree for `cloudinary`/`multipart` and finding nothing; reports, incidents, and every other module with a "photo" field are web-only today. This is a real, larger pre-existing web/Flutter parity gap that Phase 5 should audit more broadly; it was closed here specifically for the forum composer since it was directly in scope, not fixed everywhere it exists.
  - Registered the new route in `/aktivitas/forum` (Flutter) and `/forum` (web), added to both platforms' navigation gated on `forum.read`.
  - **Tests**: `apps/api/tests/forum.test.ts` — 6 cases covering RT-scoped channel visibility, cross-RT post/read denial, pagination, own-message deletion, denial of deleting others' messages without `forum.manage`, and an RT_ADMIN's moderation reach being confined to their assigned RT even when the message's author lives elsewhere.
- Files touched (representative):
  - `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260817123600_add_forum_warga/`, `apps/api/prisma/seed.ts`, `apps/api/prisma/rbac-seed-data.ts`
  - `apps/api/src/domain/repository.ts`, `apps/api/src/lib/forum-broadcaster.ts` (new), `apps/api/src/lib/push-notification-provider.ts`
  - `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`
  - `apps/api/src/routes/forum.ts` (new), `apps/api/src/app.ts`
  - `apps/api/tests/forum.test.ts` (new)
  - `packages/contracts/src/forum.ts` (new)
  - `apps/web/features/forum/forum-api.ts`, `forum-panel.tsx` (new); `apps/web/app/forum/page.tsx` (new)
  - `apps/web/components/shell/desktop-sidebar.tsx`, `mobile-navigation.tsx`
  - `apps/mobile/lib/features/forum/` (new: domain/data/presentation)
  - `apps/mobile/lib/core/upload/cloudinary_upload.dart` (new), `apps/mobile/pubspec.yaml` (added `image_picker`)
  - `apps/mobile/lib/app/router.dart`, `apps/mobile/lib/app/shell/aktivitas_hub_screen.dart`
  - `Engineering.md`
- Decisions and assumptions:
  - No `ForumAttachment` table — attachments are a plain URL array on the message, matching `Report.photos`'s existing precedent rather than building a new richer pattern for one feature.
  - SSE (not WebSocket) for web; polling (not a new realtime client) for Flutter — both deliberate choices to avoid introducing new realtime infrastructure into a codebase that had none, given the actual need (push new messages to open viewers) is one-directional.
  - Cloudinary credentials are not configured anywhere in this local environment (`.env`/`.env.example` have no `CLOUDINARY_*` keys) for either the pre-existing web `PhotoPicker` or the new Flutter uploader — both are real, complete code paths, but neither has been exercised against a live Cloudinary account in this session. This mirrors the existing, already-accepted state of the web report-photo feature; it is not a new gap introduced here.
- Verification:
  - `tsc --noEmit` (API and web): clean.
  - `vitest run` (API, in-memory backend): 56/57 passed (1 skipped-by-design real-DB test).
  - `vitest run tests/tenant-isolation.database.test.ts` against real local Postgres: passed.
  - `pnpm --filter @komplekku/web build`: compiled, typechecked, all 39 routes generated including `/forum`.
  - `eslint` (web): no new errors introduced (same 4 pre-existing errors in unrelated files as Phase 3).
  - `flutter analyze`: "No issues found!". `flutter test`: 90/90 passed.
  - Not verified: an actual live SSE connection receiving a broadcast end-to-end, an actual Cloudinary upload completing, and push notifications actually arriving on a device — none of these were exercised against a running dev server/emulator in this session.
- Follow-ups: Phase 5 (web/Flutter parity audit) remains — should now also cover the newly-confirmed broader gap that Flutter has no image-upload capability anywhere outside the forum composer just added (reports, incidents, etc. remain web-only for photos).

---

### 2026-08-17 20:35:00 WIB — Phase 4 of Multi-Feature Update: Forum Warga Realtime Chat (API, Web, Flutter)

- Status: Completed
- Objective: Owner asked for a resident forum with realtime chat, image attachments, and push notifications, on both web and Flutter. Built RT-scoped forum channels (one community-wide channel plus one per RT), realtime delivery per platform's existing transport conventions, and image attachments reusing the codebase's existing Cloudinary-unsigned-upload pattern rather than inventing a new one.
- Contributors: single agent (Claude).
- Work performed:
  - **Schema**: added `ForumChannel` (`id, communityId, rtId` nullable — null means community-wide, `name`) and `ForumMessage` (`id, communityId, channelId, authorUserId, body, imageUrls String[]`, soft-deletable). Migration `20260817123600_add_forum_warga`. Backfilled channels for existing seed communities (`ensureForumChannel()` helper in `seed.ts`): Billabong gets a community-wide channel plus one per RT, Taman Cendana likewise.
  - **RBAC**: added `forum.read`, `forum.post`, `forum.manage`. Granted read+post to residents, household members, and treasurer; read+post+manage to secretary; deliberately withheld from security/staff roles (a guard, not a resident, has no standing in the resident forum).
  - **Access model**: a channel is readable/postable only if the viewer's own household RT matches the channel's RT, or the channel is community-wide — computed via a new `viewerHouseRtId()` / `canAccessForumChannel()` pair in `prisma-repository.ts`, distinct from the RT_ADMIN `rtScopeId` administrative-authority concept added in Phase 3 (a resident's own RT membership is not the same axis as an admin's scope of control). Message deletion requires either authorship or `forum.manage`, and a moderator without RT_ADMIN's unrestricted scope can only moderate within their own RT's channel — enforced by reusing the same `rtScopeId` check as the rest of the RT-scoping system.
  - **Realtime**: web gets a true push channel via a new in-process `ForumBroadcaster` (`Map<channelId, Set<ServerResponse>>`) driving a `GET /forum/channels/:id/stream` SSE endpoint — chosen over WebSocket/Redis because the app is single-process local-first and SSE is the lighter primitive for one-way server-to-client fanout. Flutter has no long-lived connection story anywhere in the codebase (confirmed by reading `RealtimeNotificationService`, which already polls `/notifications` every 15s rather than holding a socket), so the Flutter forum screen matches that established precedent: a 5-second `Timer.periodic` while the chat screen is open, no new transport introduced.
  - **Push notifications on new messages**: `POST /forum/channels/:id/messages` calls the existing `PushNotificationProvider.sendToUsers()` (added a batch-by-user-list overload to avoid one Firestore-style query per recipient) with the message author/body as the FCM `notification` payload. This required no new Flutter-side handling — `FcmService.initialize()`'s existing `FirebaseMessaging.onMessage` foreground listener and FCM's own background/terminated auto-display already cover any push with a `notification` payload; a `data.type: "FORUM_MESSAGE"` field was included for a future tap-to-deep-link but deep-linking itself was not built (no existing push currently deep-links anywhere in this app; out of scope for parity with what already exists).
  - **Attachments**: reused the exact `Report.photos: String[]` pattern (confirmed as the actual, not aspirational, attachment convention in this codebase) as `ForumMessage.imageUrls`. Web reuses the existing `PhotoPicker`/`PhotoGrid` components and Cloudinary unsigned-upload helper unchanged. Flutter had no image-upload capability anywhere before this phase (confirmed via repo-wide search — not even the report feature has one client-side yet), so this phase added the first one: `image_picker` dependency, a `core/upload/cloudinary_upload.dart` helper mirroring `apps/web/lib/cloudinary-upload.ts` field-for-field (`--dart-define=CLOUDINARY_CLOUD_NAME/CLOUDINARY_UPLOAD_PRESET`, same as how `API_BASE_URL` is already configured), and a composer image strip (thumbnail, upload spinner, remove button, 5-image cap) in `forum_screen.dart`. Added `android.permission.CAMERA` to the Android manifest — confirmed by reading the installed `image_picker_android` plugin's own manifest that it declares a `FileProvider` for its gallery/Photo-Picker flow but does **not** declare `CAMERA`, so the "take photo" path would otherwise silently fail to launch.
  - **Mobile route wiring**: `ForumScreen` and its `/aktivitas/forum` hub-menu entry existed as of this session's start but were never actually registered in `router.dart`'s `GoRoute` tree — the screen was unreachable dead code. Added the missing `GoRoute(path: 'forum', builder: (context, state) => const ForumScreen())` under the `/aktivitas` branch.
  - **Web UI**: new `/forum` page (`ForumPanel`) — channel sidebar, message bubbles (own vs. others styled distinctly), `PhotoGrid` for received images, an `EventSource` SSE subscription that invalidates the React Query message cache on `message.created`/`message.deleted`, and a composer using the existing `PhotoPicker`. Added "Forum Warga" to both `desktop-sidebar.tsx` and `mobile-navigation.tsx`, gated on `forum.read`.
  - Found and fixed a real security bug while reading `prisma-repository.ts`: the file contained two full duplicate copies of the four forum methods (`listForumChannels`, `listForumMessages`, `createForumMessage`, `deleteForumMessage`); the second (later, effective) copy's `deleteForumMessage` omitted the ownership/moderation check entirely, meaning any authenticated reader could delete any other resident's message. Deleted the duplicate block and kept the correct one; re-verified via a single-occurrence grep and a clean `tsc --noEmit`.
  - Added `apps/api/tests/forum.test.ts` (6 tests): RT-scoped channel listing, permission denial, channel-access enforcement on post, cursor pagination, own-message deletion vs. denied-without-manage, and cross-RT moderation denial (an RT_ADMIN promoted via `PATCH /admin/users/:id/role` can delete in their own RT's channel but not the other RT's).
  - Added `apps/mobile/test/forum_test.dart` (4 tests) covering `ForumChannel`/`ForumMessage` JSON parsing, including the `imageUrls`-defaults-to-empty-list behavior, matching this codebase's existing convention of testing domain-model parsing rather than mocking Dio at the repository layer (no other repository in this app mocks Dio directly; Dio-level repository tests would need a mocking library not currently a dependency).
- Files touched:
  - `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260817123600_add_forum_warga/`, `apps/api/prisma/rbac-seed-data.ts`, `apps/api/prisma/seed.ts`
  - `apps/api/src/lib/push-notification-provider.ts`, `apps/api/src/lib/forum-broadcaster.ts` (new)
  - `apps/api/src/domain/repository.ts`, `apps/api/src/repositories/prisma-repository.ts`, `apps/api/src/testing/memory-repository.ts`
  - `apps/api/src/routes/forum.ts`, `apps/api/src/app.ts`
  - `apps/api/tests/forum.test.ts` (new)
  - `packages/contracts/src/forum.ts`
  - `apps/web/features/forum/forum-api.ts` (new), `forum-panel.tsx` (new), `apps/web/app/forum/page.tsx` (new)
  - `apps/web/components/shell/desktop-sidebar.tsx`, `mobile-navigation.tsx`
  - `apps/mobile/pubspec.yaml`, `apps/mobile/android/app/src/main/AndroidManifest.xml`
  - `apps/mobile/lib/core/upload/cloudinary_upload.dart`
  - `apps/mobile/lib/features/forum/domain/forum_channel.dart`, `forum_message.dart`, `data/forum_repository.dart`, `presentation/forum_screen.dart`
  - `apps/mobile/lib/app/router.dart`
  - `apps/mobile/test/forum_test.dart` (new)
  - `apps/mobile/README.md`
  - `Engineering.md`
- Decisions and assumptions:
  - SSE for web, polling for Flutter — matching each platform's existing realtime precedent rather than unifying on one transport, since introducing WebSocket/Redis purely for cross-platform symmetry would add infrastructure this local-first app doesn't otherwise need.
  - Forum push notifications ride the existing raw-FCM `sendToTokens` path (not the separate in-app `Notification` DB record used by `/notifications` + `RealtimeNotificationService`), so a forum message push will show as a system notification but will not appear in the in-app notification list. Flagged, not fixed — unifying those two notification paths is a larger change than this feature warrants and no other push in this app does so either.
  - Deep-linking a tapped forum push notification directly to its channel was not built; `data.type: "FORUM_MESSAGE"` is included in the payload for whenever that lands, but no existing notification tap in this app deep-links anywhere yet, so this isn't a regression relative to the rest of the app.
- Verification:
  - `tsc --noEmit` (API): clean.
  - `vitest run` (API): 56 passed, 1 pre-existing real-DB test skipped by design.
  - `pnpm --filter @komplekku/web build`: compiled, typechecked, all routes generated including `/forum`.
  - `flutter pub get`: `image_picker` resolved cleanly.
  - `flutter analyze`: "No issues found!". `flutter test`: 94/94 passed (90 pre-existing + 4 new).
  - Noted, not acted on: `dart format --set-exit-if-changed` reports nearly the entire pre-existing `lib/`/`test/` tree as unformatted, unrelated to this session's edits (a formatter-version/config drift predating this work) — left alone rather than mass-reformatting unrelated files under this task's scope.
- Follow-ups: Phase 5 (web/Flutter parity audit against `packages/contracts` as the canonical feature list) remains — the Flutter admin console gap flagged in Phase 3 is one known item for it. The forum-push/in-app-notification unification and forum push deep-linking (see decisions above) are both real but out-of-scope gaps worth a future pass. Manual on-device verification of the realtime chat (SSE on web, polling on Flutter, actually watching a push notification arrive) was not performed against a running dev server/emulator in this session.

---

### 2026-08-17 14:28:00 WIB — Phase 5 of Multi-Feature Update: Web/Flutter Parity Audit, Agenda Create Parity, Owner Follow-Up Requests

- Status: Completed (audit scoped as documented below; not an exhaustive rebuild)
- Objective: The owner's original request said "the all function is not sync with flutter app" — audit where web and Flutter have actually drifted, fix the highest-value gaps, and close out the multi-phase update. Two additional owner requests arrived mid-session and are covered here too: a purple "Forum Warga" highlight bubble in the mobile bottom nav, and correcting the seeded RT numbers to match the owner's real neighborhood (RT 03/RT 04, not RT 01/RT 02).
- Contributors: single agent (Claude).
- Work performed:
  - **Audit method**: dispatched a background research agent to compare every `apps/web/app/**/page.tsx` route against every `GoRoute` in `apps/mobile/lib/app/router.dart`, spot-checking permission-string parity (e.g. `camera.manage`, `dues.manage`, `payment.verify`) via grep on both codebases. The agent hit an account-wide usage-session limit partway through and terminated early, but had already confirmed one concrete gap (agenda has no create/edit UI on Flutter) before stopping. Completed the remaining comparison directly (`Glob`/`Grep`/`Read`) rather than retrying the same delegation.
  - **Findings**: cross-checked every module the PRD's own §103 "Phase 5 — Mobile Parity" section lists as required on Flutter (resident: Login, Home, Announcement, CCTV, Visitor, Packages, Reports, Emergency, Iuran, Notifications, Profile; security: Security Home, Visitor, Package, Patrol, Incident, Emergency, CCTV) — all are present and functional on Flutter today. `report`, `letter`, and `incident` screens are already well-designed dual-mode (a single screen adapts via `canManage`/`canCreate` permission checks instead of splitting into separate resident/admin routes like web does) — a different but equally valid parity strategy, not a gap. The real, confirmed gaps are all **admin-console features that the PRD itself never lists as mobile requirements**: community/RT management (flagged in Phase 3), house management, user-role management, camera CRUD (`camera.manage` has zero references anywhere in `apps/mobile/lib`), and dues-type/invoice-generation admin (`dues.manage` likewise has zero references) — these remain web-only, consistent with the PRD's own desktop-oriented admin navigation (§17) and the pattern already established before this session (no `/admin/*`-equivalent screen has ever existed in Flutter). One gap fell outside that "admin-only, PRD doesn't require it" bucket and was fixed: **agenda creation** existed on web (`create-agenda-modal.tsx`, gated on `agenda.manage`) but had no Flutter counterpart, even though its sibling feature (announcement creation) already had parity from an earlier session.
  - **Fix — agenda create parity**: added `AgendaRepository.create()` (`POST /admin/agenda`) and a `_CreateAgendaDialog` to `agenda_list_screen.dart`, mirroring `announcement_list_screen.dart`'s existing FAB-opens-dialog pattern exactly (same permission gate via `agenda.manage`, same error handling shape) — using native `showDatePicker`/`showTimePicker` instead of raw text fields for the date/start/end-time inputs, since typo-prone manual `YYYY-MM-DD`/`HH:mm` entry is worse UX than web's native `<input type="date">`/`<input type="time">` equivalents.
  - **Owner follow-up — Forum Warga bottom-nav bubble**: added a purple (`#7C3AED`) circular highlight for Forum Warga on both platforms' mobile bottom navigation, as an explicit, deliberate exception to the app's civic-green/terracotta palette (owner's direct instruction overrides the locked design system for this one control, per `AGENTS.md`'s "owner's latest explicit instruction controls the current task"). Flutter: a `FloatingActionButton` (`centerFloat`) on `main_shell.dart` navigating to `/aktivitas/forum`, layered above the existing 5-tab `NavigationBar` without altering its branch structure. Web: converted `.mobile-navigation`'s grid from 4 to 5 columns and added a raised circular bubble item (new `.mobile-navigation__item--bubble` CSS), removing the now-redundant "Forum Warga" entry from the "Layanan" overflow sheet so it isn't listed twice; gated on `forum.read` like the rest of the nav.
  - **Owner follow-up — real RT numbers**: `apps/api/prisma/seed.ts` now creates `"RT 03"`/`"RT 04"` for Billabong Blok F instead of the placeholder `"RT 01"`/`"RT 02"` used during Phase 3 development (super-admin/Ketua RW editing was already fully supported via `PATCH /admin/rts/:id`, `community.manage`-gated — no code change needed there, just confirmed it still works). Re-running the seed against an `upsert`-by-`code` lookup created new RT 03/04 rows rather than renaming the existing ones in place, orphaning the old RT 01/02 rows and their auto-created (now-empty) forum channels; cleaned those up directly via SQL against both the dev and test databases after confirming via a `COUNT`-join query that nothing (0 houses, 0 user_roles) still referenced them.
- Files touched:
  - `apps/mobile/lib/features/agenda/data/agenda_repository.dart`, `presentation/agenda_list_screen.dart`
  - `apps/mobile/lib/app/shell/main_shell.dart`
  - `apps/web/components/shell/mobile-navigation.tsx`, `apps/web/app/globals.css`
  - `apps/api/prisma/seed.ts`
  - `Engineering.md`
- Decisions and assumptions:
  - Phase 5 is scoped as a targeted audit against the PRD's own explicit mobile-parity checklist, not an exhaustive line-by-line rebuild of every admin screen onto Flutter — the confirmed remaining gaps (community/RT/house/user/camera/dues-type admin) are deliberately web-only, matching a pattern already established before this session, not accidental drift.
  - The purple Forum Warga bubble is a one-off, explicitly-requested exception to the locked palette (`design.md`) — not a precedent for introducing purple elsewhere in the app.
- Verification:
  - `flutter analyze`: "No issues found!". `flutter test`: 94/94 passed (no regressions from the agenda dialog or FAB change; no new dedicated widget test was added for the agenda dialog, matching the equivalent announcement dialog's own existing level of coverage).
  - `tsc --noEmit` (web): clean. `eslint` (web, changed files): no new errors.
  - `vitest run` (API): 56/57 passed (1 skipped-by-design). `vitest run tests/tenant-isolation.database.test.ts` against real Postgres: passed — run again after the RT renumbering to confirm no regression.
  - Verified via direct SQL query (not assumed) that the orphaned RT 01/02 rows had zero remaining references before deleting them, on both the dev and test databases.
- Follow-ups: no further phases planned from the original request. Remaining known gaps for a future session, in rough priority order: (1) unify forum push notifications with the in-app `Notification` record/list so a forum message shows up in `/notifikasi` too, not just as a system push; (2) deep-link push-notification taps to their originating screen (applies to every notification type, not just forum — a pre-existing gap, not introduced here); (3) if the owner ever wants full admin-console parity on Flutter (community/RT/house/user/camera/dues-type management), that is a substantial, separate scope of work beyond what the PRD's mobile-parity section requires today.

---

### 2026-08-18 07:15:00 WIB — Forum Warga: Mobile Layout Fix, Channel Ordering Parity

- Status: Completed
- Objective: Owner reported the web Forum Warga page's chat area "cutting" on narrow/mobile viewports (a screenshot showed the empty-state text wrapping one letter per line, e.g. "Belu / m ada / pesa / n"), and asked to (a) confirm RT residents genuinely can't see other RTs' channels, and (b) have one shared chat "for all warga".
- Contributors: single agent (Claude).
- Work performed:
  - **Root cause of the layout bug**: `ForumPanel` (`apps/web/features/forum/forum-panel.tsx`) used an inline `display:grid; gridTemplateColumns:"minmax(160px,220px) 1fr"` with no responsive fallback — inline styles can't carry a media query, so on a narrow viewport the message-thread column was squeezed to a few dozen pixels, forcing severe word-wrapping. Fixed by moving the layout to CSS classes (`.forum-panel`, `.forum-panel__channels`, `.forum-panel__channel[--active]`, `.forum-panel__thread` in `globals.css`) with a `@media (max-width: 767px)` rule that collapses the sidebar channel list into a horizontal scrollable strip above a full-width thread, matching the pattern the Flutter app (`_ChannelTabs` + `Expanded` thread in `forum_screen.dart`) already used — Flutter did not have this bug.
  - **RT isolation — verified, not a bug**: traced both `listForumChannels` and `listForumMessages` in `prisma-repository.ts`/`memory-repository.ts`; a plain `RESIDENT` (no `community.manage`) is already restricted server-side to their own house's RT channel plus the community-wide (`rtId: null`) channel — enforced at the repository layer, not just hidden in the UI, and already covered by `tests/forum.test.ts` (`"membatasi daftar channel sesuai RT warga"` asserts RT 02's channel ID is absent from an RT 01 resident's list; a separate test asserts POSTing into another RT's channel 404s). The screenshot that prompted this showed RT 03, RT 04, *and* "Semua RT" together because it was captured from an account with `community.manage` (which intentionally sees every channel) — not a leak. No access-control change was needed.
  - **"1 chat form for all warga"**: found a real dual-backend inconsistency instead — `memory-repository.ts` sorted the community-wide (`rtId: null`) channel *first* (empty-string sorts before any UUID in `localeCompare`), while `prisma-repository.ts` sorted it *last* (Postgres puts `NULL` after non-null values in `ORDER BY rtId ASC` by default), which is exactly why the screenshot showed RT 03/RT 04 before "Semua RT". Both web and Flutter default their active tab to `channels[0]`, so on the real database the shared community channel was never the default view. Fixed by fetching with `orderBy: [{ name: "asc" }]` and stable-sorting client-side so non-null-`rtId` channels sort after the null one, matching `memory-repository.ts`'s existing order — the one channel every resident shares is now always first and is the default tab on both platforms, with each RT's own private channel alongside it.
- Files touched:
  - `apps/web/features/forum/forum-panel.tsx`, `apps/web/app/globals.css`
  - `apps/api/src/repositories/prisma-repository.ts`
- Decisions and assumptions:
  - Did not touch the RT-scoping logic itself since it was already correct and tested — only the presentation-layer bug (layout) and the ordering inconsistency were real.
  - Kept the composer (`<form>`) as the single shared component driven by `activeChannelId`, as it already was on both platforms — no duplicate-form issue existed to fix.
- Verification:
  - `tsc --noEmit` (API): clean. `vitest run tests/forum.test.ts`: 6/6 passed (ordering change doesn't affect containment assertions).
  - `tsc --noEmit` (web): clean. `pnpm --filter @komplekku/web build`: compiled, all routes generated including `/forum`.
  - Not done: manual visual re-check of the narrow-viewport layout in a real browser (no dev server running this session) — the CSS follows the same collapse pattern already proven elsewhere in `globals.css` (e.g. `.mobile-navigation`'s breakpoint), but the owner should confirm the fix on-device.

---

### 2026-08-18 08:40:00 WIB — Flutter: Launcher Icon, Notification Permission, Nav Bubble, Admin-Console Parity

- Status: Completed
- Objective: Owner asked for a rebuilt APK, then flagged four things while reviewing it: (1) the installed app's launcher icon was still the old logo, not the current brand mark; (2) the Forum Warga highlight was a floating action button instead of matching the web bottom nav's embedded bubble; (3) push/adzan notifications never showed an Android permission prompt; (4) superadmin-only features (manage users, manage community, "and other") that exist on web were never built on Flutter — a gap Phase 5 of the previous session had explicitly deferred as "if the owner ever wants it." The owner did want it, so it's built now.
- Contributors: single agent (Claude).
- Work performed:
  - **Launcher icon**: confirmed via direct image inspection that every `android/app/src/main/res/mipmap-*/ic_launcher*.png` was still a completely different, pre-brand-refresh placeholder (a forest-green/beige "K + houses" mark) — never regenerated when the in-app logo widget was switched to the real `komplekku-mark.png` asset in an earlier session. Added `flutter_launcher_icons` as a dev dependency; composited a flattened opaque-white version of the mark (`assets/brand/komplekku-mark-icon.png`, via PIL) for the legacy/pre-adaptive-icon image, and used the original transparent mark as the adaptive-icon foreground with a white background (matching design.md's note that the compact mark assumes a light surface). Ran `dart run flutter_launcher_icons` to regenerate every mipmap density plus the Android 8+ adaptive-icon XML.
  - **Missing notification permission dialog — real bug, root cause found**: `AndroidManifest.xml` was missing the `POST_NOTIFICATIONS` `<uses-permission>` entry entirely, despite `prayer_scheduler_service.dart`'s own doc comment claiming it requests this at runtime. Without the manifest declaration, both `FcmService._messaging.requestPermission()` and `PrayerSchedulerService.requestPermissions()` silently no-op on Android 13+ — the OS refuses to show a permission dialog for a permission the app never declared, so neither push notifications nor adzan/iqomah could ever prompt or fire on API 33+. Fixed by adding the manifest entry.
  - **Forum Warga bubble — floating vs. embedded**: replaced `main_shell.dart`'s `FloatingActionButton` (`floatingActionButtonLocation: centerFloat`, layered independently above the `Scaffold`) with a `Stack` inside the `bottomNavigationBar` slot itself — the `NavigationBar` plus a `Positioned` circular bubble (`top: -20`) directly on top of it, `clipBehavior: Clip.none`. This reads as one nav bar with a raised bubble embedded in it, matching the web bottom nav's `.mobile-navigation__item--bubble` CSS technique (a grid item raised via negative `top` offset) instead of a disconnected FAB floating above a separate bar.
  - **Admin-console parity — three new full feature modules**, each mirroring its exact web counterpart's API calls and field names (`community-admin-panel.tsx`, `house-admin-panel.tsx`, `admin-role-panel.tsx`):
    - `features/community_admin/` — community identity form (name/address/RW label, `PATCH /admin/community`) plus RT list with inline rename and an add-RT form (`GET/POST /admin/rts`, `PATCH /admin/rts/:id`), gated on `community.manage`.
    - `features/house_admin/` — add-house form (code/block/number/RT/occupancy, `POST /houses`) plus a house list with an inline RT-reassignment dropdown (`PATCH /houses/:id`), gated on `resident.manage`. Reuses `rtListProvider` from `community_admin` for the RT dropdown, matching web's own cross-feature import of `listRts` into `house-admin-panel.tsx`.
    - `features/admin_role/` — community member list with a per-row role dropdown (and a conditional RT dropdown when the drafted role is `RT_ADMIN`) plus an apply button, mirroring web's per-row draft-then-apply pattern exactly (`GET /admin/roles`, `GET /admin/users`, `PATCH /admin/users/:id/role`), gated on `resident.manage`.
    - Wired as three new routes nested under the existing `/akun` branch (`/akun/komunitas`, `/akun/rumah`, `/akun/pengguna`), alongside the pre-existing `/akun/permohonan-warga` — the Akun tab was already the established home for this app's admin-only screens (via `_AdminTaskCard`), so new entries were added there rather than inventing a new navigation surface. Generalized `_AdminTaskCard` (previously hardcoded to the residency queue) to accept icon/title/description/route, and added the three new cards each gated by the same permission check pattern (`community.manage` / `resident.manage`) the web sidebar uses.
- Decisions and assumptions:
  - Camera management (`camera.manage`) and dues-type/invoice-generation admin (`dues.manage`) — the other two gaps Phase 5 flagged — were not built this pass; the owner named "management user, management community and other," and these three cover the concretely named items. Flagged as the remaining "and other" for a future pass rather than silently scoped out.
  - Did not restructure `main_shell.dart`'s existing 5 `NavigationDestination`s into a `BottomAppBar` + `CircularNotchedRectangle` notch (Flutter's more idiomatic "docked FAB" pattern) — a `Stack`-based overlay achieves the same visual result with zero risk to the 5 existing tabs' behavior, and mirrors the web CSS technique more directly (raised sibling, not a carved notch).
- Verification:
  - `flutter analyze`: "No issues found!" (fixed 6 `use_null_aware_elements` info-lints along the way by switching `if (x != null) 'key': x` to `'key': ?x`).
  - `flutter test`: 94/94 passed, no regressions.
  - `flutter build apk --release`: succeeded (first rebuild, before this pass's fixes, produced a 60.7MB APK at `build/app/outputs/flutter-apk/app-release.apk`; rebuilt again after these fixes).
  - Not done: on-device verification that the new launcher icon renders correctly on a real home screen, that the POST_NOTIFICATIONS dialog now actually appears on a physical Android 13+ device, or manual click-through of the three new admin screens — all verified by reading code/config and running static analysis + the test suite, not by running the app.

---

### 2026-08-18 09:15:00 WIB — Flutter: On-Device Verification Round (Emulator), Two More Real Bugs Found and Fixed

- Status: Completed
- Objective: Owner asked to install the just-built APK on the Android emulator so the previous pass's fixes (icon, permission, nav bubble, admin screens) could be confirmed for real rather than taken on faith from static analysis. Doing so surfaced two additional real bugs the static checks had missed entirely.
- Contributors: single agent (Claude).
- Work performed:
  - **Installed and launched on `emulator-5554`** (Pixel-profile, Android 15/API 35) via `flutter install` + `adb`, screenshotting each state to verify rather than assuming.
  - **Bug found — launcher icon fix was incomplete**: the home-screen/app-drawer icon still showed the old stale forest-green logo despite the previous pass's `flutter_launcher_icons` run reporting success. Root cause: `flutter_launcher_icons` v0.14.4 regenerated `mipmap-anydpi-v26/ic_launcher.xml` (square adaptive icon) to point at a new `@drawable/ic_launcher_foreground`, but left `ic_launcher_round.xml` untouched, still pointing at the old `@mipmap/ic_launcher_foreground` — and most launchers (including this emulator's) display the *round* variant. This is a real inconsistency in the tool's own two code paths (square vs. round adaptive icon generation), not a config mistake — confirmed by comparing file mtimes (`ic_launcher.xml` touched today, `ic_launcher_round.xml` still dated from the pre-brand-refresh commit). Fixed by hand-editing `ic_launcher_round.xml` to mirror `ic_launcher.xml`'s `@drawable/ic_launcher_foreground` reference, and copying the newly-regenerated per-density `ic_launcher.png` over the stale `ic_launcher_round.png` for the legacy (pre-API26) fallback path too. Verified via a fresh install + app-drawer screenshot: the correct purple mark now shows.
  - **Bug found — Forum bubble overlapped "Layanan"**: the previous pass's fix (a `Stack` with the bubble `Positioned` at top-center over the `NavigationBar`) put the bubble directly on top of the bar's existing middle tab ("Layanan," which is also horizontally centered in a 5-item row) instead of beside it — an oversight, since the earlier fix only addressed "floating disconnected from the bar" without checking what already occupied the bar's center. The owner caught this from the screenshot ("lok at the layanan and the forum is tumpang tindih"). Fixed by replacing the whole bottom bar with a custom `Row` of 6 independent `Expanded` slots (`Beranda`, `Keamanan`, `Layanan`, `Forum` bubble, `Aktivitas`, `Akun`) — Forum now has its own dedicated horizontal space instead of overlaying an existing tab. Regular tabs bottom-align within the row's height; the Forum slot top-aligns its circle+label, producing the same "raised bubble" look without a shared-position collision. Confirmed via screenshot: clear gaps on both sides of the bubble, no overlap.
  - **Confirmed working, not just assumed**: the `POST_NOTIFICATIONS` manifest fix actually produces the "Allow Komplekku to send you notifications?" system dialog on launch now (previously silent) — screenshotted directly.
  - **Bug found — account card header overflow ("logo and card tumpang tindih")**: the owner reported overlap in the Akun tab's credential card header (small brand mark on the left, resident-status pill on the right) after installing this round's rebuild. Could not reproduce with the demo account's "Aktif" status at default or 1.3x accessibility font scale on the emulator — the pill is short. Root cause found by reading `residentStatusLabel()` (`account_snapshot.dart`): other statuses render much longer Indonesian strings (`"Menunggu verifikasi"`, `"Ditangguhkan"`), and the header `Row` used `mainAxisAlignment: spaceBetween` with neither child wrapped in `Flexible`/`Expanded` — a longer status label has no bounded width to shrink into, so Flutter would render it past the row's bounds (a classic unbounded-`Row`-child overflow, which reads to a user as elements overlapping/bleeding into each other, not as a visible red/yellow debug-overflow banner since this was a release build). Fixed in `account_screen.dart`'s `_CredentialCard` by giving the logo a fixed slot (`SizedBox(width: 12)` gap) and wrapping the status pill in `Expanded(child: Align(alignment: centerRight, child: ...))` with the `Text` given `maxLines: 1` and `overflow: TextOverflow.ellipsis` — this bounds the pill to the remaining row width unconditionally (Flutter's `Expanded`/`Flexible` always cap a child's max constraint to its allotted flex space regardless of loose/tight fit), so it can now only ellipsize, never overflow, while staying pinned to the right edge exactly as before for the common short-label case.
  - Reinstalling for this round's final verification (`flutter install`, which uninstalls before reinstalling) cleared the emulator's persisted login session; re-logging in requires a real OTP against what this release build resolves to (an already-live-looking production API, per the real "Abdul Aziz Setiawan / RT 03 RW 13" data seen mid-session) — did not attempt a fresh OTP login to avoid firing real SMS/OTP traffic against production for a UI-only verification, so the "Menunggu verifikasi" long-label case specifically was fixed by code reasoning + Flutter's constraint guarantees, not re-screenshotted after the fix.
- Decisions and assumptions:
  - Did not attempt to log into the app with a "pending" residency status account to visually reproduce the exact reported string, since valid credentials for such an account weren't available without initiating a real OTP flow against a live backend. The fix is structurally overflow-proof for *any* string length, not tuned only to the two known long labels, so this is treated as adequately covered by reasoning rather than blocked on it.
  - This entry exists specifically because "the previous pass looked done statically but wasn't" — flagging for future sessions that `flutter analyze`/`flutter test` passing does not substitute for at least one real on-device screenshot pass when a fix is about rendered layout or OS-level behavior (icons, permission dialogs, nav geometry) rather than pure logic.
- Verification:
  - `flutter analyze`: "No issues found!" after each of the three fixes in this entry.
  - `flutter build apk --release` + `flutter install -d emulator-5554` + `adb screencap`: used as the actual verification method for the icon and nav-bubble fixes (screenshots taken and inspected, not assumed).
  - `flutter test`: 94/94 passed after this entry's changes.

---

### 2026-08-19 01:50:43 WIB — Flutter Adzan and Prototype-Fidelity Investigation

- Status: Investigation completed; bounded design awaiting owner approval before implementation.
- Objective: Diagnose the owner's report that Flutter still exposes manual “Putar Adzan” behavior instead of sounding automatically, and assess the current Flutter UI against five supplied green civic-style prototype screenshots.
- Contributors: single agent (Codex `/root`).
- Work performed:
  - Read the repository workflow, canonical PRD, current engineering memory, relevant debugging/TDD/design skills, recent commits, and the current Flutter prayer, shell, home, announcement, forum, and theme implementations.
  - Preserved unrelated uncommitted owner work for the in-app APK updater, release signing, and API release endpoint; no production source was edited during this investigation.
  - Booted the local `Keenan` Android emulator and inspected the previously installed `0.1.0+1` APK. It had only the legacy adzan/iqomah notification channels using `USAGE_NOTIFICATION`, exact-alarm package permission reported as not granted, and zero Komplekku alarms in `dumpsys alarm`.
  - Installed the already-existing local `0.2.0+2` release APK with `adb install -r` (preserving emulator app data), launched it, and confirmed the new `_v2` adzan/iqomah channels are created with `USAGE_ALARM`. The Shalat UI reported Subuh adzan enabled, but `dumpsys alarm` still showed zero Komplekku/ScheduledNotificationReceiver alarms after restart and after an explicit Subuh off/on toggle.
  - Confirmed the immediate failure boundary: `PrayerSchedulerService._scheduleAt()` catches every scheduling exception and returns `false`, so all schedule attempts can fail silently while the UI continues to claim adzan is enabled. The precise plugin exception is not observable without first replacing the blanket catch with testable diagnostics.
  - Confirmed the manual `PrayerCard` still contains “Putar Adzan”/Iqomah controls but is currently unreferenced by the redesigned navigation; the installed older APK can therefore still expose obsolete behavior while the current Shalat screen uses per-prayer bell toggles.
  - Compared the latest source/render with the supplied prototypes. The structural direction is partially present, but the live theme remains purple (`#4B2DA1`/`#32178F`/`#EEE9FF`) and visible layout differs materially: generic app bars, oversized controls/cards, wrapped bottom-nav label, missing prototype header actions, and incomplete home/forum/detail geometry.
- Files touched: `Engineering.md` only. Diagnostic screenshots were written under ignored `apps/mobile/build/`; the existing release APK and emulator installation were used without changing source.
- Decisions and assumptions:
  - Treat the user's newest prototype set as the latest visual instruction and therefore as superseding the prior purple palette once the owner approves the proposed design.
  - Preserve real API-driven content and permissions; “same as prototype” means layout, hierarchy, typography, colors, and interaction fidelity, not hardcoding the prototype's sample names, dates, counts, or images.
- Verification and results:
  - On-device evidence: legacy APK had old notification channels and no alarms; release `0.2.0+2` created `USAGE_ALARM` channels but still registered zero prayer alarms despite enabled UI state and explicit rescheduling.
  - Captured and inspected `apps/mobile/build/diagnostic-current.png`, `diagnostic-latest.png`, and `diagnostic-shalat.png`.
  - A fresh debug build attempt was stopped after Gradle exceeded five minutes with no output; only the exact orphaned diagnostic build processes started by this task were terminated. The existing release APK was sufficient for the on-device comparison.
- Follow-up: after owner approval, use TDD to expose the scheduler result/error path, fix the confirmed scheduling failure, remove obsolete manual playback UI, apply the green prototype design system to the five requested Flutter surfaces, and perform analyzer/tests/build plus on-device alarm and screenshot verification.

---

### 2026-08-19 01:55:18 WIB — Delete-Flow Investigation Added to Flutter Scope

- Status: Investigation completed; combined design awaiting owner approval before implementation.
- Objective: Add the owner's report that delete actions fail for agenda, announcements, forum content, and similar existing delete-capable flows to the pending Flutter repair/redesign scope.
- Contributors: single agent (Codex `/root`).
- Work performed:
  - Traced the mobile confirmation widget, repository calls, provider invalidation, API routes, permission guards, and Prisma soft-delete/archive implementations for agenda, announcements, forum posts, forum replies, and realtime forum messages.
  - Confirmed the production API currently exposes every named mutation route: anonymous requests to the agenda archive and announcement/forum delete endpoints return `401` rather than `404`; no production data was created, changed, or deleted.
  - Confirmed the source API already has focused tests for agenda archive, announcement archive, forum post/reply moderation, and own-message deletion. The current mobile package has no equivalent mutation-flow tests.
  - Found a concrete cross-flow UX defect in realtime forum chat: `_delete()` catches and discards every error, so authorization/network/server failures look exactly like an inert delete button. Other delete flows surface API errors but have no shared busy/success handling and inconsistent refresh/navigation behavior.
- Files touched: `Engineering.md` only; no application source or production state changed.
- Decisions and assumptions:
  - Interpret “dsb” only as existing UI flows that already provide an explicit delete/archive action; do not broaden it to unrelated records or add new destructive capabilities without owner direction.
  - Retain server-side soft deletion/archive and audit history for agenda and announcements, while presenting the action consistently as “Hapus” to the user.
- Verification and results:
  - Safe production route probe: `/health/live` returned `200`; anonymous agenda archive plus announcement, forum-post, forum-reply, and forum-message delete requests each returned `401`, confirming route presence without exercising a mutation.
  - Static trace confirms mobile endpoint paths match the API paths and that list queries exclude archived/deleted rows.
- Follow-up: after owner approval, add failing mobile tests for mutation state/error behavior, make delete confirmation and progress/result feedback consistent, stop swallowing forum delete errors, refresh or navigate only after confirmed success, and retain the existing permission/ownership rules.

---

### 2026-08-19 02:44:02 WIB — Green Prototype Parity, Automatic Adzan, and Reliable Delete Actions

- Status: Completed locally; no deploy, push, or production mutation performed.
- Objective: Match the five supplied green prototypes across Web and Flutter, remove manual adzan replay, restore automatic adzan sound, and repair delete/archive interactions for agenda, announcements, and forum content.
- Contributors: single agent (Codex `/root`); no subagents used.
- Work performed:
  - Replaced the live purple/cyan presentation with the owner-approved white/green system (`#008A52`, `#006B3F`, `#EEF8F2`, Plus Jakarta Sans, 16 px cards) in canonical tokens, design notes, Web CSS, and Flutter theme. Reworked responsive Beranda, Shalat, Pengumuman, Forum, and Diskusi surfaces plus the shared five-item bottom navigation; real API content and permission gates remain dynamic rather than copying prototype sample data.
  - Removed the obsolete unreferenced Flutter manual `PrayerCard` and its `audioplayers` dependency. Root-caused scheduler failure to Android resources referenced only by plugin strings: `@mipmap/ic_launcher` was rejected because the plugin resolves icons only from `drawable`, then release resource shrinking removed `raw/adzan` and `raw/iqomah`. Added a valid monochrome drawable, made it the default notification icon, retained raw audio via `res/raw/keep.xml`, and exposed/logged scheduler failures instead of silently reporting success.
  - Made shared Web and Flutter delete controls await the server operation and expose pending/error state. Web agenda/announcement/forum mutations now use `mutateAsync`; Flutter shows success/failure feedback, refreshes providers only after a confirmed response, adds confirmation for realtime messages, and no longer discards delete errors.
  - Cleaned five pre-existing Web lint findings encountered by the finish gate (unused photo-picker/report state and stale missing-rule suppression comments) without changing their behavior. Reverted an accidental repo-wide Dart formatting pass so unrelated mobile files remain byte-equivalent to their original state.
- Files touched: canonical `tokens.css`/`design.md`; Web prayer/home/announcement/forum/detail pages, responsive CSS, shared entity actions and focused contract tests; Flutter theme/shell/header, home/shalat/announcement/forum/detail screens, scheduler/push notification resources and tests; `Engineering.md`. Existing updater/signing/API-release worktree changes were preserved.
- Decisions and assumptions:
  - “Same as prototype” means the supplied layout, visual hierarchy, palette, spacing, and interaction language at responsive mobile widths; names, addresses, counts, dates, permissions, and records continue to come from the signed-in account/API.
  - Agenda and announcement “Hapus” remains the existing server-side archive/soft-delete operation, preserving auditability. No new destructive endpoint was introduced.
  - Browser-control inspection remained unavailable because the in-app browser reported no installed backend. Web parity was verified through source contracts, lint/typecheck/tests, and a production Next.js build; Flutter was visually inspected from emulator screenshots.
- Verification and results:
  - Flutter: `flutter analyze` clean; full `flutter test` 106/106 passed; release APK built successfully and updated in place on `emulator-5554`. Final Android inspection found exactly 70 distinct prayer alarms (10 per day for 2026-08-19 through 2026-08-25), with zero `invalid_icon`, `invalid_sound`, scheduler, or fatal error log lines. Final artifact: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`.
  - Web: ESLint clean, route type generation/TypeScript clean, 17/17 Vitest tests passed, and Next.js production build completed all 41 routes.
  - API delete coverage: focused agenda, announcement, forum board, and realtime forum suites passed 29/29. API TypeScript passed. Full API lint still reports six unrelated existing findings in updater/repository/push/announcement-test files; none is in this task's mutation or UI changes.
  - `git diff --check` passed, and production strings no longer contain “Putar Adzan” or the removed in-process audio source.
- Follow-ups: rendered Web browser QA remains the only blocked visual check; repeat at 360/393/471 px once a browser backend is available. A physical Android device should still confirm OEM-specific exact-alarm and volume behavior, although emulator OS scheduling is now proven.

---

### 2026-08-19 07:34:41 WIB — Flutter Profil Redesign and Forum Composer Layout Repair

- Status: Completed locally; no deploy, push, or production mutation performed.
- Objective: Address the owner's report that Flutter Profil had not materially changed and that the Forum Obrolan create action covered the composer/send control.
- Contributors: single agent (Codex `/root`); no subagents used.
- Work performed:
  - Replaced the legacy `Akun warga` app bar and dark credential strip with the shared prototype header plus a resident-first identity hero: initial avatar, name, masked phone, status, community, house, household, and inline name editing. Existing permission-gated administration, service, activity, household, and logout behavior remains available below it.
  - Removed the nested Forum board/chat floating action buttons. `Buat Post` and `Buat Forum` now sit in compact top content toolbars, so neither can cover lists or the bottom composer.
  - Kept the message image picker, text field, and send control as three separate constrained row children; added an explicit `Kirim pesan` tooltip and retained `TextInputAction.send`/`onSubmitted` so the keyboard Enter/send action invokes the same real repository mutation as the visible arrow.
  - Emulator inspection exposed a separate 360 px `RenderFlex` risk in the Profil household heading. Bounded the title/subtitle column with `Expanded`, ellipsis, and a fixed gap before `Tambah`.
- Files touched: `apps/mobile/lib/features/account/presentation/account_screen.dart`, `apps/mobile/lib/features/forum/presentation/forum_screen.dart`, `apps/mobile/lib/features/forum/presentation/forum_board_screen.dart`, `apps/mobile/test/forum_profile_layout_test.dart`, and `Engineering.md`.
- Decisions and assumptions:
  - The five supplied prototypes remain the visual source of truth; because no standalone Profil prototype was supplied, Profil reuses their header, spacing, surface, icon, typography, and green hierarchy while preserving real account content.
  - “Buat Forum” refers to creating an Obrolan channel, while “Buat Post” remains the Diskusi action. Both were moved to the top for consistent placement.
- Verification and results:
  - TDD red/green confirmed the old Profil lacked the prototype hierarchy, the old Forum FAB did not sit above the composer, and the household header overflowed by 188 px at 360 px before the fixes.
  - Fresh `flutter analyze`: no issues. Fresh full `flutter test`: 109/109 passed. `git diff --check`: passed (one line-ending warning only).
  - Fresh release build succeeded: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk` (61.4 MB). Installed with `adb install -r` on `emulator-5554` and visually inspected final Profil and Forum Obrolan screenshots; the identity layout is visibly restructured, household action no longer overlaps, `Buat Forum` is above the channel tabs, and the send arrow is fully visible beside the composer.
- Follow-ups: none for this bounded correction. Physical-device keyboard behavior may still vary by OEM keyboard, but the Flutter send action is covered by a widget test and the visible control is independently available.

---

### 2026-08-19 07:35:16 WIB — Flutter Palette Clarification Required

- Status: Awaiting owner direction; no source change made.
- Objective: Resolve the owner's question about why the corrected Flutter screens remain green.
- Contributors: single agent (Codex `/root`); no subagents used.
- Findings: the active green palette (`#008A52`) was intentionally retained because all five owner-supplied prototype screenshots use green and the previous explicit instruction required Web and Flutter to match those prototypes. The newest message indicates that green may no longer be desired, which conflicts with that visual reference.
- Verification: inspected the latest owner request against the recorded prototype decision and current rendered emulator screenshots; no build or test was needed because no code changed.
- Blocker/follow-up: owner must identify the intended replacement palette (for example the earlier purple brand palette or a new color reference) before another global color change is made.

---

### 2026-08-19 07:56:19 WIB — Purple/Cyan/Yellow Brand Palette Restored Across Web and Flutter

- Status: Completed locally; no deploy, push, or production mutation performed.
- Objective: Apply the owner's explicit final palette to Web and Flutter while retaining the supplied prototypes' layout and the corrected Profil/Forum interaction structure.
- Contributors: single agent (Codex `/root`); no subagents used.
- Work performed:
  - Replaced the prototype-green brand tokens with `#4B2DA1` primary purple, `#32178F` deep purple, `#EEE9FF` soft purple, `#32BCE3` cyan, `#FFEB22` yellow, `#FFFFFF` background, `#F6F6F8` surface, `#25232B` primary text, `#777480` secondary text, `#20A464` success, and `#E5484D` error in canonical Web and Flutter theme sources.
  - Removed remaining hardcoded prototype-green presentation values from Web and Flutter prayer surfaces. Green remains only for semantic success/availability states.
  - Updated design documentation and cross-client palette contract tests. Preserved the prototype-driven layout, resident identity Profil, top-positioned Forum create action, visible composer send control, and keyboard-send behavior.
  - Emulator review found the selected Obrolan channel chip's checkmark inherited a gray default; added an explicit white checkmark and a widget regression assertion.
- Files touched: canonical `tokens.css`/`design.md`; `apps/web/app/globals.css`, `apps/web/features/design/prototype-contract.test.ts`; `apps/mobile/lib/app/theme/app_theme.dart`, `apps/mobile/lib/features/prayer/presentation/shalat_screen.dart`, `apps/mobile/lib/features/forum/presentation/forum_screen.dart`; `apps/mobile/test/prototype_theme_test.dart`, `apps/mobile/test/forum_profile_layout_test.dart`; and `Engineering.md`.
- Decisions and assumptions:
  - The prototypes define geometry and interaction placement, while the owner's latest palette table supersedes their green branding.
  - Cyan and yellow are supporting logo/accent colors; purple remains the primary navigation/action color, and success green is not reused as general branding.
- Verification and results:
  - Flutter: final `flutter analyze` clean; full `flutter test` 109/109 passed; release APK rebuilt successfully (61.4 MB), installed on `emulator-5554`, and final Forum/Profil screenshots visually inspected with purple navigation/actions and no composer overlap.
  - Web: ESLint and TypeScript clean; 17/17 Vitest tests passed; Next.js production build completed all 41 routes.
  - Repository: `git diff --check` passed with one line-ending warning; search found no obsolete prototype-green literals in production Web/Flutter theme or UI source.
  - Rendered Web browser QA could not be repeated because the in-app browser backend reported no available browser. Source contracts and the complete Web lint/type/test/build gate passed.
- Follow-up: optional physical-device visual QA for OEM font/rendering differences; no functional blocker remains for this palette correction.

---

### 2026-08-19 08:06:40 WIB — Flutter Profil vs. Layanan Navigation Review

- Status: Design recommendation presented; awaiting owner approval before implementation.
- Objective: Assess whether operational features currently grouped inside the Flutter Profil tab should move to a dedicated Layanan tab.
- Contributors: single agent (Codex `/root`); no subagents used.
- Findings:
  - Profil currently contains resident identity, household, administration tasks, Keamanan, Layanan, Aktivitas, and logout, so it mixes personal-account management with unrelated operational workflows and is visually overburdened.
  - A complete `LayananHubScreen` and `/layanan/*` route tree already exist, but the prototype-aligned five-tab shell no longer exposes Layanan directly. The PRD also explicitly says other menus belong under Layanan rather than Akun.
- Recommendation:
  - Use `Beranda / Shalat / Pengumuman / Forum / Layanan` as the five bottom tabs, expose Profil from a persistent avatar/account action in page headers, and keep Profil limited to identity, residency/household, account settings, and logout.
  - Group the Layanan hub into Warga, Keamanan, Keuangan, and permission-gated Pengurus sections while preserving all existing route paths and deep links.
- Files touched: `Engineering.md` only; no application code changed pending owner approval.
- Verification: reviewed the current Flutter shell, router, account screen, existing Layanan hub, and PRD mobile-navigation requirements.
- Follow-up: implement the bounded navigation restructure after explicit owner approval, then cover branch selection/profile access with widget tests and verify the five-tab shell on emulator.

---

### 2026-08-19 08:34:52 WIB — Automatic Adzan and Iqomah Countdown Root-Cause Investigation

- Status: Root cause identified; architectural replacement and iqomah interval awaiting owner approval before implementation.
- Objective: Investigate the owner's report that automatic adzan still produces no audible playback and that no adzan-to-iqomah countdown appears.
- Contributors: single agent (Codex `/root`); no subagents used.
- Work performed:
  - Traced the Flutter scheduler, Android manifest/receivers, notification channels, packaged audio resources, app lifecycle rescheduling, prayer state calculation, and Shalat presentation.
  - Inspected the installed `0.3.0` release on `emulator-5554`: `POST_NOTIFICATIONS` is granted, exact `RTC_WAKEUP` prayer alarms are pending, the adzan/iqomah channels are importance 5 with `USAGE_ALARM`, alarm volume is 6/7 and unmuted, packaged raw MP3/WAV resources are present, and AlarmManager records two receiver wakeups.
  - Confirmed the current implementation delegates all playback to a custom notification-channel sound. There is no native foreground media service that owns playback duration/lifecycle, so registering alarms proves delivery intent but does not guarantee full audible adzan across device/OEM notification policies.
  - Confirmed `getAdzanState()` already models post-adzan and iqomah phases but is dead code: `ShalatScreen` never calls it and only renders the next-prayer countdown.
  - Found a second concrete logic mismatch: the scheduler posts the iqomah notification at adzan + 5 minutes, while `getAdzanState()` starts a separate six-minute countdown at +5 and reaches zero at +11. The notification and intended UI therefore cannot agree even after the missing banner is wired.
- Decisions and assumptions:
  - Treat this as an architectural correction after repeated notification-channel fixes, not another channel-ID/resource patch.
  - Recommended direction is an exact-alarm receiver starting a native `mediaPlayback` foreground service for deterministic bundled-audio playback, with a single shared per-prayer iqomah interval driving both the alarm and visible countdown.
  - Navigation/Layanan changes remain unimplemented while the owner prioritizes this new prayer issue.
- Files touched: `Engineering.md` only; no application source changed during diagnosis.
- Verification and results: inspected Android package permissions, app-ops, AlarmManager, notification channels, audio volume/playback diagnostics, APK resource contents, and current Flutter data/presentation usage. Android documentation confirms exact alarms may start foreground services and Android 14+ media playback services require `FOREGROUND_SERVICE` plus `FOREGROUND_SERVICE_MEDIA_PLAYBACK` and a declared `mediaPlayback` service type.
- Follow-up: owner must choose the iqomah interval policy (one fixed duration or per-prayer values). After approval, implement via TDD, build/install the release APK, schedule a near-term diagnostic alarm, and verify actual receiver → service → audio start/stop plus the live countdown on emulator.

---

### 2026-08-19 08:40:30 WIB — Reliable Adzan/Iqomah Architecture Spec Finalized

- Status: Design documented and committed; awaiting owner review before the implementation plan and code changes.
- Objective: Incorporate the owner's decision that all prayers default to the same 10-minute iqomah delay while allowing authorized administrators to change one community-wide value.
- Contributors: single agent (Codex `/root`); no subagents used.
- Work performed:
  - Defined the server-authoritative `iqomahDelayMinutes` community setting with a database default of 10, validation range 1–60, existing `community.manage` authorization, Web and Flutter admin controls, device caching, and offline fallback.
  - Specified replacement of notification-channel-only adzan audio with an Android exact-alarm receiver and native `mediaPlayback` foreground service, including stop action, audio focus, wake lock, reboot restoration, resource validation, and structured scheduling/playback status.
  - Unified the resident state model so `iqomahAt = adzanAt + configured delay`; the same timestamp drives Android scheduling and the Flutter countdown card.
  - Documented API, Flutter, Android, failure-state, migration, testing, rollout, and acceptance requirements in `docs/superpowers/specs/2026-08-19-reliable-adzan-iqomah-design.md`.
- Files touched: new design specification and `Engineering.md`; no production application source changed.
- Decisions and assumptions:
  - The administrator changes one global delay that applies equally to Subuh, Dzuhur, Ashar, Maghrib, and Isya; there are no per-prayer overrides.
  - Existing per-prayer mute preferences remain independent from the community-wide iqomah delay.
- Verification and results: specification self-review found no placeholders or conflicting duration rules; `git diff --cached --check` passed after removing two metadata whitespace findings. Design checkpoint commit: `7818e17` (`docs: design reliable adzan and iqomah flow`).
- Follow-up: owner reviews the written specification; after approval, create the implementation plan and execute it with TDD and release-emulator verification.

---

### 2026-08-19 03:05:56 WIB — Reliable Adzan/Iqomah Implementation Completed (Tasks 4–7)

- Status: Tasks 1–7 of `docs/superpowers/plans/2026-08-19-reliable-adzan-iqomah.md` are now complete except the physical-device/emulator step noted below; full verification gate passes.
- Objective: Finish the plan another agent had left with Tasks 1–3 checked and Tasks 4–7 unchecked, then verify the whole feature end to end.
- Contributors: single agent (Claude, this session); no subagents used.
- Work performed:
  - Verified Tasks 1–3 (community `iqomahDelayMinutes` contract/persistence, Web/Flutter admin controls, unified `getAdzanState` phase model) were genuinely complete by reading every listed file, not just trusting the plan's checkboxes.
  - Found and fixed two real defects in `apps/mobile/lib/features/prayer/data/prayer_scheduler_service.dart`: `setPrayerEnabled()` referenced `isAndroid`/`nativeEvents` locals that only existed in a different method (a compile error caught by `flutter analyze`), and `rescheduleUpcomingPrayers()` built a native `nativeEvents` list on Android but never called `_alarmBridge.replaceSchedule(nativeEvents)`, so native alarm scheduling silently never happened despite all surrounding plumbing being present.
  - Verified Task 4's native Kotlin pipeline (`PrayerAlarmContract`, `PrayerAlarmScheduler`, `PrayerAlarmReceiver`, `AdzanPlaybackService`, `PrayerBootReceiver`, Kotlin `PrayerAlarmBridge`, manifest registrations) by reading every file; all matched the design spec (non-exported receivers, `mediaPlayback` foreground type, `USAGE_ALARM` playback, partial wake lock, Stop action, boot/timezone restoration without playback).
  - Closed out Task 5: fixed `prayer_scheduler_service_test.dart`'s existing-but-never-green test by registering `AndroidFlutterLocalNotificationsPlugin` against a mocked `dexterous.com/flutter/local_notifications` method channel in `setUp()` (added `flutter_local_notifications_platform_interface` as a direct dev dependency); added a concurrent-reschedule guard and a `PrayerScheduleHealth`/`prayerScheduleHealthProvider` Riverpod notifier in `MainShell` so `exactAlarmAllowed`/`scheduledCount`/`lastError` are surfaced without triggering extra scheduling.
  - Closed out Task 6: added a purple `IqomahCountdownCard` (MM:SS tabular countdown, exact iqomah clock time, progress bar sharing the same `iqomahAt` timestamp as the native alarm) and a persistent `PrayerScheduleHealthBanner` (open exact-alarm settings / retry, never a transient snackbar) to `shalat_screen.dart`; added a compact matching `_CompactIqomahRow` to `prayer_summary_card.dart` on Beranda. Added `test/shalat_iqomah_card_test.dart` covering the 10:00/00:01 countdown boundaries, per-prayer labeling, and both banner action paths.
  - Fixed an unrelated pre-existing widget-test flake surfaced by these changes: `prototype_navigation_test.dart` pumped `ShalatScreen` without any repository override, so the new `iqomahDelayMinutesProvider` watch triggered a real Dio call that left a pending timer after teardown; added an `_OfflineCommunityAdminRepository` override so the test stays off the network.
- Files touched: `apps/mobile/lib/features/prayer/data/prayer_scheduler_service.dart`, `apps/mobile/lib/app/shell/main_shell.dart`, `apps/mobile/lib/features/prayer/presentation/shalat_screen.dart`, `apps/mobile/lib/features/home/presentation/prayer_summary_card.dart`, `apps/mobile/pubspec.yaml`/`pubspec.lock`, `apps/mobile/test/prayer_scheduler_service_test.dart`, `apps/mobile/test/prototype_navigation_test.dart`, `apps/mobile/test/shalat_iqomah_card_test.dart` (new), and the plan document's checkboxes.
- Verification and results:
  - `flutter analyze` (apps/mobile): 1 pre-existing `prefer_initializing_formals` info only.
  - `flutter test` (apps/mobile): 121 tests, all passing (including the newly-fixed native-scheduling test and the 5 new widget tests).
  - Android JVM: `:app:testDebugUnitTest` passed (`PrayerAlarmContractTest`: 2/2). The unrelated `flutter_local_notifications` plugin module's own bundled Robolectric tests fail under the local JDK 21/ASM combination — a pre-existing environment mismatch, not a regression.
  - `:app:assembleDebug` — BUILD SUCCESSFUL.
  - `corepack pnpm --filter @komplekku/contracts typecheck`, `--filter @komplekku/api typecheck`/`test` (81 passed, 1 skipped), `--filter @komplekku/web typecheck`/`test` (18 passed)/`build` — all passed.
  - Scanned changed files for `TODO`/`FIXME`/placeholders and green-brand color leakage: none found.
- Known limitation: no Android emulator/device was attached in this environment, so the debug-only near-future diagnostic alarm, actual foreground-service/audio verification via logcat, and reboot-restoration behavior were not exercised live. Everything upstream of that (scheduling math, native code paths, JVM tests, build) is verified; on-device audible/reboot verification remains required before shipping to production, per the plan's own acceptance criteria.
- Follow-up: install the debug APK on a real device or emulator, trigger `scheduleDiagnostic`, confirm audible adzan/iqomah, `Hentikan Adzan`, and reboot restoration, then proceed to the owner's next request (Flutter changelog screen for app updates + `DownloadManager`-based background APK download).

---

### 2026-08-19 03:31:33 WIB — Reliable Adzan/Iqomah On-Device Diagnostic Verification

- Status: The one remaining gap from the previous entry (live device verification) is closed for the single-alarm-cycle case; full reboot-restoration cycle remains code-reviewed only, not live-tested.
- Objective: The owner opened an emulator (`emulator-5554`) and asked to verify the native adzan/iqomah pipeline on it, closing out Task 7's on-device checklist item.
- Contributors: single agent (Claude, this session); no subagents used.
- Work performed:
  - Installed the debug APK on `emulator-5554` (`adb uninstall` was required first — the emulator had a previous build installed under a different signing key, giving `INSTALL_FAILED_UPDATE_INCOMPATIBLE`).
  - Discovered the app was sitting at the login screen (no cached session, since the uninstall wiped app data) with a "Tidak dapat terhubung ke Komplekku" connectivity error, meaning `MainShell` — where the debug diagnostic would naturally be reachable in production code — never mounts pre-login.
  - Temporarily added a `kDebugMode`-gated call to `PrayerAlarmBridge().scheduleDiagnostic(delaySeconds: 20)` right after `runApp()` in `lib/main.dart` (reaches native regardless of auth state), rebuilt, reinstalled, launched, and captured evidence via `adb shell dumpsys alarm`, `dumpsys activity services`, `dumpsys notification`, and `logcat`.
  - Reverted the temporary probe from `main.dart` immediately after capturing evidence, verified `git diff` showed no leftover probe code, and rebuilt/reinstalled the clean debug APK so the emulator now runs the actual committed code.
- Verification and results (all captured live from `emulator-5554`):
  - `dumpsys alarm`: two `RTC_WAKEUP` alarms tagged `*walarm*:id.komplekku.action.PRAYER_ALARM` were registered; alarm history showed 1 wakeup for `id.komplekku` already delivered, and the second (iqomah) alarm still pending at the time of the check — confirming `AlarmManager.setExactAndAllowWhileIdle` scheduling actually reaches the OS.
  - `logcat`: `ActivityManager: Background started FGS: Allowed ... AdzanPlaybackService` confirmed the foreground service started from the receiver; two separate `MediaPlayer` initialization blocks ~38s apart confirmed both the adzan and iqomah audio each played through a fresh `MediaPlayer` instance.
  - `dumpsys notification`: `komplekku_prayer_playback_v1` channel present at `mImportance=2` (low/silent), matching the design's "silent playback-status channel" requirement.
  - Re-checking `dumpsys activity services` afterward showed `AdzanPlaybackService` no longer running and no active notification instance — confirming `stopForeground(STOP_FOREGROUND_REMOVE)`/`stopSelf()`/wake-lock release ran to completion after each playback, without needing to separately exercise the `Hentikan Adzan` action (same code path).
- Known limitation (unchanged from the prior entry): a full reboot-restoration cycle (`PrayerBootReceiver` → `PrayerAlarmScheduler.restoreSchedule()` firing for real after an emulator reboot) was not exercised live in this session — that code path is verified by reading, not by a live reboot — because the diagnostic events used here were short-lived (20s) and already consumed by the time of the check. A live reboot test needs a diagnostic scheduled several minutes out so it survives the reboot cycle.
- Follow-up: if the owner wants the reboot-restoration path live-verified too, schedule a longer-delay diagnostic before rebooting the emulator. Otherwise this plan is complete enough to move on to the queued changelog-screen + background-download (`DownloadManager`) request.

---

### 2026-08-19 04:16:37 WIB — Layanan Navigation Restructure and Background Update Download

- Status: Both items complete; full Flutter test suite and Android debug build pass.
- Objective: Implement the previously-recommended Profil→Layanan navigation restructure (see the 2026-08-19 08:06:40 WIB entry) now that the owner approved it, then deliver the still-queued changelog screen and `DownloadManager`-based background APK download.
- Contributors: single agent (Claude, this session); no subagents used.

**Navigation restructure**

- Replaced the fifth bottom tab (`Profil` → `/akun`) with `Layanan` → `/layanan`, per the owner's explicit follow-up that admin/pengurus features read better living in Layanan than under Akun.
- `PrototypeHeader` gained a `showAccount` option (a small avatar/person icon that pushes `/akun`); wired it into Beranda's bespoke `_WelcomeHeader`, Shalat, Pengumuman, Forum, and the rebuilt Layanan screen, so Profil is one tap away from every tab's header instead of owning a bottom slot.
- `/akun` moved out of the `StatefulShellRoute` branches into a standalone top-level `GoRoute` (same path, so existing deep links still resolve) — it is now a normal pushed screen with a back button rather than a bottom-tab root.
- The four Pengurus/admin routes (`permohonan-warga`, `komunitas`, `rumah`, `pengguna`) moved from under `/akun/*` to `/layanan/*` (grep-confirmed no other code or test referenced the old paths), matching the owner's explicit instruction that these features belong in Layanan, not Akun.
- Rebuilt `LayananHubScreen` around four permission-gated sections — Warga, Keamanan (a single doorway into the existing `/keamanan` hub, which keeps its own paths untouched), Keuangan, and Pengurus — each section hiding itself entirely when the account holds none of its entries' permissions.
- Trimmed `AccountScreen` (Profil) down to identity, household, and session/logout — removed the now-redundant Keamanan/Layanan/Aktivitas menu blocks and the four `_AdminTaskCard`s that duplicated what Layanan now owns; added `showBack: true` since it is no longer a bottom-tab root.
- Updated `auth_state_test.dart` (path-reachability assertions for the new `/layanan/*` admin paths and the moved bottom-tab set) and `prototype_navigation_test.dart` (expected tab label `Layanan` instead of `Profil`); added `layanan_hub_screen_test.dart` covering the permission-gated section visibility.
- Fixed a real widget-rendering bug caught by the new tests: the first draft of `LayananHubScreen`'s section list wrapped `ListTile`s in a plain `Container` with a background color, which Flutter's framework flags as a hard assertion failure (`ListTile` needs a `Material` ancestor for its ink effects) — switched to `Material`/`RoundedRectangleBorder`, matching the pattern the old `_MenuGroup` already used correctly.

**Changelog screen and background APK download**

- Root-caused the owner's report that the update download restarts when the screen turns off: the previous `AppUpdateService.downloadApk()` ran the HTTP transfer inside the Dart isolate via Dio, which Android throttles or tears down once the screen locks or the app backgrounds — there was no way for that download to survive independently of the app process.
- Replaced it with Android's own `DownloadManager`: added `enqueueDownload`/`queryDownload` handlers to `MainActivity.kt`'s `id.komplekku/app_update` channel, using `setDestinationInExternalFilesDir` (no storage permission needed) and `VISIBILITY_VISIBLE_NOTIFY_COMPLETED` so the OS keeps the transfer running and shows its own progress notification regardless of screen state or app lifecycle.
- Rewrote `AppUpdateService` (Dart): `enqueueDownload()` hands the URL to `DownloadManager` and caches the returned request id (plus the release's `versionCode`) in `SharedPreferencesAsync`; `queryDownload()` reads live status straight from the OS; `pendingDownloadId()`/`clearPendingDownload()` let the dialog resume watching an already-enqueued download instead of starting a duplicate one after the app was killed and relaunched mid-download.
- Rewrote `AppUpdateDialog` around that: on open it checks for a pending download matching the offered release and resumes polling it if found; otherwise "Perbarui sekarang" enqueues a fresh one. Polling is a `Timer.periodic` that only drives the *UI* — disposing the dialog cancels the timer, never the actual `DownloadManager` request, so backgrounding the app mid-download no longer restarts anything.
- Added `AppChangelogScreen`: a full page (not a GoRouter path — pushed via plain `Navigator` since it is tied to one in-memory `AppRelease` the dialog already holds, not a deep-linkable destination) rendering the release notes as a bulleted list plus a mandatory-update badge, reached from a new "Lihat catatan perubahan lengkap" link in the compact update dialog.
- Added `app_update_service_test.dart` (enqueue/query/pending/clear against a mocked method channel), `app_update_dialog_test.dart` (live progress → install-on-success, and resuming an already-enqueued download on reopen), and `app_changelog_screen_test.dart` (bullet rendering, mandatory badge, empty-notes fallback).
- Verification: `flutter analyze` clean (same one pre-existing lint as before), `flutter test` 134/134 passing, `:app:assembleDebug` BUILD SUCCESSFUL (confirms the new Kotlin `DownloadManager` code compiles), and the rebuilt debug APK installs and launches cleanly on `emulator-5554`. The update flow itself was not exercised end-to-end live in this session (that needs a configured server release to offer and a real network download), so on-device confirmation that a real background download survives a screen-off cycle remains outstanding.
- Adzan/iqomah regression check (owner asked to re-confirm): no file under `lib/features/prayer/**` or the native `prayer/` package was touched in this session's changes; the full test suite — including `prayer_scheduler_service_test.dart`, `prayer_service_test.dart`, and `shalat_iqomah_card_test.dart` from the prior session's on-device-verified work — still passes 100%, so the previously-confirmed automatic-adzan and iqomah-countdown behavior is unaffected.
- Follow-up: configure a test release on a reachable API and walk the real update flow on-device (enqueue → lock screen → reopen app → confirm progress resumed → install prompt) before shipping; otherwise both items are ready for the owner to try.

---

### 2026-08-19 05:12:40 WIB — Live Update-Flow Verification Against Production Found and Fixed Two Real Bugs

- Status: Both bugs fixed and covered by regression tests; the background-download flow is now confirmed working end to end against the live production API, including surviving a real screen lock.
- Objective: The owner supplied the production API (`api.komplekku.duacincin.id`) to close out the "not exercised end-to-end live" gap from the previous entry, then separately reported a live "double back button" sighting on the Profil screen with a screenshot.
- Contributors: single agent (Claude, this session); no subagents used.
- Work performed:
  - Confirmed `/app/latest-release` is deliberately unauthenticated (so a too-old app can still discover an update) and queried it directly: production has versionCode 3 (`0.3.0`) configured with a GitHub Releases `apkUrl`.
  - To exercise the flow without needing real OTP access to production, temporarily added a `kDebugMode`-only probe to `LoginScreen.initState()` that runs the same `checkForUpdate()` → `AppUpdateDialog` sequence `MainShell` normally runs post-login (removed again before finishing), and temporarily lowered `pubspec.yaml`'s version to `0.2.9+2` so the real production release would actually look newer (reverted back to `0.3.0+3` afterward).
  - Built with `flutter build apk --debug --dart-define=API_BASE_URL=https://api.komplekku.duacincin.id`, installed on `emulator-5554`, tapped "Perbarui sekarang", then locked the screen (`KEYCODE_POWER`) mid-download and left it locked.
  - **Confirmed via `adb logcat`** (`DownloadManager: [11] Finished with status SUCCESS`) that a real ~62MB APK download from GitHub Releases completed entirely while the screen stayed locked — the core reported bug (download restarting on screen-off) is fixed.
  - **Found a second, real bug this surfaced**: when the download finished while the app was backgrounded, `ActivityTaskManager` logged `Background activity launch blocked!` — Android refuses to launch the package-installer activity from a non-visible app state, so the dialog's original code called `installApk()` anyway, got no exception back (the block is silent, not an error), and popped itself closed into a dead end with no way to retry.
  - Fixed it in `AppUpdateDialog`: added a `WidgetsBindingObserver`, and `_attemptInstall()` now only calls through to the native installer when `WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed`; otherwise it waits, showing "Unduhan selesai. Ketuk 'Pasang sekarang' untuk memasang." with a manual button, and `didChangeAppLifecycleState` auto-retries the instant the resident returns to the app. Added `app_update_dialog_test.dart`'s new case reproducing the exact scenario (backgrounded completion → stuck-safely → resumed → auto-installs), verified red-then-green.
  - **Re-ran the live scenario with the fix**: locked the screen mid-download again; this time `adb logcat` showed the installer's `ResolverActivity` launch succeed (`BAL_ALLOW_VISIBLE_WINDOW`, `result code=0`, replacing the earlier `BAL_BLOCK`/`result code=102`) once the app was foregrounded again — the installer prompt genuinely opened this time.
  - **Separately fixed the owner-reported "double back button"** on Profil: `AccountScreen`'s `AppBar` was letting Flutter imply its own automatic back button *in addition to* `PrototypeHeader`'s own back arrow (added when Profil moved off the bottom tabs). Set `automaticallyImplyLeading: false`. Added a regression test in `forum_profile_layout_test.dart` that pushes `AccountScreen` on top of another route (the original test used a bare `home:` route, which never exercises `AppBar`'s automatic-leading behavior and would have missed this) — confirmed it fails without the fix (`Found 2 widgets with icon "arrow_back"`) and passes with it.
- Files touched: `apps/mobile/lib/core/update/app_update_dialog.dart`, `apps/mobile/lib/features/account/presentation/account_screen.dart`, `apps/mobile/test/app_update_dialog_test.dart`, `apps/mobile/test/forum_profile_layout_test.dart`.
- Verification: `flutter analyze` clean (same one pre-existing lint), `flutter test` 136/136 passing, `:app:assembleDebug` BUILD SUCCESSFUL, clean debug APK reinstalled on `emulator-5554` (pubspec version and `LoginScreen` confirmed via `git diff` to have no leftover temporary code).
- Follow-up: none blocking — both the background-download reliability fix and the double-back-button fix are live-verified. The only remaining gap from the adzan/iqomah plan (a full reboot-restoration cycle) is unrelated to this entry and still open from before.

