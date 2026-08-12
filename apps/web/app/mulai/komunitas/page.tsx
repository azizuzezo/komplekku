import type { Metadata } from "next";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ResidencyOnboarding } from "@/features/onboarding/residency-onboarding";

export const metadata: Metadata = {
  title: "Hubungkan tempat tinggal",
  description: "Hubungkan akun Komplekku dengan lingkungan dan rumah tempat tinggal.",
};

export default function CommunityOnboardingPage() {
  return (
    <OnboardingShell
      stage="Langkah aktivasi"
      title="Hubungkan akun dengan rumahmu"
      description="Pilih lingkungan, lalu masukkan data rumah untuk diperiksa pengurus."
    >
      <ResidencyOnboarding />
    </OnboardingShell>
  );
}
