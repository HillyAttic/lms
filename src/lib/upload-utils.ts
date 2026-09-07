/**
 * Client-side utility for uploading files directly to Firebase Storage
 * via signed URLs. Bypasses Vercel's body size limit.
 */

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
    xhr.setRequestHeader("x-upload-content-type", contentType);

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

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to get upload URL");
  }

  return {
    uploadUrl: result.uploadUrl,
    storagePath: result.storagePath,
  };
}
