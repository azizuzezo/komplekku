/**
 * Client-side Cloudinary unsigned upload helper.
 *
 * Requires two env vars in apps/web/.env.local:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
 *
 * The upload preset must be set to "Unsigned" in Cloudinary dashboard.
 * (Settings → Upload → Upload Presets → Add Preset → Signing Mode = Unsigned)
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export class CloudinaryConfigError extends Error {
  constructor() {
    super(
      "Cloudinary belum dikonfigurasi. Tambahkan NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME dan " +
        "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ke apps/web/.env.local",
    );
    this.name = "CloudinaryConfigError";
  }
}

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

/**
 * Upload a single file to Cloudinary using unsigned upload.
 * Returns the secure_url of the uploaded asset.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new CloudinaryConfigError();
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "komplekku/laporan");

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText) as { secure_url: string };
        resolve(response.secure_url);
      } else {
        reject(new Error(`Upload gagal: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload gagal: koneksi bermasalah."));
    xhr.ontimeout = () => reject(new Error("Upload gagal: waktu habis."));

    xhr.send(formData);
  });
}

/** Check if Cloudinary is configured (both env vars are set). */
export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME) && Boolean(UPLOAD_PRESET);
}
