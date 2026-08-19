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
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { EntityActions } from "@/components/ui/entity-actions";
import { PhotoGrid, PhotoPicker } from "@/components/ui/photo-picker";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  createForumPost,
  deleteForumPost,
  forumPostKeys,
  getForumPost,
  listForumPosts,
  toggleForumPostLike,
  updateForumPost,
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
  const canModerate = meQuery.data?.data.permissions.includes("forum.manage") ?? false;
  const currentUserId = meQuery.data?.data.id;
  const [editing, setEditing] = useState<ForumPostSummary | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: deleteForumPost,
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
    <div className="forum-board prototype-forum">
      {editing && <EditForumPostModal post={editing} onClose={() => setEditing(null)} />}
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
              canEdit={post.authorUserId === currentUserId && canPost}
              canDelete={post.authorUserId === currentUserId || canModerate}
              onEdit={() => setEditing(post)}
              onDelete={() => deleteMutation.mutateAsync(post.id)}
              isBusy={deleteMutation.isPending}
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
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  isBusy,
}: {
  post: ForumPostSummary;
  onToggleLike: () => void;
  isLikePending: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => Promise<unknown> | void;
  isBusy: boolean;
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
        <div className="forum-post-card__header-end">
          <span className="announcement-badge announcement-badge--event">
            {FORUM_POST_CATEGORY_LABELS[post.category]}
          </span>
          <EntityActions
            onEdit={canEdit ? onEdit : undefined}
            onDelete={canDelete ? onDelete : undefined}
            isBusy={isBusy}
            deleteTitle="Hapus diskusi?"
            deleteMessage={`"${post.title}" beserta balasannya tidak akan terlihat lagi oleh warga.`}
            label={`Kelola diskusi ${post.title}`}
          />
        </div>
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
                    onChange={(event) => setCategory(event.target.value as ForumPostCategory)}
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

/** Edit reuses the create form's fields but sends a partial PATCH, so it gets
 * its own component rather than a mode flag threaded through the other one. */
function EditForumPostModal({
  post,
  onClose,
}: {
  post: ForumPostSummary;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<ForumPostCategory>(post.category);
  const [title, setTitle] = useState(post.title);
  // The board only carries an excerpt, so the full body is fetched for editing.
  const detailQuery = useQuery({
    queryKey: forumPostKeys.detail(post.id),
    queryFn: () => getForumPost(post.id),
  });
  const [body, setBody] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded || !detailQuery.data) return;
    setBody(detailQuery.data.data.post.body);
    setIsLoaded(true);
  }, [detailQuery.data, isLoaded]);

  const mutation = useMutation({
    mutationFn: updateForumPost,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: forumPostKeys.all });
      onClose();
    },
  });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Edit diskusi"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Edit diskusi</h2>
          <button className="icon-button" type="button" aria-label="Tutup" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {detailQuery.isPending ? (
          <p className="field-hint">Memuat diskusi…</p>
        ) : (
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              if (title.trim().length < 5 || body.trim().length < 10) return;
              mutation.mutate({
                postId: post.id,
                changes: { category, title: title.trim(), body: body.trim() },
              });
            }}
          >
            <div className="field">
              <label htmlFor="edit-forum-category">Kategori</label>
              <select
                id="edit-forum-category"
                className="input"
                value={category}
                onChange={(event) => setCategory(event.target.value as ForumPostCategory)}
              >
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {FORUM_POST_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="edit-forum-title">Judul</label>
              <input
                id="edit-forum-title"
                className="input"
                value={title}
                minLength={5}
                maxLength={240}
                required
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="edit-forum-body">Isi</label>
              <textarea
                id="edit-forum-body"
                className="input"
                rows={6}
                value={body}
                minLength={10}
                maxLength={5000}
                required
                onChange={(event) => setBody(event.target.value)}
              />
            </div>

            {mutation.isError && (
              <p className="form-message" role="alert">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Perubahan belum dapat disimpan."}
              </p>
            )}

            <div className="modal-actions">
              <button className="button button--secondary" type="button" onClick={onClose}>
                Batal
              </button>
              <button
                className="button button--primary"
                type="submit"
                disabled={mutation.isPending || title.trim().length < 5 || body.trim().length < 10}
              >
                {mutation.isPending ? (
                  <>
                    <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                    Menyimpan…
                  </>
                ) : (
                  "Simpan perubahan"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
