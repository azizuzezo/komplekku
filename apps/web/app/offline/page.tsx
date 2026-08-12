import type { Metadata } from "next";

import { BrandMark } from "@/components/ui/brand-mark";
import { StatePanel } from "@/components/ui/state-panel";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="standalone-state">
      <BrandMark />
      <StatePanel
        kind="offline"
        title="Kamu sedang offline"
        description="Sambungkan kembali perangkatmu untuk memperbarui data. Informasi yang pernah dibuka tetap tersedia bila sudah tersimpan di perangkat."
        headingLevel={1}
        actionHref="/"
        actionLabel="Coba buka beranda"
      />
    </main>
  );
}
