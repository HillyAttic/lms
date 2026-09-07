"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadScormPackage } from "@/app/actions/scorm-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Upload, FileArchive, X, Image } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [interactivityLevel, setInteractivityLevel] = useState<number>(1);
  const [duration, setDuration] = useState<number>(30);
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        toast.error("Please upload a .zip file");
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error(`File size (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB) exceeds 200MB limit`);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setThumbnail(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbnailPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".zip")) {
        toast.error("Please upload a .zip file");
        return;
      }
      if (droppedFile.size > MAX_FILE_SIZE) {
        toast.error(`File size (${(droppedFile.size / 1024 / 1024).toFixed(1)}MB) exceeds 200MB limit`);
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a SCORM package (.zip file)");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a course title");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("userId", user?.uid || "");
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("features", features);
      formData.append("interactivityLevel", interactivityLevel.toString());
      formData.append("duration", duration.toString());
      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      // Simulate progress (server actions don't support real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 300);

      const result = await uploadScormPackage(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        toast.success("SCORM package uploaded successfully!");
        setTimeout(() => {
          router.push("/admin/courses");
        }, 500);
      } else {
        toast.error(result.error || "Upload failed");
        setUploadProgress(0);
      }
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
      console.error(error);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div>
      <PageHeader
        title="Upload SCORM Package"
        subtitle="Upload a new SCORM course package to the platform"
      />

      <div className="max-w-2xl rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SCORM Package (.zip) *
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? "border-purple-500 bg-purple-50"
                  : file
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-purple-500"
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileArchive className="w-10 h-10 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">
                    Drag and drop your .zip file here, or{" "}
                    <label className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium">
                      browse
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum file size: 200MB • Only .zip files accepted
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image
            </label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-32 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnail(null);
                      setThumbnailPreview(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <Image className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-sm text-gray-500">
                Optional. Recommended size: 800x450px
              </p>
            </div>
          </div>

          {/* Course Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter course title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Brief description of the course"
            />
          </div>

          {/* Features */}
          <div>
            <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-2">
              Features
            </label>
            <textarea
              id="features"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Key features (one per line)"
            />
          </div>

          {/* Categories and Tags */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <input
                id="categories"
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Comma-separated categories"
              />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Comma-separated tags"
              />
            </div>
          </div>

          {/* Interactivity Level & Duration */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="interactivity" className="block text-sm font-medium text-gray-700 mb-2">
                Level of Interactivity
              </label>
              <select
                id="interactivity"
                value={interactivityLevel}
                onChange={(e) => setInteractivityLevel(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value={1}>Level 1 - Read Only</option>
                <option value={2}>Level 2 - Limited Interaction</option>
                <option value={2.5}>Level 2.5 - Complex Interaction</option>
                <option value={3}>Level 3 - Full Simulation</option>
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading and processing SCORM package...</span>
                <span className="text-purple-600 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {uploadProgress < 30
                  ? "Uploading file..."
                  : uploadProgress < 60
                  ? "Extracting SCORM package..."
                  : uploadProgress < 90
                  ? "Processing course content..."
                  : "Finalizing..."}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              disabled={uploading}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload SCORM
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
