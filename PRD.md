# PRODUCT REQUIREMENTS DOCUMENT

# KOMPLEKKU

**Product Name:** Komplekku
**Initial Community:** Billabong Blok F
**Product Type:** Community / Residential Management Platform
**Platforms:** Responsive Web + PWA + Flutter Mobile
**Development Strategy:** Local-first
**Initial Deployment:** NONE
**Hosting:** Akan ditentukan dan dilakukan manual oleh owner
**Primary Language:** Bahasa Indonesia
**Status:** Development Specification

---

# 1. PRODUCT VISION

Komplekku adalah aplikasi digital untuk membantu warga, pengurus lingkungan, bendahara, dan security mengelola aktivitas lingkungan perumahan dalam satu sistem.

Komplekku bukan sekadar dashboard RT.

Aplikasi harus menjadi pusat aktivitas lingkungan untuk:

* informasi warga,
* keamanan,
* CCTV,
* tamu,
* paket,
* laporan lingkungan,
* pengaduan,
* kendaraan,
* iuran,
* kas,
* agenda,
* dokumen warga,
* emergency,
* patroli security,
* dan administrasi lingkungan.

Lingkungan pertama:

**Billabong Blok F**

Namun arsitektur database WAJIB mendukung banyak komunitas melalui `community_id`.

Jangan hardcode Billabong Blok F ke seluruh aplikasi.

---

# 2. CORE PRINCIPLES

## 2.1 Functional First

Semua elemen yang terlihat interaktif harus benar-benar bekerja.

DILARANG membuat:

* tombol kosong,
* menu dummy,
* card yang tidak bisa dibuka padahal terlihat clickable,
* tombol tiga titik tanpa fungsi,
* filter palsu,
* search palsu,
* pagination palsu,
* notifikasi palsu,
* statistik hardcoded,
* grafik dekoratif,
* CTA yang tidak memiliki action.

Jika fungsi belum tersedia:

* sembunyikan,
* atau tampilkan sebagai disabled dengan alasan yang jelas.

---

# 3. LOCAL-FIRST REQUIREMENT

Development pertama HARUS berjalan sepenuhnya lokal.

Tidak boleh ada auto deployment.

Codex DILARANG menjalankan:

```bash
vercel deploy
vercel --prod
wrangler deploy
firebase deploy
railway up
netlify deploy
supabase link
supabase db push
docker push
git push
```

atau command lain yang melakukan perubahan ke cloud/external infrastructure tanpa instruksi eksplisit dari owner.

Semua development awal menggunakan:

```text
Web
localhost

API
localhost

PostgreSQL
Docker local

Redis
Docker local

Object Storage
MinIO local

Email Development
Mailpit local

CCTV Gateway
MediaMTX local

Flutter
Android Emulator / Physical Device
```

Owner sendiri yang nantinya menentukan hosting.

---

# 4. CODEX PROJECT RULE

Repository harus mempunyai:

```text
AGENTS.md
README.md
.env.example
docker-compose.yml
docs/
    PRD.md
    ARCHITECTURE.md
    API.md
    DATABASE.md
    CCTV.md
    DESIGN_SYSTEM.md
    MOBILE.md
```

Codex mendukung instruksi repository melalui `AGENTS.md`, sehingga aturan development Komplekku harus disimpan di sana agar menjadi guardrail project.

---

# 5. PROPOSED REPOSITORY

```text
komplekku/
│
├── AGENTS.md
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
│
├── apps/
│   │
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── public/
│   │
│   ├── api/
│   │   ├── src/
│   │   ├── modules/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── tests/
│   │
│   └── mobile/
│       ├── android/
│       ├── ios/
│       └── lib/
│
├── packages/
│   ├── contracts/
│   ├── design-tokens/
│   └── shared-config/
│
├── infra/
│   └── local/
│       ├── postgres/
│       ├── minio/
│       ├── mailpit/
│       └── mediamtx/
│
└── docs/
```

---

# 6. TECHNOLOGY STACK

## Web

Use:

```text
Next.js
React
TypeScript
Tailwind CSS
TanStack Query
Zod
React Hook Form
```

Component UI dibuat sendiri.

Radix primitive boleh digunakan untuk:

* dialog,
* popover,
* dropdown,
* tooltip,
* accessibility primitives.

JANGAN copy keseluruhan style default library tertentu sehingga tampil seperti template AI SaaS.

---

# 7. BACKEND

Gunakan backend terpisah supaya web dan Flutter memakai API yang sama.

Recommended:

```text
Node.js
TypeScript
Fastify
Zod
Prisma
PostgreSQL
Redis
```

Base API:

```text
http://localhost:3001/api/v1
```

Web:

```text
http://localhost:3000
```

API tidak boleh bergantung pada Next.js Server Actions untuk core business logic.

Flutter harus dapat menggunakan API yang sama.

---

# 8. LOCAL SERVICES

Docker Compose minimal:

```text
PostgreSQL
Redis
MinIO
Mailpit
MediaMTX
```

Example:

```bash
docker compose up -d
```

Tidak diperlukan akun cloud untuk menjalankan application development.

---

# 9. DESIGN DIRECTION

## IMPORTANT

Komplekku tidak boleh terlihat seperti UI hasil generator AI generik.

HINDARI:

* purple-blue gradient,
* neon glow,
* glassmorphism berlebihan,
* blur di semua card,
* floating orb,
* background blob,
* card di dalam card di dalam card,
* border radius terlalu besar,
* ikon emoji,
* random illustrations,
* giant dashboard headline,
* hero section ala landing page SaaS,
* statistik dekoratif,
* terlalu banyak badge,
* animasi hanya untuk pamer.

