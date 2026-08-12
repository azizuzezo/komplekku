import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { HomeScreen } from "@/features/home/home-screen";

export const metadata: Metadata = {
  title: "Beranda",
};

export default function HomePage() {
  return (
    <AppShell contextLabel="Beranda">
      <HomeScreen />
    </AppShell>
  );
}
