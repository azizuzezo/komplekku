import {
  adminResidencyRequestListResponseSchema,
  approveResidencyRequestResponseSchema,
  meResponseSchema,
  onboardingOptionsResponseSchema,
  rejectResidencyRequestResponseSchema,
  residencyRequestResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

const adminPermissions = [
  "announcement.read",
  "community.read",
  "home.read",
  "household.read",
  "resident.manage",
];

describe("onboarding dan persetujuan resident", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("membuka opsi komunitas tanpa enumerasi rumah lalu mengaktifkan pemohon", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const applicant = await loginWeb(app, "0812 9999 9991");
    expect(applicant.response.json().data.authState).toBe("NEEDS_RESIDENCY");

    const options = await app.inject({
      method: "GET",
      url: "/api/v1/onboarding/options",
      headers: { cookie: applicant.cookie },
    });
    expect(options.statusCode).toBe(200);
    expect(onboardingOptionsResponseSchema.safeParse(options.json()).success).toBe(true);
    expect(options.json().data.communities).toHaveLength(2);
    expect(JSON.stringify(options.json())).not.toContain("house");

    const crossTenantHouseGuess = await app.inject({
      method: "POST",
      url: "/api/v1/onboarding/residency-requests",
      headers: { cookie: applicant.cookie },
      payload: {
        communityId: demoIds.secondCommunity,
        rtId: demoIds.secondCommunityRt,
        houseCode: "F03",
        fullName: "Nadia Penguji",
        relationship: "HEAD",
      },
    });
    expect(crossTenantHouseGuess.statusCode).toBe(404);
    expect(crossTenantHouseGuess.json().error.code).toBe("RESIDENCY_TARGET_NOT_FOUND");

    const submitted = await app.inject({
      method: "POST",
      url: "/api/v1/onboarding/residency-requests",
      headers: { cookie: applicant.cookie },
      payload: {
        communityId: demoIds.community,
        rtId: demoIds.rtOne,
        houseCode: "f03",
        fullName: "Nadia Penguji",
        relationship: "HEAD",
      },
    });
    expect(submitted.statusCode).toBe(201);
    expect(residencyRequestResponseSchema.safeParse(submitted.json()).success).toBe(true);
    expect(submitted.json().data.request.status).toBe("PENDING");
    expect(submitted.json().data.request.house.code).toBe("F03");
    const requestId = submitted.json().data.request.id as string;

    const duplicate = await app.inject({
      method: "POST",
      url: "/api/v1/onboarding/residency-requests",
      headers: { cookie: applicant.cookie },
      payload: {
        communityId: demoIds.community,
        rtId: demoIds.rtOne,
        houseCode: "F03",
        fullName: "Nadia Penguji",
        relationship: "HEAD",
      },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe("RESIDENCY_REQUEST_EXISTS");

    const pendingMe = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie: applicant.cookie },
    });
    expect(meResponseSchema.safeParse(pendingMe.json()).success).toBe(true);
    expect(pendingMe.json().data.authState).toBe("PENDING_APPROVAL");
    expect(pendingMe.json().data.currentContext).toBeNull();

    const forbiddenAdminList = await app.inject({
      method: "GET",
      url: "/api/v1/admin/residency-requests",
      headers: { cookie: applicant.cookie },
    });
    expect(forbiddenAdminList.statusCode).toBe(403);

    const admin = await loginWeb(app);
    repository.setPermissions(demoIds.user, adminPermissions);
    const pendingList = await app.inject({
      method: "GET",
      url: "/api/v1/admin/residency-requests",
      headers: { cookie: admin.cookie },
    });
    expect(pendingList.statusCode).toBe(200);
    expect(adminResidencyRequestListResponseSchema.safeParse(pendingList.json()).success).toBe(
      true,
    );
    expect(pendingList.json().data.items).toHaveLength(1);
    expect(pendingList.json().data.items[0].user.phoneMasked).not.toContain("081299999991");

    const approved = await app.inject({
      method: "POST",
      url: `/api/v1/admin/residency-requests/${requestId}/approve`,
      headers: { cookie: admin.cookie },
    });
    expect(approved.statusCode).toBe(200);
    expect(approveResidencyRequestResponseSchema.safeParse(approved.json()).success).toBe(true);

    const approvedAgain = await app.inject({
      method: "POST",
      url: `/api/v1/admin/residency-requests/${requestId}/approve`,
      headers: { cookie: admin.cookie },
    });
    expect(approvedAgain.statusCode).toBe(409);
    expect(approvedAgain.json().error.code).toBe("RESIDENCY_REQUEST_NOT_PENDING");

    const activeMe = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie: applicant.cookie },
    });
    expect(activeMe.statusCode).toBe(200);
    expect(activeMe.json().data.authState).toBe("READY");
    expect(activeMe.json().data.currentContext.household.house.code).toBe("F03");

    const home = await app.inject({
      method: "GET",
      url: "/api/v1/home",
      headers: { cookie: applicant.cookie },
    });
    expect(home.statusCode).toBe(200);
    expect(repository.audits.map((audit) => audit.action)).toEqual(
      expect.arrayContaining(["resident.requested", "resident.approved"]),
    );
  });

  it("mengizinkan admin menolak permohonan dan menyembunyikannya dari antrean", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const applicant = await loginWeb(app, "0812 9999 9992");
    const submitted = await app.inject({
      method: "POST",
      url: "/api/v1/onboarding/residency-requests",
      headers: { cookie: applicant.cookie },
      payload: {
        communityId: demoIds.community,
        rtId: demoIds.rtOne,
        houseCode: "F03",
        fullName: "Bima Penguji",
        relationship: "TENANT",
      },
    });
    const requestId = submitted.json().data.request.id as string;

    const admin = await loginWeb(app);
    repository.setPermissions(demoIds.user, adminPermissions);
    const rejected = await app.inject({
      method: "POST",
      url: `/api/v1/admin/residency-requests/${requestId}/reject`,
      headers: { cookie: admin.cookie },
      payload: { reason: "Dokumen alamat belum sesuai." },
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejectResidencyRequestResponseSchema.safeParse(rejected.json()).success).toBe(true);

    const rejectedMe = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie: applicant.cookie },
    });
    expect(rejectedMe.json().data.authState).toBe("REJECTED");

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/admin/residency-requests",
      headers: { cookie: admin.cookie },
    });
    expect(list.json().data.items).toHaveLength(0);
    expect(repository.audits.map((audit) => audit.action)).toContain("resident.rejected");
  });
});
