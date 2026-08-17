import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ForumPanel } from "@/features/forum/forum-panel";

export const metadata: Metadata = {
  title: "Forum Warga",
  description: "Obrolan realtime dengan warga satu RT atau seluruh komunitas.",
};

export default function ForumPage() {
  return (
    <AppShell contextLabel="Forum Warga">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Forum Warga</h1>
          <p>Ngobrol dengan warga RT-mu atau seluruh komunitas secara realtime.</p>
        </header>
        <ForumPanel />
      </div>
    </AppShell>
  );
}
