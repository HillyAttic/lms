/**
 * Client-side utility for uploading files directly to Firebase Storage
 * via signed URLs. Bypasses Vercel's body size limit.
 */
import { getSignedThumbnailUrl } from "@/app/actions/repository-actions";

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Upload a file directly to Firebase Storage using a signed URL.
 * Uses XMLHttpRequest for real-time progress tracking.
 *
 * @param file - The file to upload
 * @param uploadUrl - Signed upload URL from /api/upload-url
 * @param contentType - MIME type (e.g. "application/zip", "video/mp4")
 * @param onProgress - Optional callback for upload progress
 * @returns Promise that resolves when upload completes
 */
export function uploadFileDirect(
  file: File,
  uploadUrl: string,
  contentType: string,
  onProgress?: ProgressCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.timeout = 600_000; // 10 minutes

    xhr.send(file);
  });
}

/**
 * Get a signed upload URL from the server.
 *
 * @param storagePath - Firebase Storage path (e.g. "scorm/course_123/source.zip")
 * @param contentType - MIME type of the file
 * @param userId - Admin user ID for auth check
 * @returns Promise with { uploadUrl, storagePath }
 */
export async function getSignedUploadUrl(
  storagePath: string,
  contentType: string,
  userId: string
): Promise<{ uploadUrl: string; storagePath: string }> {
  const response = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath, contentType, userId }),
  });

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.error) errorMessage = errorBody.error;
    } catch {
      const textBody = await response.text().catch(() => "");
      if (textBody) errorMessage = textBody;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to get upload URL");
  }

  return {
    uploadUrl: result.uploadUrl,
    storagePath: result.storagePath,
  };
}

/**
 * Upload a course thumbnail and return a URL the browser can actually load.
 * Storage objects are private, so the signed read URL is what gets stored on
 * the course document — a plain `storage.googleapis.com` URL would 403.
 *
 * Returns null when no thumbnail was picked, so callers can pass the result
 * straight through as `thumbnailUrl`.
 */
export async function uploadThumbnail(
  file: File | null,
  ownerId: string,
  userId: string
): Promise<string | null> {
  if (!file) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `thumbnails/${ownerId}/thumbnail.${ext}`;
  const { uploadUrl } = await getSignedUploadUrl(storagePath, file.type, userId);
  await uploadFileDirect(file, uploadUrl, file.type);

  const signed = await getSignedThumbnailUrl(storagePath);
  if (!signed.success || !signed.url) {
    throw new Error(signed.error || "Uploaded thumbnail could not be made viewable");
  }
  return signed.url;
}
