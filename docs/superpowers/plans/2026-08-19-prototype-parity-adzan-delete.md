# Prototype Parity, Automatic Adzan, and Delete Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the responsive web application and Flutter application reproduce the five supplied green prototypes with the same hierarchy and tokens, make every existing delete/archive action observable and reliable, and make Android adzan alarms schedule and sound automatically without a manual “Putar Adzan” control.

**Architecture:** A shared prototype specification in `design.md` and portable root tokens drive equivalent Web CSS and Flutter theme values. Existing API-driven screen components remain the data source; only presentation composition and mutation feedback are normalized. Prayer scheduling returns a structured result and exposes scheduling failures so the UI cannot claim success when Android registered zero alarms.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Vitest, Flutter 3.38+, Riverpod, Dio, flutter_local_notifications 18, Android API 35/37 tooling.

**Spec:** `PRD.md`, `design.md`, and the five owner-supplied PNG prototypes listed in the 2026-08-19 request.

## Global Constraints

- Latest owner instruction overrides the previous purple theme: Web and Flutter use the green prototype system.
- Preserve live API content, permissions, ownership, audit history, and archive/soft-delete semantics; never hardcode prototype sample records.
- Preserve unrelated dirty updater, signing, and API-release work already present in the shared workspace.
- No deployment, push, cloud provisioning, production mutation, or secret access.
- Mobile bottom navigation remains exactly five destinations: Beranda, Shalat, Pengumuman, Forum, Profil.
- Plus Jakarta Sans remains the only product UI font.
- Every behavior change follows red-green-refactor and every visual batch receives rendered verification.

---

### Task 1: Lock the Green Cross-Platform Prototype System

**Files:**
- Create: `apps/web/features/design/prototype-contract.test.ts`
- Create: `apps/mobile/test/prototype_theme_test.dart`
- Modify: `design.md`
- Modify: `tokens.css`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/mobile/lib/app/theme/app_theme.dart`

**Interfaces:**
- Consumes: owner prototype colors and dimensions.
- Produces: semantic green tokens (`primary`, `primaryDark`, `surfaceSage`, borders, ink, radii, shadows) used by every later task.

- [ ] **Step 1: Write failing token/theme tests** asserting primary `#008A52`, deep green `#006B3F`, pale green surface, white canvas, Plus Jakarta Sans, 12–20 px prototype radii, and five non-wrapping bottom destinations.
- [ ] **Step 2: Run focused Web and Flutter tests** and confirm they fail on the current purple values.
- [ ] **Step 3: Update the canonical design document and portable tokens** to describe the latest owner-approved green civic prototype rather than the superseded purple system.
- [ ] **Step 4: Implement equivalent Web and Flutter theme values** without introducing route-local palette forks.
- [ ] **Step 5: Re-run focused tests** and confirm green.

### Task 2: Match the Web Mobile Viewport to All Five Prototypes

**Files:**
- Modify: `apps/web/components/shell/app-shell.tsx`
- Modify: `apps/web/components/shell/mobile-navigation.tsx`
- Modify: `apps/web/features/home/home-screen.tsx`
- Modify: `apps/web/features/home/home-quick-actions.tsx`
- Modify: `apps/web/features/prayer/prayer-card.tsx`
- Modify: `apps/web/features/prayer/prayer-schedule.tsx`
- Modify: `apps/web/features/announcement/announcement-list.tsx`
- Modify: `apps/web/features/announcement/announcement-row.tsx`
- Modify: `apps/web/features/forum/forum-tabs.tsx`
- Modify: `apps/web/features/forum/forum-board.tsx`
- Modify: `apps/web/features/forum/forum-post-detail.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/shalat/page.tsx`
- Modify: `apps/web/app/pengumuman/page.tsx`
- Modify: `apps/web/app/forum/page.tsx`
- Modify: `apps/web/app/forum/[id]/page.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/features/design/prototype-contract.test.ts`

