# CCTV

## Data path

```text
IP camera / NVR --RTSP--> local MediaMTX --HLS/WebRTC--> client
                                           ^
                                           └─ API permission check + short-lived ticket
```

The browser and Flutter client must never receive an RTSP URL, camera username, camera
password, or unrestricted gateway credential.

## Local foundation

- Default mode: `CCTV_MODE=mock`.
- MediaMTX RTSP: `localhost:8554`.
- HLS: `http://localhost:8888`.
- WebRTC signalling: `http://localhost:8889`.
- Local API: `http://localhost:9997`.
- WebRTC UDP: `8189`.

All published ports bind to loopback by default. `infra/local/mediamtx/mediamtx.yml` contains
no camera path or secret. Add explicit paths only during an authorized local camera-integration
task; do not commit real source URLs.

## Application rules

- Camera visibility is resolved from backend permissions and access level.
- Full streams start only when a camera is opened or actively monitored.
- Lists use snapshots or low-resource previews.
- Stream tickets expire quickly and are recorded in access logs.
- Residents see a moving, restrained audit watermark.
- Offline state includes last health check and a working retry action.

Mock and RTSP modes must implement the same gateway interface so clients do not branch on the
transport.

## Implementation status (Phase 2)

- Implemented: `Camera` model (`name`, `location`, `accessLevel` in `RESIDENT`/`SECURITY`/`ADMIN_ONLY`,
  `status` in `ONLINE`/`OFFLINE`, `lastOnlineAt`), `GET /api/v1/cameras` (list, filtered server-side to
  the caller's visible access levels via `camera.public.read`/`camera.security.read`/`camera.manage`),
  and `POST /api/v1/cameras/:id/stream-ticket` (permission-checked per camera; returns
  `{ cameraId, mode, status, ticket, expiresAt, watermark }`).
- `CCTV_MODE=mock` is the only mode wired end-to-end: `issueStreamTicket` always returns
  `mode: "mock"` with a generated ticket string and a watermark payload (`label`, `viewerName`,
  `generatedAt`); there is no MediaMTX/RTSP call in this path yet. The web `/cctv` page renders a
  clearly labeled "simulated feed" card (name/location/status/watermark text), not a video element.
- `camera.manage` (create/edit a camera) exists as a route and permission but has no seeded demo
  user — camera inventory is currently seed-only (`prisma/seed.ts`).
- Not implemented: real RTSP ingestion, the MediaMTX bridge, camera health polling, per-view access
  logs beyond the existing `AuditLog` table, and a moving audit watermark (the current watermark is
  static text, not the restrained motion overlay described above).
