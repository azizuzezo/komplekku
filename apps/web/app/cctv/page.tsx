import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { CameraList } from "@/features/camera/camera-list";

export const metadata: Metadata = {
  title: "CCTV",
  description: "Kamera lingkungan yang dapat kamu akses.",
};

export default function CctvPage() {
  return (
    <AppShell contextLabel="CCTV">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Kamera lingkungan</h1>
          <p>
            Tayangan pada halaman ini bersifat simulasi (mode mock) di lingkungan pengembangan
            lokal, belum menampilkan aliran video sungguhan.
          </p>
        </header>
        <CameraList />
      </div>
    </AppShell>
  );
}