Aplikasi harus terasa:

**Residential + Civic + Safe + Warm + Practical.**

---

# 10. VISUAL LANGUAGE

Inspirasi visual:

```text
Modern neighborhood
Residential signage
Security system
Community notice board
Apartment resident app
Modern civic services
```

Bukan:

```text
AI Dashboard
Crypto Dashboard
Fintech App
Cyber Security Interface
Gaming UI
```

---

# 11. COLOR SYSTEM

Primary:

```text
Komplek Green
#28594A
```

Primary Dark:

```text
#1E4438
```

Warm Background:

```text
#F7F5EF
```

Surface:

```text
#FFFFFF
```

Soft Surface:

```text
#EEF2EF
```

Text Primary:

```text
#202724
```

Text Secondary:

```text
#66706B
```

Border:

```text
#DDE3DF
```

Accent Terracotta:

```text
#C86F4B
```

Warning:

```text
#B7791F
```

Danger:

```text
#B54343
```

Success:

```text
#347A52
```

Jangan gunakan gradient sebagai warna utama aplikasi.

---

# 12. TYPOGRAPHY

Primary:

**Plus Jakarta Sans**

Fallback:

```css
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif
```

Gunakan tabular numbers untuk:

* nominal uang,
* jam,
* nomor rumah,
* statistik,
* data CCTV.

---

# 13. ICONOGRAPHY

Ikon WAJIB berasal dari established vector icon library.

Recommended web:

**Lucide Icons**

Flutter:

**Material Symbols / Material Icons**

DILARANG:

* emoji sebagai navigation icon,
* generated AI icon,
* random SVG dari AI,
* icon berbeda style antara menu,
* icon 3D,
* decorative AI illustration.

Standard:

```text
16px small
20px default
24px navigation
```

Stroke harus konsisten.

---

# 14. BORDER RADIUS

Gunakan:

```text
Button: 8-10px
Input: 10px
Card: 12px
Modal: 14px
Bottom Sheet: 18px top corner
```

Jangan membuat semua komponen menjadi pill.

---

# 15. RESPONSIVE SYSTEM

Komplekku harus berfungsi mulai dari lebar sekitar:

```text
360px
```

hingga desktop besar.

## Mobile

```text
360-767
```

Navigation:

```text
Bottom Navigation
```

## Tablet

```text
768-1199
```

Navigation:

```text
Navigation Rail / Compact Sidebar
```

## Desktop

```text
1200+
```

Navigation:

```text
Sidebar
```

---

# 16. MOBILE NAVIGATION

Bottom navigation maksimal 5 item utama:

```text
Beranda
Keamanan
Layanan
Aktivitas
Akun
```

Menu lain berada di dalam Layanan.

Jangan menaruh 10 icon pada bottom navigation.

---

# 17. DESKTOP NAVIGATION

Sidebar:

```text
Komplekku

Beranda

LINGKUNGAN
Pengumuman
Agenda
Warga

KEAMANAN
CCTV
Tamu
Paket
Patroli
Laporan Kejadian

LAYANAN
Pengaduan
Surat
Fasilitas

KEUANGAN
Iuran
Kas

ADMIN
Manajemen Warga
Rumah
CCTV
Pengguna
Audit Log
Pengaturan
```

Menu ditampilkan berdasarkan permission.

---

# 18. MOTION DESIGN SYSTEM

Motion harus memberikan feedback.

Tidak boleh hanya menjadi dekorasi.

## Button

On press:

```text
scale 1 → 0.98
90ms
```

Release:

```text
120ms
```

---

## Card Hover

Desktop only:

```text
translateY 0 → -2px
shadow slightly increase
160ms
```

Tidak digunakan berlebihan.

---

## Page Transition

```text
opacity 0 → 1
translateY 4px → 0
180-220ms
```

---

## Bottom Sheet

```text
translateY 100% → 0
240ms
```

---

## Modal

```text
opacity
small scale 0.98 → 1
180ms
```

---

## List Insert

Ketika announcement/report baru muncul:

```text
fade
translateY 6px
```

Jangan stagger lebih dari 5 item.

---

## CCTV Loading

Jangan gunakan spinner besar.

Gunakan:

```text
dark video surface
small status indicator
"Menyiapkan siaran…"
```

---

## Success

Contoh check-in tamu:

```text
check icon stroke animation
180-260ms
```

Tidak menggunakan confetti.

---

# 19. REDUCED MOTION

Web harus menghormati:

```css
prefers-reduced-motion
```

Jika user menonaktifkan motion:

* hilangkan translate,
* hilangkan scale,
* gunakan opacity minimal,
* jangan menjalankan looping animation.

Flutter terbaru juga memiliki dukungan terkait reduced/disabled motion di platform yang didukung, sehingga motion Komplekku harus dibuat sebagai enhancement, bukan syarat penggunaan aplikasi.

---

# 20. USER ROLES

Role awal:

```text
SUPER_ADMIN
COMMUNITY_ADMIN
RT_ADMIN
TREASURER
SECURITY
RESIDENT
HOUSEHOLD_MEMBER
STAFF
```

Gunakan RBAC.

Jangan hanya:

```text
isAdmin: true
```

---

# 21. PERMISSION SYSTEM

Contoh permission:

```text
announcement.read
announcement.create

resident.read
resident.manage

finance.read
finance.manage

camera.public.read
camera.security.read
camera.manage

visitor.read
visitor.create
visitor.checkin

package.read
package.manage

incident.create
incident.read
incident.manage

patrol.execute
patrol.manage

letter.request
letter.approve

admin.audit.read
```

