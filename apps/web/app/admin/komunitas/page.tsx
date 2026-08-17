import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { CommunityAdminPanel } from "@/features/community/community-admin-panel";

export const metadata: Metadata = {
  title: "Kelola komunitas",
  description: "Ubah identitas komunitas, label RW, dan struktur RT di dalamnya.",
};

export default function CommunityAdminPage() {
  return (
    <AppShell contextLabel="Kelola komunitas">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Kelola komunitas</h1>
          <p>Atur identitas komunitas, label RW, dan RT di dalamnya.</p>
        </header>
        <CommunityAdminPanel />
      </div>
    </AppShell>
  );
}
