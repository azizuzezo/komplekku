"use client";

import {
  FORUM_POST_CATEGORY_LABELS,
  FORUM_POST_SORT_LABELS,
  forumPostCategorySchema,
  forumPostSortSchema,
  type ForumPostCategory,
  type ForumPostSort,
  type ForumPostSummary,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, LoaderCircle, MessageCircle, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { PhotoGrid, PhotoPicker } from "@/components/ui/photo-picker";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  createForumPost,
  forumPostKeys,
  listForumPosts,
  toggleForumPostLike,
} from "./forum-post-api";

const SORTS = forumPostSortSchema.options;
const CATEGORIES = forumPostCategorySchema.options;

/** "5 jam yang lalu" — the board reads as a conversation, so relative time is
 * more useful here than a timestamp. */
export function formatRelativeTime(iso: string) {
  const elapsedMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(elapsedMs / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari yang lalu`;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function ForumBoard() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canPost = meQuery.data?.data.permissions.includes("forum.post") ?? false;

  const [sort, setSort] = useState<ForumPostSort>("latest");
  const [category, setCategory] = useState<ForumPostCategory | "all">("all");

  const postsQuery = useQuery({
    queryKey: forumPostKeys.list(sort, category),
    queryFn: () => listForumPosts({ sort, ...(category === "all" ? {} : { category }) }),
  });

  const likeMutation = useMutation({
    mutationFn: toggleForumPostLike,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: forumPostKeys.all });
    },
  });

  const controls = (
    <div className="forum-board__controls">
      <div className="forum-board__sorts" role="tablist" aria-label="Urutan diskusi">
        {SORTS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={sort === value}
            className={`forum-board__sort${sort === value ? " forum-board__sort--active" : ""}`}
            onClick={() => setSort(value)}
          >
            {FORUM_POST_SORT_LABELS[value]}
          </button>
        ))}
      </div>
      <div className="forum-board__categories" role="group" aria-label="Kategori diskusi">
        <button
          type="button"
          className="announcement-filters__chip"
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          Semua
        </button>
        {CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            className="announcement-filters__chip"
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
          >
            {FORUM_POST_CATEGORY_LABELS[value]}
          </button>
        ))}
      </div>
    </div>
  );

  if (postsQuery.isPending) {
    return (
      <div className="forum-board">
        {controls}
        <AdminQueueSkeleton />
      </div>
    );
  }

  if (postsQuery.isError) {
    const state = getRequestState(postsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka papan diskusi."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Papan diskusi tidak dapat diakses"
          description="Akunmu tidak memiliki izin untuk membuka Forum Warga."
          actionHref="/"
          actionLabel="Ke beranda"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Diskusi belum bisa dimuat"
        description="Terjadi kendala saat mengambil papan diskusi."
        onRetry={() => void postsQuery.refetch()}
      />
    );
  }

  const posts = postsQuery.data.data.items;

  return (
    <div className="forum-board">
      <div className="forum-board__header">
        {controls}
        {canPost && <CreateForumPostModal />}
      </div>

      {posts.length === 0 ? (
        <StatePanel
          kind="empty"
          title={sort === "answered" ? "Belum ada yang terjawab" : "Belum ada diskusi"}
          description={
            sort === "answered"
              ? "Diskusi akan muncul di sini setelah ada warga yang membalas."
              : "Mulai percakapan pertama untuk warga di lingkunganmu."
          }
        />
      ) : (
        <div className="forum-board__list">
          {posts.map((post) => (
            <ForumPostCard
              post={post}
              key={post.id}
              onToggleLike={() => likeMutation.mutate(post.id)}
              isLikePending={likeMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ForumPostCard({
  post,
  onToggleLike,
  isLikePending,
}: {
  post: ForumPostSummary;
  onToggleLike: () => void;
  isLikePending: boolean;
}) {
  return (
    <article className="forum-post-card">
      <header>
        <div>
          <p className="forum-post-card__author">{post.authorName}</p>
          <p className="forum-post-card__time">
            {formatRelativeTime(post.createdAt)}
            {post.editedAt && " · diedit"}
          </p>
        </div>
        <span className="announcement-badge announcement-badge--event">
          {FORUM_POST_CATEGORY_LABELS[post.category]}
        </span>
      </header>

      <Link href={`/forum/${post.id}`} className="forum-post-card__body">
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
      </Link>

      {post.imageUrls.length > 0 && <PhotoGrid urls={post.imageUrls} />}

      <footer>
        <Link href={`/forum/${post.id}`} className="forum-post-card__stat">
          <MessageCircle size={15} aria-hidden="true" />
          {post.replyCount} balasan
        </Link>
        <button
          type="button"
          className={`forum-post-card__stat forum-post-card__like${
            post.likedByMe ? " forum-post-card__like--on" : ""
          }`}
          onClick={onToggleLike}
          disabled={isLikePending}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? "Batalkan suka" : "Suka diskusi ini"}
        >
          <Heart size={15} aria-hidden="true" fill={post.likedByMe ? "currentColor" : "none"} />
          {post.likeCount} suka
        </button>
      </footer>
    </article>
  );
}

function CreateForumPostModal() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<ForumPostCategory>("INFORMATION");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: createForumPost,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: forumPostKeys.all });
      close();
    },
  });

  function close() {
    setIsOpen(false);
    setCategory("INFORMATION");
    setTitle("");
    setBody("");
    setImageUrls([]);
    mutation.reset();
  }

  return (
    <>
      <button className="button button--primary" type="button" onClick={() => setIsOpen(true)}>
        <Plus size={16} aria-hidden="true" />
        Buat post
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="modal-backdrop" onClick={close}>
            <div
              className="modal-card"
              role="dialog"
              aria-modal="true"
              aria-label="Buat diskusi baru"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Buat diskusi baru</h2>
                <button className="icon-button" type="button" aria-label="Tutup" onClick={close}>
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <form
                className="form-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (title.trim().length < 5 || body.trim().length < 10) return;
                  mutation.mutate({
                    category,
                    title: title.trim(),
                    body: body.trim(),
                    imageUrls,
                  });
                }}
              >
                <div className="field">
                  <label htmlFor="forum-post-category">Kategori</label>
                  <select
                    id="forum-post-category"
                    className="input"
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as ForumPostCategory)
                    }
                  >
                    {CATEGORIES.map((value) => (
                      <option key={value} value={value}>
                        {FORUM_POST_CATEGORY_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="forum-post-title">Judul</label>
                  <input
                    id="forum-post-title"
                    className="input"
                    value={title}
                    minLength={5}
                    maxLength={240}
                    required
                    placeholder="Misal: Usulan pemasangan CCTV di lingkungan RT"
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="forum-post-body">Isi</label>
                  <textarea
                    id="forum-post-body"
                    className="input"
                    rows={6}
                    value={body}
                    minLength={10}
                    maxLength={5000}
                    required
                    placeholder="Jelaskan maksudmu supaya warga lain mudah menanggapi…"
                    onChange={(event) => setBody(event.target.value)}
                  />
                </div>

                <div className="field">
                  <span className="field-label">Foto (opsional)</span>
                  <PhotoPicker onChange={setImageUrls} disabled={mutation.isPending} />
                </div>

                {mutation.isError && (
                  <p className="form-message" role="alert">
                    {mutation.error instanceof ApiError
                      ? mutation.error.message
                      : "Diskusi belum dapat dibuat. Coba lagi."}
                  </p>
                )}

                <div className="modal-actions">
                  <button className="button button--secondary" type="button" onClick={close}>
                    Batal
                  </button>
                  <button
                    className="button button--primary"
                    type="submit"
                    disabled={
                      mutation.isPending || title.trim().length < 5 || body.trim().length < 10
                    }
                  >
                    {mutation.isPending ? (
                      <>
                        <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                        Menerbitkan…
                      </>
                    ) : (
                      "Terbitkan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
