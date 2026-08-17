import type { PrismaClient } from "@prisma/client";

export const roleDefinitions = [
  ["SUPER_ADMIN", "Super Admin"],
  ["COMMUNITY_ADMIN", "Ketua RW"],
  ["RT_ADMIN", "Ketua RT"],
  ["SEKRETARIS", "Sekretaris"],
  ["TREASURER", "Bendahara"],
  ["SECURITY", "Security"],
  ["RESIDENT", "Warga"],
  ["HOUSEHOLD_MEMBER", "Anggota Keluarga"],
  ["STAFF", "Staf"],
] as const;

export const permissionDefinitions = [
  ["home.read", "Melihat beranda sesuai konteks"],
  ["community.read", "Melihat informasi komunitas"],
  ["community.manage", "Mengelola struktur komunitas, RT, dan RW"],
  ["platform.community.create", "Membuat komunitas baru di platform"],
  ["household.read", "Melihat rumah tangga sendiri"],
  ["household.manage", "Menambah dan menghapus anggota rumah tangga sendiri"],
  ["announcement.read", "Membaca pengumuman"],
  ["announcement.manage", "Mengelola pengumuman"],
  ["agenda.read", "Membaca agenda komunitas"],
  ["agenda.manage", "Mengelola agenda komunitas"],
  ["notification.read", "Membaca notifikasi sendiri"],
  ["directory.read", "Membaca direktori warga dengan data minimum"],
  ["resident.read", "Membaca data administrasi warga sesuai komunitas"],
  ["resident.manage", "Mengelola dan menyetujui warga"],
  ["vehicle.manage", "Mengelola kendaraan rumah sendiri"],
  ["vehicle.search", "Mencari kendaraan komunitas berdasarkan plat"],
  ["camera.public.read", "Melihat kamera dengan akses warga"],
  ["camera.security.read", "Melihat kamera dengan akses security"],
  ["camera.manage", "Mengelola kamera CCTV"],
  ["visitor.create", "Membuat undangan tamu"],
  ["visitor.read", "Melihat daftar tamu"],
  ["visitor.checkin", "Check-in dan check-out tamu"],
  ["package.read", "Melihat status paket rumah sendiri"],
  ["package.manage", "Mengelola paket masuk dan pengambilan"],
  ["incident.create", "Membuat laporan kejadian"],
  ["incident.read", "Membaca laporan kejadian"],
  ["incident.manage", "Mengelola status laporan kejadian"],
  ["patrol.execute", "Menjalankan patroli security"],
  ["patrol.manage", "Mengelola titik checkpoint patroli"],
  ["emergency.create", "Mengirim sinyal emergency"],
  ["emergency.read", "Melihat sinyal emergency"],
  ["emergency.manage", "Menindaklanjuti sinyal emergency"],
  ["security.dashboard.read", "Melihat dasbor ringkas security"],
  ["report.create", "Membuat laporan/pengaduan warga"],
  ["report.read", "Membaca laporan/pengaduan warga"],
  ["report.manage", "Mengelola status laporan/pengaduan warga"],
  ["letter.create", "Mengajukan permohonan surat"],
  ["letter.read", "Membaca permohonan surat"],
  ["letter.manage", "Meninjau dan menindaklanjuti permohonan surat"],
  ["facility.read", "Melihat daftar fasilitas dan kalender booking"],
  ["facility.book", "Memesan fasilitas lingkungan"],
  ["facility.manage", "Mengelola fasilitas dan pemesanan"],
  ["dues.manage", "Mengelola jenis iuran dan menerbitkan tagihan"],
  ["invoice.read", "Melihat tagihan iuran"],
  ["payment.create", "Mengirim pembayaran manual atas tagihan sendiri"],
  ["payment.verify", "Memverifikasi atau menolak pembayaran warga"],
  ["cash.read", "Melihat transparansi kas lingkungan"],
  ["cash.manage", "Mencatat transaksi kas lingkungan"],
  ["finance.dashboard.read", "Melihat dasbor ringkas keuangan"],
  ["admin.audit.read", "Membaca audit log"],
  ["forum.read", "Membaca pesan Forum Warga"],
  ["forum.post", "Mengirim pesan dan lampiran di Forum Warga"],
  ["forum.manage", "Menghapus pesan warga lain di Forum Warga"],
] as const;

