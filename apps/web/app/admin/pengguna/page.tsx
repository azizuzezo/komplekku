import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { AdminRolePanel } from "@/features/admin-role/admin-role-panel";

export const metadata: Metadata = {
  title: "Kelola pengguna",
  description: "Ubah peran warga aktif di komunitas ini, misalnya Ketua RT, Ketua RW, atau Sekretaris.",
};

export default function AdminRolePage() {
  return (
    <AppShell contextLabel="Kelola pengguna">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Kelola pengguna</h1>
          <p>Ubah peran warga aktif di komunitas ini.</p>
        </header>
        <AdminRolePanel />
      </div>
    </AppShell>
  );
}
