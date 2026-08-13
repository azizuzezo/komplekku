"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { agendaKeys, createAgendaEvent } from "./agenda-api";

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
