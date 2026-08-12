import type { Metadata } from "next";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { PendingApprovalView } from "@/features/onboarding/pending-approval-view";

export const metadata: Metadata = {
  title: "Menunggu verifikasi",
  description: "Periksa status verifikasi tempat tinggal akun Komplekku.",
};

export default function PendingApprovalPage() {
  return (
    <OnboardingShell
      stage="Verifikasi tempat tinggal"
      title="Permohonan sedang diperiksa"
      description="Status berubah setelah pengurus menyelesaikan pemeriksaan."
    >
      <PendingApprovalView />
    </OnboardingShell>
  );
}
