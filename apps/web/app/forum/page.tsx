import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ForumTabs } from "@/features/forum/forum-tabs";

export const metadata: Metadata = {
  title: "Forum Warga",
  description: "Papan diskusi warga dan obrolan realtime satu RT atau seluruh komunitas.",
};

export default function ForumPage() {
  return (
    <AppShell contextLabel="Forum Warga">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Forum Warga</h1>
          <p>Diskusi bertopik dengan warga, atau obrolan realtime satu RT dan komunitas.</p>
        </header>
        <ForumTabs />
      </div>
    </AppShell>
  );
}
