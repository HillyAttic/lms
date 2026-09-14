"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getRepositoryItemsPaginated,
  updateRepositoryItem,
  deleteRepositoryItem,
  batchDeleteRepositoryItems,
  getExtractedFiles,
  updateEntryPoint,
  getZipFileMetadata,
  getUploadProgress,
  cleanupUploadProgress,
  getSignedThumbnailUrl,
  type RepositoryContentItem,
  type RepositoryContentType,
} from "@/app/actions/repository-actions";
import PageHeader from "@/components/admin/page-header";
import Badge from "@/components/admin/badge";
import LoadingSpinner from "@/components/admin/loading-spinner";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import Pagination from "@/components/admin/pagination";
import SearchFilterBar from "@/components/admin/search-filter-bar";
import EmptyState from "@/components/admin/empty-state";
import VideoPlayer from "@/components/admin/video-player";
import { Edit, Trash2, Upload, X, Save, Eye, Play, Video, Sparkles, FileStack, FileArchive, Image as ImageIcon, Check } from "@/lib/icons";
import { getSignedUploadUrl, uploadFileDirect } from "@/lib/upload-utils";
import { processVideoCourse, deleteVideoCourse, batchDeleteVideoCourses } from "@/app/actions/video-course-actions";
import { processGameCourse, deleteGameCourse, batchDeleteGameCourses } from "@/app/actions/game-course-actions";
import { toast } from "react-toastify";
import type { ReactNode } from "react";

type CourseType = RepositoryContentType;

const COURSE_TYPE_OPTIONS: Array<{
  value: CourseType;
  label: string;
  icon: ReactNode;
}> = [
  { value: "scorm", label: "SCORM", icon: <FileStack className="h-4 w-4" /> },
  { value: "video", label: "Video", icon: <Video className="h-4 w-4" /> },
  { value: "game", label: "Game", icon: <Sparkles className="h-4 w-4" /> },
];

// Each type accepts a different source file and lands in a different collection.
const FILE_CONFIG: Record<
  CourseType,
  { accept: string; label: string; hint: string; extensions: RegExp }
> = {
  scorm: {
    accept: ".zip",
    label: "SCORM ZIP File *",
    hint: "Upload a SCORM package ZIP file (max 500MB)",
    extensions: /\.zip$/i,
  },
  video: {
    accept: ".mp4,video/mp4",
    label: "Video File (MP4) *",
    hint: "Upload an MP4 video file (max 2GB)",
    extensions: /\.mp4$/i,
  },
  game: {
    accept: ".zip",
    label: "Game Package (ZIP) *",
    hint: "ZIP containing HTML5 game files (max 500MB)",
    extensions: /\.zip$/i,
  },
};

// How each content type is labelled in the list. All three share one table.
const TYPE_META: Record<
  CourseType,
  { label: string; variant: "purple" | "blue" | "green"; subtitle: string }
> = {
  scorm: { label: "SCORM", variant: "purple", subtitle: "SCORM package" },
  video: { label: "Video", variant: "blue", subtitle: "Video course" },
  game: { label: "Game", variant: "green", subtitle: "Game course" },
};

// SCORM, video and game content all surface here — see getRepositoryItemsPaginated.
type RepositoryItem = RepositoryContentItem;

function TypeIcon({ type, className }: { type: CourseType; className?: string }) {
  if (type === "video") return <Video className={className} />;
  if (type === "game") return <Sparkles className={className} />;
  return <FileStack className={className} />;
}

