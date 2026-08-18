"use client";

import {
  FORUM_POST_CATEGORY_LABELS,
  type ForumPostReply as ForumPostReplyModel,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Heart, LoaderCircle, Pencil, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { PhotoGrid } from "@/components/ui/photo-picker";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { formatRelativeTime } from "./forum-board";
import {
  createForumPostReply,
  deleteForumPostReply,
  forumPostKeys,
  getForumPost,
  toggleForumPostLike,
  toggleForumReplyLike,
  updateForumPostReply,
} from "./forum-post-api";

function formatPostedAt(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function ForumPostDetail({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const currentUserId = meQuery.data?.data.id;
  const canPost = meQuery.data?.data.permissions.includes("forum.post") ?? false;
  const canModerate = meQuery.data?.data.permissions.includes("forum.manage") ?? false;

  const postQuery = useQuery({
    queryKey: forumPostKeys.detail(postId),
    queryFn: () => getForumPost(postId),
  });

  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<ForumPostReplyModel | null>(null);
  const [editing, setEditing] = useState<ForumPostReplyModel | null>(null);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: forumPostKeys.detail(postId) });
    void queryClient.invalidateQueries({ queryKey: forumPostKeys.all });
  }

  function resetComposer() {
    setBody("");
    setReplyTo(null);
    setEditing(null);
  }

  const replyMutation = useMutation({
    mutationFn: createForumPostReply,
    onSuccess() {
      resetComposer();
      invalidate();
    },
  });
  const editMutation = useMutation({
    mutationFn: updateForumPostReply,
    onSuccess() {
      resetComposer();
      invalidate();
    },
  });
  const deleteMutation = useMutation({ mutationFn: deleteForumPostReply, onSuccess: invalidate });
  const postLikeMutation = useMutation({ mutationFn: toggleForumPostLike, onSuccess: invalidate });
  const replyLikeMutation = useMutation({
    mutationFn: toggleForumReplyLike,
    onSuccess: invalidate,
  });

  if (postQuery.isPending) return <AdminQueueSkeleton />;

  if (postQuery.isError) {
    const state = getRequestState(postQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka diskusi ini."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    // getRequestState has no 404 bucket, so a deleted discussion has to be
    // recognised from the status directly.
    const isMissing = postQuery.error instanceof ApiError && postQuery.error.status === 404;
    if (state === "forbidden" || isMissing) {
      return (
        <StatePanel
          kind="empty"
          title="Diskusi tidak ditemukan"
          description="Diskusi ini mungkin sudah dihapus penulisnya."
          actionHref="/forum"
          actionLabel="Kembali ke forum"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Diskusi belum bisa dimuat"
        description="Terjadi kendala saat mengambil diskusi ini."
        onRetry={() => void postQuery.refetch()}
      />
    );
  }

  const post = postQuery.data.data.post;
  const isComposerBusy = replyMutation.isPending || editMutation.isPending;
  const composerError = replyMutation.error ?? editMutation.error;

  return (
    <div className="forum-thread">
      <Link className="text-link" href="/forum">
        <ArrowLeft size={16} aria-hidden="true" />
        Kembali ke forum
      </Link>

      <article className="forum-thread__post">
        <span className="announcement-badge announcement-badge--event">
          {FORUM_POST_CATEGORY_LABELS[post.category]}
        </span>
        <h1>{post.title}</h1>
        <p className="forum-thread__byline">
          {post.authorName} · {formatPostedAt(post.createdAt)}
          {post.editedAt && " · diedit"}
        </p>
        <p className="forum-thread__body">{post.body}</p>
        {post.imageUrls.length > 0 && <PhotoGrid urls={post.imageUrls} />}
        <footer>
          <span className="forum-post-card__stat">{post.replyCount} balasan</span>
          <button
            type="button"
            className={`forum-post-card__stat forum-post-card__like${
              post.likedByMe ? " forum-post-card__like--on" : ""
            }`}
            onClick={() => postLikeMutation.mutate(post.id)}
            disabled={postLikeMutation.isPending}
            aria-pressed={post.likedByMe}
          >
            <Heart size={15} aria-hidden="true" fill={post.likedByMe ? "currentColor" : "none"} />
            {post.likeCount} suka
          </button>
        </footer>
      </article>

      <section aria-labelledby="forum-replies-heading" className="forum-thread__replies">
        <h2 id="forum-replies-heading">Balasan ({post.replies.length})</h2>

        {post.replies.length === 0 ? (
          <StatePanel
            kind="empty"
            title="Belum ada balasan"
            description="Jadilah yang pertama menanggapi diskusi ini."
          />
        ) : (
          post.replies.map((reply) => {
            const isOwn = reply.authorUserId === currentUserId;
            return (
              <article className="forum-reply" key={reply.id}>
                <header>
                  <strong>{reply.authorName}</strong>
                  <span>
                    {formatRelativeTime(reply.createdAt)}
                    {reply.editedAt && " · diedit"}
                  </span>
                </header>

                {reply.replyToReplyId && (
                  <blockquote className="forum-message__quote">
                    <strong>{reply.replyToAuthorName ?? "Balasan dihapus"}</strong>
                    <span>{reply.replyToBody ?? "Balasan asli sudah dihapus."}</span>
                  </blockquote>
                )}

                <p>{reply.body}</p>

                <footer>
                  {canPost && (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setEditing(null);
                        setReplyTo(reply);
                      }}
                    >
                      Balas
                    </button>
                  )}
                  {isOwn && canPost && (
                    <button
                      type="button"
                      className="text-link"
                      aria-label="Edit balasan"
                      onClick={() => {
                        setReplyTo(null);
                        setEditing(reply);
                        setBody(reply.body);
                      }}
                    >
                      <Pencil size={13} aria-hidden="true" />
                    </button>
                  )}
                  {(isOwn || canModerate) && (
                    <button
                      type="button"
                      className="text-link"
                      aria-label="Hapus balasan"
                      onClick={() => deleteMutation.mutate(reply.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`forum-post-card__like${
                      reply.likedByMe ? " forum-post-card__like--on" : ""
                    }`}
                    onClick={() => replyLikeMutation.mutate(reply.id)}
                    disabled={replyLikeMutation.isPending}
                    aria-pressed={reply.likedByMe}
                    aria-label={reply.likedByMe ? "Batalkan suka" : "Suka balasan ini"}
                  >
                    <Heart
                      size={14}
                      aria-hidden="true"
                      fill={reply.likedByMe ? "currentColor" : "none"}
                    />
                    {reply.likeCount}
                  </button>
                </footer>
              </article>
            );
          })
        )}
      </section>

      {canPost && (
        <form
          className="form-stack forum-thread__composer"
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) return;
            if (editing) {
              editMutation.mutate({ replyId: editing.id, reply: { body: body.trim() } });
              return;
            }
            replyMutation.mutate({
              postId: post.id,
              reply: {
                body: body.trim(),
                ...(replyTo ? { replyToReplyId: replyTo.id } : {}),
              },
            });
          }}
        >
          {(replyTo || editing) && (
            <div className="forum-composer__context">
              <div>
                <strong>
                  {editing ? "Mengedit balasan" : `Membalas ${replyTo!.authorName}`}
                </strong>
                <span>{(editing ?? replyTo)!.body}</span>
              </div>
              <button type="button" aria-label="Batalkan" onClick={resetComposer}>
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: "var(--space-xs)" }}>
            <textarea
              className="input"
              rows={2}
              placeholder={editing ? "Perbarui balasanmu…" : "Tulis balasan…"}
              value={body}
              disabled={isComposerBusy}
              onChange={(event) => setBody(event.target.value)}
              style={{ flex: 1, resize: "vertical" }}
            />
            <button
              className="button button--primary"
              type="submit"
              disabled={isComposerBusy || !body.trim()}
              aria-label={editing ? "Simpan perubahan" : "Kirim balasan"}
            >
              {isComposerBusy ? (
                <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
              ) : editing ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <Send size={17} aria-hidden="true" />
              )}
            </button>
          </div>
          {composerError && (
            <p className="form-message" role="alert">
              {composerError instanceof ApiError
                ? composerError.message
                : "Balasan belum dapat dikirim. Coba lagi."}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