Role berisi sekumpulan permission.

---

# 22. AUTHENTICATION

Target UX:

**Phone number + OTP**

Flow:

```text
Nomor HP
→ OTP 6 Digit
→ Verification
→ Community
→ Household
→ Home
```

Resident account harus dikaitkan ke rumah.

Contoh:

```text
Billabong Blok F
F1 No. 12
```

Untuk local development:

```env
AUTH_MODE=development
DEV_OTP=123456
```

DEV OTP hanya boleh aktif ketika environment development.

Production tidak boleh menerima `123456`.

Provider OTP production dibuat menggunakan adapter interface agar nantinya owner dapat menentukan:

```text
WhatsApp provider
SMS provider
Email provider
```

tanpa mengubah business logic.

---

# 23. RESIDENT APPROVAL

User baru tidak otomatis mendapatkan akses CCTV dan data lingkungan.

Flow:

```text
Daftar
↓
OTP berhasil
↓
Pilih / masukkan rumah
↓
Pending verification
↓
Admin melakukan approval
↓
Resident Active
```

Status:

```text
PENDING
ACTIVE
REJECTED
SUSPENDED
MOVED_OUT
```

---

# 24. HOME

Home bukan dashboard statistik.

Prioritaskan informasi yang berguna.

Contoh mobile:

```text
Selamat pagi, Aziz

Billabong Blok F
Selasa, 11 Agustus

[ Emergency ]

PENGUMUMAN TERBARU
───────────────────
Pemadaman listrik sementara
Hari ini • 13:00

KEAMANAN
───────────────────
CCTV            6 Online
Security        On Duty
Tamu Hari Ini   4

AKTIVITAS RUMAH
───────────────────
1 Paket menunggu
Iuran Agustus sudah lunas

AGENDA
───────────────────
Kerja Bakti
Minggu • 07:00
```

---

# 25. ANNOUNCEMENT MODULE

Admin dapat:

* membuat pengumuman,
* memilih prioritas,
* memilih target,
* menjadwalkan publish,
* attach gambar/PDF,
* pin announcement,
* archive.

Target:

```text
Semua warga
Blok tertentu
Rumah tertentu
Security
Pengurus
```

Priority:

```text
NORMAL
IMPORTANT
URGENT
```

Resident dapat melihat:

* unread/read,
* detail,
* attachment.

Tidak perlu social-media comment pada MVP.

---

# 26. COMMUNITY AGENDA

Agenda lingkungan:

* kerja bakti,
* rapat,
* fogging,
* maintenance,
* kegiatan warga,
* pemadaman,
* acara komunitas.

Support:

```text
date
start time
end time
location
description
organizer
attachment
reminder
```

---

# 27. CCTV MODULE

Ini merupakan salah satu core feature Komplekku.

## Architecture

```text
IP CAMERA / NVR
       │
       │ RTSP
       ▼
Local Media Gateway
MediaMTX
       │
       ├── WebRTC
       └── HLS
       │
       ▼
Komplekku API
Permission Check
       │
       ▼
Web / Flutter
```

MediaMTX dapat menangani beberapa protokol live media termasuk RTSP, WebRTC dan HLS serta stream dapat dibaca melalui browser.

---

# 28. CCTV SECURITY RULE

RTSP URL DILARANG diberikan ke browser.

Jangan:

```text
Frontend
↓
rtsp://admin:password@camera-ip
```

Gunakan:

```text
Frontend
↓
Komplekku API
↓
Check session
↓
Check permission
↓
Short-lived stream ticket
↓
Media Gateway
```

Camera password tidak pernah ditampilkan pada client.

---

# 29. CAMERA TYPES

Example Billabong Blok F:

```text
Gerbang Utama
Gerbang Keluar
Pos Security
Area Taman
Jalan Utama
Area Fasilitas
```

Actual camera dapat dikonfigurasi melalui admin.

Jangan hardcode nama kamera.

---

# 30. CCTV ACCESS LEVEL

Camera mempunyai:

```text
RESIDENT
SECURITY
ADMIN_ONLY
```

Contoh:

```text
Gerbang Utama
RESIDENT

Taman
RESIDENT

Pos Security
SECURITY

Area Internal
ADMIN_ONLY
```

---

# 31. CCTV SCREEN

Mobile:

```text
CCTV Lingkungan

6 kamera online

[ Gerbang Utama              ]
[ LIVE VIDEO                 ]
[ ● Live       Online        ]

[ Taman                       ]
[ PREVIEW                     ]

[ Gerbang Keluar              ]
[ PREVIEW                     ]
```

Desktop:

Grid adaptive:

```text
1 / 2 / 3 / 4 column
```

---

# 32. CCTV PLAYER

Player mempunyai:

```text
Camera Name
Live status
Online/offline
Fullscreen
Mute
Reconnect
Quality if available
Last health check
```

Tidak perlu video control seperti YouTube.

---

# 33. CCTV PRIVACY WATERMARK

Saat resident melihat CCTV, overlay tipis:

```text
KOMPLEKKU
Nama User
Tanggal & Jam
```

Tujuan:

audit awareness.

Watermark bergerak perlahan antar posisi untuk mengurangi kemungkinan cropping sederhana.

Jangan terlalu mengganggu video.

---

# 34. CCTV OFFLINE HANDLING

Jika camera mati:

```text
Kamera sedang tidak tersedia

Terakhir terhubung
10:24
```

Actions:

```text
Coba Lagi
```

Admin dapat melihat:

```text
Camera Offline
Gateway Offline
Source Error
Authentication Error
```

---

