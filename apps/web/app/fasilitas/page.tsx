import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { FacilityBookingPanel } from "@/features/facility/facility-booking-panel";

export const metadata: Metadata = {
  title: "Fasilitas",
  description: "Pesan fasilitas bersama seperti balai warga dan lihat jadwal pemesanannya.",
};

export default function FacilityPage() {
  return (
    <AppShell contextLabel="Fasilitas">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Fasilitas & pemesanan</h1>
          <p>
            Pesan fasilitas bersama lingkungan, seperti balai warga, dan lihat jadwal yang sudah
            dipesan warga lain.
          </p>
        </header>
        <FacilityBookingPanel />
      </div>
    </AppShell>
  );
}
