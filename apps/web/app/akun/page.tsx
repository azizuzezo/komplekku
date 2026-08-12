import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { AccountView } from "@/features/auth/account-view";

export const metadata: Metadata = {
  title: "Akun",
};

export default function AccountPage() {
  return (
    <AppShell contextLabel="Akun">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--credential">
          <h1>Akun warga</h1>
          <p>Identitas akun dan tempat tinggal yang terhubung.</p>
        </header>
        <AccountView />
      </div>
    </AppShell>
  );
}