# 35. CCTV DEVELOPMENT MODE

Support:

```env
CCTV_MODE=mock
```

dan

```env
CCTV_MODE=rtsp
```

Dengan demikian development aplikasi tidak harus menunggu CCTV asli.

Mock mode harus tetap melewati interface yang sama agar pergantian ke RTSP tidak membutuhkan perubahan UI.

---

# 36. EMERGENCY MODULE

Home mempunyai tombol:

**Emergency**

Jangan terlalu mudah tertekan tanpa sengaja.

Flow:

```text
Emergency
↓
Bottom Sheet
↓
Pilih kondisi
↓
Hold to Confirm 2 seconds
```

Pilihan:

```text
Keamanan
Medis
Kebakaran
Gangguan Lingkungan
Lainnya
```

Setelah confirm:

```text
Alert dikirim ke Security/Admin
Resident Location/House included
Incident created
```

Status:

```text
SENT
ACKNOWLEDGED
RESPONDING
RESOLVED
```

Emergency internal Komplekku tidak boleh mengklaim otomatis menghubungi layanan darurat pemerintah jika integrasinya memang belum tersedia.

---

# 37. VISITOR MANAGEMENT

Resident dapat membuat kunjungan.

Input:

```text
Nama tamu
Nomor HP optional
Tanggal
Jam perkiraan
Kendaraan
Plat nomor
Keperluan
Catatan
```

Generate:

```text
Visitor QR
```

---

# 38. SECURITY VISITOR CHECK-IN

Security membuka:

```text
Scan Tamu
```

Kemudian:

```text
Scan QR
↓
Data Tamu
↓
Confirm Check-In
```

Record:

```text
arrival time
security officer
vehicle
destination house
```

Keluar:

```text
Check-Out
```

---

# 39. WALK-IN VISITOR

Jika tidak punya QR:

Security dapat membuat entry manual.

Search destination:

```text
F12
Aziz
No 12
```

Kemudian:

```text
Call Resident / Request Confirmation
```

---

# 40. PACKAGE MANAGEMENT

Security dapat memasukkan paket:

```text
Rumah
Recipient
Courier
Tracking optional
Photo optional
Received time
```

Resident mendapatkan status:

```text
Paket tiba di pos
```

Status:

```text
RECEIVED
NOTIFIED
COLLECTED
```

Ketika diambil:

```text
Collected By
Collected Time
Security Officer
```

---

# 41. SECURITY DASHBOARD

Security tidak membutuhkan finance dashboard.

Dashboard Security:

```text
Security On Duty

[ Scan Tamu ]
[ Paket Masuk ]
[ Laporan Kejadian ]
[ Mulai Patroli ]

TAMU AKTIF
4 orang

PAKET MENUNGGU
7 paket

CCTV
6 / 6 Online

ALERT
0 Emergency
```

Large touch targets.

Security harus dapat menggunakan UI dengan satu tangan di HP.

---

# 42. SECURITY SHIFT

Data:

```text
shift
start_at
end_at
officer
status
```

Actions:

```text
Mulai Shift
Selesai Shift
```

Shift report dapat mempunyai:

```text
notes
incidents
visitors
patrol result
```

---

# 43. PATROL MODULE

Admin membuat checkpoint.

Contoh:

```text
Pos Security
Gerbang Utama
Taman
Ujung Blok F
Area Fasilitas
```

Checkpoint dapat memiliki QR unik.

Security:

```text
Mulai Patroli
↓
Scan checkpoint
↓
Timestamp otomatis
↓
Optional note/photo
↓
Checkpoint berikut
↓
Selesai
```

---

# 44. PATROL HISTORY

Admin dapat melihat:

```text
Tanggal
Security
Start
Finish
Duration
Checkpoint completed
Missing checkpoint
Incident
```

Tidak perlu tracking GPS terus-menerus pada MVP.

---

# 45. INCIDENT REPORT

Security dapat membuat laporan.

Kategori:

```text
Security
Suspicious Activity
Damage
Noise
Traffic
Lost Item
Emergency
Other
```

Isi:

```text
Title
Description
Location
Date/time
Photo/video
Reporter
People involved
Action taken
```

Status:

```text
OPEN
IN_REVIEW
RESOLVED
CLOSED
```

---

# 46. RESIDENT COMPLAINT / REPORT

Menu:

**Lapor Masalah**

Kategori:

```text
Lampu Jalan
Sampah
Drainase
Keamanan
Fasilitas
Kebersihan
Kebisingan
Lainnya
```

Flow:

```text
Kategori
↓
Deskripsi
↓
Photo
↓
Lokasi
↓
Kirim
```

Resident dapat melihat timeline.

```text
Dikirim
→ Diterima
→ Diproses
→ Selesai
```

---

# 47. RESIDENT DIRECTORY

Informasi default yang terlihat warga lain dibuat minimal.

Contoh:

```text
F12
Keluarga Aziz
```

Nomor HP tidak tampil secara default.

User harus dapat memilih:

```text
Allow resident contact
```

Admin tetap memiliki directory berdasarkan permission.

---

# 48. HOUSEHOLD

Data rumah:

```text
community
block
house_number
owner
occupancy_status
```

Status:

```text
OWNER_OCCUPIED
RENTED
VACANT
```

Household member:

```text
name
relation
phone
account
```

---

# 49. VEHICLE MANAGEMENT

Resident dapat mendaftarkan:

```text
Mobil
Motor
Sepeda
Lainnya
```

Fields:

```text
plate
brand
model
color
owner
house
```

Security dapat search:

```text
B 1234 ABC
```

Result:

