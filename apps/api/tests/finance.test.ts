import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, loginWeb } from "./test-app";

const treasurerPhone = "0812 0000 0004";

describe("keuangan lingkungan (Phase 4)", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("mengalirkan iuran dari pembuatan jenis, penerbitan tagihan, pembayaran, sampai verifikasi", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);
    const treasurer = await loginWeb(app, treasurerPhone);

    const forbidden = await app.inject({
      method: "POST",
      url: "/api/v1/dues-types",
      headers: { cookie: resident.cookie },
      payload: { name: "Iuran Keamanan", defaultAmount: 100000 },
    });
    expect(forbidden.statusCode).toBe(403);

    const createdType = await app.inject({
      method: "POST",
      url: "/api/v1/dues-types",
      headers: { cookie: treasurer.cookie },
      payload: { name: "Iuran Keamanan", description: "Iuran keamanan bulanan.", defaultAmount: 100000 },
    });
    expect(createdType.statusCode).toBe(201);
    const duesTypeId = createdType.json().data.duesType.id as string;

    const generated = await app.inject({
      method: "POST",
      url: "/api/v1/invoices/generate",
      headers: { cookie: treasurer.cookie },
      payload: { duesTypeId, period: "2026-09", amount: 100000, dueDate: "2026-09-30" },
    });
    expect(generated.statusCode).toBe(201);
    expect(generated.json().data.createdCount).toBeGreaterThan(0);

    const duplicateGenerate = await app.inject({
      method: "POST",
      url: "/api/v1/invoices/generate",
      headers: { cookie: treasurer.cookie },
      payload: { duesTypeId, period: "2026-09", amount: 100000, dueDate: "2026-09-30" },
    });
    expect(duplicateGenerate.statusCode).toBe(201);
    expect(duplicateGenerate.json().data.createdCount).toBe(0);

    const residentInvoices = await app.inject({
      method: "GET",
      url: "/api/v1/invoices?status=UNPAID",
      headers: { cookie: resident.cookie },
    });
    expect(residentInvoices.statusCode).toBe(200);
    const ownInvoice = (residentInvoices.json().data.items as Array<{ id: string; period: string }>).find(
      (item) => item.period === "2026-09",
    );
    expect(ownInvoice).toBeTruthy();
    if (!ownInvoice) throw new Error("expected the generated invoice for the resident household");

    const submitted = await app.inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: { cookie: resident.cookie },
      payload: {
        invoiceId: ownInvoice.id,
        amount: 100000,
        paidAt: "2026-09-05",
        note: "Transfer BCA an. Aziz Pratama, 05/09 pukul 10:00.",
      },
    });
    expect(submitted.statusCode).toBe(201);
    expect(submitted.json().data.payment.status).toBe("PENDING");
    const paymentId = submitted.json().data.payment.id as string;

    const invoiceAfterSubmit = await app.inject({
      method: "GET",
      url: `/api/v1/invoices/${ownInvoice.id}`,
      headers: { cookie: resident.cookie },
    });
    expect(invoiceAfterSubmit.json().data.invoice.status).toBe("PENDING_VERIFICATION");

    const doublePayment = await app.inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: { cookie: resident.cookie },
      payload: {
        invoiceId: ownInvoice.id,
        amount: 100000,
        paidAt: "2026-09-05",
        note: "Percobaan kedua sebelum diverifikasi.",
      },
    });
    expect(doublePayment.statusCode).toBe(409);

    const queue = await app.inject({
      method: "GET",
      url: "/api/v1/payments?status=PENDING",
      headers: { cookie: treasurer.cookie },
    });
    expect(queue.statusCode).toBe(200);
    expect(queue.json().data.items.map((item: { id: string }) => item.id)).toContain(paymentId);

    const verified = await app.inject({
      method: "POST",
      url: `/api/v1/payments/${paymentId}/verify`,
      headers: { cookie: treasurer.cookie },
    });
    expect(verified.statusCode).toBe(200);
    expect(verified.json().data.payment.status).toBe("VERIFIED");
    expect(verified.json().data.payment.receiptNumber).toBeTruthy();

    const doubleVerify = await app.inject({
      method: "POST",
      url: `/api/v1/payments/${paymentId}/verify`,
      headers: { cookie: treasurer.cookie },
    });
    expect(doubleVerify.statusCode).toBe(409);

    const paidInvoice = await app.inject({
      method: "GET",
      url: `/api/v1/invoices/${ownInvoice.id}`,
      headers: { cookie: resident.cookie },
    });
    expect(paidInvoice.json().data.invoice.status).toBe("PAID");
    expect(paidInvoice.json().data.invoice.receiptNumber).toBeTruthy();
  });

  it("mengembalikan tagihan ke UNPAID saat pembayaran ditolak, dan mendukung pembebasan tagihan", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);
    const treasurer = await loginWeb(app, treasurerPhone);

    const invoices = await app.inject({
      method: "GET",
      url: "/api/v1/invoices",
      headers: { cookie: treasurer.cookie },
    });
    const seededInvoice = (invoices.json().data.items as Array<{ id: string; status: string }>).find(
      (item) => item.status === "UNPAID",
    );
    expect(seededInvoice).toBeTruthy();
    if (!seededInvoice) throw new Error("expected a seeded unpaid invoice");

    const submitted = await app.inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: { cookie: resident.cookie },
      payload: {
        invoiceId: seededInvoice.id,
        amount: 150000,
        paidAt: "2026-08-15",
        note: "Transfer Mandiri an. Aziz Pratama.",
      },
    });
    expect(submitted.statusCode).toBe(201);
    const paymentId = submitted.json().data.payment.id as string;

    const rejected = await app.inject({
      method: "POST",
      url: `/api/v1/payments/${paymentId}/reject`,
      headers: { cookie: treasurer.cookie },
      payload: { reason: "Nominal tidak sesuai tagihan." },
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json().data.payment.status).toBe("REJECTED");

    const invoiceAfterReject = await app.inject({
      method: "GET",
      url: `/api/v1/invoices/${seededInvoice.id}`,
      headers: { cookie: resident.cookie },
    });
    expect(invoiceAfterReject.json().data.invoice.status).toBe("UNPAID");

    const waived = await app.inject({
      method: "POST",
      url: `/api/v1/invoices/${seededInvoice.id}/waive`,
      headers: { cookie: treasurer.cookie },
      payload: { reason: "Warga pindah sebelum jatuh tempo." },
    });
    expect(waived.statusCode).toBe(200);
    expect(waived.json().data.invoice.status).toBe("WAIVED");

    const doubleWaive = await app.inject({
      method: "POST",
      url: `/api/v1/invoices/${seededInvoice.id}/waive`,
      headers: { cookie: treasurer.cookie },
      payload: { reason: "Coba lagi." },
    });
    expect(doubleWaive.statusCode).toBe(409);
  });

  it("membatasi transparansi kas sesuai visibilitas dan menghitung saldo kas", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);
    const treasurer = await loginWeb(app, treasurerPhone);

    const forbidden = await app.inject({
      method: "POST",
      url: "/api/v1/cash-transactions",
      headers: { cookie: resident.cookie },
      payload: {
        date: "2026-08-01",
        category: "Kebersihan",
        description: "Percobaan warga.",
        amount: 50000,
        type: "EXPENSE",
      },
    });
    expect(forbidden.statusCode).toBe(403);

    const adminOnly = await app.inject({
      method: "POST",
      url: "/api/v1/cash-transactions",
      headers: { cookie: treasurer.cookie },
      payload: {
        date: "2026-08-02",
        category: "Catatan internal",
        description: "Dana cadangan darurat, hanya pengurus.",
        amount: 500000,
        type: "INCOME",
        visibility: "ADMIN_ONLY",
      },
    });
    expect(adminOnly.statusCode).toBe(201);

    const publicOne = await app.inject({
      method: "POST",
      url: "/api/v1/cash-transactions",
      headers: { cookie: treasurer.cookie },
      payload: {
        date: "2026-08-03",
        category: "Kebersihan",
        description: "Biaya kebersihan bulan ini.",
        amount: 200000,
        type: "EXPENSE",
        visibility: "PUBLIC_TO_RESIDENTS",
      },
    });
    expect(publicOne.statusCode).toBe(201);

    const residentView = await app.inject({
      method: "GET",
      url: "/api/v1/cash-transactions",
      headers: { cookie: resident.cookie },
    });
    expect(residentView.statusCode).toBe(200);
    const residentDescriptions = residentView
      .json()
      .data.items.map((item: { description: string }) => item.description);
    expect(residentDescriptions).toContain("Biaya kebersihan bulan ini.");
    expect(residentDescriptions).not.toContain("Dana cadangan darurat, hanya pengurus.");

    const treasurerView = await app.inject({
      method: "GET",
      url: "/api/v1/cash-transactions",
      headers: { cookie: treasurer.cookie },
    });
    const treasurerDescriptions = treasurerView
      .json()
      .data.items.map((item: { description: string }) => item.description);
    expect(treasurerDescriptions).toContain("Dana cadangan darurat, hanya pengurus.");
  });

  it("merangkum dasbor keuangan untuk bendahara", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const treasurer = await loginWeb(app, treasurerPhone);

    const dashboard = await app.inject({
      method: "GET",
      url: "/api/v1/finance/dashboard",
      headers: { cookie: treasurer.cookie },
    });
    expect(dashboard.statusCode).toBe(200);
    expect(typeof dashboard.json().data.outstandingInvoiceCount).toBe("number");
    expect(typeof dashboard.json().data.cashBalance).toBe("number");

    const resident = await loginWeb(app);
    const forbidden = await app.inject({
      method: "GET",
      url: "/api/v1/finance/dashboard",
      headers: { cookie: resident.cookie },
    });
    expect(forbidden.statusCode).toBe(403);
  });
});
