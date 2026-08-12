import type { Metadata } from "next";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { AccountStatusView } from "@/features/onboarding/account-status-view";

export const metadata: Metadata = {
  title: "Status akun",
  description: "Periksa status akses akun Komplekku.",
};

export default function AccountStatusPage() {
  return (
    <OnboardingShell
      stage="Status akun warga"
      title="Akses lingkungan belum tersedia"
      description="Lihat kondisi akun saat ini dan periksa kembali setelah pengurus melakukan perubahan."
    >
      <AccountStatusView />
    </OnboardingShell>
  );
}
