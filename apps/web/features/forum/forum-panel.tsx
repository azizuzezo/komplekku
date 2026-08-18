"use client";

import type { ForumChannel, ForumMessage } from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle, Pencil, Reply, Send, Trash2, Users, X } from "lucide-react";
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
  listForumChannelMembers,
  listForumChannels,
  listForumMessages,
  postForumMessage,
  respondForumInvitation,
  updateForumMessage,
} from "./forum-api";
import { CreateForumChannelModal, InviteForumMembersModal } from "./forum-channel-modals";

function readableError(error: unknown) {
  return error instanceof ApiError ? error.message : "Pesan belum dapat dikirim. Coba lagi.";
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function channelLabel(channel: ForumChannel) {
  if (channel.kind === "PRIVATE") return channel.name;
  return channel.rtId ? channel.name : `${channel.name} (Semua RT)`;
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

  // A pending invitation is not a room you can read yet — it is a decision to
  // make, so those channels are pulled out of the tab strip into their own
  // banner above the thread.
  const invitations = useMemo(
    () => channels.filter((channel) => channel.membershipStatus === "PENDING"),
    [channels],
  );
  const openChannels = useMemo(
    () => channels.filter((channel) => channel.membershipStatus !== "PENDING"),
    [channels],
  );

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  useEffect(() => {
    if (openChannels.length === 0) {
      if (activeChannelId !== null) setActiveChannelId(null);
      return;
    }
    // Also re-anchors when the active forum disappears (invitation declined,
    // message posted from another device, …) instead of leaving a dead tab.
    if (!activeChannelId || !openChannels.some((channel) => channel.id === activeChannelId)) {
      setActiveChannelId(openChannels[0]!.id);
    }
  }, [activeChannelId, openChannels]);

  const activeChannel = openChannels.find((channel) => channel.id === activeChannelId) ?? null;

  const messagesQuery = useQuery({
    queryKey: activeChannelId ? forumKeys.messages(activeChannelId) : ["forum-messages", "none"],
    queryFn: () => listForumMessages({ channelId: activeChannelId! }),
    enabled: Boolean(activeChannelId),
  });

  // Live updates: the server pushes an SSE event whenever a message in this
  // channel is created, edited, or deleted; we simply refetch rather than
  // hand-merge state, since the page size here is small and correctness
  // matters more than shaving one request.
  useEffect(() => {
    if (!activeChannelId) return;
    const source = new EventSource(forumChannelStreamUrl(activeChannelId), {
      withCredentials: true,
    });
    const onUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: forumKeys.messages(activeChannelId) });
    };
    source.addEventListener("message.created", onUpdate);
    source.addEventListener("message.updated", onUpdate);
    source.addEventListener("message.deleted", onUpdate);
    return () => source.close();
  }, [activeChannelId, queryClient]);

  const [body, setBody] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<ForumMessage | null>(null);
  const [editing, setEditing] = useState<ForumMessage | null>(null);

  // Switching rooms must not carry a half-written reply or edit into the next
  // thread, where its target message does not even exist.
  useEffect(() => {
    setReplyTo(null);
    setEditing(null);
    setBody("");
    setImageUrls([]);
  }, [activeChannelId]);

  function invalidateMessages() {
    if (activeChannelId) {
      void queryClient.invalidateQueries({ queryKey: forumKeys.messages(activeChannelId) });
    }
  }

  function resetComposer() {
    setBody("");
    setImageUrls([]);
    setReplyTo(null);
    setEditing(null);
  }

  const postMutation = useMutation({
    mutationFn: postForumMessage,
    onSuccess() {
      resetComposer();
      invalidateMessages();
    },
  });

  const editMutation = useMutation({
    mutationFn: updateForumMessage,
    onSuccess() {
      resetComposer();
      invalidateMessages();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteForumMessage,
    onSuccess: invalidateMessages,
  });

  const invitationMutation = useMutation({
    mutationFn: respondForumInvitation,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: forumKeys.channels });
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

  const messages = messagesQuery.data?.data.items ?? [];
  const isComposerBusy = postMutation.isPending || editMutation.isPending;
  const composerError = postMutation.error ?? editMutation.error;

  return (
    <div className="forum-panel">
      <div className="forum-panel__toolbar">
        <nav aria-label="Channel forum" className="forum-panel__channels">
          {openChannels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => setActiveChannelId(channel.id)}
              className={`forum-panel__channel${
                channel.id === activeChannelId ? " forum-panel__channel--active" : ""
              }`}
            >
              {channelLabel(channel)}
              {channel.kind === "PRIVATE" && (
                <span className="forum-panel__channel-count">{channel.memberCount}</span>
              )}
            </button>
          ))}
        </nav>
        {canPost && <CreateForumChannelModal />}
      </div>

      {invitations.length > 0 && (
        <section className="forum-invitations" aria-label="Undangan forum">
          {invitations.map((invitation) => (
            <article className="forum-invitation" key={invitation.id}>
              <div>
                <p className="section-kicker">Undangan forum</p>
                <h2>{invitation.name}</h2>
                {invitation.description && <p>{invitation.description}</p>}
              </div>
              <div className="forum-invitation__actions">
                <button
                  className="button button--primary"
                  type="button"
                  disabled={invitationMutation.isPending}
                  onClick={() =>
                    invitationMutation.mutate({ channelId: invitation.id, accept: true })
                  }
                >
                  <Check size={16} aria-hidden="true" />
                  Terima
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={invitationMutation.isPending}
                  onClick={() =>
                    invitationMutation.mutate({ channelId: invitation.id, accept: false })
                  }
                >
                  <X size={16} aria-hidden="true" />
                  Tolak
                </button>
              </div>
            </article>
          ))}
          {invitationMutation.isError && (
            <p className="form-message" role="alert">
              {invitationMutation.error instanceof ApiError
                ? invitationMutation.error.message
                : "Undangan belum dapat diproses. Coba lagi."}
            </p>
          )}
        </section>
      )}

      {openChannels.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Belum ada forum yang bisa dibuka"
          description={
            invitations.length > 0
              ? "Terima salah satu undangan di atas untuk mulai mengobrol."
              : "Buat forum sendiri lalu undang warga yang ingin kamu ajak."
          }
        />
      ) : (
        <div className="forum-panel__thread">
          {activeChannel && <ChannelHeader channel={activeChannel} />}

          <div className="forum-panel__messages">
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
                const canDeleteMessage =
                  isOwn ||
                  (activeChannel?.kind === "PRIVATE" ? activeChannel.isOwner : canModerate);
                return (
                  <div
                    key={message.id}
                    className={`forum-message${isOwn ? " forum-message--own" : ""}`}
                  >
                    {!isOwn && <p className="forum-message__author">{message.authorName}</p>}
                    {message.replyToMessageId && (
                      <blockquote className="forum-message__quote">
                        <strong>{message.replyToAuthorName ?? "Pesan dihapus"}</strong>
                        <span>{message.replyToBody ?? "Pesan asli sudah dihapus."}</span>
                      </blockquote>
                    )}
                    <p className="forum-message__body">{message.body}</p>
                    {message.imageUrls.length > 0 && (
                      <div style={{ marginTop: "var(--space-2xs)" }}>
                        <PhotoGrid urls={message.imageUrls} />
                      </div>
                    )}
                    <div className="forum-message__meta">
                      <span>
                        {formatMessageTime(message.createdAt)}
                        {message.editedAt && " · diedit"}
                      </span>
                      <span className="forum-message__actions">
                        {canPost && (
                          <button
                            type="button"
                            aria-label="Balas pesan"
                            onClick={() => {
                              setEditing(null);
                              setReplyTo(message);
                            }}
                          >
                            <Reply size={13} aria-hidden="true" />
                          </button>
                        )}
                        {isOwn && canPost && (
                          <button
                            type="button"
                            aria-label="Edit pesan"
                            onClick={() => {
                              setReplyTo(null);
                              setEditing(message);
                              setBody(message.body);
                            }}
                          >
                            <Pencil size={13} aria-hidden="true" />
                          </button>
                        )}
                        {canDeleteMessage && (
                          <button
                            type="button"
                            aria-label="Hapus pesan"
                            onClick={() => deleteMutation.mutate(message.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        )}
                      </span>
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
              onSubmit={(event) => {
                event.preventDefault();
                if (editing) {
                  if (!body.trim()) return;
                  editMutation.mutate({
                    messageId: editing.id,
                    message: { body: body.trim() },
                  });
                  return;
                }
                if (!body.trim() && imageUrls.length === 0) return;
                postMutation.mutate({
                  channelId: activeChannelId,
                  message: {
                    body: body.trim() || " ",
                    imageUrls,
                    ...(replyTo ? { replyToMessageId: replyTo.id } : {}),
                  },
                });
              }}
            >
              {(replyTo || editing) && (
                <div className="forum-composer__context">
                  <div>
                    <strong>
                      {editing ? "Mengedit pesan" : `Membalas ${replyTo!.authorName}`}
                    </strong>
                    <span>{(editing ?? replyTo)!.body}</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Batalkan"
                    onClick={() => {
                      setReplyTo(null);
                      setEditing(null);
                      setBody("");
                    }}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              )}
              {!editing && <PhotoPicker onChange={setImageUrls} disabled={isComposerBusy} />}
              <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                <textarea
                  className="input"
                  rows={2}
                  placeholder={editing ? "Perbarui pesanmu…" : "Tulis pesan untuk warga…"}
                  value={body}
                  disabled={isComposerBusy}
                  onChange={(event) => setBody(event.target.value)}
                  style={{ flex: 1, resize: "vertical" }}
                />
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={
                    isComposerBusy ||
                    (editing ? !body.trim() : !body.trim() && imageUrls.length === 0)
                  }
                  aria-label={editing ? "Simpan perubahan" : "Kirim pesan"}
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
                  {readableError(composerError)}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function ChannelHeader({ channel }: { channel: ForumChannel }) {
  const [showMembers, setShowMembers] = useState(false);
  const membersQuery = useQuery({
    queryKey: forumKeys.members(channel.id),
    queryFn: () => listForumChannelMembers(channel.id),
    enabled: showMembers && channel.kind === "PRIVATE",
  });

  if (channel.kind !== "PRIVATE") return null;

  return (
    <header className="forum-channel-header">
      <div>
        <h2>{channel.name}</h2>
        {channel.description && <p>{channel.description}</p>}
      </div>
      <div className="forum-channel-header__actions">
        <button
          className="button button--secondary"
          type="button"
          aria-expanded={showMembers}
          onClick={() => setShowMembers((open) => !open)}
        >
          <Users size={16} aria-hidden="true" />
          {channel.memberCount} anggota
        </button>
        {channel.membershipStatus === "ACCEPTED" && (
          <InviteForumMembersModal channelId={channel.id} channelName={channel.name} />
        )}
      </div>
      {showMembers && (
        <ul className="forum-member-list">
          {membersQuery.isPending && <li className="field-hint">Memuat anggota…</li>}
          {membersQuery.isError && (
            <li className="field-hint">Daftar anggota belum dapat dimuat.</li>
          )}
          {membersQuery.data?.data.items.map((member) => (
            <li key={member.userId}>
              <span>
                {member.displayName}
                {member.houseLabel && ` · ${member.houseLabel}`}
              </span>
              <span className="forum-member-list__status">
                {member.isOwner ? "Pembuat" : member.status === "PENDING" ? "Menunggu" : "Anggota"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
