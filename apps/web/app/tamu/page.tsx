import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { VisitorInvitePanel } from "@/features/visitor/visitor-invite-panel";

export const metadata: Metadata = {
  title: "Tamu",
  description: "Undang tamu dengan kode QR yang ditunjukkan ke petugas keamanan.",
};

export default function VisitorInvitePage() {
  return (
    <AppShell contextLabel="Tamu">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Undangan tamu</h1>
          <p>
            Undang tamu dan bagikan kode QR yang ditunjukkan ke petugas keamanan saat mereka tiba.
          </p>
        </header>
        <VisitorInvitePanel />
      </div>
    </AppShell>
  );
}