/** Row artwork — the uploaded thumbnail, or a type icon when there isn't one. */
function ItemThumbnail({ item, className }: { item: RepositoryItem; className?: string }) {
  if (item.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.thumbnailUrl}
        alt=""
        className={`${className} shrink-0 rounded-lg object-cover`}
      />
    );
  }
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400`}
    >
      <TypeIcon type={item.type} className="h-5 w-5" />
    </div>
  );
}

/**
 * Click-or-drop file picker. The native input is hidden; this renders the affordance.
 * Dropped files bypass `accept`, so the extension check at submit (see validateForm) still gates it.
 */
function FilePicker({
  accept,
  file,
  onSelect,
  hint,
  icon,
  previewUrl,
}: {
  accept: string;
  file: File | null;
  onSelect: (file: File | null) => void;
  hint: string;
  icon: ReactNode;
  /** Existing artwork shown in place of the icon until a new file is picked. */
  previewUrl?: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const showPreview = !!previewUrl && !file && !dragging;

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onSelect(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-left transition-all active:translate-y-px ${
          dragging
            ? "border-purple-500 bg-purple-50 shadow-inner"
            : file
              ? "border-purple-300 bg-purple-50/60 shadow-sm"
              : "border-gray-300 bg-gray-50 shadow-sm hover:border-purple-400 hover:bg-purple-50 hover:shadow"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${
            file ? "bg-purple-600 text-white" : "border border-gray-200 bg-white text-purple-600"
          }`}
        >
          {file ? (
            <Check className="h-5 w-5" />
          ) : showPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl!} alt="" className="h-full w-full rounded-lg object-cover" />
          ) : (
            icon
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-900">
            {file ? file.name : showPreview ? "Current thumbnail — click to replace" : "Click to upload or drag & drop"}
          </span>
          <span className="block truncate text-xs text-gray-500">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(1)} MB — click to replace`
              : showPreview
                ? "Leave unchanged to keep this image"
                : hint}
          </span>
        </span>
        <span className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
          Browse
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
      {file && (
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            onSelect(null);
          }}
          className="mt-1 text-xs font-medium text-gray-500 hover:text-red-600"
        >
          Remove file
        </button>
      )}
    </div>
  );
}

export default function AdminRepositoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<CourseType | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<RepositoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<RepositoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Files viewer state
  const [extractedFiles, setExtractedFiles] = useState<Array<{ name: string; fullPath: string; isHtml: boolean }>>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedEntryPoint, setSelectedEntryPoint] = useState("");

  // Zip file metadata state
  const [zipMetadata, setZipMetadata] = useState<{ fileSize: number; updated?: string } | null>(null);
  const [loadingZipMeta, setLoadingZipMeta] = useState(false);

  // Upload progress tracking state
  const [uploadProgress, setUploadProgress] = useState<{
    status: string;
    phase: string;
    progress: number;
    uploadedFiles: number;
    totalFiles: number;
    currentBatch: number;
    totalBatches: number;
  } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    type: "scorm" as CourseType,
    name: "",
    description: "",
    features: "",
    interactivityLevel: "2",
    duration: "30",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const limit = 10;

  useEffect(() => {
    loadItems();
  }, [page, searchTerm, filterLevel, filterType]);

  const loadItems = async () => {
    setLoading(true);
    const result = await getRepositoryItemsPaginated(
      page,
      limit,
      searchTerm || undefined,
      filterLevel ?? undefined,
      filterType || undefined
    );
    if (result.success) {
      setItems(result.data as RepositoryItem[]);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
    }
    setLoading(false);
  };

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((itemId: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const result = await getUploadProgress(itemId);
        if (result.success && result.data) {
          setUploadProgress({
            status: result.data.status || "preparing",
            phase: result.data.phase || "",
            progress: result.data.progress ?? 0,
            uploadedFiles: result.data.uploadedFiles ?? 0,
            totalFiles: result.data.totalFiles ?? 0,
            currentBatch: result.data.currentBatch ?? 0,
            totalBatches: result.data.totalBatches ?? 0,
          });
          if (["complete", "error"].includes(result.data.status)) {
            stopPolling();
          }
        }
      } catch {
        // Silently retry on next interval
      }
    }, 500);
  }, [stopPolling]);

  // Uploads the optional thumbnail and returns a URL the browser can load (null when none).
  const uploadThumbnail = async (uploadId: string): Promise<string | null> => {
    if (!selectedThumbnail) return null;
    const thumbExt = selectedThumbnail.name.split(".").pop() || "jpg";
    const thumbPath = `thumbnails/${uploadId}/thumbnail.${thumbExt}`;
    const { uploadUrl: thumbUploadUrl } = await getSignedUploadUrl(
      thumbPath,
      selectedThumbnail.type,
      user?.uid || ""
    );
    await uploadFileDirect(selectedThumbnail, thumbUploadUrl, selectedThumbnail.type);

    // Storage objects are private, so a plain storage.googleapis.com URL would
    // 403 and the thumbnail would never render — store a signed read URL.
    const signed = await getSignedThumbnailUrl(thumbPath);
    if (!signed.success || !signed.url) {
      throw new Error(signed.error || "Uploaded thumbnail could not be made viewable");
    }
    return signed.url;
  };

  // Validation shared by all three course types.
  const validateUpload = (): string | null => {
    if (!formData.name.trim()) return "Name is required";
    if (!selectedFile) {
      return `${FILE_CONFIG[formData.type].label.replace(" *", "")} is required`;
    }
    if (!FILE_CONFIG[formData.type].extensions.test(selectedFile.name)) {
      return formData.type === "video"
        ? "Please select an MP4 video file"
        : "Please select a ZIP file";
    }
    return null;
  };

  const handleUpload = async () => {
    const validationError = validateUpload();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const file = selectedFile;
    if (!file) return; // unreachable after validateUpload, keeps types honest

    setFormError("");
    if (formData.type === "scorm") return uploadScormPackage(file);
    if (formData.type === "video") return uploadVideoCourse(file);
    return uploadGameCourse(file);
  };

  const uploadScormPackage = async (file: File) => {
    const itemId = `repo_${Date.now()}`;
    setUploading(true);
    setFormError("");
    setUploadProgress({
      status: "preparing",
      phase: "Preparing upload...",
      progress: 0,
      uploadedFiles: 0,
      totalFiles: 0,
      currentBatch: 0,
      totalBatches: 0,
    });

    try {
      const sourceZipPath = `repository/${itemId}/source.zip`;

      // Step 1: Get signed upload URL from generic endpoint
      console.log("Step 1: Getting signed upload URL...");
      setUploadProgress((prev) =>
        prev ? { ...prev, phase: "Preparing upload URL...", progress: 5 } : null
      );

      const { uploadUrl } = await getSignedUploadUrl(
        sourceZipPath,
        "application/zip",
        user?.uid || ""
      );

      // Step 2: Upload ZIP directly to Firebase Storage (bypasses Vercel)
      console.log("Step 2: Uploading file directly to storage...", {
        fileName: file.name,
        fileSize: file.size,
      });
      setUploadProgress((prev) =>
        prev ? { ...prev, phase: "Uploading ZIP... 0%", progress: 10 } : null
      );

      try {
        await uploadFileDirect(file, uploadUrl, "application/zip", (progress) => {
          // Map 0-100% upload progress to 10-90% of overall progress
          setUploadProgress((prev) =>
            prev
              ? { ...prev, phase: `Uploading ZIP... ${progress.percent}%`, progress: 10 + progress.percent * 0.8 }
              : null
          );
        });
        console.log("Direct upload to storage complete");
      } catch (uploadError: any) {
        setFormError(`File upload failed: ${uploadError.message}. Please try again.`);
        setUploading(false);
        return;
      }

      // Step 2.5: Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (selectedThumbnail) {
        console.log("Step 2.5: Uploading thumbnail...");
        setUploadProgress((prev) =>
          prev ? { ...prev, phase: "Uploading thumbnail...", progress: 88 } : null
        );
        thumbnailUrl = await uploadThumbnail(itemId);
      }

      // Step 3: Tell the server to process the uploaded ZIP
      console.log("Step 3: Processing uploaded ZIP...");
      setUploadProgress((prev) =>
        prev
          ? { ...prev, phase: "Processing ZIP on server...", progress: 90 }
          : null
      );

      // Start polling for server-side progress updates (extraction, file uploads)
      startPolling(itemId);

      const processResponse = await fetch("/api/repository/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          itemId,
          userId: user?.uid || "",
          name: formData.name,
          description: formData.description,
          features: formData.features,
          interactivityLevel: formData.interactivityLevel,
          duration: formData.duration,
          sourceZipPath,
          thumbnailUrl,
        }),
      });

      stopPolling();

      if (!processResponse.ok) {
        let errorMessage = `Server error: ${processResponse.status} ${processResponse.statusText}`;
        try {
          const errorBody = await processResponse.json();
          if (errorBody.error) errorMessage = errorBody.error;
        } catch {
          const textBody = await processResponse.text().catch(() => "");
          if (textBody) errorMessage = textBody;
        }
        setFormError(errorMessage);
        setUploading(false);
        return;
      }

      const result = await processResponse.json();
      console.log("Processing result:", result);

      if (result.success) {
        cleanupUploadProgress(itemId).catch(() => {});
        setShowUploadModal(false);
        resetForm();
        setUploadProgress(null);
        await loadItems();
      } else {
        setFormError(result.error || "Upload processing failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setFormError(error.message || "Upload failed. Please try again.");
    } finally {
      stopPolling();
      setUploading(false);
    }
  };

  // Video courses land in the `video_courses` collection, not the repository.
  const uploadVideoCourse = async (file: File) => {
    const courseId = `video_${Date.now()}`;
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const videoStoragePath = `videos/${courseId}/video.${ext}`;
    const contentType = file.type || `video/${ext}`;

    setUploading(true);
    setUploadProgress({
      status: "preparing",
      phase: "Preparing upload...",
      progress: 0,
      uploadedFiles: 0,
      totalFiles: 0,
      currentBatch: 0,
      totalBatches: 0,
    });

    try {
      const { uploadUrl } = await getSignedUploadUrl(
        videoStoragePath,
        contentType,
        user?.uid || ""
      );

      await uploadFileDirect(file, uploadUrl, contentType, (progress) => {
        setUploadProgress((prev) =>
          prev
            ? {
                ...prev,
                phase: `Uploading video... ${progress.percent}%`,
                progress: 5 + progress.percent * 0.85,
              }
            : null
        );
      });

      setUploadProgress((prev) =>
        prev ? { ...prev, phase: "Creating course record...", progress: 92 } : null
      );

      const thumbnailUrl = await uploadThumbnail(courseId);

      const result = await processVideoCourse(
        user?.uid || "",
        videoStoragePath,
        formData.name,
        formData.description,
        parseInt(formData.duration) || 0,
        [],
        [],
        contentType,
        file.size,
        thumbnailUrl,
        courseId
      );

      if (!result.success) {
        setFormError(
          ("error" in result && result.error) || "Failed to create video course"
        );
        return;
      }

      setShowUploadModal(false);
      resetForm();
      setUploadProgress(null);
      toast.success("Video course uploaded. Find it under Video Courses.");
    } catch (error: any) {
      console.error("Video upload error:", error);
      setFormError(error.message || "Video upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Game packages are extracted server-side into the `game_courses` collection.
  const uploadGameCourse = async (file: File) => {
    const courseId = `game_${Date.now()}`;
    const gameZipPath = `games/${courseId}/source.zip`;

    setUploading(true);
    setUploadProgress({
      status: "preparing",
      phase: "Preparing upload...",
      progress: 0,
      uploadedFiles: 0,
      totalFiles: 0,
      currentBatch: 0,
      totalBatches: 0,
    });

    try {
      const { uploadUrl } = await getSignedUploadUrl(
        gameZipPath,
        "application/zip",
        user?.uid || ""
      );

      await uploadFileDirect(file, uploadUrl, "application/zip", (progress) => {
        setUploadProgress((prev) =>
          prev
            ? {
                ...prev,
                phase: `Uploading ZIP... ${progress.percent}%`,
                progress: 5 + progress.percent * 0.6,
              }
            : null
        );
      });

      setUploadProgress((prev) =>
        prev ? { ...prev, phase: "Extracting game files on server...", progress: 70 } : null
      );

      const thumbnailUrl = await uploadThumbnail(courseId);

      const result = await processGameCourse(
        user?.uid || "",
        "uploaded",
        gameZipPath,
        "",
        formData.name,
        formData.description,
        parseInt(formData.duration) || 0,
        [],
        [],
        thumbnailUrl,
        courseId
      );

      if (!result.success) {
        setFormError(
          ("error" in result && result.error) || "Failed to create game course"
        );
        return;
      }

      setShowUploadModal(false);
      resetForm();
      setUploadProgress(null);
      toast.success("Game course created. Find it under Game Courses.");
    } catch (error: any) {
      console.error("Game upload error:", error);
      setFormError(error.message || "Game upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem || !formData.name) {
      setFormError("Name is required");
      return;
    }

    setEditSaving(true);
    setFormError("");
    try {
      // Thumbnail is optional — only touch it when a new file was picked.
      const thumbnailUrl = selectedThumbnail ? await uploadThumbnail(editingItem.id) : undefined;

      const result = await updateRepositoryItem(editingItem.id, user?.uid || "", {
        name: formData.name,
        description: formData.description,
        features: formData.features,
        interactivityLevel: parseFloat(formData.interactivityLevel),
        duration: parseInt(formData.duration),
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
      });

      if (result.success) {
        setShowEditModal(false);
        setEditingItem(null);
        resetForm();
        loadItems();
        toast.success("Repository item updated");
      } else {
        setFormError(result.error || "Update failed");
      }
    } catch (error: any) {
      setFormError(error.message || "Thumbnail upload failed. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;

    setDeleteLoading(true);
    try {
      const uid = user?.uid || "";
      const result =
        editingItem.type === "video"
          ? await deleteVideoCourse(editingItem.id, uid)
          : editingItem.type === "game"
            ? await deleteGameCourse(editingItem.id, uid)
            : await deleteRepositoryItem(editingItem.id, uid);

      if (result.success) {
        setShowDeleteConfirm(false);
        setEditingItem(null);
        await loadItems();
      } else {
        alert(result.error || "Delete failed");
      }
    } catch (error: any) {
      alert(error.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;

    setDeleteLoading(true);
    try {
      const uid = user?.uid || "";
      // Selections can span all three collections, each with its own delete action.
      const byType: Record<CourseType, string[]> = { scorm: [], video: [], game: [] };
      for (const id of selectedItems) {
        byType[items.find((item) => item.id === id)?.type || "scorm"].push(id);
      }

      const results = (
        await Promise.all([
          byType.scorm.length ? batchDeleteRepositoryItems(byType.scorm, uid) : null,
          byType.video.length ? batchDeleteVideoCourses(byType.video, uid) : null,
          byType.game.length ? batchDeleteGameCourses(byType.game, uid) : null,
        ])
      ).filter((result) => result !== null);

      const failed = results.find((result) => !result.success);
      if (failed) {
        alert(failed.error || "Batch delete failed");
        return;
      }

      setShowBatchDeleteConfirm(false);
      setSelectedItems([]);
      await loadItems();
    } catch (error: any) {
      alert(error.message || "Batch delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTypeChange = (type: CourseType) => {
    if (type === formData.type) return;
    setFormData((prev) => ({ ...prev, type }));
    // A package picked for one type is not a valid source for another.
    setSelectedFile(null);
    setFormError("");
  };

  const resetForm = () => {
    setFormData({
      type: "scorm",
      name: "",
      description: "",
      features: "",
      interactivityLevel: "2",
      duration: "30",
    });
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setFormError("");
    setUploadProgress(null);
  };

  const openEditModal = async (item: RepositoryItem) => {
    // Video and game courses have their own admin edit pages.
    if (item.type === "video") {
      router.push(`/admin/video-courses/${item.id}`);
      return;
    }
    if (item.type === "game") {
      router.push(`/admin/game-courses/${item.id}`);
      return;
    }

    setEditingItem(item);
    setFormData({
      type: "scorm",
      name: item.name,
      description: item.description || "",
      features: item.features || "",
      interactivityLevel: (item.interactivityLevel ?? 2).toString(),
      duration: (item.duration || 0).toString(),
    });
    setSelectedEntryPoint(item.entryPoint || "");
    // Don't inherit a file picked in the upload modal.
    setSelectedThumbnail(null);
    setFormError("");
    setShowEditModal(true);

    // Fetch zip file metadata
    setLoadingZipMeta(true);
    const metaResult = await getZipFileMetadata(item.id);
    if (metaResult.success) {
      setZipMetadata({
        fileSize: metaResult.fileSize || 0,
        updated: metaResult.updated,
      });
    } else {
      setZipMetadata(null);
    }
    setLoadingZipMeta(false);
  };

  const openFilesModal = async (item: RepositoryItem) => {
    setEditingItem(item);
    setLoadingFiles(true);
    setShowFilesModal(true);

    const result = await getExtractedFiles(item.id);
    if (result.success) {
      setExtractedFiles(result.files || []);
      setSelectedEntryPoint(result.currentEntryPoint || "story.html");
    }
    setLoadingFiles(false);
  };

  const handleUpdateEntryPoint = async () => {
    if (!editingItem || !selectedEntryPoint) return;

    const result = await updateEntryPoint(editingItem.id, user?.uid || "", selectedEntryPoint);
    if (result.success) {
      setShowFilesModal(false);
      setEditingItem(null);
      setExtractedFiles([]);
      loadItems();
    } else {
      setFormError(result.error || "Failed to update entry point");
    }
  };

  // SCORM rows have a file list to manage; video and game open a preview.
  const openView = (item: RepositoryItem) =>
    item.type === "scorm" ? openFilesModal(item) : setPreviewItem(item);

  const openDeleteConfirm = (item: RepositoryItem) => {
    setEditingItem(item);
    setShowDeleteConfirm(true);
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getInteractivityBadge = (level?: number) => {
    if (level === undefined || level === null) {
      // Video and game rows have no interactivity level.
      return <span className="text-sm text-gray-400">—</span>;
    }
    const colors: Record<number, string> = {
      1: "gray",
      2: "blue",
      2.5: "purple",
      3: "green",
    };
    return <Badge label={`Level ${level}`} variant={colors[level] as any || "gray"} />;
  };

  // Every row launches in its own player: SCORM via the package proxy, video on
  // the watch page, games through the launch proxy (or their external URL).
  const openItem = (item: RepositoryItem) => {
    if (item.type === "video") {
      window.open(`/watch/${item.id}`, "_blank");
    } else if (item.type === "game") {
      window.open(item.gameUrl || `/api/game/launch/${item.id}`, "_blank");
    } else {
      window.open(
        `/api/repository/launch/${item.id}/${item.entryPoint || "story.html"}`,
        "_blank"
      );
    }
  };

  const launchLabel = (type: CourseType) =>
    type === "video" ? "Play video" : type === "game" ? "Play game" : "Launch course";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repository Management"
        subtitle="Manage SCORM packages, video courses, and game courses"
        actions={
          <button
            onClick={() => {
              resetForm();
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Course
          </button>
        }
      />

      {/* Batch actions */}
      {selectedItems.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-purple-700">
            {selectedItems.length} item(s) selected
          </span>
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <SearchFilterBar
        searchPlaceholder="Search repository items..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[
          {
            label: "All Types",
            value: filterType,
            options: [
              { label: "All Types", value: "" },
              { label: "SCORM", value: "scorm" },
              { label: "Video", value: "video" },
              { label: "Game", value: "game" },
            ],
            onChange: (value) => {
              setFilterType(value as CourseType | "");
              setPage(1);
            },
          },
          {
            label: "All Levels",
            value: filterLevel?.toString() || "",
            options: [
              { label: "Level 1", value: "1" },
              { label: "Level 2", value: "2" },
              { label: "Level 2.5", value: "2.5" },
              { label: "Level 3", value: "3" },
            ],
            onChange: (value) => {
              setFilterLevel(value ? parseFloat(value) : null);
              setPage(1);
            },
          },
        ]}
      />

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Upload className="w-12 h-12" />}
          title="No repository items"
          description="Upload your first course to get started"
          action={
            <button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Course
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="mt-1 shrink-0 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <ItemThumbnail item={item} className="h-12 w-16" />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{TYPE_META[item.type].subtitle}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openItem(item)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
                      title={launchLabel(item.type)}
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openView(item)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                      title={item.type === "scorm" ? "View Files" : "View"}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(item)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    label={TYPE_META[item.type].label}
                    variant={TYPE_META[item.type].variant}
                  />
                  {getInteractivityBadge(item.interactivityLevel)}
                  <span className="text-xs text-gray-500">{formatDuration(item.duration)}</span>
                  {item.features && (
                    <span className="max-w-[200px] truncate text-xs text-gray-500" title={item.features}>
                      · {item.features}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === items.length && items.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Interactivity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Features
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.serialNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={TYPE_META[item.type].label}
                          variant={TYPE_META[item.type].variant}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ItemThumbnail item={item} className="h-10 w-16" />
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              {TYPE_META[item.type].subtitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getInteractivityBadge(item.interactivityLevel)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate text-sm text-gray-600" title={item.features}>
                          {item.features || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-md truncate text-sm text-gray-600" title={item.description}>
                          {item.description || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {formatDuration(item.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openItem(item)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
                            title={launchLabel(item.type)}
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openView(item)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                            title={
                              item.type === "scorm"
                                ? "View Files & Set Entry Point"
                                : "View"
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(item)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            // Handle limit change if needed
          }}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <h2 className="text-lg font-semibold sm:text-xl">Add Course</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COURSE_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleTypeChange(option.value)}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                        formData.type === option.value
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === "scorm" ? "Module Name *" : "Title *"}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder={formData.type === "scorm" ? "Enter module name" : "Enter title"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
              {/* Features and interactivity are SCORM-only concepts. */}
              {formData.type === "scorm" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features
                  </label>
                  <input
                    type="text"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="e.g., Interactive, Quiz, Animation"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {formData.type === "scorm" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interactivity Level *
                    </label>
                    <select
                      value={formData.interactivityLevel}
                      onChange={(e) => setFormData({ ...formData, interactivityLevel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="1">Level 1 - Read Only</option>
                      <option value="2">Level 2 - Limited</option>
                      <option value="2.5">Level 2.5 - Complex</option>
                      <option value="3">Level 3 - Full Simulation</option>
                    </select>
                  </div>
                )}
                <div className={formData.type === "scorm" ? "" : "sm:col-span-2"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    min="1"
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {FILE_CONFIG[formData.type].label}
                </label>
                <FilePicker
                  accept={FILE_CONFIG[formData.type].accept}
                  file={selectedFile}
                  onSelect={setSelectedFile}
                  hint={FILE_CONFIG[formData.type].hint}
                  icon={formData.type === "video" ? <Video className="h-5 w-5" /> : <FileArchive className="h-5 w-5" />}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Image
                </label>
                <FilePicker
                  accept="image/*"
                  file={selectedThumbnail}
                  onSelect={setSelectedThumbnail}
                  hint="Optional. Recommended size: 800x450px. Shows on the shared link page."
                  icon={<ImageIcon className="h-5 w-5" />}
                />
              </div>
            </div>
            <div className="space-y-4 border-t p-4 sm:p-6">
              {/* Upload progress bar */}
              {uploading && (
                <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  {/* Phase label + percentage */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-900 truncate mr-2">
                      {uploadProgress?.phase || "Preparing upload..."}
                    </span>
                    <span className="text-sm font-bold text-purple-600 flex-shrink-0">
                      {Math.round(uploadProgress?.progress ?? 0)}%
                    </span>
                  </div>

                  {/* Animated progress bar */}
                  <div className="w-full bg-purple-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(uploadProgress?.progress ?? 0, 100)}%` }}
                    />
                  </div>

                  {/* File + batch counts */}
                  {uploadProgress && uploadProgress.totalFiles > 0 && (
                    <div className="flex items-center justify-between text-xs text-purple-700">
                      <span>
                        {uploadProgress.uploadedFiles} / {uploadProgress.totalFiles} files
                      </span>
                      {uploadProgress.totalBatches > 1 && (
                        <span>
                          Batch {uploadProgress.currentBatch} / {uploadProgress.totalBatches}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Upload error */}
              {uploading && uploadProgress?.status === "error" && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  Upload failed: {uploadProgress.phase}
                </div>
              )}

              {/* General form error (hide when upload error is shown) */}
              {formError && !(uploading && uploadProgress?.status === "error") && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                    setUploadProgress(null);
                    stopPolling();
                  }}
                  disabled={uploading}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Package
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <h2 className="text-lg font-semibold sm:text-xl">Edit Repository Item</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features
                </label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interactivity Level *
                  </label>
                  <select
                    value={formData.interactivityLevel}
                    onChange={(e) => setFormData({ ...formData, interactivityLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="1">Level 1 - Read Only</option>
                    <option value="2">Level 2 - Limited</option>
                    <option value="2.5">Level 2.5 - Complex</option>
                    <option value="3">Level 3 - Full Simulation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Image
                </label>
                <FilePicker
                  accept="image/*"
                  file={selectedThumbnail}
                  onSelect={setSelectedThumbnail}
                  hint="Optional. Recommended size: 800x450px. Shows on the shared link page."
                  icon={<ImageIcon className="h-5 w-5" />}
                  previewUrl={editingItem.thumbnailUrl}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Entry Point</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Current: <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">{selectedEntryPoint}</span>
                    </p>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        openFilesModal(editingItem);
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      View extracted files & change entry point →
                    </button>
                  </div>
                </div>
              </div>

              {/* Uploaded ZIP File Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Uploaded ZIP File</p>
                    {loadingZipMeta ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                        <p className="text-sm text-gray-500">Loading file info…</p>
                      </div>
                    ) : zipMetadata ? (
                      <div className="mt-1.5 space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="text-gray-500">Size:</span>{" "}
                          <span className="font-medium">
                            {zipMetadata.fileSize >= 1024 * 1024
                              ? `${(zipMetadata.fileSize / (1024 * 1024)).toFixed(2)} MB`
                              : `${(zipMetadata.fileSize / 1024).toFixed(1)} KB`}
                          </span>
                        </p>
                        {zipMetadata.updated && (
                          <p className="text-sm text-gray-700">
                            <span className="text-gray-500">Updated:</span>{" "}
                            <span className="font-medium">
                              {new Date(zipMetadata.updated).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">ZIP info unavailable</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end sm:p-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Repository Item"
          message={`Are you sure you want to delete "${editingItem?.name}"? This will also delete all associated files from storage. This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setEditingItem(null);
          }}
          confirmText="Delete"
          variant="danger"
          loading={deleteLoading}
        />
      )}

      {/* Batch Delete Confirmation */}
      {showBatchDeleteConfirm && (
        <ConfirmDialog
          title="Delete Selected Items"
          message={`Are you sure you want to delete ${selectedItems.length} item(s)? This will also delete all associated files from storage. This action cannot be undone.`}
          onConfirm={handleBatchDelete}
          onCancel={() => setShowBatchDeleteConfirm(false)}
          confirmText="Delete All"
          variant="danger"
          loading={deleteLoading}
        />
      )}

      {/* Video / Game Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold sm:text-xl">
                  {previewItem.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {TYPE_META[previewItem.type].subtitle}
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {previewItem.type === "video" ? (
                previewItem.videoUrl ? (
                  <VideoPlayer
                    videoUrl={previewItem.videoUrl}
                    thumbnailUrl={previewItem.thumbnailUrl}
                    title={previewItem.name}
                  />
                ) : (
                  <p className="py-12 text-center text-sm text-gray-500">
                    No video file attached
                  </p>
                )
              ) : (
                <iframe
                  src={previewItem.gameUrl || `/api/game/launch/${previewItem.id}`}
                  title={previewItem.name}
                  className="h-[70vh] w-full rounded-lg border border-gray-200"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Files Modal */}
      {showFilesModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold sm:text-xl">Extracted Files</h2>
                <p className="mt-1 text-sm text-gray-500">{editingItem.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowFilesModal(false);
                  setEditingItem(null);
                  setExtractedFiles([]);
                  setFormError("");
                }}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {formError}
                </div>
              )}

              {loadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Entry Point Selector */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Entry Point File *
                    </label>
                    <select
                      value={selectedEntryPoint}
                      onChange={(e) => setSelectedEntryPoint(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">-- Select HTML file --</option>
                      {extractedFiles
                        .filter(file => file.isHtml)
                        .map(file => (
                          <option key={file.name} value={file.name}>
                            {file.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-2">
                      Current entry point: <span className="font-medium text-purple-700">{editingItem.entryPoint}</span>
                    </p>
                  </div>

                  {/* Files List */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      All Files ({extractedFiles.length})
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {extractedFiles.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No files found
                        </div>
                      ) : (
                        extractedFiles.map((file, index) => (
                          <div
                            key={index}
                            className={`px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors ${
                              file.name === selectedEntryPoint ? 'bg-purple-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {file.isHtml ? (
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate" title={file.name}>
                                  {file.name}
                                </p>
                                {file.isHtml && (
                                  <p className="text-xs text-gray-500">HTML Entry Point</p>
                                )}
                              </div>
                            </div>
                            {file.name === selectedEntryPoint && (
                              <span className="flex-shrink-0 ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end sm:p-6">
              <button
                onClick={() => {
                  setShowFilesModal(false);
                  setEditingItem(null);
                  setExtractedFiles([]);
                  setFormError("");
                }}
                className="rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEntryPoint}
                disabled={!selectedEntryPoint || selectedEntryPoint === editingItem.entryPoint}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Update Entry Point
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
