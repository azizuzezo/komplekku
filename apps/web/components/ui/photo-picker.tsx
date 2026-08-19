"use client";

import { useRef, useState } from "react";
import { Camera, Image, LoaderCircle, X } from "lucide-react";

import {
  CloudinaryConfigError,
  isCloudinaryConfigured,
  uploadToCloudinary,
} from "@/lib/cloudinary-upload";

const MAX_PHOTOS = 5;

type PhotoSlot =
  | { kind: "uploading"; localUrl: string; percent: number; file: File }
  | { kind: "done"; localUrl: string; remoteUrl: string }
  | { kind: "error"; localUrl: string; message: string; file: File };

type PhotoPickerProps = {
  /** Called whenever the list of successfully-uploaded URLs changes. */
  onChange: (urls: string[]) => void;
  /** Disable interactions (e.g. while form is submitting). */
  disabled?: boolean;
};

export function PhotoPicker({ onChange, disabled = false }: PhotoPickerProps) {
  const [slots, setSlots] = useState<PhotoSlot[]>([]);
  const [configError, setConfigError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = slots.length < MAX_PHOTOS && !disabled;

  function notifyParent(updatedSlots: PhotoSlot[]) {
    const urls = updatedSlots
      .filter((s): s is Extract<PhotoSlot, { kind: "done" }> => s.kind === "done")
      .map((s) => s.remoteUrl);
    onChange(urls);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    if (!isCloudinaryConfigured()) {
      setConfigError(true);
      return;
    }
    setConfigError(false);

    const remaining = MAX_PHOTOS - slots.length;
    const toUpload = Array.from(files).slice(0, remaining);

    const localUrls = toUpload.map((file) => URL.createObjectURL(file));

    const initialSlots: PhotoSlot[] = toUpload.map((file, i) => ({
      kind: "uploading",
      localUrl: localUrls[i],
      percent: 0,
      file,
    }));

    setSlots((prev) => {
      const next = [...prev, ...initialSlots];
      notifyParent(next);
      return next;
    });

    await Promise.all(
      toUpload.map(async (file, i) => {
        const localUrl = localUrls[i];
        try {
          const remoteUrl = await uploadToCloudinary(file, (progress) => {
            setSlots((prev) =>
              prev.map((s) =>
                s.localUrl === localUrl && s.kind === "uploading"
                  ? { ...s, percent: progress.percent }
                  : s,
              ),
            );
          });

          setSlots((prev) => {
            const next = prev.map((s) =>
              s.localUrl === localUrl
                ? ({ kind: "done", localUrl, remoteUrl } satisfies PhotoSlot)
                : s,
            );
            notifyParent(next);
            return next;
          });
        } catch (err) {
          const message =
            err instanceof CloudinaryConfigError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Upload gagal. Coba lagi.";

          setSlots((prev) => {
            const next = prev.map((s) =>
              s.localUrl === localUrl
                ? ({ kind: "error", localUrl, message, file } satisfies PhotoSlot)
                : s,
            );
            notifyParent(next);
            return next;
          });
        }
      }),
    );
  }

  function removeSlot(localUrl: string) {
    setSlots((prev) => {
      const next = prev.filter((s) => s.localUrl !== localUrl);
      notifyParent(next);
      return next;
    });
  }

  async function retrySlot(slot: Extract<PhotoSlot, { kind: "error" }>) {
    setSlots((prev) =>
      prev.map((s) =>
        s.localUrl === slot.localUrl
          ? ({
              kind: "uploading",
              localUrl: slot.localUrl,
              percent: 0,
              file: slot.file,
            } satisfies PhotoSlot)
          : s,
      ),
    );

    try {
      const remoteUrl = await uploadToCloudinary(slot.file, (progress) => {
        setSlots((prev) =>
          prev.map((s) =>
            s.localUrl === slot.localUrl && s.kind === "uploading"
              ? { ...s, percent: progress.percent }
              : s,
          ),
        );
      });

      setSlots((prev) => {
        const next = prev.map((s) =>
          s.localUrl === slot.localUrl
            ? ({ kind: "done", localUrl: slot.localUrl, remoteUrl } satisfies PhotoSlot)
            : s,
        );
        notifyParent(next);
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload gagal. Coba lagi.";
      setSlots((prev) => {
        const next = prev.map((s) =>
          s.localUrl === slot.localUrl
            ? ({
                kind: "error",
                localUrl: slot.localUrl,
                message,
                file: slot.file,
              } satisfies PhotoSlot)
            : s,
        );
        notifyParent(next);
        return next;
      });
    }
  }

  return (
    <div className="photo-picker" aria-label="Lampiran foto">
      {configError && (
        <p className="photo-picker__config-error">
          ⚠ Cloudinary belum dikonfigurasi. Tambahkan <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code>{" "}
          dan <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> ke <code>.env.local</code>.
        </p>
      )}

      <div className="photo-picker__grid">
        {/* Existing slots */}
        {slots.map((slot) => (
          <div key={slot.localUrl} className="photo-picker__slot">
            {/* Preview image */}
            <img
              src={slot.localUrl}
              alt="Pratinjau foto"
              className="photo-picker__preview"
              draggable={false}
            />

            {/* Uploading overlay */}
            {slot.kind === "uploading" && (
              <div className="photo-picker__overlay photo-picker__overlay--uploading">
                <LoaderCircle size={20} className="animate-spin text-white" />
                <span className="photo-picker__percent">{slot.percent}%</span>
              </div>
            )}

            {/* Error overlay */}
            {slot.kind === "error" && (
              <div className="photo-picker__overlay photo-picker__overlay--error">
                <button
                  type="button"
                  className="photo-picker__retry"
                  onClick={() => retrySlot(slot)}
                  title="Coba upload lagi"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              className="photo-picker__remove"
              onClick={() => removeSlot(slot.localUrl)}
              title="Hapus foto"
              disabled={disabled || slot.kind === "uploading"}
              aria-label="Hapus foto"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        {/* Add slot — hidden when at max */}
        {canAddMore && (
          <button
            type="button"
            className="photo-picker__add"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="Tambah foto"
          >
            <Image size={22} className="photo-picker__add-icon" />
            <span className="photo-picker__add-label">
              {slots.length === 0 ? "Tambah foto" : "Foto lagi"}
            </span>
            <span className="photo-picker__add-hint">{MAX_PHOTOS - slots.length} tersisa</span>
          </button>
        )}
      </div>

      <p className="photo-picker__caption">
        <Camera size={12} className="inline mr-1" />
        Pilih dari galeri atau ambil foto langsung — maks. {MAX_PHOTOS} foto.
      </p>

      {/* Hidden file input — accepts images, opens camera on mobile if supported */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="visually-hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleFiles(e.target.files)}
        onClick={(e) => {
          // Reset so same file can be re-selected after removal
          (e.target as HTMLInputElement).value = "";
        }}
      />
    </div>
  );
}

/** Shows a grid of thumbnail photos (read-only, for detail views). */
export function PhotoGrid({ urls }: { urls: string[] }) {
  if (!urls.length) return null;

  return (
    <div className="photo-grid" aria-label="Foto terlampir">
      {urls.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="photo-grid__item"
          aria-label={`Foto ${i + 1} — buka di tab baru`}
        >
          <img src={url} alt={`Foto laporan ${i + 1}`} className="photo-grid__img" loading="lazy" />
        </a>
      ))}
    </div>
  );
}
