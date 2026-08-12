import { BrandMark } from "@/components/ui/brand-mark";
import { StatePanel } from "@/components/ui/state-panel";

export default function NotFoundPage() {
  return (
    <main className="standalone-state">
      <BrandMark />
      <StatePanel
        kind="empty"
        title="Halaman tidak ditemukan"
        description="Alamat yang kamu buka mungkin sudah berubah atau tidak tersedia."
        headingLevel={1}
        actionHref="/"
        actionLabel="Kembali ke beranda"
      />
    </main>
  );
}
