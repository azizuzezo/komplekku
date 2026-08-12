import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { LetterReviewQueue } from "@/features/letter/letter-review-queue";

export const metadata: Metadata = {
  title: "Tinjau surat",
  description: "Tinjau, setujui, dan tandai kesiapan permohonan surat warga.",
};

export default function AdminSuratPage() {
  return (
    <AppShell contextLabel="Tinjau surat">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Tinjau surat</h1>
          <p>Kelola permohonan surat warga, dari pengajuan hingga dokumen siap diambil.</p>
        </header>
        <LetterReviewQueue />
      </div>
    </AppShell>
  );
}
