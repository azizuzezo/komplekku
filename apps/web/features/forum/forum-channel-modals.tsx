"use client";

import type { ForumMemberCandidate } from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { ApiError } from "@/lib/api/client";

import {
  createForumChannel,
  forumKeys,
  inviteForumMembers,
  listForumChannelMembers,
  listForumMemberCandidates,
} from "./forum-api";

function readableError(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

/** Shared checkbox roster of residents a forum can invite. */
function ResidentPicker({
  candidates,
  selected,
  onToggle,
  isPending,
  isError,
  emptyLabel,
}: {
  candidates: ForumMemberCandidate[];
  selected: Set<string>;
  onToggle: (userId: string) => void;
  isPending: boolean;
  isError: boolean;
  emptyLabel: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter(
      (candidate) =>
        candidate.displayName.toLowerCase().includes(term) ||
        (candidate.houseLabel ?? "").toLowerCase().includes(term),
    );
  }, [candidates, search]);

  if (isPending) return <p className="field-hint">Memuat daftar warga…</p>;
  if (isError) return <p className="field-hint">Daftar warga belum dapat dimuat.</p>;
  if (candidates.length === 0) return <p className="field-hint">{emptyLabel}</p>;

  return (
    <>
      <input
        className="input"
        type="search"
        placeholder="Cari nama atau rumah…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <ul className="forum-resident-picker">
        {filtered.map((candidate) => (
          <li key={candidate.userId}>
            <label>
              <input
                type="checkbox"
                checked={selected.has(candidate.userId)}
                onChange={() => onToggle(candidate.userId)}
              />
              <span>
                {candidate.displayName}
                {candidate.houseLabel && (
                  <small className="forum-resident-picker__house"> · {candidate.houseLabel}</small>
                )}
              </span>
            </label>
          </li>
        ))}
        {filtered.length === 0 && <li className="field-hint">Tidak ada warga yang cocok.</li>}
      </ul>
    </>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-button" type="button" aria-label="Tutup" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** "Buat Forum": a warga names a room, describes it, and picks who gets an
 * invitation. Only the people invited here can ever read it. */
export function CreateForumChannelModal() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidatesQuery = useQuery({
    queryKey: forumKeys.candidates,
    queryFn: listForumMemberCandidates,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: createForumChannel,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: forumKeys.channels });
      close();
    },
  });

  function close() {
    setIsOpen(false);
    setName("");
    setDescription("");
    setSelected(new Set());
    mutation.reset();
  }

  function toggle(userId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  return (
    <>
      <button className="button button--primary" type="button" onClick={() => setIsOpen(true)}>
        <Plus size={16} aria-hidden="true" />
        Buat forum
      </button>

      {isOpen && (
        <ModalShell title="Buat forum baru" onClose={close}>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim().length < 3) return;
              mutation.mutate({
                name: name.trim(),
                ...(description.trim() ? { description: description.trim() } : {}),
                invitedUserIds: [...selected],
              });
            }}
          >
            <div className="field">
              <label htmlFor="forum-name">Nama forum</label>
              <input
                id="forum-name"
                className="input"
                value={name}
                minLength={3}
                maxLength={160}
                required
                onChange={(event) => setName(event.target.value)}
                placeholder="Misal: Panitia 17 Agustus"
              />
            </div>
            <div className="field">
              <label htmlFor="forum-description">Deskripsi (opsional)</label>
              <textarea
                id="forum-description"
                className="input"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Untuk apa forum ini dibuat?"
              />
            </div>
            <div className="field">
              <span className="field-label">Undang warga</span>
              <p className="field-hint">
                Hanya warga yang kamu undang dan menerima undangan yang bisa membaca forum ini.
              </p>
              <ResidentPicker
                candidates={candidatesQuery.data?.data.items ?? []}
                selected={selected}
                onToggle={toggle}
                isPending={candidatesQuery.isPending}
                isError={candidatesQuery.isError}
                emptyLabel="Belum ada warga lain di komunitas ini."
              />
            </div>
            {mutation.isError && (
              <p className="form-message" role="alert">
                {readableError(mutation.error, "Forum belum dapat dibuat. Coba lagi.")}
              </p>
            )}
            <div className="modal-actions">
              <button className="button button--secondary" type="button" onClick={close}>
                Batal
              </button>
              <button
                className="button button--primary"
                type="submit"
                disabled={mutation.isPending || name.trim().length < 3}
              >
                {mutation.isPending ? (
                  <>
                    <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                    Membuat…
                  </>
                ) : (
                  "Buat forum"
                )}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
}

/** Adds more neighbours to an existing private forum. */
export function InviteForumMembersModal({
  channelId,
  channelName,
}: {
  channelId: string;
  channelName: string;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidatesQuery = useQuery({
    queryKey: forumKeys.candidates,
    queryFn: listForumMemberCandidates,
    enabled: isOpen,
  });
  const membersQuery = useQuery({
    queryKey: forumKeys.members(channelId),
    queryFn: () => listForumChannelMembers(channelId),
    enabled: isOpen,
  });

  // Someone already in the room (or still deciding) is not invitable again.
  const invitable = useMemo(() => {
    const taken = new Set(membersQuery.data?.data.items.map((member) => member.userId) ?? []);
    return (candidatesQuery.data?.data.items ?? []).filter(
      (candidate) => !taken.has(candidate.userId),
    );
  }, [candidatesQuery.data, membersQuery.data]);

  const mutation = useMutation({
    mutationFn: inviteForumMembers,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: forumKeys.channels });
      void queryClient.invalidateQueries({ queryKey: forumKeys.members(channelId) });
      close();
    },
  });

  function close() {
    setIsOpen(false);
    setSelected(new Set());
    mutation.reset();
  }

  function toggle(userId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  return (
    <>
      <button className="button button--secondary" type="button" onClick={() => setIsOpen(true)}>
        <UserPlus size={16} aria-hidden="true" />
        Undang warga
      </button>

      {isOpen && (
        <ModalShell title={`Undang warga ke ${channelName}`} onClose={close}>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              if (selected.size === 0) return;
              mutation.mutate({ channelId, userIds: [...selected] });
            }}
          >
            <ResidentPicker
              candidates={invitable}
              selected={selected}
              onToggle={toggle}
              isPending={candidatesQuery.isPending || membersQuery.isPending}
              isError={candidatesQuery.isError || membersQuery.isError}
              emptyLabel="Semua warga sudah diundang ke forum ini."
            />
            {mutation.isError && (
              <p className="form-message" role="alert">
                {readableError(mutation.error, "Undangan belum dapat dikirim. Coba lagi.")}
              </p>
            )}
            <div className="modal-actions">
              <button className="button button--secondary" type="button" onClick={close}>
                Batal
              </button>
              <button
                className="button button--primary"
                type="submit"
                disabled={mutation.isPending || selected.size === 0}
              >
                {mutation.isPending ? (
                  <>
                    <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                    Mengundang…
                  </>
                ) : (
                  `Undang ${selected.size} warga`
                )}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
}
