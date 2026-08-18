import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ForumPostDetail } from "@/features/forum/forum-post-detail";

export const metadata: Metadata = {
  title: "Diskusi",
  description: "Diskusi warga beserta balasannya.",
};

export default async function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell contextLabel="Forum Warga">
      <div className="page-content page-content--narrow">
        <ForumPostDetail postId={id} />
      </div>
    </AppShell>
  );
}
