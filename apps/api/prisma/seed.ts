import { PrismaClient } from "@prisma/client";

import { seedRbac } from "./rbac-seed-data";

const prisma = new PrismaClient();

async function main() {
  const billabong = await prisma.community.upsert({
    where: { slug: "billabong-blok-f" },
    update: {
      name: "Billabong Blok F",
      address: "Billabong, Bogor",
      timezone: "Asia/Jakarta",
      rwLabel: "RW 13",
      registrationOpen: true,
      deletedAt: null,
    },
    create: {
      slug: "billabong-blok-f",
      name: "Billabong Blok F",
      address: "Billabong, Bogor",
      timezone: "Asia/Jakarta",
      rwLabel: "RW 13",
      registrationOpen: true,
    },
  });

  const tamanCendana = await prisma.community.upsert({
    where: { slug: "demo-taman-cendana" },
    update: {
      name: "[Demo] Taman Cendana",
      address: "Komunitas kedua untuk pengujian isolasi tenant lokal",
      timezone: "Asia/Jakarta",
      registrationOpen: true,
      deletedAt: null,
    },
    create: {
      slug: "demo-taman-cendana",
      name: "[Demo] Taman Cendana",
      address: "Komunitas kedua untuk pengujian isolasi tenant lokal",
      timezone: "Asia/Jakarta",
      registrationOpen: true,
    },
  });

  const { roles } = await seedRbac(prisma);

  // Billabong Blok F has two RTs under one RW, matching the real neighborhood
  // structure — the owner's actual RT numbers are RT 03 and RT 04. All the
  // regular Blok F houses sit in RT 03 (kept together so the seeded admin
  // fixture retains community-wide reach across the existing test suite);
  // F2D2-17 sits in RT 04 to demonstrate a second, genuinely separate RT
  // without disturbing that fixture's scope. Both remain editable by a
  // super admin / Ketua RW via PATCH /admin/rts/:id (community.manage).
  const billabongRt01 = await prisma.rt.upsert({
    where: { communityId_code: { communityId: billabong.id, code: "RT 03" } },
    update: { name: "RT 03", deletedAt: null },
    create: { communityId: billabong.id, code: "RT 03", name: "RT 03" },
  });
  const billabongRt02 = await prisma.rt.upsert({
    where: { communityId_code: { communityId: billabong.id, code: "RT 04" } },
    update: { name: "RT 04", deletedAt: null },
    create: { communityId: billabong.id, code: "RT 04", name: "RT 04" },
  });
  const tamanCendanaRt01 = await prisma.rt.upsert({
    where: { communityId_code: { communityId: tamanCendana.id, code: "RT 01" } },
    update: { name: "RT 01", deletedAt: null },
    create: { communityId: tamanCendana.id, code: "RT 01", name: "RT 01" },
  });

  // Forum Warga channels aren't backfilled by a migration (no production data
  // exists to migrate yet) — ensure one per RT plus one community-wide
  // channel exists for every seeded community, mirroring what the API does
  // automatically for RTs/communities created after this point.
  async function ensureForumChannel(communityId: string, rtId: string | null, name: string) {
    const existing = await prisma.forumChannel.findFirst({ where: { communityId, rtId } });
    if (existing) return existing;
    return prisma.forumChannel.create({ data: { communityId, rtId, name } });
  }
  await ensureForumChannel(billabong.id, null, "Forum Warga");
  await ensureForumChannel(billabong.id, billabongRt01.id, billabongRt01.name);
  await ensureForumChannel(billabong.id, billabongRt02.id, billabongRt02.name);
  await ensureForumChannel(tamanCendana.id, null, "Forum Warga");
  await ensureForumChannel(tamanCendana.id, tamanCendanaRt01.id, tamanCendanaRt01.name);

  const billabongHouses = new Map<string, string>();
  for (const number of ["01", "02", "03", "04", "05"]) {
    const code = `F${number}`;
    const rtId = billabongRt01.id;
    const house = await prisma.house.upsert({
      where: { communityId_code: { communityId: billabong.id, code } },
      update: {
        block: "F",
        number,
        rtId,
        occupancyStatus: number === "05" ? "VACANT" : "OWNER_OCCUPIED",
        deletedAt: null,
      },
      create: {
        communityId: billabong.id,
        code,
        block: "F",
        number,
        rtId,
        occupancyStatus: number === "05" ? "VACANT" : "OWNER_OCCUPIED",
      },
    });
    billabongHouses.set(code, house.id);
  }

  // Demonstrates that block/number accept any format, not just a single letter
  // plus a two-digit number (e.g. multi-block cluster names like "F2D2").
  const superAdminHouse = await prisma.house.upsert({
    where: { communityId_code: { communityId: billabong.id, code: "F2D2-17" } },
    update: {
      block: "F2D2",
      number: "17",
      rtId: billabongRt02.id,
      occupancyStatus: "OWNER_OCCUPIED",
      deletedAt: null,
    },
    create: {
      communityId: billabong.id,
      code: "F2D2-17",
      block: "F2D2",
      number: "17",
      rtId: billabongRt02.id,
      occupancyStatus: "OWNER_OCCUPIED",
    },
  });
  billabongHouses.set("F2D2-17", superAdminHouse.id);

  const c01 = await prisma.house.upsert({
    where: {
      communityId_code: { communityId: tamanCendana.id, code: "C01" },
    },
    update: {
      block: "C",
      number: "01",
      rtId: tamanCendanaRt01.id,
      occupancyStatus: "OWNER_OCCUPIED",
      deletedAt: null,
    },
    create: {
      communityId: tamanCendana.id,
      code: "C01",
      block: "C",
      number: "01",
      rtId: tamanCendanaRt01.id,
      occupancyStatus: "OWNER_OCCUPIED",
    },
  });

  const f01Id = billabongHouses.get("F01");
  const f02Id = billabongHouses.get("F02");
  if (!f01Id || !f02Id) throw new Error("Seed rumah F01/F02 gagal dibuat.");

  async function seedApprovedUser(input: {
    communityId: string;
    houseId: string;
    householdName: string;
    phoneE164: string;
    fullName: string;
    roleCode: string;
    allowResidentContact?: boolean;
    rtId?: string;
  }) {
    const household = await prisma.household.upsert({
      where: { houseId: input.houseId },
      update: {
        displayName: input.householdName,
        communityId: input.communityId,
        deletedAt: null,
      },
      create: {
        communityId: input.communityId,
        houseId: input.houseId,
        displayName: input.householdName,
      },
    });
    const user = await prisma.user.upsert({
      where: { phoneE164: input.phoneE164 },
      update: {
        displayName: input.fullName,
        status: "ACTIVE",
        allowResidentContact: input.allowResidentContact ?? false,
      },
      create: {
        phoneE164: input.phoneE164,
        displayName: input.fullName,
        status: "ACTIVE",
        allowResidentContact: input.allowResidentContact ?? false,
        phoneVerifiedAt: new Date(),
      },
    });
    const resident = await prisma.resident.upsert({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: input.communityId,
        },
      },
      update: {
        fullName: input.fullName,
        status: "ACTIVE",
        requestedHouseId: input.houseId,
        requestedRelationship: "HEAD",
        approvedAt: new Date(),
        rejectedAt: null,
        rejectedByUserId: null,
        rejectionReason: null,
      },
      create: {
        communityId: input.communityId,
        userId: user.id,
        fullName: input.fullName,
        status: "ACTIVE",
        requestedHouseId: input.houseId,
        requestedRelationship: "HEAD",
        approvedAt: new Date(),
      },
    });
    await prisma.householdMember.upsert({
      where: {
        residentId_householdId: {
          residentId: resident.id,
          householdId: household.id,
        },
      },
      update: { relationship: "HEAD", isPrimary: true, endedAt: null },
      create: {
        communityId: input.communityId,
        residentId: resident.id,
        householdId: household.id,
        relationship: "HEAD",
        isPrimary: true,
      },
    });
    // If a prior seed run assigned this demo resident to a different house
    // (e.g. the target house code changed between iterations), retire that
    // stale membership so re-seeding stays idempotent and context auto-selects.
    await prisma.householdMember.updateMany({
      where: {
        residentId: resident.id,
        householdId: { not: household.id },
        endedAt: null,
      },
      data: { endedAt: new Date() },
    });
    const roleId = roles.get(input.roleCode);
    if (!roleId) throw new Error(`Role ${input.roleCode} gagal dibuat.`);
    await prisma.userRole.upsert({
      where: {
        userId_communityId_roleId: {
          userId: user.id,
          communityId: input.communityId,
          roleId,
        },
      },
      update: { rtId: input.rtId ?? null },
      create: {
        userId: user.id,
        communityId: input.communityId,
        roleId,
        rtId: input.rtId ?? null,
      },
    });
    return { household, resident, user };
  }

  const billabongResident = await seedApprovedUser({
    communityId: billabong.id,
    houseId: f01Id,
    householdName: "Keluarga Pratama",
    phoneE164: "+6281200000001",
    fullName: "Aziz Pratama",
    roleCode: "RESIDENT",
    allowResidentContact: true,
  });
  const billabongAdmin = await seedApprovedUser({
    communityId: billabong.id,
    houseId: f02Id,
    householdName: "Keluarga Wulandari",
    phoneE164: "+6281200000002",
    fullName: "Rina Wulandari",
    roleCode: "RT_ADMIN",
    rtId: billabongRt01.id,
  });
  const tamanCendanaAdmin = await seedApprovedUser({
    communityId: tamanCendana.id,
    houseId: c01.id,
    householdName: "Keluarga Cendana",
    phoneE164: "+6281200000101",
    fullName: "Dimas Cendana",
    roleCode: "RT_ADMIN",
    allowResidentContact: true,
    rtId: tamanCendanaRt01.id,
  });
  const f03Id = billabongHouses.get("F03");
  if (!f03Id) throw new Error("Seed rumah F03 gagal dibuat.");
  await seedApprovedUser({
    communityId: billabong.id,
    houseId: f03Id,
    householdName: "Keluarga Santoso",
    phoneE164: "+6281200000003",
    fullName: "Budi Santoso",
    roleCode: "SECURITY",
  });
  const f04Id = billabongHouses.get("F04");
  if (!f04Id) throw new Error("Seed rumah F04 gagal dibuat.");
  const billabongTreasurer = await seedApprovedUser({
    communityId: billabong.id,
    houseId: f04Id,
    householdName: "Keluarga Nugroho",
    phoneE164: "+6281200000004",
    fullName: "Sari Nugroho",
    roleCode: "TREASURER",
  });
  await seedApprovedUser({
    communityId: billabong.id,
    houseId: superAdminHouse.id,
    householdName: "Admin Utama",
    phoneE164: "+6282145610774",
    fullName: "Super Admin",
    roleCode: "SUPER_ADMIN",
  });

  const demoVehicles = [
    {
      id: "70000000-0000-4000-8000-000000000001",
      communityId: billabong.id,
      householdId: billabongResident.household.id,
      ownerResidentId: billabongResident.resident.id,
      type: "CAR" as const,
      plate: "B 1234 KKU",
      plateNormalized: "B1234KKU",
      brand: "Toyota",
      model: "Avanza",
      color: "Hijau tua",
      ownerLabel: "[Demo] Aziz Pratama",
      status: "ACTIVE" as const,
    },
    {
      id: "80000000-0000-4000-8000-000000000001",
      communityId: tamanCendana.id,
      householdId: tamanCendanaAdmin.household.id,
      ownerResidentId: tamanCendanaAdmin.resident.id,
      type: "MOTORCYCLE" as const,
      plate: "B 1234 KKU",
      plateNormalized: "B1234KKU",
      brand: "Honda",
      model: "Vario",
      color: "Hitam",
      ownerLabel: "[Demo Tenant B] Dimas Cendana",
      status: "ACTIVE" as const,
    },
  ];

  for (const vehicle of demoVehicles) {
    await prisma.vehicle.upsert({
      where: { id: vehicle.id },
      update: { ...vehicle, archivedAt: null },
      create: vehicle,
    });
  }

  const now = new Date();
  const announcements = [
    {
      id: "10000000-0000-4000-8000-000000000001",
      title: "[Demo] Pemadaman listrik sementara",
      summary: "Simulasi informasi pemadaman untuk pengembangan lokal.",
      body: "Data contoh: pemadaman listrik dijadwalkan pukul 13.00-15.00 WIB. Informasi ini bukan pengumuman operasional nyata.",
      priority: "IMPORTANT" as const,
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      communityId: billabong.id,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      title: "[Demo] Kerja bakti Blok F",
      summary: "Simulasi agenda warga untuk pengembangan lokal.",
      body: "Data contoh: warga berkumpul di taman blok pada Minggu pukul 07.00 WIB.",
      priority: "NORMAL" as const,
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      communityId: billabong.id,
    },
    {
      id: "20000000-0000-4000-8000-000000000001",
      title: "[Demo Tenant B] Informasi Taman Cendana",
      summary: "Pengumuman ini hanya boleh terlihat di komunitas demo kedua.",
      body: "Data contoh untuk membuktikan bahwa pengumuman tenant B tidak dapat dibaca tenant A.",
      priority: "NORMAL" as const,
      publishedAt: new Date(now.getTime() - 60 * 60 * 1000),
      communityId: tamanCendana.id,
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.upsert({
      where: { id: announcement.id },
      update: {
        title: announcement.title,
        summary: announcement.summary,
        body: announcement.body,
        priority: announcement.priority,
        publishedAt: announcement.publishedAt,
        archivedAt: null,
        deletedAt: null,
      },
      create: {
        ...announcement,
      },
    });
  }

  function dateAtOffset(days: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
  }

  function timeAt(value: string) {
    return new Date(`1970-01-01T${value}:00.000Z`);
  }

  const events = [
    {
      id: "30000000-0000-4000-8000-000000000001",
      communityId: billabong.id,
      createdByUserId: billabongAdmin.user.id,
      title: "[Demo] Kerja bakti lingkungan",
      eventDate: dateAtOffset(2),
      startTime: timeAt("07:00"),
      endTime: timeAt("09:00"),
      location: "Taman Blok F",
      description: "Data contoh agenda kerja bakti untuk pengembangan lokal.",
      organizer: "Pengurus RT",
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      communityId: billabong.id,
      createdByUserId: billabongAdmin.user.id,
      title: "[Demo] Rapat warga sebelumnya",
      eventDate: dateAtOffset(-2),
      startTime: timeAt("19:00"),
      endTime: timeAt("20:30"),
      location: "Balai Warga",
      description: "Data contoh agenda lampau untuk pengembangan lokal.",
      organizer: "Pengurus RT",
    },
    {
      id: "40000000-0000-4000-8000-000000000001",
      communityId: tamanCendana.id,
      createdByUserId: tamanCendanaAdmin.user.id,
      title: "[Demo Tenant B] Agenda Taman Cendana",
      eventDate: dateAtOffset(3),
      startTime: timeAt("08:00"),
      endTime: timeAt("10:00"),
      location: "Taman Cendana",
      description: "Agenda ini hanya boleh terlihat di komunitas demo kedua.",
      organizer: "Pengurus Taman Cendana",
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        communityId: event.communityId,
        createdByUserId: event.createdByUserId,
        title: event.title,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        description: event.description,
        organizer: event.organizer,
        archivedAt: null,
        archivedByUserId: null,
        deletedAt: null,
      },
      create: event,
    });
  }

  const seededNotifications = [
    {
      id: "50000000-0000-4000-8000-000000000001",
      communityId: billabong.id,
      userId: billabongResident.user.id,
      title: "Agenda lingkungan mendatang",
      message: "Kerja bakti lingkungan dijadwalkan dua hari lagi.",
      entityType: "EVENT",
      entityId: events[0]?.id ?? null,
      priority: "NORMAL" as const,
    },
    {
      id: "60000000-0000-4000-8000-000000000001",
      communityId: tamanCendana.id,
      userId: tamanCendanaAdmin.user.id,
      title: "Agenda komunitas Taman Cendana",
      message: "Ada agenda demo khusus komunitas Taman Cendana.",
      entityType: "EVENT",
      entityId: events[2]?.id ?? null,
      priority: "NORMAL" as const,
    },
  ];

  for (const notification of seededNotifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: {
        communityId: notification.communityId,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        priority: notification.priority,
      },
      create: notification,
    });
  }

  const demoCameras = [
    {
      id: "90000000-0000-4000-8000-000000000001",
      communityId: billabong.id,
      name: "Gerbang Utama",
      location: "Pintu masuk utama",
      accessLevel: "RESIDENT" as const,
      displayOrder: 1,
    },
    {
      id: "90000000-0000-4000-8000-000000000002",
      communityId: billabong.id,
      name: "Area Taman",
      location: "Taman Blok F",
      accessLevel: "RESIDENT" as const,
      displayOrder: 2,
    },
    {
      id: "90000000-0000-4000-8000-000000000003",
      communityId: billabong.id,
      name: "Pos Security",
      location: "Pos jaga",
      accessLevel: "SECURITY" as const,
      displayOrder: 3,
    },
    {
      id: "90000000-0000-4000-8000-000000000004",
      communityId: billabong.id,
      name: "Area Internal",
      location: "Gudang dan area layanan",
      accessLevel: "ADMIN_ONLY" as const,
      displayOrder: 4,
    },
  ];

  for (const camera of demoCameras) {
    await prisma.camera.upsert({
      where: { id: camera.id },
      update: { ...camera, status: "ONLINE", lastOnlineAt: now, archivedAt: null },
      create: { ...camera, status: "ONLINE", lastOnlineAt: now },
    });
  }

  const demoCheckpoints = [
    { id: "a0000000-0000-4000-8000-000000000001", name: "Pos Security", displayOrder: 1 },
    { id: "a0000000-0000-4000-8000-000000000002", name: "Gerbang Utama", displayOrder: 2 },
    { id: "a0000000-0000-4000-8000-000000000003", name: "Taman", displayOrder: 3 },
    { id: "a0000000-0000-4000-8000-000000000004", name: "Ujung Blok F", displayOrder: 4 },
    { id: "a0000000-0000-4000-8000-000000000005", name: "Area Fasilitas", displayOrder: 5 },
  ];

  for (const checkpoint of demoCheckpoints) {
    await prisma.patrolCheckpoint.upsert({
      where: { id: checkpoint.id },
      update: {
        name: checkpoint.name,
        displayOrder: checkpoint.displayOrder,
        communityId: billabong.id,
        archivedAt: null,
      },
      create: {
        id: checkpoint.id,
        communityId: billabong.id,
        name: checkpoint.name,
        displayOrder: checkpoint.displayOrder,
        qrToken: `checkpoint-${checkpoint.id}`,
      },
    });
  }

  await prisma.visitor.upsert({
    where: { id: "b0000000-0000-4000-8000-000000000001" },
    update: {
      guestName: "Rudi Hartono",
      status: "PENDING",
      visitDate: dateAtOffset(0),
    },
    create: {
      id: "b0000000-0000-4000-8000-000000000001",
      communityId: billabong.id,
      householdId: billabongResident.household.id,
      createdByUserId: billabongResident.user.id,
      guestName: "Rudi Hartono",
      guestPhone: "+6281300000001",
      visitDate: dateAtOffset(0),
      expectedTime: timeAt("14:00"),
      purpose: "Kunjungan keluarga",
      qrToken: "b0000000-0000-4000-8000-000000000001-qr",
      status: "PENDING",
    },
  });

  const demoLetterTypes = [
    {
      id: "c1000000-0000-4000-8000-000000000001",
      name: "Surat Pengantar",
      description: "Surat pengantar umum dari lingkungan.",
      displayOrder: 1,
    },
    {
      id: "c1000000-0000-4000-8000-000000000002",
      name: "Surat Domisili Lingkungan",
      description:
        "Keterangan domisili yang diterbitkan lingkungan, bukan dokumen pemerintah resmi.",
      displayOrder: 2,
    },
    {
      id: "c1000000-0000-4000-8000-000000000003",
      name: "Surat Keterangan",
      description: "Surat keterangan umum sesuai kebutuhan warga.",
      displayOrder: 3,
    },
    {
      id: "c1000000-0000-4000-8000-000000000004",
      name: "Surat Pengantar Administrasi",
      description: "Surat pengantar untuk keperluan administrasi warga.",
      displayOrder: 4,
    },
  ];

  for (const letterType of demoLetterTypes) {
    await prisma.letterType.upsert({
      where: { id: letterType.id },
      update: { ...letterType, communityId: billabong.id, isActive: true },
      create: { ...letterType, communityId: billabong.id },
    });
  }

  await prisma.facility.upsert({
    where: { id: "d1000000-0000-4000-8000-000000000001" },
    update: {
      name: "Balai Warga",
      openTime: "08:00",
      closeTime: "21:00",
      capacity: 80,
      rules: "Wajib menjaga kebersihan dan mengembalikan kunci setelah acara selesai.",
      communityId: billabong.id,
      isActive: true,
    },
    create: {
      id: "d1000000-0000-4000-8000-000000000001",
      communityId: billabong.id,
      name: "Balai Warga",
      openTime: "08:00",
      closeTime: "21:00",
      capacity: 80,
      rules: "Wajib menjaga kebersihan dan mengembalikan kunci setelah acara selesai.",
    },
  });

  const duesTypeLingkungan = await prisma.duesType.upsert({
    where: { id: "d2000000-0000-4000-8000-000000000001" },
    update: {
      name: "Iuran Lingkungan",
      description: "Iuran bulanan untuk operasional lingkungan.",
      defaultAmount: 150000,
      communityId: billabong.id,
      isActive: true,
    },
    create: {
      id: "d2000000-0000-4000-8000-000000000001",
      communityId: billabong.id,
      name: "Iuran Lingkungan",
      description: "Iuran bulanan untuk operasional lingkungan.",
      defaultAmount: 150000,
    },
  });

  await prisma.invoice.upsert({
    where: {
      householdId_duesTypeId_period: {
        householdId: billabongResident.household.id,
        duesTypeId: duesTypeLingkungan.id,
        period: "2026-08",
      },
    },
    update: { amount: 150000, dueDate: dateAtOffset(20), status: "UNPAID" },
    create: {
      id: "e1000000-0000-4000-8000-000000000001",
      communityId: billabong.id,
      householdId: billabongResident.household.id,
      duesTypeId: duesTypeLingkungan.id,
      period: "2026-08",
      amount: 150000,
      dueDate: dateAtOffset(20),
    },
  });

  const demoCashTransactions = [
    {
      id: "f1000000-0000-4000-8000-000000000001",
      date: dateAtOffset(-10),
      category: "Iuran Lingkungan",
      description: "Kumpulan iuran lingkungan bulan lalu.",
      amount: 3500000,
      type: "INCOME" as const,
      visibility: "PUBLIC_TO_RESIDENTS" as const,
    },
    {
      id: "f1000000-0000-4000-8000-000000000002",
      date: dateAtOffset(-5),
      category: "Kebersihan",
      description: "Biaya kebersihan dan pengangkutan sampah.",
      amount: 800000,
      type: "EXPENSE" as const,
      visibility: "PUBLIC_TO_RESIDENTS" as const,
    },
  ];

  for (const transaction of demoCashTransactions) {
    await prisma.cashTransaction.upsert({
      where: { id: transaction.id },
      update: {
        ...transaction,
        communityId: billabong.id,
        recordedByUserId: billabongTreasurer.user.id,
      },
      create: {
        ...transaction,
        communityId: billabong.id,
        recordedByUserId: billabongTreasurer.user.id,
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
