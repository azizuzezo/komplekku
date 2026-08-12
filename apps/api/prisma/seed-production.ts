import { PrismaClient } from "@prisma/client";

import { seedRbac } from "./rbac-seed-data";

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} wajib diisi di environment sebelum menjalankan seed produksi.`);
  }
  return value;
}

/**
 * One-time (but safe to re-run) production bootstrap: real RBAC reference
 * data, one real community, and one real SUPER_ADMIN account tied to a real
 * house. Unlike prisma/seed.ts, this contains no demo/fake residents - every
 * other resident and house is expected to come from the real onboarding flow
 * and the /admin/rumah page.
 *
 * All real identifying values (name, phone, address) are read from env vars
 * rather than hardcoded, since this repo is public - see .env.example for
 * the full list of BOOTSTRAP_* variables this script requires.
 */
async function main() {
  const COMMUNITY = {
    slug: requireEnv("BOOTSTRAP_COMMUNITY_SLUG"),
    name: requireEnv("BOOTSTRAP_COMMUNITY_NAME"),
    address: requireEnv("BOOTSTRAP_COMMUNITY_ADDRESS"),
    timezone: process.env.BOOTSTRAP_COMMUNITY_TIMEZONE ?? "Asia/Jakarta",
  };

  const ADMIN_HOUSE = {
    code: requireEnv("BOOTSTRAP_ADMIN_HOUSE_CODE"),
    block: requireEnv("BOOTSTRAP_ADMIN_HOUSE_BLOCK"),
    number: requireEnv("BOOTSTRAP_ADMIN_HOUSE_NUMBER"),
  };

  const ADMIN = {
    phoneE164: requireEnv("BOOTSTRAP_ADMIN_PHONE_E164"),
    fullName: requireEnv("BOOTSTRAP_ADMIN_FULL_NAME"),
    householdName: requireEnv("BOOTSTRAP_ADMIN_HOUSEHOLD_NAME"),
  };

  const { roles } = await seedRbac(prisma);

  const community = await prisma.community.upsert({
    where: { slug: COMMUNITY.slug },
    update: {
      name: COMMUNITY.name,
      address: COMMUNITY.address,
      timezone: COMMUNITY.timezone,
      registrationOpen: true,
      deletedAt: null,
    },
    create: {
      slug: COMMUNITY.slug,
      name: COMMUNITY.name,
      address: COMMUNITY.address,
      timezone: COMMUNITY.timezone,
      registrationOpen: true,
    },
  });

  const house = await prisma.house.upsert({
    where: { communityId_code: { communityId: community.id, code: ADMIN_HOUSE.code } },
    update: {
      block: ADMIN_HOUSE.block,
      number: ADMIN_HOUSE.number,
      occupancyStatus: "OWNER_OCCUPIED",
      deletedAt: null,
    },
    create: {
      communityId: community.id,
      code: ADMIN_HOUSE.code,
      block: ADMIN_HOUSE.block,
      number: ADMIN_HOUSE.number,
      occupancyStatus: "OWNER_OCCUPIED",
    },
  });

  const household = await prisma.household.upsert({
    where: { houseId: house.id },
    update: { displayName: ADMIN.householdName, communityId: community.id, deletedAt: null },
    create: {
      communityId: community.id,
      houseId: house.id,
      displayName: ADMIN.householdName,
    },
  });

  const user = await prisma.user.upsert({
    where: { phoneE164: ADMIN.phoneE164 },
    update: { displayName: ADMIN.fullName, status: "ACTIVE" },
    create: {
      phoneE164: ADMIN.phoneE164,
      displayName: ADMIN.fullName,
      status: "ACTIVE",
      phoneVerifiedAt: new Date(),
    },
  });

  const resident = await prisma.resident.upsert({
    where: { userId_communityId: { userId: user.id, communityId: community.id } },
    update: {
      fullName: ADMIN.fullName,
      status: "ACTIVE",
      requestedHouseId: house.id,
      requestedRelationship: "HEAD",
      approvedAt: new Date(),
      rejectedAt: null,
      rejectedByUserId: null,
      rejectionReason: null,
    },
    create: {
      communityId: community.id,
      userId: user.id,
      fullName: ADMIN.fullName,
      status: "ACTIVE",
      requestedHouseId: house.id,
      requestedRelationship: "HEAD",
      approvedAt: new Date(),
    },
  });

  await prisma.householdMember.upsert({
    where: { residentId_householdId: { residentId: resident.id, householdId: household.id } },
    update: { relationship: "HEAD", isPrimary: true, endedAt: null },
    create: {
      communityId: community.id,
      residentId: resident.id,
      householdId: household.id,
      relationship: "HEAD",
      isPrimary: true,
    },
  });

  const superAdminRoleId = roles.get("SUPER_ADMIN");
  if (!superAdminRoleId) throw new Error("Role SUPER_ADMIN gagal dibuat.");
  await prisma.userRole.upsert({
    where: {
      userId_communityId_roleId: {
        userId: user.id,
        communityId: community.id,
        roleId: superAdminRoleId,
      },
    },
    update: {},
    create: { userId: user.id, communityId: community.id, roleId: superAdminRoleId },
  });

  console.warn(
    `Production bootstrap complete: community="${community.name}", admin=${user.displayName} (${user.phoneE164})`,
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
