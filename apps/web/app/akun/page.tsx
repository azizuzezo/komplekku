import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ServiceMenu } from "@/components/shell/service-menu";
import { AccountView } from "@/features/auth/account-view";

export const metadata: Metadata = {
  title: "Akun",
};

export default function AccountPage() {
  return (
    <AppShell contextLabel="Akun">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--credential">
          <h1>Profil warga</h1>
          <p>Identitas akun, tempat tinggal, dan semua layanan lingkungan.</p>
        </header>
        <ServiceMenu />
        <AccountView />
      </div>
    </AppShell>
  );
}
