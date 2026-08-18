"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { agendaKeys, createAgendaEvent, getAgendaEvent, updateAgendaEvent } from "./agenda-api";

export function CreateAgendaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createAgendaEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agendaKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
      setIsOpen(false);
      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setOrganizer("");
      setDescription("");
      setErrorMsg("");
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Gagal membuat agenda.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title.trim() ||
      !date ||
      !startTime ||
      !endTime ||
      !location.trim() ||
      !organizer.trim() ||
      !description.trim()
    ) {
      setErrorMsg("Semua kolom wajib diisi.");
      return;
    }
    if (endTime <= startTime) {
      setErrorMsg("Waktu selesai harus setelah waktu mulai.");
      return;
    }
    setErrorMsg("");
    mutation.mutate({ title, date, startTime, endTime, location, organizer, description });
  };

  return (
    <>
      <button type="button" className="button button--primary" onClick={() => setIsOpen(true)}>
        <Plus size={18} />
        <span>Buat Agenda</span>
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Buat Agenda Baru</h2>
                  <button type="button" className="icon-button" onClick={() => setIsOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="form-stack">
                  {errorMsg && <div className="form-message">{errorMsg}</div>}

                  <div className="field">
                    <label htmlFor="agenda-title">Judul Agenda</label>
                    <input
                      id="agenda-title"
                      type="text"
                      className="input"
                      placeholder="Contoh: Kerja Bakti Hari Minggu"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="agenda-date">Tanggal</label>
                    <input
                      id="agenda-date"
                      type="date"
                      className="input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="agenda-start-time">Waktu Mulai</label>
                    <input
                      id="agenda-start-time"
                      type="time"
                      className="input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="agenda-end-time">Waktu Selesai</label>
                    <input
                      id="agenda-end-time"
                      type="time"
                      className="input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="agenda-location">Lokasi</label>
                    <input
                      id="agenda-location"
                      type="text"
                      className="input"
                      placeholder="Contoh: Balai Warga"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="agenda-organizer">Penyelenggara</label>
                    <input
                      id="agenda-organizer"
                      type="text"
                      className="input"
                      placeholder="Contoh: Pengurus RT 01"
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="agenda-description">Deskripsi</label>
                    <textarea
                      id="agenda-description"
                      className="input textarea"
                      rows={5}
                      placeholder="Tuliskan detail kegiatan di sini..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
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
                      {mutation.isPending ? "Menerbitkan..." : "Terbitkan Agenda"}
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

/**
 * Edit gets its own modal for the same reason the announcement one does: it
 * loads current values first and sends a partial PATCH, so sharing state with
 * the create form would mean two half-populated code paths.
 */
export function EditAgendaModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: agendaKeys.detail(eventId),
    queryFn: () => getAgendaEvent(eventId),
  });

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Populate once; re-running on every refetch would discard edits in progress.
  useEffect(() => {
    if (isLoaded || !detailQuery.data) return;
    const event = detailQuery.data.data.event;
    setTitle(event.title);
    setDate(event.date);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setLocation(event.location);
    setOrganizer(event.organizer);
    setDescription(event.description);
    setIsLoaded(true);
  }, [detailQuery.data, isLoaded]);

  const mutation = useMutation({
    mutationFn: updateAgendaEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agendaKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
      onClose();
    },
    onError: (err: Error) => setErrorMsg(err.message || "Gagal menyimpan perubahan."),
  });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Edit agenda"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Edit Agenda</h2>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {detailQuery.isPending ? (
          <p className="field-hint">Memuat agenda…</p>
        ) : detailQuery.isError ? (
          <p className="form-message" role="alert">
            Agenda ini belum bisa dimuat.
          </p>
        ) : (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (endTime <= startTime) {
                setErrorMsg("Waktu selesai harus setelah waktu mulai.");
                return;
              }
              setErrorMsg("");
              mutation.mutate({
                id: eventId,
                changes: { title, date, startTime, endTime, location, organizer, description },
              });
            }}
          >
            {errorMsg && <div className="form-message">{errorMsg}</div>}

            <div className="field">
              <label htmlFor="edit-agenda-title">Judul Agenda</label>
              <input
                id="edit-agenda-title"
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="edit-agenda-date">Tanggal</label>
              <input
                id="edit-agenda-date"
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="edit-agenda-start">Waktu Mulai</label>
              <input
                id="edit-agenda-start"
                type="time"
                className="input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="edit-agenda-end">Waktu Selesai</label>
              <input
                id="edit-agenda-end"
                type="time"
                className="input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="edit-agenda-location">Lokasi</label>
              <input
                id="edit-agenda-location"
                type="text"
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="edit-agenda-organizer">Penyelenggara</label>
              <input
                id="edit-agenda-organizer"
                type="text"
                className="input"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="edit-agenda-description">Deskripsi</label>
              <textarea
                id="edit-agenda-description"
                className="input textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="button button--secondary" onClick={onClose}>
                Batal
              </button>
              <button
                type="submit"
                className="button button--primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
