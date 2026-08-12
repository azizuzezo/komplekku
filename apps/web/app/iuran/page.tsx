import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { InvoiceList } from "@/features/invoice/invoice-list";

export const metadata: Metadata = {
  title: "Iuran",
  description: "Tagihan iuran lingkungan yang menjadi tanggungan rumah tanggamu.",
};

export default function IuranPage() {
  return (
    <AppShell contextLabel="Iuran">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Tagihan iuran</h1>
          <p>Pantau tagihan iuran rumah tanggamu dan status pembayarannya.</p>
        </header>
        <InvoiceList />
      </div>
    </AppShell>
  );
}
