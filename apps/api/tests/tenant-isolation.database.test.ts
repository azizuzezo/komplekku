import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../src/app";
import { PrismaRepository } from "../src/repositories/prisma-repository";
import { loginWeb, testEnv } from "./test-app";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const applicantPhoneInput = "0812 9999 9991";
const applicantPhoneE164 = "+6281299999991";
const billabongAdminPhone = "0812 0000 0002";
const tenantBAdminPhone = "0812 0000 0101";
const seededAnnouncementA = "10000000-0000-4000-8000-000000000001";
const seededAnnouncementB = "20000000-0000-4000-8000-000000000001";
const seededAgendaA = "30000000-0000-4000-8000-000000000001";
const seededAgendaB = "40000000-0000-4000-8000-000000000001";
const testAgendaTitle = "[Test Isolasi] Agenda Tenant A";

describe.skipIf(!testDatabaseUrl)("isolasi tenant dengan PostgreSQL nyata", () => {
  let prisma: PrismaClient;
  let app: Awaited<ReturnType<typeof buildApp>>["app"];

  async function cleanupTestIdentity() {
    const testEvents = await prisma.event.findMany({
      where: { title: testAgendaTitle },
      select: { id: true },
    });
    const testEventIds = testEvents.map((event) => event.id);
    const testNotifications = testEventIds.length
      ? await prisma.notification.findMany({
          where: { entityType: "EVENT", entityId: { in: testEventIds } },
          select: { id: true },
        })
      : [];
    const testNotificationIds = testNotifications.map((notification) => notification.id);
    if (testEventIds.length || testNotificationIds.length) {
      await prisma.auditLog.deleteMany({
        where: { entityId: { in: [...testEventIds, ...testNotificationIds] } },
      });
      await prisma.notification.deleteMany({ where: { id: { in: testNotificationIds } } });
      await prisma.event.deleteMany({ where: { id: { in: testEventIds } } });
    }
    const users = await prisma.user.findMany({
      where: {
        phoneE164: {
          in: [applicantPhoneE164, "+6281200000002", "+6281200000101"],
        },
      },
      select: { id: true, phoneE164: true },
    });
    const userIds = users.map((user) => user.id);
    const applicant = users.find((user) => user.phoneE164 === applicantPhoneE164);
    const applicantResidentIds = applicant
      ? (
          await prisma.resident.findMany({
            where: { userId: applicant.id },
            select: { id: true },
          })
        ).map((resident) => resident.id)
      : [];
    const householdIds = applicantResidentIds.length
      ? (
          await prisma.householdMember.findMany({
            where: { residentId: { in: applicantResidentIds } },
            select: { householdId: true },
          })
        ).map((membership) => membership.householdId)
      : [];
    const sessionIds = userIds.length
      ? (
          await prisma.session.findMany({
            where: { userId: { in: userIds } },
            select: { id: true },
          })
        ).map((session) => session.id)
      : [];
    const otpIds = (
      await prisma.otpRequest.findMany({
        where: {
          phoneE164: {
            in: [applicantPhoneE164, "+6281200000002", "+6281200000101"],
          },
        },
        select: { id: true },
      })
    ).map((otp) => otp.id);
    const auditedEntityIds = [...applicantResidentIds, ...sessionIds, ...otpIds];

    if (auditedEntityIds.length || applicant) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            ...(auditedEntityIds.length ? [{ entityId: { in: auditedEntityIds } }] : []),
            ...(applicant ? [{ actorUserId: applicant.id }] : []),
          ],
        },
      });
    }
    if (userIds.length) {
      await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    }
    if (applicant) {
      await prisma.announcementRead.deleteMany({ where: { userId: applicant.id } });
      await prisma.notification.deleteMany({ where: { userId: applicant.id } });
      if (applicantResidentIds.length) {
        await prisma.householdMember.deleteMany({
          where: { residentId: { in: applicantResidentIds } },
        });
      }
      await prisma.userRole.deleteMany({ where: { userId: applicant.id } });
      await prisma.resident.deleteMany({ where: { userId: applicant.id } });
      await prisma.user.delete({ where: { id: applicant.id } });
    }
    if (householdIds.length) {
      await prisma.household.deleteMany({
        where: { id: { in: householdIds }, members: { none: {} } },
      });
    }
    await prisma.otpRequest.deleteMany({
      where: {
        phoneE164: {
          in: [applicantPhoneE164, "+6281200000002", "+6281200000101"],
        },
      },
    });
    const billabong = await prisma.community.findUnique({
      where: { slug: "billabong-blok-f" },
      select: { id: true },
    });
    if (billabong) {
      await prisma.house.updateMany({
        where: { communityId: billabong.id, code: "F05" },
        data: { occupancyStatus: "VACANT" },
      });
    }
  }

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: testDatabaseUrl } },
    });
    await cleanupTestIdentity();
    const built = await buildApp({
      env: { ...testEnv, DATABASE_URL: testDatabaseUrl },
      repository: new PrismaRepository(prisma),
      logger: false,
    });
    app = built.app;
  });

  afterAll(async () => {
    if (prisma) await cleanupTestIdentity();
    if (app) await app.close();
  });

  it("menolak admin tenant B membaca atau menyetujui permohonan tenant A", async () => {
    const communities = await prisma.community.findMany({
      where: {
        slug: { in: ["billabong-blok-f", "demo-taman-cendana"] },
        deletedAt: null,
      },
      select: { id: true, slug: true },
    });
    expect(communities).toHaveLength(2);
    const billabong = communities.find((community) => community.slug === "billabong-blok-f");
    const tenantB = communities.find((community) => community.slug === "demo-taman-cendana");
    if (!billabong || !tenantB) throw new Error("Fixture dua komunitas tidak lengkap.");

    const applicant = await loginWeb(app, applicantPhoneInput);
    const submitted = await app.inject({
      method: "POST",
      url: "/api/v1/onboarding/residency-requests",
      headers: { cookie: applicant.cookie },
      payload: {
        communityId: billabong.id,
        houseCode: "F05",
        fullName: "Nadia Isolasi",
        relationship: "HEAD",
      },
    });
    expect(submitted.statusCode).toBe(201);
    const requestId = submitted.json().data.request.id as string;

    const tenantBAdmin = await loginWeb(app, tenantBAdminPhone);
    expect(tenantBAdmin.response.json().data.authState).toBe("READY");
    const tenantBQueue = await app.inject({
      method: "GET",
      url: "/api/v1/admin/residency-requests",
      headers: { cookie: tenantBAdmin.cookie },
    });
    expect(tenantBQueue.statusCode).toBe(200);
    expect(
      tenantBQueue.json().data.items.some((item: { id: string }) => item.id === requestId),
    ).toBe(false);

    const crossTenantApproval = await app.inject({
      method: "POST",
      url: `/api/v1/admin/residency-requests/${requestId}/approve`,
      headers: { cookie: tenantBAdmin.cookie },
    });
    expect(crossTenantApproval.statusCode).toBe(404);
    expect(crossTenantApproval.json().error.code).toBe("RESIDENCY_REQUEST_NOT_FOUND");

    const tenantBAnnouncements = await app.inject({
      method: "GET",
      url: "/api/v1/announcements",
      headers: { cookie: tenantBAdmin.cookie },
    });
    expect(tenantBAnnouncements.statusCode).toBe(200);
    expect(tenantBAnnouncements.json().data.items.map((item: { id: string }) => item.id)).toContain(
      seededAnnouncementB,
    );
    const tenantBReadingTenantA = await app.inject({
      method: "GET",
      url: `/api/v1/announcements/${seededAnnouncementA}`,
      headers: { cookie: tenantBAdmin.cookie },
    });
    expect(tenantBReadingTenantA.statusCode).toBe(404);

    const tenantBAgenda = await app.inject({
      method: "GET",
      url: "/api/v1/agenda?view=upcoming",
      headers: { cookie: tenantBAdmin.cookie },
    });
    expect(tenantBAgenda.statusCode).toBe(200);
    expect(tenantBAgenda.json().data.items.map((item: { id: string }) => item.id)).toContain(
      seededAgendaB,
    );
    const tenantBReadingAgendaA = await app.inject({
      method: "GET",
      url: `/api/v1/agenda/${seededAgendaA}`,
      headers: { cookie: tenantBAdmin.cookie },
    });
    expect(tenantBReadingAgendaA.statusCode).toBe(404);

    const billabongAdmin = await loginWeb(app, billabongAdminPhone);
    const billabongQueue = await app.inject({
      method: "GET",
      url: "/api/v1/admin/residency-requests",
      headers: { cookie: billabongAdmin.cookie },
    });
    expect(billabongQueue.statusCode).toBe(200);
    expect(billabongQueue.json().data.items.map((item: { id: string }) => item.id)).toContain(
      requestId,
    );

    const approved = await app.inject({
      method: "POST",
      url: `/api/v1/admin/residency-requests/${requestId}/approve`,
      headers: { cookie: billabongAdmin.cookie },
    });
    expect(approved.statusCode).toBe(200);
    const onboardingAudits = await prisma.auditLog.findMany({
      where: { entityId: requestId },
      select: { action: true, communityId: true },
      orderBy: { createdAt: "asc" },
    });
    expect(onboardingAudits).toEqual(
      expect.arrayContaining([
        { action: "resident.requested", communityId: billabong.id },
        { action: "resident.approved", communityId: billabong.id },
      ]),
    );

    const activeMe = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie: applicant.cookie },
    });
    expect(activeMe.statusCode).toBe(200);
    expect(activeMe.json().data.authState).toBe("READY");
    expect(activeMe.json().data.currentContext.community.id).toBe(billabong.id);
    expect(activeMe.json().data.currentContext.household.house.code).toBe("F05");

    const createdAgenda = await app.inject({
      method: "POST",
      url: "/api/v1/admin/agenda",
      headers: { cookie: billabongAdmin.cookie },
      payload: {
        title: testAgendaTitle,
        date: "2099-08-10",
        startTime: "19:00",
        endTime: "20:30",
        location: "Balai Warga",
        description: "Fixture nyata untuk membuktikan isolasi agenda dan notifikasi.",
        organizer: "Pengurus RT",
      },
    });
    expect(createdAgenda.statusCode).toBe(201);
    const eventId = createdAgenda.json().data.event.id as string;

    const tenantBUpdatingAgendaA = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/agenda/${eventId}`,
      headers: { cookie: tenantBAdmin.cookie },
      payload: { location: "Tidak boleh berubah" },
    });
    expect(tenantBUpdatingAgendaA.statusCode).toBe(404);

    const applicantNotifications = await app.inject({
      method: "GET",
      url: "/api/v1/notifications?limit=50",
      headers: { cookie: applicant.cookie },
    });
    expect(applicantNotifications.statusCode).toBe(200);
    const generatedNotification = applicantNotifications
      .json()
      .data.items.find(
        (notification: { entityId: string | null }) => notification.entityId === eventId,
      ) as { id: string } | undefined;
    expect(generatedNotification).toBeDefined();
    if (!generatedNotification) throw new Error("Notifikasi agenda tenant A tidak dibuat.");

    const tenantBReadingNotificationA = await app.inject({
      method: "POST",
      url: `/api/v1/notifications/${generatedNotification.id}/read`,
      headers: { cookie: tenantBAdmin.cookie },
    });
    expect(tenantBReadingNotificationA.statusCode).toBe(404);
    const applicantReadsOwnNotification = await app.inject({
      method: "POST",
      url: `/api/v1/notifications/${generatedNotification.id}/read`,
      headers: { cookie: applicant.cookie },
    });
    expect(applicantReadsOwnNotification.statusCode).toBe(200);

    const archivedAgenda = await app.inject({
      method: "POST",
      url: `/api/v1/admin/agenda/${eventId}/archive`,
      headers: { cookie: billabongAdmin.cookie },
    });
    expect(archivedAgenda.statusCode).toBe(200);
    const agendaAudits = await prisma.auditLog.findMany({
      where: { entityId: eventId },
      select: { action: true, communityId: true },
      orderBy: { createdAt: "asc" },
    });
    expect(agendaAudits).toEqual(
      expect.arrayContaining([
        { action: "agenda.created", communityId: billabong.id },
        { action: "agenda.archived", communityId: billabong.id },
      ]),
    );

    const billabongReadingTenantB = await app.inject({
      method: "GET",
      url: `/api/v1/announcements/${seededAnnouncementB}`,
      headers: { cookie: billabongAdmin.cookie },
    });
    expect(billabongReadingTenantB.statusCode).toBe(404);
  });
});