```text
Resident
House
Vehicle status
```

---

# 50. IURAN

Bendahara membuat jenis iuran.

Contoh:

```text
Iuran Lingkungan
Keamanan
Kebersihan
Kegiatan
Iuran Khusus
```

Invoice:

```text
Period
House
Amount
Due date
Status
```

Status:

```text
UNPAID
PENDING_VERIFICATION
PAID
OVERDUE
WAIVED
```

---

# 51. PAYMENT MVP

Tidak perlu langsung membangun payment gateway.

MVP:

```text
Resident lihat tagihan
↓
Transfer manual
↓
Upload bukti
↓
Bendahara verify
↓
PAID
```

Database tetap disiapkan agar nanti payment provider dapat ditambahkan melalui adapter.

---

# 52. RECEIPT

Ketika paid:

Resident dapat melihat receipt digital:

```text
Komplekku
Billabong Blok F

Iuran Agustus 2026
Rp xxx.xxx

Status
LUNAS

Tanggal
Reference Number
```

---

# 53. COMMUNITY CASH

Menu:

**Transparansi Kas**

Resident dapat melihat summary yang dipublish.

```text
Saldo Awal
Pemasukan
Pengeluaran
Saldo Akhir
```

Transactions:

```text
date
category
description
amount
type
attachment
visibility
```

Admin dapat menentukan:

```text
PUBLIC_TO_RESIDENTS
ADMIN_ONLY
```

---

# 54. LETTER REQUESTS

Resident dapat meminta:

```text
Surat Pengantar
Surat Domisili lingkungan
Surat Keterangan
Surat Pengantar Administrasi
Lainnya
```

Flow:

```text
Request
↓
Admin Review
↓
Approved
↓
Document Ready
```

Jangan mengklaim dokumen sebagai dokumen pemerintah resmi apabila sebenarnya hanya surat lingkungan.

---

# 55. FACILITY MODULE

Jika terdapat fasilitas:

```text
Lapangan
Balai warga
Area kegiatan
```

Data:

```text
facility
operational hour
capacity
rules
booking
```

Calendar mencegah double booking.

---

# 56. NOTIFICATIONS

Notification center:

```text
Pengumuman
Tamu
Paket
Iuran
Laporan
Emergency
Surat
Agenda
Security
```

Notification mempunyai:

```text
read_at
created_at
entity_type
entity_id
priority
```

---

# 57. LOCAL NOTIFICATION DEVELOPMENT

Development awal tidak wajib menggunakan Firebase.

Implement:

```text
In-App Notification
Browser Notification where supported
Local Flutter Notification
```

Buat `PushProvider` abstraction untuk production integration nanti.

---

# 58. SEARCH

Global search desktop:

```text
Cari warga, rumah, laporan...
```

Permission aware.

Resident tidak boleh menemukan data administrative yang tidak memiliki izin.

Admin:

```text
resident
house
vehicle
visitor
report
```

Security:

```text
house
resident
vehicle
visitor
```

---

# 59. AUDIT LOG

WAJIB.

Track:

```text
login
resident approval
role changes
camera access
camera settings
finance changes
payment verification
visitor entry
incident update
data deletion
admin settings
```

Data:

```text
actor
action
entity
entity_id
timestamp
metadata
ip where available
```

Audit log tidak bisa diedit melalui UI.

---

# 60. ADMIN DASHBOARD

Admin dashboard fokus actionable item:

```text
5 akun menunggu approval
2 laporan belum ditangani
1 CCTV offline
3 pembayaran menunggu verifikasi
2 surat menunggu approval
```

Bukan chart besar tanpa kegunaan.

---

# 61. ADMIN COMMUNITY MANAGEMENT

Initial seed:

```text
Community:
Billabong Blok F
```

Data:

```text
name
slug
address
logo
timezone
contact
emergency_contact
```

Jangan hardcode community name di components.

---

# 62. DATABASE CORE

Core tables:

```text
communities

users
sessions
otp_requests

roles
permissions
user_roles
role_permissions

houses
households
household_members

residents

vehicles

announcements
announcement_targets

events

cameras
camera_permissions
camera_health
camera_access_logs

emergencies

visitors
visitor_checkins

packages

security_shifts

patrol_routes
patrol_checkpoints
patrol_sessions
patrol_scans

incidents

reports
report_updates

dues_types
invoices
payments

cash_transactions

letter_types
letter_requests

facilities
facility_bookings

notifications

attachments

audit_logs

settings
```

---

# 63. DATABASE STANDARD

Semua domain table yang membutuhkan isolation mempunyai:

```text
id
community_id
created_at
updated_at
```

Gunakan UUID.

Soft delete untuk data administrative tertentu:

```text
deleted_at
```

Tidak semua record boleh langsung dihapus permanen.

---

# 64. FILE STORAGE

Development:

**MinIO**

Buckets:

```text
avatars
announcements
reports
incidents
packages
payments
letters
community
```

Backend memberikan signed access.

Storage tidak boleh langsung public secara default.

---

# 65. ATTACHMENT SECURITY

Validate:

```text
mime
extension
size
authorization
```

Generate randomized object key.

Jangan gunakan filename dari user langsung sebagai storage path.

---

# 66. API DESIGN

Prefix:

```text
/api/v1
```

Example:

```text
POST   /auth/otp/request
POST   /auth/otp/verify
POST   /auth/logout

GET    /me

GET    /communities/current

GET    /announcements
POST   /announcements

GET    /cameras
GET    /cameras/:id
POST   /cameras/:id/stream-ticket

GET    /visitors
POST   /visitors
POST   /visitors/:id/check-in
POST   /visitors/:id/check-out

GET    /packages
POST   /packages
POST   /packages/:id/collect

GET    /reports
POST   /reports

GET    /emergencies
POST   /emergencies
POST   /emergencies/:id/acknowledge

GET    /invoices
POST   /payments

GET    /notifications
POST   /notifications/:id/read
```