**Interfaces:**
- Consumes: Task 1 semantic tokens and existing API responses.
- Produces: common prototype page header, action buttons, prayer panels, announcement cards, forum cards/thread, and fixed five-item dock.

- [ ] **Step 1: Extend the failing contract test** to assert the five routes use prototype page/screen classes and manual adzan replay copy is absent.
- [ ] **Step 2: Run the focused test** and confirm the structural assertions fail.
- [ ] **Step 3: Recompose Home and Shalat** to match prototype ordering, compact prayer summary, next-prayer emphasis, schedule list, week strip, and quote block.
- [ ] **Step 4: Recompose Announcement, Forum, and Discussion** to match prototype headers, pills/tabs, card density, metadata, reactions, reply layout, and composer.
- [ ] **Step 5: Implement responsive CSS** with a 941 px prototype canvas scaled fluidly on phones and restrained centered layouts on tablet/desktop.
- [ ] **Step 6: Run Web tests, lint, and typecheck** and fix all regressions.
- [ ] **Step 7: Render all five routes locally at a phone viewport** and compare screenshots against the supplied references.

### Task 3: Match Flutter to the Same Prototype Contract

**Files:**
- Create: `apps/mobile/lib/core/widgets/prototype_header.dart`
- Create: `apps/mobile/lib/core/widgets/prototype_bottom_navigation.dart`
- Create: `apps/mobile/test/prototype_navigation_test.dart`
- Modify: `apps/mobile/lib/app/shell/main_shell.dart`
- Modify: `apps/mobile/lib/features/home/presentation/home_screen.dart`
- Modify: `apps/mobile/lib/features/prayer/presentation/prayer_screen.dart`
- Modify: `apps/mobile/lib/features/announcement/presentation/announcement_list_screen.dart`
- Modify: `apps/mobile/lib/features/forum/presentation/forum_screen.dart`
- Modify: `apps/mobile/lib/features/forum/presentation/forum_board_screen.dart`
- Modify: `apps/mobile/lib/features/forum/presentation/forum_post_detail_screen.dart`
- Modify: `apps/mobile/lib/features/prayer/presentation/prayer_card.dart`

**Interfaces:**
- Consumes: Task 1 theme values and the same live repositories already used by each screen.
- Produces: reusable Flutter header/dock components and five screens visually equivalent to Task 2.

- [ ] **Step 1: Write failing Flutter widget tests** for five dock labels, green selected state, prototype header copy/actions, and absence of “Putar Adzan”.
- [ ] **Step 2: Run the focused widget tests** and verify the expected failures.
- [ ] **Step 3: Implement the shared header and bottom dock** with safe-area behavior, fixed single-line labels, correct active indicator, and prototype spacing.
- [ ] **Step 4: Recompose Home, Shalat, Announcement, Forum, and Discussion** with the same hierarchy, sizes, chips, cards, and green states as Web.
- [ ] **Step 5: Remove obsolete manual prayer playback controls and any unused player state** while retaining scheduled-notification behavior.
- [ ] **Step 6: Run focused tests, full Flutter tests, and analyzer.**
- [ ] **Step 7: Install a debug/release build on the Keenan emulator and capture all five screens** for comparison.

### Task 4: Make Existing Delete and Archive Actions Reliable

**Files:**
- Create: `apps/mobile/test/entity_actions_test.dart`
- Create: `apps/web/components/ui/entity-actions.test.tsx` only if the current Vitest DOM setup supports component rendering; otherwise extend API/client tests with real request assertions.
- Modify: `apps/mobile/lib/core/widgets/entity_actions.dart`
- Modify: `apps/mobile/lib/features/agenda/presentation/agenda_list_screen.dart`
- Modify: `apps/mobile/lib/features/announcement/presentation/announcement_list_screen.dart`
- Modify: `apps/mobile/lib/features/forum/presentation/forum_screen.dart`
- Modify: `apps/mobile/lib/features/forum/presentation/forum_post_detail_screen.dart`
- Modify: `apps/web/components/ui/entity-actions.tsx`
- Modify: `apps/web/features/agenda/agenda-list.tsx`
- Modify: `apps/web/features/announcement/announcement-list.tsx`
- Modify: `apps/web/features/forum/forum-panel.tsx`
- Modify: `apps/web/features/forum/forum-board.tsx`
- Modify: `apps/web/features/forum/forum-post-detail.tsx`

