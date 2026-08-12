# Komplekku

Komplekku adalah platform lokal untuk kebutuhan warga, pengurus, bendahara, dan security
di lingkungan perumahan. Komunitas pertama adalah Billabong Blok F, tetapi semua domain
yang bersifat tenant harus tetap dipisahkan dengan `community_id`.

Status saat ini: Phases 0 hingga 5 (Resident Core, Security & CCTV, Community Services, Finance, serta Flutter Mobile Parity) telah selesai secara penuh pada Web, API, dan Flutter Native App. Phase 6 (Quality, Accessibility, Security, Permission, Performance, Offline, Responsive, dan Documentation Audits) telah diverifikasi 100% lokal. Tidak ada proses deploy atau provisioning cloud di repository ini.

## Architecture

```text
Next.js web (localhost:3000) ─┐
                              ├─ Fastify API (localhost:3001/api/v1)
Flutter mobile ───────────────┘             │
                                            ├─ PostgreSQL / Prisma
                                            ├─ Redis
                                            ├─ MinIO
                                            ├─ Mailpit
                                            └─ MediaMTX
```

- `apps/web` — responsive web and PWA.
- `apps/api` — API and business rules shared by web and Flutter.
- `apps/mobile` — native Flutter client.
- `packages/contracts` — transport schemas and TypeScript contract types.
- `packages/design-tokens` — platform-neutral design-token values.
- `tokens.css` — canonical CSS custom properties for the web.
- `design.md` — locked premium civic composition, brand, responsive, and interaction rules.
- `assets/brand` and `assets/fonts` — owner-supplied identity source, compact app mark, and
  locally bundled Plus Jakarta Sans.
- `infra/local` — local-only service configuration.
- `docs` — concise architecture and operating notes.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for dependency boundaries.

## Requirements

- Node.js 24 or newer.
- Corepack with pnpm `11.21.0`.
- Docker Desktop with Docker Compose.
- Flutter SDK and a configured Android device/emulator for mobile development.

## Local setup

```powershell
Copy-Item .env.example .env
corepack prepare pnpm@11.21.0 --activate
corepack pnpm install
corepack pnpm infra:up
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

The same flow on a POSIX shell starts with `cp .env.example .env`.

Local endpoints:

| Service         | Address                        |
| --------------- | ------------------------------ |
| Web             | `http://localhost:3000`        |
| API             | `http://localhost:3001/api/v1` |
| PostgreSQL      | `localhost:5433`               |
| MinIO API       | `http://localhost:9000`        |
| MinIO console   | `http://localhost:9001`        |
| Mailpit         | `http://localhost:8025`        |
| MediaMTX HLS    | `http://localhost:8888`        |
| MediaMTX WebRTC | `http://localhost:8889`        |

PostgreSQL deliberately uses host port `5433` because `5432` is already occupied on the
development machine. Inside Docker it remains on `5432`.

## Docker

```bash
corepack pnpm infra:config
corepack pnpm infra:up
corepack pnpm infra:status
corepack pnpm infra:logs
corepack pnpm infra:down
```

`infra:down` preserves volumes. Never add `-v` unless you intentionally want to erase all
local service data.

MinIO is pinned to the last immutable server image currently published on its official
Docker Hub repository. It is loopback-only and suitable for this local foundation; reassess
the storage implementation and upstream security releases before any hosting decision.

## Database

Prisma migrations and seeds are owned by `apps/api`:

```bash
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm db:status
```

The PostgreSQL initializer creates both `komplekku` and `komplekku_test` on a fresh volume.
See [docs/DATABASE.md](docs/DATABASE.md).

## Web

```bash
corepack pnpm dev:web
```

The web app consumes the Fastify API; core business rules do not live in Next.js Server
Actions. Only implemented navigation and real API data may be shown.

The complete supplied lockup is used at identity-first moments; the transparent compact
mark is used in constrained application chrome. The responsive shell uses a bottom dock
below 768 px, a compact rail from 768–1199 px, and the full resident side column from
1200 px. Visual changes must follow root `design.md` and `docs/DESIGN_SYSTEM.md`.

## API

```bash
corepack pnpm dev:api
```

The API base path is `/api/v1`. It owns tenant scoping, validation, sessions, RBAC, audit
events, and storage access. See [docs/API.md](docs/API.md).

## Flutter

```bash
cd apps/mobile
flutter pub get
flutter doctor
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/api/v1
```

Use the development computer's LAN address instead of `10.0.2.2` for a physical device.
See [docs/MOBILE.md](docs/MOBILE.md).

## CCTV

Local development defaults to `CCTV_MODE=mock`. MediaMTX starts with no camera paths and
no camera credentials in source control. RTSP URLs must never reach web or Flutter clients;
the API will issue short-lived, permission-checked stream tickets. See
[docs/CCTV.md](docs/CCTV.md).

## Testing

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:integration
corepack pnpm build
corepack pnpm check
```

Flutter checks are separate:

```bash
corepack pnpm mobile:analyze
corepack pnpm mobile:test
```

See [docs/TESTING.md](docs/TESTING.md) for prerequisites and test boundaries.

## Seed account

Development data comes from `apps/api/prisma/seed.ts` and is labelled demo data. Use phone
`0812 0000 0001` (stored as `+6281200000001`) with the local `DEV_OTP` value; the committed
default is `123456`. These values work only while every local development guard is enabled
and must never be reused as production identity or authentication data.

## Environment

Copy `.env.example` to `.env`. The committed file contains local-only defaults, not
production secrets. Important switches:

- `AUTH_MODE=development` and `ALLOW_DEV_OTP=true` enable the local OTP adapter.
- `CCTV_MODE=mock` keeps camera integration behind the gateway abstraction.
- `DATABASE_URL` uses PostgreSQL host port `5433`.
- `MINIO_BUCKETS` lists private buckets created by the one-shot initializer.

Never commit real OTP-provider secrets, payment keys, camera credentials, RTSP URLs, or
production personal data.

## Troubleshooting

- If a bare `pnpm` shim is missing, use `corepack pnpm`; confirm
  `corepack pnpm --version` prints `11.21.0`.
- If PostgreSQL cannot bind, confirm the app is using `5433`, not the occupied `5432`.
- If a service is not ready, run `corepack pnpm infra:status` and
  `docker compose logs <service>`.
- If Android cannot reach the API, use `10.0.2.2`; `localhost` inside the emulator points to
  the emulator itself.
- If Flutter commands are unavailable, install the Flutter SDK and make `flutter doctor`
  pass before claiming mobile verification.

## Deployment

Deployment, cloud provisioning, DNS, image publishing, and Git push are intentionally out
of scope until the owner explicitly requests them.
