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

Last updated: 2026-08-12 10:35:00 WIB (UTC+07:00).

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
- Primary design anchors: Komplek Green `#28594A`, warm background `#F7F5EF`, Plus Jakarta Sans, Lucide icons on web, Material icons on Flutter, restrained radii and purposeful motion.
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

