const allPermissionKeys = permissionDefinitions.map(([key]) => key);

// COMMUNITY_ADMIN (Ketua RW) manages everything within their own community,
// including its RT/RW structure, but — unlike SUPER_ADMIN — cannot create a
// brand-new community on the platform.
const communityAdminPermissionKeys = allPermissionKeys.filter(
  (key) => key !== "platform.community.create",
);

// RT_ADMIN (Ketua RT) has the same operational breadth as Ketua RW within
// their own RT (enforced by rtScopeId in the auth session, not here), but
// must not be able to rename the RW or create/edit RTs — that was the actual
// bug this permission set fixes (RT_ADMIN previously had SUPER_ADMIN-level
// access with no scoping at all).
const rtAdminPermissionKeys = communityAdminPermissionKeys.filter(
  (key) => key !== "community.manage",
);

export const rolePermissionKeys: Record<string, readonly string[]> = {
  SUPER_ADMIN: allPermissionKeys,
  COMMUNITY_ADMIN: communityAdminPermissionKeys,
  RT_ADMIN: rtAdminPermissionKeys,
  SEKRETARIS: [
    "home.read",
    "community.read",
    "household.read",
    "announcement.read",
    "announcement.manage",
    "agenda.read",
    "agenda.manage",
    "notification.read",
    "directory.read",
    "resident.read",
    "letter.read",
    "letter.manage",
    "report.read",
    "facility.read",
    "admin.audit.read",
    "forum.read",
    "forum.post",
    "forum.manage",
  ],
  TREASURER: [
    "home.read",
    "community.read",
    "household.read",
    "announcement.read",
    "announcement.manage",
    "agenda.read",
    "notification.read",
    "directory.read",
    "vehicle.manage",
    "dues.manage",
    "invoice.read",
    "payment.verify",
    "cash.read",
    "cash.manage",
    "finance.dashboard.read",
    "forum.read",
    "forum.post",
  ],
  SECURITY: [
    "community.read",
    "announcement.read",
    "agenda.read",
    "notification.read",
    "directory.read",
    "resident.read",
    "vehicle.search",
    "camera.public.read",
    "camera.security.read",
    "visitor.read",
    "visitor.checkin",
    "package.manage",
    "incident.create",
    "incident.read",
    "patrol.execute",
    "emergency.create",
    "emergency.read",
    "emergency.manage",
    "security.dashboard.read",
  ],
  RESIDENT: [
    "home.read",
    "community.read",
    "household.read",
    "household.manage",
    "announcement.read",
    "agenda.read",
    "notification.read",
    "directory.read",
    "vehicle.manage",
    "camera.public.read",
    "visitor.create",
    "visitor.read",
    "package.read",
    "emergency.create",
    "report.create",
    "report.read",
    "letter.create",
    "letter.read",
    "facility.read",
    "facility.book",
    "invoice.read",
    "payment.create",
    "cash.read",
    "forum.read",
    "forum.post",
  ],
  HOUSEHOLD_MEMBER: [
    "home.read",
    "community.read",
    "household.read",
    "household.manage",
    "announcement.read",
    "agenda.read",
    "notification.read",
    "directory.read",
    "vehicle.manage",
    "camera.public.read",
    "visitor.create",
    "visitor.read",
    "package.read",
    "emergency.create",
    "report.create",
    "report.read",
    "letter.create",
    "letter.read",
    "facility.read",
    "facility.book",
    "invoice.read",
    "payment.create",
    "cash.read",
    "forum.read",
    "forum.post",
  ],
  STAFF: [
    "community.read",
    "announcement.read",
    "agenda.read",
    "notification.read",
    "directory.read",
    "camera.public.read",
  ],
};

/**
 * Upserts the permission and role reference data shared by every
 * environment (dev demo seed and the real production bootstrap alike).
 */
export async function seedRbac(prisma: PrismaClient) {
  const permissions = new Map<string, string>();
  for (const [key, description] of permissionDefinitions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
    permissions.set(key, permission.id);
  }

  const roles = new Map<string, string>();
  for (const [code, name] of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
    roles.set(code, role.id);

    for (const key of rolePermissionKeys[code] ?? []) {
      const permissionId = permissions.get(key);
      if (!permissionId) throw new Error(`Permission seed tidak ditemukan: ${key}`);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  return { roles, permissions };
}
