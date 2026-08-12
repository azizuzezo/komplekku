import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { LetterRequestPanel } from "@/features/letter/letter-request-panel";

export const metadata: Metadata = {
  title: "Surat",
  description: "Ajukan dan pantau permohonan surat keterangan dari pengurus lingkungan.",
};

export default function SuratPage() {
  return (
    <AppShell contextLabel="Surat">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Permohonan surat</h1>
          <p>
            Ajukan surat keterangan yang diterbitkan pengurus lingkungan. Surat ini bukan dokumen
            resmi pemerintah, melainkan surat keterangan dari lingkunganmu.
          </p>
        </header>
        <LetterRequestPanel />
      </div>
    </AppShell>
  );
}
