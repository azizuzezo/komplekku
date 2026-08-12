# Architecture

Komplekku is a local-first monorepo with three clients/services and two shared packages.

```text
apps/web ───────┐
                ├─ HTTP /api/v1 ─ apps/api ─ Prisma ─ PostgreSQL
apps/mobile ────┘                       ├──── Redis
                                      ├──── MinIO
                                      ├──── Mailpit
                                      └──── MediaMTX

apps/web + apps/api ── packages/contracts
apps/web ───────────── packages/design-tokens + tokens.css
apps/mobile ────────── OpenAPI contract + mapped native theme
```

## Boundaries

- `apps/api` owns business rules, tenant filtering, authentication, RBAC, audit events,
  Prisma, and integrations. It never imports from a client application.
- `apps/web` owns responsive/PWA presentation and HTTP orchestration. It never imports
  Prisma or API implementation modules.
- `apps/mobile` is native Flutter with feature-first presentation, domain, and data layers.
- `packages/contracts` contains transport schemas only; it has no Fastify, Prisma, React,
  Next.js, browser, or Node runtime dependency.
- `packages/design-tokens` exposes platform-neutral values. `tokens.css` is the web CSS
  representation; Flutter maps the same named values into native theme objects.

## Tenant and security boundary

Every tenant-owned query is scoped by the authenticated `community_id`, never by a client
claim alone. The API enforces permission checks even when the UI hides unavailable actions.
Sessions and OTP codes are stored as hashes. Private files use randomized object keys and
signed access. Server logs redact cookies, authorization values, OTPs, and connection URLs.

## Phase order

Phase 0 establishes tooling, local infrastructure, API/web/mobile shells, contracts, design
tokens, authentication/RBAC foundations, seed data, and tests. The first vertical slice is
resident OTP login → real home summary → announcement detail/read state → logout.

No deployment or cloud provisioning belongs to this architecture until explicitly approved.
