"use client";

import { LoaderCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * The "⋮" menu that carries Edit and Hapus for anything a warga or pengurus
 * owns — announcements, agenda, forum posts.
 *
 * One component so the confirmation step is never accidentally skipped in one
 * place and present in another: deleting always asks first.
 */
export function EntityActions({
  onEdit,
  onDelete,
  deleteTitle,
  deleteMessage,
  isBusy = false,
  label = "Tindakan lainnya",
}: {
  onEdit?: () => void;
  onDelete?: () => Promise<unknown> | void;
  deleteTitle: string;
  deleteMessage: string;
  isBusy?: boolean;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [isOpen]);

  if (!onEdit && !onDelete) return null;

  return (
    <div className="entity-actions" ref={containerRef}>
      <button
        type="button"
        className="icon-button"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        disabled={isBusy || deleting}
      >
        {isBusy || deleting ? (
          <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
        ) : (
          <MoreVertical size={18} aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className="entity-actions__menu" role="menu">
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
            >
              <Pencil size={15} aria-hidden="true" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              className="entity-actions__danger"
              onClick={() => {
                setIsOpen(false);
                setConfirming(true);
              }}
            >
              <Trash2 size={15} aria-hidden="true" />
              Hapus
            </button>
          )}
        </div>
      )}

      {confirming && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!deleting) setConfirming(false);
          }}
        >
          <div
            className="modal-card modal-card--confirm"
            role="alertdialog"
            aria-modal="true"
            aria-label={deleteTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{deleteTitle}</h2>
            </div>
            <p>{deleteMessage}</p>
            {deleteError && <p role="alert" className="field-error">{deleteError}</p>}
            <div className="modal-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                className="button button--danger"
                type="button"
                disabled={deleting}
                onClick={async () => {
                  if (!onDelete) return;
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    await onDelete();
                    setConfirming(false);
                  } catch (error) {
                    setDeleteError(
                      error instanceof Error
                        ? error.message
                        : "Data belum dapat dihapus. Coba lagi.",
                    );
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