---

# 67. API RESPONSE

Standard:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "CAMERA_OFFLINE",
    "message": "Kamera sedang tidak tersedia."
  }
}
```

Jangan mengirim stack trace ke client.

---

# 68. OPENAPI

API harus menghasilkan OpenAPI schema.

Gunanya:

* dokumentasi,
* testing,
* Flutter API integration,
* future integration.

Contracts jangan didefinisikan dua kali secara manual tanpa alasan.

---

# 69. LOADING STATE

Gunakan skeleton sesuai layout.

Jangan:

```text
blank page
```

atau spinner fullscreen untuk setiap request.

---

# 70. EMPTY STATES

Contoh:

```text
Belum ada paket

Paket yang diterima security
akan muncul di sini.
```

CTA hanya muncul jika relevan.

---

# 71. ERROR STATES

Contoh:

```text
Data belum bisa dimuat

Periksa koneksi lalu coba lagi.

[Coba Lagi]
```

Tidak menampilkan:

```text
TypeError
500 undefined
fetch failed
```

kepada resident.

---

# 72. OFFLINE EXPERIENCE

Web/PWA dan Flutter minimal menyimpan:

```text
user profile
community info
last announcements
last notifications
basic home snapshot
```

Jika offline:

```text
Anda sedang offline
Menampilkan data terakhir yang tersedia.
```

Action yang membutuhkan server harus diberi status jelas.

Jangan berpura-pura request berhasil.

---

# 73. ACCESSIBILITY

Minimum:

* semantic HTML,
* form label,
* keyboard navigation,
* visible focus,
* sufficient contrast,
* screen reader labels,
* touch target minimum yang nyaman,
* tidak mengandalkan warna saja,
* reduced motion.

---

# 74. PWA

Web harus installable.

Include:

```text
manifest
app icons
theme metadata
service worker
offline fallback
```

Display:

```text
standalone
```

Nama:

```text
Komplekku
```

Short name:

```text
Komplekku
```

---

# 75. FLUTTER APPLICATION

Flutter menggunakan backend yang sama.

Official Flutter documentation merekomendasikan arsitektur aplikasi yang terstruktur agar aplikasi tetap scalable saat complexity bertambah; Komplekku mobile harus mengikuti pemisahan presentation/data/domain yang jelas.

---

# 76. FLUTTER FOLDER STRUCTURE

```text
apps/mobile/lib/

app/
    app.dart
    router.dart
    theme/

core/
    api/
    auth/
    errors/
    storage/
    widgets/
    utils/

features/

    auth/
        data/
        domain/
        presentation/

    home/
    announcement/
    cctv/
    security/
    visitor/
    package/
    report/
    emergency/
    finance/
    resident/
    notification/
    profile/
```

Feature-first organization.

---

# 77. FLUTTER STACK

Recommended:

```text
Flutter
Dart
Riverpod
go_router
Dio
Freezed
json_serializable
flutter_secure_storage
shared_preferences
```

Camera/video dependency dipilih melalui abstraction.

Untuk WebRTC player buat interface:

```text
CctvPlayerController
```

Sehingga implementation dapat diganti tanpa mengubah presentation layer.

---

# 78. FLUTTER NAVIGATION

Bottom navigation:

```text
Beranda
Keamanan
Layanan
Aktivitas
Akun
```

Gunakan nested navigation agar state tab tidak reset setiap pindah menu.

Flutter menyediakan sistem Navigator/Router dan Router sesuai untuk aplikasi yang membutuhkan routing/deep links lebih terstruktur.

---

# 79. FLUTTER DESIGN

Mobile bukan web yang dibungkus WebView.

Flutter app harus native Flutter UI.

Shared:

```text
colors
spacing
typography
icons philosophy
API contracts
business rules
```

Namun layout mengikuti platform mobile.

---

# 80. FLUTTER MOTION

Gunakan native Flutter animation.

Contoh:

```text
AnimatedSwitcher
AnimatedSize
TweenAnimationBuilder
Hero only where meaningful
```

Hindari animation package untuk hal yang bisa dilakukan Flutter sendiri.

Tidak ada Lottie random hanya untuk mempercantik loading.

---

# 81. FLUTTER LOCAL SETUP

Install Flutter mengikuti setup resmi Flutter lalu pastikan environment sehat melalui:

```bash
flutter doctor
```

Dokumentasi Flutter menyediakan quick/manual installation flow dan project bootstrap resmi.

Initialize:

```bash
cd apps/mobile

flutter create \
  --org id.komplekku \
  --project-name komplekku \
  .
```

Kemudian:

```bash
flutter pub get
flutter doctor
flutter devices
```

Run Android:

```bash
flutter run
```

---

# 82. FLUTTER LOCAL API

Android Emulator:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

Android Emulator menyediakan `10.0.2.2` sebagai alamat khusus untuk mengakses loopback/localhost komputer development.

Physical device:

```text
http://IP-PC-DI-LAN:3001
```

Contoh konfigurasi:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://192.168.x.x:3001
```

---

# 83. ENVIRONMENT

Root `.env.example`:

