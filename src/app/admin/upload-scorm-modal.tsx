"use client";

import { useState, FormEvent } from "react";
import { processScormPackage } from "@/app/actions/scorm-actions";
import { toast } from "react-toastify";
import { X, Upload, FileArchive } from "@/lib/icons";
import { useAuth } from "@/lib/auth-context";
import { getSignedUploadUrl, uploadFileDirect } from "@/lib/upload-utils";

interface UploadScormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadScormModal({ onClose, onSuccess }: UploadScormModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [interactivityLevel, setInteractivityLevel] = useState<number>(1);
  const [duration, setDuration] = useState<number>(30);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        toast.error("Please upload a .zip file");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".zip")) {
        toast.error("Please upload a .zip file");
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
      // Step 1: Get signed upload URL
      setUploadProgress(10);
      const sourceZipPath = `scorm/course_${Date.now()}/source.zip`;
      const { uploadUrl } = await getSignedUploadUrl(
        sourceZipPath,
        "application/zip",
        user?.uid || ""
      );

      // Step 2: Upload file directly to Firebase Storage
      setUploadProgress(20);
      await uploadFileDirect(file, uploadUrl, "application/zip", (progress) => {
        // Map 0-100% to 20-80% of overall progress
        setUploadProgress(20 + Math.round(progress.percent * 0.6));
      });

      // Step 3: Process the uploaded package
      setUploadProgress(85);
      const result = await processScormPackage(
        user?.uid || "",
        sourceZipPath,
        title,
        description,
        features,
        interactivityLevel,
        duration
      );

      setUploadProgress(100);

      if (result.success) {
        toast.success("SCORM package uploaded successfully!");
        onSuccess();
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Upload SCORM Package</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SCORM Package (.zip)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileArchive className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
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
                  <p className="text-xs text-gray-500 mt-1">Maximum file size: 500MB</p>
                </div>
              )}
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

          {/* Interactivity Level & Duration */}
          <div className="grid grid-cols-2 gap-4">
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
                <span className="text-gray-600">
                  {uploadProgress < 80 ? "Uploading file..." : "Processing package..."}
                </span>
                <span className="text-purple-600 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Uploading..." : "Upload SCORM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