**Interfaces:**
- Consumes: existing repository/API delete methods and permission checks.
- Produces: one confirmation → pending → success/error interaction contract across agenda, announcement, forum post, reply, and realtime message deletion.

- [ ] **Step 1: Write failing tests** proving delete is invoked once after confirmation, controls remain busy until completion, failures are visible, and success invalidates/navigates only after the request resolves.
- [ ] **Step 2: Run focused tests** and confirm current silent/inconsistent flows fail them.
- [ ] **Step 3: Implement shared async confirmation state** and await the supplied delete callback before closing or announcing success.
- [ ] **Step 4: Replace swallowed forum errors** with Indonesian error feedback and normalize provider/query invalidation for all named entities.
- [ ] **Step 5: Add success feedback and protect against double submission** while preserving server ownership/moderation rules.
- [ ] **Step 6: Run mobile, Web, and API delete-focused tests.**

### Task 5: Prove and Repair Automatic Android Adzan Scheduling

**Files:**
- Modify: `apps/mobile/test/prayer_scheduler_service_test.dart`
- Modify: `apps/mobile/lib/features/prayer/data/prayer_scheduler_service.dart`
- Modify: `apps/mobile/lib/features/prayer/presentation/prayer_screen.dart`
- Modify: `apps/mobile/android/app/src/main/AndroidManifest.xml` only if diagnostics prove a manifest requirement is missing.

**Interfaces:**
- Consumes: calculated prayer times, local notification plugin, persisted per-prayer preferences.
- Produces: `PrayerScheduleResult` containing attempted/scheduled counts and failures; UI reflects the real registered state.

- [ ] **Step 1: Add failing service tests** using a notification scheduling seam to prove future prayers register, a failed alarm is reported rather than swallowed, and stored IDs contain only accepted alarms.
- [ ] **Step 2: Run the focused test** and verify failure on the current silent `catch` behavior.
- [ ] **Step 3: Introduce the smallest scheduling seam/result type** and surface diagnostic failure details without exposing sensitive data.
- [ ] **Step 4: Fix the exact plugin/configuration failure found on the emulator** and keep the exact-to-inexact fallback.
- [ ] **Step 5: Update Shalat UI state** so enabled bells cannot falsely imply alarms exist; show a retryable Indonesian error when scheduling fails.
- [ ] **Step 6: Run scheduler tests, analyzer, and full Flutter tests.**
- [ ] **Step 7: Build/install on emulator, toggle one prayer, and verify `dumpsys alarm` contains Komplekku ScheduledNotificationReceiver entries**; restart the app and verify the entries persist/reschedule.

### Task 6: Cross-Platform Finish Gate and Handoff

**Files:**
- Modify: `Engineering.md`
- Modify: implementation files only when verification exposes a concrete defect.

**Interfaces:**
- Consumes: all earlier tasks.
- Produces: verified source, local artifacts/screenshots, and durable handoff notes.

- [ ] **Step 1: Run formatting checks for touched files.**
- [ ] **Step 2: Run Web lint, typecheck, tests, and build.**
- [ ] **Step 3: Run API delete-focused tests plus API typecheck.**
- [ ] **Step 4: Run Flutter analyze, full tests, and release APK build.**
- [ ] **Step 5: Compare Web and Flutter screenshots side-by-side with all five supplied prototypes** and correct any material geometry/color/navigation mismatch.
- [ ] **Step 6: Re-run every affected check after final corrections.**
- [ ] **Step 7: Append a dated WIB Engineering journal entry** covering files, decisions, exact verification results, and any environmental limitation.