```env
APP_ENV=local

WEB_PORT=3000
API_PORT=3001

DATABASE_URL=postgresql://komplekku:komplekku@localhost:5432/komplekku

REDIS_URL=redis://localhost:6379

AUTH_MODE=development
DEV_OTP=123456

STORAGE_DRIVER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=komplekku
MINIO_SECRET_KEY=change-me
MINIO_BUCKET=komplekku

MAIL_DRIVER=mailpit
MAIL_HOST=localhost
MAIL_PORT=1025

CCTV_MODE=mock
CCTV_GATEWAY_URL=http://localhost:8889

ALLOW_DEV_OTP=true
```

Secret real tidak boleh commit.

---

# 84. CAMERA SECRET

Actual source:

```env
CAMERA_GATE_MAIN_RTSP=rtsp://...
```

atau encrypted secret store.

Jangan simpan:

```text
camera username
camera password
RTSP URL
```

di frontend source.

---

# 85. SEED DATABASE

Development seed:

```text
Community
Billabong Blok F

Users
Super Admin
RT Admin
Treasurer
Security
Resident

Houses
F01
F02
F03
F04
F05

Cameras
Gerbang Utama
Gerbang Keluar
Taman
Pos Security

Announcements
2 sample

Invoices
sample

Visitors
sample
```

Seed data harus jelas diberi tanda demo.

---

# 86. NO FAKE PRODUCTION DATA

Demo data hanya berasal dari seed development.

Dilarang:

```javascript
const totalResidents = 328;
```

di component.

UI selalu mengambil data dari API.

---

# 87. TESTING

Minimum backend:

```text
Unit tests
Integration tests
Permission tests
API tests
```

Web:

```text
Component tests
E2E critical flow
Responsive tests
```

Flutter:

```text
Unit tests
Widget tests
Integration tests
```

---

# 88. CRITICAL E2E TESTS

Test:

### Auth

```text
OTP
→ login
→ resident dashboard
```

### Resident

```text
Create visitor
→ QR generated
```

### Security

```text
Scan visitor
→ check-in
→ check-out
```

### Package

```text
Create package
→ resident notification
→ collect
```

### Report

```text
Resident report
→ admin processing
→ resolved
```

### CCTV

```text
Resident opens allowed camera
```

Unauthorized:

```text
Resident opens security-only camera
→ 403
```

### Finance

```text
Invoice
→ proof upload
→ treasurer verify
→ paid
```

---

# 89. SECURITY CHECKLIST

Before production:

```text
Rate limiting
OTP attempt limit
Session expiration
CSRF protection where appropriate
CORS configuration
Input validation
RBAC
File validation
Secure headers
Encrypted secrets
Audit log
Signed storage URLs
Stream ticket expiration
No RTSP credentials client-side
```

---

# 90. PERFORMANCE TARGET

Home page jangan request 15 API terpisah bila bisa diaggregasi.

Provide:

```text
GET /home
```

yang memberikan information summary sesuai role.

Images:

* resize,
* compress,
* lazy load.

CCTV preview jangan otomatis membuka semua full-quality streams.

---

# 91. CCTV PERFORMANCE

Camera list:

thumbnail/snapshot atau low resource preview.

Full stream baru dimulai ketika:

```text
camera opened
```

atau kamera berada di active monitoring grid.

Saat tab/background tidak aktif:

pause stream jika memungkinkan.

---

# 92. PRIVACY PRINCIPLE

Resident hanya mendapatkan data minimum yang dibutuhkan.

Contoh:

Resident A tidak membutuhkan:

* phone seluruh warga,
* kartu identitas warga lain,
* payment evidence warga lain,
* detail incident sensitif,
* internal admin notes.

Backend harus enforce permission.

Jangan mengandalkan hide component saja.

---

# 93. ADMIN CONFIGURATION

Settings:

```text
Community identity
Resident registration
Visitor rules
CCTV permissions
Finance
Emergency contact
Notification
Facilities
Security shifts
Retention settings
```

---

# 94. BRANDING

Logo sementara boleh menggunakan typographic mark:

```text
Komplekku
```

dengan simple geometric home/community mark yang nanti dibuat secara manual.

Jangan meminta AI membuat random logo lalu memasukkannya otomatis.

Untuk development gunakan:

```text
K
```

monogram sederhana apabila final logo belum tersedia.

---

# 95. COPYWRITING

Gunakan Bahasa Indonesia natural.

GOOD:

```text
Paketmu sudah tiba di pos security.
```

BAD:

```text
Pemberitahuan paket berhasil diterima secara sukses.
```

GOOD:

```text
Belum ada tamu hari ini.
```

BAD:

```text
No visitor data available.
```

---

# 96. DATE FORMAT

UI Indonesia:

```text
11 Agu 2026
11 Agustus 2026
10:35
```

Currency:

```text
Rp150.000
```

Phone:

```text
08xx
```

Database tetap menggunakan timestamp standard.

---

# 97. APP STATES

Setiap feature WAJIB menangani:

```text
loading
success
empty
error
offline
unauthorized
forbidden
```

Tidak boleh hanya happy path.

---

# 98. FIRST DEVELOPMENT PHASE

Codex harus mengerjakan secara bertahap.

## Phase 0 — Foundation

Build:

```text
Monorepo
Docker local
Database
API
Web
Flutter project
Design tokens
Authentication foundation
RBAC
Seed
Testing foundation
```

Tidak deploy.

---

# 99. PHASE 1 — Resident Core

Build:

```text
Auth
Onboarding
Home
Profile
Community
Household
Announcement
Agenda
Notification
Resident directory
Vehicle
```

Semua functional.

---

# 100. PHASE 2 — SECURITY

Build:

```text
CCTV
Visitor
Visitor QR
Package
Security dashboard
Shift
Patrol
Incident
Emergency
```

