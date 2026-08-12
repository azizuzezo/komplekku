"use client";

import { useEffect } from "react";

import { BrandMark } from "@/components/ui/brand-mark";
import { StatePanel } from "@/components/ui/state-panel";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is retained by Next.js for server-side diagnostics; never expose it to residents.
    void error.digest;
  }, [error]);

  return (
    <main className="standalone-state">
      <BrandMark />
      <StatePanel
        kind="error"
        title="Halaman belum bisa dibuka"
        description="Terjadi kendala yang tidak terduga. Coba muat kembali halaman ini."
        headingLevel={1}
        onRetry={reset}
        actionHref="/"
        actionLabel="Ke beranda"
      />
    </main>
  );
}
