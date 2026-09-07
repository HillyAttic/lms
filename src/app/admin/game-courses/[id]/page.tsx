"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";
import { Sparkles, X, Save, Trash2, ArrowLeft, Globe } from "@/lib/icons";
import {
  getGameCourseById,
  updateGameCourse,
  deleteGameCourse,
} from "@/app/actions/game-course-actions";
import GamePlayer from "@/components/admin/game-player";
import PageHeader from "@/components/admin/page-header";
import LoadingSpinner from "@/components/admin/loading-spinner";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import Badge from "@/components/admin/badge";

export default function GameCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useAuth();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("draft");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [gameType, setGameType] = useState<"uploaded" | "url">("uploaded");
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [gameStoragePath, setGameStoragePath] = useState("");
  const [gameEntryFile, setGameEntryFile] = useState("index.html");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<any>(null);

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const result = await getGameCourseById(courseId);
      if (result.success && result.data) {
        const course = result.data;
        setTitle(course.title || "");
        setDescription(course.description || "");
        setDuration(course.duration?.toString() || "");
        setStatus(course.status || "draft");
        setCategories(course.categories?.join(", ") || "");
        setTags(course.tags?.join(", ") || "");
        setGameType(course.gameType || "uploaded");
        setGameUrl(course.gameUrl || null);
        setGameStoragePath(course.gameStoragePath || "");
        setGameEntryFile(course.gameEntryFile || "index.html");
        setThumbnailUrl(course.thumbnailUrl || null);
        setCreatedAt(course.createdAt);
      } else {
        toast.error("Course not found");
        router.push("/admin/game-courses");
      }
    } catch (error) {
      toast.error("Failed to load course");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setThumbnail(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const result = await updateGameCourse(courseId, user.uid, {
        title: title.trim(),
        description: description.trim(),
        duration: parseInt(duration) || 0,
        status,
        categories: categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });

      if (result.success) {
        toast.success("Course updated successfully!");
      } else {
        toast.error(result.error || "Failed to update course");
      }
    } catch (error) {
      toast.error("Failed to update course");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const result = await deleteGameCourse(courseId, user.uid);
      if (result.success) {
        toast.success("Course deleted successfully!");
        router.push("/admin/game-courses");
      } else {
        toast.error(result.error || "Failed to delete course");
      }
    } catch (error) {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Build game preview URL
  const getGamePreviewUrl = () => {
    if (gameType === "url" && gameUrl) {
      return gameUrl;
    }
    if (gameType === "uploaded" && gameStoragePath) {
      // For uploaded games, we'd need to serve files through an API route
      // For now, return null as we need an API route to serve the files
      return null;
    }
    return null;
  };

  const gamePreviewUrl = getGamePreviewUrl();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Edit Game Course"
        subtitle={title}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 border border-gray-300 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 border border-red-300 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        {/* Game Preview */}
        {gamePreviewUrl && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Game Preview
            </h3>
            <GamePlayer gameUrl={gamePreviewUrl} title={title} />
          </div>
        )}

        {/* Edit Form */}
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            {/* Game Type Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                {gameType === "url" ? (
                  <Globe className="h-5 w-5 text-purple-600" />
                ) : (
                  <Sparkles className="h-5 w-5 text-purple-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {gameType === "url" ? "External Game URL" : "Uploaded Game"}
                  </p>
                  {gameType === "url" && gameUrl && (
                    <p className="text-sm text-gray-500 truncate max-w-md">
                      {gameUrl}
                    </p>
                  )}
                  {gameType === "uploaded" && (
                    <p className="text-sm text-gray-500">
                      Entry point: {gameEntryFile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Image
              </label>
              <div
                className="relative w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleThumbnailSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                {thumbnailPreview || thumbnailUrl ? (
                  <>
                    <img
                      src={thumbnailPreview || thumbnailUrl || ""}
                      alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnail(null);
                        setThumbnailPreview(null);
                        setThumbnailUrl(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-gray-500 text-center">
                      Click to upload
                      <br />
                      800x450px recommended
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Enter course title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Enter course description"
              />
            </div>

            {/* Status and Duration */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "active" | "draft")
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Enter duration in minutes"
                  min="0"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <input
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Comma-separated categories"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Comma-separated tags"
              />
            </div>

            {/* Course Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Course Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>{" "}
                  <span className="text-gray-900">
                    {formatDate(createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Course ID:</span>{" "}
                  <span className="text-gray-900 font-mono text-xs">
                    {courseId}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Game Course"
        message="Are you sure you want to delete this course? This action cannot be undone and will remove all associated files."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