---

# 101. PHASE 3 — COMMUNITY SERVICES

Build:

```text
Reports
Complaint tracking
Letters
Facilities
Bookings
```

---

# 102. PHASE 4 — FINANCE

Build:

```text
Dues
Invoices
Manual payments
Payment verification
Receipt
Cash transparency
Treasurer dashboard
```

---

# 103. PHASE 5 — MOBILE PARITY

Flutter must support core resident:

```text
Login
Home
Announcement
CCTV
Visitor
Packages
Reports
Emergency
Iuran
Notifications
Profile
```

Security mobile:

```text
Security Home
Visitor
Package
Patrol
Incident
Emergency
CCTV
```

---

# 104. PHASE 6 — QUALITY

Perform:

```text
Responsive QA
Flutter QA
Accessibility
Permission audit
Security audit
Performance
Offline states
Error states
Test coverage
Code cleanup
Documentation
```

Still:

**NO DEPLOYMENT.**

---

# 105. DEFINITION OF DONE

Sebuah feature dianggap selesai jika:

1. UI selesai.
2. Mobile responsive.
3. API real.
4. Database real.
5. Permission bekerja.
6. Validation bekerja.
7. Loading state tersedia.
8. Empty state tersedia.
9. Error state tersedia.
10. Unauthorized state tersedia.
11. Success feedback tersedia.
12. Tests tersedia untuk critical logic.
13. Tidak ada console error.
14. Tidak ada dead button.
15. Tidak ada fake count.
16. Tidak ada hardcoded production data.
17. Dokumentasi diperbarui.

---

# 106. CODE QUALITY

Dilarang membuat file:

```text
utils.ts
helpers.ts
common.ts
misc.ts
```

berisi ratusan fungsi tidak berhubungan.

Gunakan domain ownership.

Contoh:

```text
features/visitor/
features/cctv/
features/payment/
```

---

# 107. COMPONENT RULE

Jangan membuat:

```text
UniversalCard
UniversalModal
UniversalForm
UniversalEverything
```

yang menerima puluhan props.

Components harus mempunyai tujuan jelas.

Example:

```text
CameraCard
VisitorCard
InvoiceCard
AnnouncementCard
EmergencyButton
```

---

# 108. COMMENT RULE

Jangan comment:

```javascript
// increment counter
counter++;
```

Comment digunakan untuk:

* business rule,
* security decision,
* workaround,
* non-obvious logic.

---

# 109. README

README WAJIB menjelaskan:

```text
Apa itu Komplekku
Architecture
Requirements
Local setup
Docker
Database
Web
API
Flutter
CCTV
Testing
Seed account
Environment
Troubleshooting
```

Tidak boleh berisi deployment cloud sebagai default quickstart.

---

# 110. LOCAL START COMMAND

Target akhir:

```bash
git clone ...
cd komplekku

cp .env.example .env

docker compose up -d

pnpm install

pnpm db:migrate
pnpm db:seed

pnpm dev
```

Kemudian:

```text
Web:
http://localhost:3000

API:
http://localhost:3001

Mailpit:
http://localhost:8025

MinIO:
local configured port

Media Gateway:
local configured port
```

Flutter:

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

---

# 111. CODEX EXECUTION BEHAVIOR

Sebelum coding:

1. Read `AGENTS.md`.
2. Read `docs/PRD.md`.
3. Inspect existing implementation.
4. Create implementation plan.
5. Work in small coherent batches.
6. Run lint/test after meaningful changes.
7. Fix error before moving on.
8. Never hide failing tests.
9. Never disable test just to make build green.
10. Update docs where behavior changes.

Codex should not recreate working modules without reason.

---

# 112. STRICT NO DEPLOY RULE

Even after application passes tests:

DO NOT:

```text
Deploy
Publish
Push Docker image
Create Cloudflare project
Create Vercel project
Create Railway project
Configure production DNS
Purchase domain
Provision production DB
Configure production Supabase
Upload secrets to external provider
```

Instead create:

```text
docs/HOSTING_READINESS.md
```

containing requirements only.

The owner will handle hosting manually.

---

# 113. FINAL PRODUCT EXPECTATION

Komplekku harus terasa seperti aplikasi yang memang dibuat untuk penghuni perumahan.

Resident harus dapat membuka aplikasi dan dalam beberapa detik mengetahui:

```text
Ada pengumuman apa?
Ada paket?
Ada tamu?
CCTV aman?
Iuran sudah dibayar?
Ada agenda?
Bagaimana menghubungi security?
Bagaimana melaporkan masalah?
```

Security harus dapat membuka aplikasi dan langsung melakukan:

```text
Scan tamu
Input paket
Lihat emergency
Lihat CCTV
Mulai patroli
Buat laporan kejadian
```

Admin harus dapat langsung mengetahui:

```text
Apa yang perlu ditindaklanjuti hari ini?
```

---

# 114. PRODUCT MOTTO

**Komplekku — Semua kebutuhan lingkungan, dalam satu tempat.**

---

# 115. ABSOLUTE DEVELOPMENT RULE

Prioritas:

```text
Functional
→ Clear
→ Fast
→ Secure
→ Accessible
→ Beautiful
```

Bukan:

```text
Beautiful
→ Animation
→ Fake Dashboard
→ Function later
```

Jika design bertabrakan dengan usability:

**usability menang.**

Jika animation bertabrakan dengan performance:

**performance menang.**

Jika convenience bertabrakan dengan security:

**security menang.**

Dan sampai owner secara eksplisit meminta deployment:

# KOMPLEKKU HARUS TETAP BERJALAN LOKAL.
