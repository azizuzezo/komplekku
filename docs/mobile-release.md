# Merilis APK Komplekku

APK dibangun oleh GitHub Actions dan diterbitkan sebagai **GitHub Release
asset**, bukan di Vercel.

Dua alasan:

- Build container Vercel hanya punya Node. APK butuh Flutter SDK + Android SDK
  + JDK, sekitar 4 menit build.
- APK-nya ~62 MB. Menaruhnya di `apps/web/public/` berarti commit 62 MB ke git
  setiap rilis, dan git menyimpannya selamanya — repo ini baru 8 MB.

Vercel tetap meng-host web app seperti biasa; hanya APK-nya yang tidak.

## URL unduhan (dipasang sekali, tidak pernah berubah)

```
https://github.com/azizuzezo/komplekku/releases/latest/download/app-release.apk
```

GitHub mengarahkan `latest` ke rilis terbaru secara otomatis, jadi
`MOBILE_APK_URL` di env API cukup diisi sekali. (Updater di aplikasi mengikuti
redirect — `followRedirects: true` di `AppUpdateService.downloadApk`.)

## Setup sekali di awal: empat secret repository

Buka **Settings → Secrets and variables → Actions → New repository secret** di
GitHub, lalu isi:

| Secret | Nilai |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | isi `komplekku-release.jks` dalam base64 (lihat di bawah) |
| `ANDROID_STORE_PASSWORD` | `storePassword` dari `android/key.properties` |
| `ANDROID_KEY_ALIAS` | `keyAlias` dari `android/key.properties` |
| `ANDROID_KEY_PASSWORD` | `keyPassword` dari `android/key.properties` |

Untuk mendapatkan base64-nya (jalankan di Git Bash dari akar repo):

```bash
base64 -w0 apps/mobile/android/komplekku-release.jks | clip
```

Isinya sekitar 3.700 karakter; tempel apa adanya ke kolom secret.

> Keystore dan `key.properties` sengaja di-gitignore. Kalau keduanya hilang,
> **tidak ada build masa depan yang bisa memperbarui aplikasi yang sudah
> terpasang** — Android menolak update yang tanda tangannya berubah. Simpan
> cadangannya di luar repo.

## Alur rilis

1. Naikkan versi di `apps/mobile/pubspec.yaml`, misal `0.2.0+2` → `0.3.0+3`.
   Angka setelah `+` adalah `versionCode` — itulah yang dibandingkan Android
   dan updater untuk memutuskan ada pembaruan atau tidak.
2. Push ke `main`. Workflow berjalan otomatis kalau ada perubahan di
   `apps/mobile/**` atau `packages/contracts/**`.
3. Buka ringkasan job di tab Actions. Di sana tertulis persis nilai env yang
   harus dipasang.
4. Set di env API (Railway/Vercel/di mana pun API berjalan), lalu deploy ulang:

   ```
   MOBILE_LATEST_VERSION_CODE=3
   MOBILE_LATEST_VERSION_NAME=0.3.0
   MOBILE_APK_URL=https://github.com/azizuzezo/komplekku/releases/latest/download/app-release.apk
   ```

Warga akan ditawari pembaruan saat berikutnya membuka aplikasi.

## Hal yang perlu diketahui

- **Push tanpa menaikkan versi** tetap membangun ulang dan mengganti aset di
  rilis yang sama, tapi warga yang sudah memasang `versionCode` itu **tidak**
  akan ditawari lagi. Naikkan `+N` kalau memang ingin menyebarkan pembaruan.
- Workflow **gagal dengan sengaja** kalau secret keystore tidak ada, atau kalau
  APK hasilnya tidak ditandatangani kunci Komplekku. APK bertanda tangan debug
  lebih buruk daripada tidak ada APK: pemasangannya gagal untuk semua pengguna
  lama dengan `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.
- Selama `MOBILE_APK_URL` kosong, endpoint melaporkan "tidak ada pembaruan" dan
  aplikasi tidak pernah bertanya. Aman untuk dibiarkan mati.
- Android **tidak pernah** memasang senyap untuk aplikasi biasa. Warga tetap
  menekan satu konfirmasi di layar pemasang milik OS.
