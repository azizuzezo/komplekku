# Testing

Tests are owned by the package whose behavior they verify.

## Current layers

- Contracts: exercised by API and web fixtures through exported Zod schemas.
- API: Fastify `inject()` tests with the deterministic in-memory repository, covering OTP,
  sessions, permissions, resident context, onboarding/approval, announcements, agenda,
  in-app notifications, safe errors, and health behavior.
- Web: API-client, auth-routing/resubmission, announcement, agenda, and notification-cache
  tests, plus Next route generation and production compilation.
- Real PostgreSQL: migrations, repeatable two-community seed, and tenant-isolation coverage
  for approval, announcements, agenda cursors/details/admin mutations, and user-targeted
  notifications.
- Flutter source: focused Dart and 360 px widget tests exist for auth-state parsing, guarded
  routing, onboarding repositories/errors, status copy, and resident forms, but cannot be
  executed until Flutter/Dart are installed.

Rendered web E2E and Flutter unit/widget/device tests remain future gates. They must not be
reported as passed until their runtimes are available.

## Commands

```bash
corepack pnpm format:check
corepack pnpm tokens:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:integration
corepack pnpm build
corepack pnpm check
```

The real-database smoke requires `corepack pnpm infra:up`, migrated databases, and
deterministic development seed data. Automated unit and Fastify-inject tests do not require
Docker.

Critical flows include OTP request/verify → typed auth state → residency request →
tenant-scoped admin approval → READY context, resident home → announcement read state,
agenda read/admin lifecycle → targeted notification → idempotent read state, and logout. The
real database fixture contains two communities and proves that guessed cross-tenant IDs and
cursors reveal nothing. No check may be disabled merely to make the suite green.
