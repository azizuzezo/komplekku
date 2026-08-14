"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { createAnnouncement } from "./announcement-api";

export function CreateAnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [errorMsg, setErrorMsg] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
      setIsOpen(false);
      setTitle("");
      setSummary("");
      setBody("");
      setPriority("NORMAL");
      setErrorMsg("");
    },
    onError: (err: Error) => {
      const details = (err as { details?: unknown }).details;
      const fieldMessages =
        Array.isArray(details) && details.length > 0
          ? details
              .map((d) =>
                d && typeof d === "object" && "message" in d ? String(d.message) : String(d),
              )
              .join(" ")
          : null;
      setErrorMsg(fieldMessages ?? err.message ?? "Gagal membuat pengumuman.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !body.trim()) {
      setErrorMsg("Semua kolom wajib diisi.");
      return;
    }
    setErrorMsg("");
    mutation.mutate({ title, summary, body, priority });
  };

  return (
    <>
      <button type="button" className="button button--primary" onClick={() => setIsOpen(true)}>
        <Plus size={18} />
        <span>Buat Pengumuman</span>
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Buat Pengumuman Baru</h2>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setIsOpen(false)}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="form-stack">
                  {errorMsg && <div className="form-message">{errorMsg}</div>}

                  <div className="field">
                    <label htmlFor="announcement-title">Judul Pengumuman</label>
                    <input
                      id="announcement-title"
                      type="text"
                      className="input"
                      placeholder="Contoh: Kerja Bakti Hari Minggu"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="announcement-summary">Ringkasan Singkat</label>
                    <input
                      id="announcement-summary"
                      type="text"
                      className="input"
                      placeholder="Ringkasan 1-2 kalimat..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="announcement-priority">Prioritas</label>
                    <select
                      id="announcement-priority"
                      className="input"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                    >
                      <option value="NORMAL">Biasa (Normal)</option>
                      <option value="IMPORTANT">Penting</option>
                      <option value="URGENT">Mendesak (Darurat)</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="announcement-body">Isi Lengkap Pengumuman</label>
                    <textarea
                      id="announcement-body"
                      className="input textarea"
                      rows={5}
                      placeholder="Tuliskan isi pengumuman secara lengkap di sini..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => setIsOpen(false)}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="button button--primary"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? "Menerbitkan..." : "Terbitkan Pengumuman"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
