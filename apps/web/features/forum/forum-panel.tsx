"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PhotoGrid, PhotoPicker } from "@/components/ui/photo-picker";
import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  deleteForumMessage,
  forumChannelStreamUrl,
  forumKeys,
  listForumChannels,
  listForumMessages,
  postForumMessage,
} from "./forum-api";

function readableError(error: unknown) {
  return error instanceof ApiError ? error.message : "Pesan belum dapat dikirim. Coba lagi.";
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function ForumPanel() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("forum.read") ?? false;
  const canPost = meQuery.data?.data.permissions.includes("forum.post") ?? false;
  const canModerate = meQuery.data?.data.permissions.includes("forum.manage") ?? false;
  const currentUserId = meQuery.data?.data.id;

  const channelsQuery = useQuery({
    queryKey: forumKeys.channels,
    queryFn: listForumChannels,
    enabled: canRead,
  });
  const channels = useMemo(() => channelsQuery.data?.data.items ?? [], [channelsQuery.data]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      setActiveChannelId(channels[0]!.id);
    }
  }, [activeChannelId, channels]);

  const messagesQuery = useQuery({
    queryKey: activeChannelId ? forumKeys.messages(activeChannelId) : ["forum-messages", "none"],
    queryFn: () => listForumMessages({ channelId: activeChannelId! }),
    enabled: Boolean(activeChannelId),
  });

  // Live updates: the server pushes an SSE event whenever a message in this
  // channel is created or deleted; we simply refetch rather than hand-merge
  // state, since the page size here is small and correctness matters more
  // than shaving one request.
  useEffect(() => {
    if (!activeChannelId) return;
    const source = new EventSource(forumChannelStreamUrl(activeChannelId), {
      withCredentials: true,
    });
    const onUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: forumKeys.messages(activeChannelId) });
    };
    source.addEventListener("message.created", onUpdate);
    source.addEventListener("message.deleted", onUpdate);
    return () => source.close();
  }, [activeChannelId, queryClient]);

  const [body, setBody] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const postMutation = useMutation({
    mutationFn: postForumMessage,
    onSuccess() {
      setBody("");
      setImageUrls([]);
      if (activeChannelId) {
        void queryClient.invalidateQueries({ queryKey: forumKeys.messages(activeChannelId) });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteForumMessage,
    onSuccess() {
      if (activeChannelId) {
        void queryClient.invalidateQueries({ queryKey: forumKeys.messages(activeChannelId) });
      }
    },
  });

  if (meQuery.isPending || (canRead && channelsQuery.isPending)) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka Forum Warga."
          headingLevel={1}
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Izin akun belum bisa diperiksa"
        description="Terjadi kendala saat mengambil informasi akunmu."
        headingLevel={1}
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canRead) {
    return (
      <StatePanel
        kind="forbidden"
        title="Forum Warga tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk membuka Forum Warga."
        headingLevel={1}
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (channelsQuery.isError) {
    return (
      <StatePanel
        kind="error"
        title="Forum belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar channel forum."
        headingLevel={1}
        onRetry={() => void channelsQuery.refetch()}
      />
    );
  }

  if (channels.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada channel forum"
        description="Channel forum akan muncul setelah pengurus menyiapkan RT."
      />
    );
  }

  const messages = messagesQuery.data?.data.items ?? [];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(160px, 220px) 1fr",
        gap: "var(--space-md)",
        minHeight: "60vh",
      }}
    >
      <nav
        aria-label="Channel forum"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2xs)",
          borderRight: "1px solid var(--color-border)",
          paddingRight: "var(--space-sm)",
        }}
      >
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            onClick={() => setActiveChannelId(channel.id)}
            style={{
              textAlign: "left",
              padding: "var(--space-xs) var(--space-sm)",
              borderRadius: "var(--radius-input)",
              border: "1px solid transparent",
              background:
                channel.id === activeChannelId ? "var(--color-surface-soft)" : "transparent",
              color:
                channel.id === activeChannelId ? "var(--color-primary)" : "var(--color-text-primary)",
              fontWeight: channel.id === activeChannelId ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {channel.rtId ? channel.name : `${channel.name} (Semua RT)`}
          </button>
        ))}
      </nav>

      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column-reverse",
            gap: "var(--space-sm)",
            padding: "var(--space-xs) var(--space-2xs)",
          }}
        >
          {messagesQuery.isPending ? (
            <p className="field-hint">Memuat pesan…</p>
          ) : messagesQuery.isError ? (
            <StatePanel
              kind="error"
              title="Pesan belum bisa dimuat"
              description="Terjadi kendala saat mengambil pesan forum."
              onRetry={() => void messagesQuery.refetch()}
            />
          ) : messages.length === 0 ? (
            <StatePanel
              kind="empty"
              title="Belum ada pesan"
              description="Jadilah yang pertama menyapa warga di channel ini."
            />
          ) : (
            messages.map((message) => {
              const isOwn = message.authorUserId === currentUserId;
              const canDelete = isOwn || canModerate;
              return (
                <div
                  key={message.id}
                  style={{
                    alignSelf: isOwn ? "flex-end" : "flex-start",
                    maxWidth: "min(480px, 85%)",
                    background: isOwn ? "var(--color-primary)" : "var(--color-surface-soft)",
                    color: isOwn ? "var(--color-on-primary)" : "var(--color-text-primary)",
                    borderRadius: "var(--radius-card)",
                    padding: "var(--space-xs) var(--space-sm)",
                  }}
                >
                  {!isOwn && (
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, margin: "0 0 2px" }}>
                      {message.authorName}
                    </p>
                  )}
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {message.body}
                  </p>
                  {message.imageUrls.length > 0 && (
                    <div style={{ marginTop: "var(--space-2xs)" }}>
                      <PhotoGrid urls={message.imageUrls} />
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "var(--space-2xs)",
                      gap: "var(--space-xs)",
                    }}
                  >
                    <span style={{ fontSize: "0.7rem", opacity: 0.75 }}>
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        aria-label="Hapus pesan"
                        onClick={() => deleteMutation.mutate(message.id)}
                        disabled={deleteMutation.isPending}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "inherit",
                          opacity: 0.75,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canPost && activeChannelId && (
          <form
            className="form-stack"
            style={{ marginTop: "var(--space-sm)" }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim() && imageUrls.length === 0) return;
              postMutation.mutate({
                channelId: activeChannelId,
                message: { body: body.trim() || " ", imageUrls },
              });
            }}
          >
            <PhotoPicker onChange={setImageUrls} disabled={postMutation.isPending} />
            <div style={{ display: "flex", gap: "var(--space-xs)" }}>
              <textarea
                className="input"
                rows={2}
                placeholder="Tulis pesan untuk warga…"
                value={body}
                disabled={postMutation.isPending}
                onChange={(e) => setBody(e.target.value)}
                style={{ flex: 1, resize: "vertical" }}
              />
              <button
                className="button button--primary"
                type="submit"
                disabled={postMutation.isPending || (!body.trim() && imageUrls.length === 0)}
                aria-label="Kirim pesan"
              >
                {postMutation.isPending ? (
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                ) : (
                  <Send size={17} aria-hidden="true" />
                )}
              </button>
            </div>
            {postMutation.isError && (
              <p className="form-message" role="alert">
                {readableError(postMutation.error)}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
