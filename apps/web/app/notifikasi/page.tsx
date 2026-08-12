import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { NotificationList } from "@/features/notification/notification-list";

export const metadata: Metadata = {
  title: "Notifikasi",
  description: "Pembaruan yang ditujukan untuk akun Komplekku.",
};

export default function NotificationsPage() {
  return (
    <AppShell contextLabel="Notifikasi">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Notifikasi</h1>
          <p>Pembaruan yang ditujukan langsung untuk akun dan lingkunganmu.</p>
        </header>
        <NotificationList />
      </div>
    </AppShell>
  );
}
