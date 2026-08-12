import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { InvoiceDetail } from "@/features/invoice/invoice-detail";

export const metadata: Metadata = {
  title: "Detail tagihan",
};

export default async function IuranDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell contextLabel="Detail tagihan">
      <div className="page-content page-content--narrow">
        <InvoiceDetail id={id} />
      </div>
    </AppShell>
  );
}
