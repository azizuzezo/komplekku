import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { PaymentVerificationQueue } from "@/features/payment/payment-verification-queue";

export const metadata: Metadata = {
  title: "Verifikasi pembayaran",
  description: "Tinjau dan verifikasi bukti pembayaran iuran yang dikirim warga.",
};

export default function PaymentVerificationPage() {
  return (
    <AppShell contextLabel="Verifikasi pembayaran">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Verifikasi pembayaran</h1>
          <p>Cocokkan detail transfer warga dengan mutasi rekening sebelum menyetujui.</p>
        </header>
        <PaymentVerificationQueue />
      </div>
    </AppShell>
  );
}
