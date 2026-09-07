"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";
import { Sparkles, X, Upload, Globe } from "@/lib/icons";
import { processGameCourse } from "@/app/actions/game-course-actions";
import PageHeader from "@/components/admin/page-header";
import { getSignedUploadUrl, uploadFileDirect } from "@/lib/upload-utils";

const ACCEPTED_GAME_TYPES = [".zip"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export default function CreateGameCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [gameType, setGameType] = useState<"uploaded" | "url">("uploaded");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [gameUrl, setGameUrl] = useState("");
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleGameFileSelect = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_GAME_TYPES.includes(ext)) {
      toast.error("Please select a ZIP file");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 500MB");
      return;
    }
    setGameFile(file);
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleGameFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (gameType === "uploaded" && !gameFile) {
      toast.error("Game file is required");
      return;
    }

    if (gameType === "url" && !gameUrl.trim()) {
      toast.error("Game URL is required");
      return;
    }

    if (gameType === "url" && gameUrl.trim()) {
      try {
        new URL(gameUrl.trim());
      } catch {
        toast.error("Please enter a valid URL");
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    let gameZipPath: string | null = null;

    try {
      if (gameType === "uploaded" && gameFile) {
        // Step 1: Get signed upload URL for ZIP
        setUploadProgress(5);
        const courseId = `game_${Date.now()}`;
        gameZipPath = `games/${courseId}/source.zip`;
        const { uploadUrl } = await getSignedUploadUrl(
          gameZipPath,
          "application/zip",
          user.uid
        );

        // Step 2: Upload ZIP directly to Firebase Storage
        setUploadProgress(10);
        await uploadFileDirect(gameFile, uploadUrl, "application/zip", (progress) => {
          // Map 0-100% to 10-70% of overall progress
          setUploadProgress(10 + Math.round(progress.percent * 0.6));
        });
      }

      // Step 3: Process the uploaded game (or just metadata for URL type)
      setUploadProgress(75);
      const catsArr = categories.split(",").map((c) => c.trim()).filter(Boolean);
      const tagsArr = tags.split(",").map((t) => t.trim()).filter(Boolean);

      const result = await processGameCourse(
        user.uid,
        gameType,
        gameZipPath,
        gameUrl,
        title,
        description,
        parseInt(duration) || 0,
        catsArr,
        tagsArr,
        null
      );

      setUploadProgress(100);

      if (result.success) {
        toast.success("Game course created successfully!");
        router.push("/admin/game-courses");
      } else {
        toast.error(result.error || "Failed to create game course");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create game course");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  return (
    <div>
      <PageHeader
        title="Create Game Course"
        subtitle="Upload a new game course to the platform"
      />

      <div className="max-w-3xl rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game Type *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setGameType("uploaded")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  gameType === "uploaded"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                <Sparkles className="h-5 w-5" />
                Upload Game Package
              </button>
              <button
                type="button"
                onClick={() => setGameType("url")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  gameType === "url"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                <Globe className="h-5 w-5" />
                External Game URL
              </button>
            </div>
          </div>

          {/* Game File Upload or URL Input */}
          {gameType === "uploaded" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Package (ZIP) *
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? "border-purple-500 bg-purple-50"
                    : gameFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-purple-500"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleGameFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                {gameFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {gameFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(gameFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGameFile(null);
                      }}
                      className="ml-4 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Drag and drop your game package here, or click to select
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      ZIP file containing HTML5 game files (max 500MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game URL *
              </label>
              <input
                type="url"
                value={gameUrl}
                onChange={(e) => setGameUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="https://example.com/game"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the URL of your hosted HTML5 game
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {uploadProgress < 75 ? "Uploading..." : "Processing game..."}
                </span>
                <span className="text-purple-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

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
              {thumbnailPreview ? (
                <>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnail(null);
                      setThumbnailPreview(null);
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

          {/* Duration */}
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create Game Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
