"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createPublicCourse,
  uploadPublicCourseThumbnail,
} from "@/app/actions/public-course-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Upload, X, Image, PlusIcon } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";

export default function NewPublicCoursePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [status, setStatus] = useState<"Ongoing" | "Completed">("Ongoing");
  const [slug, setSlug] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [overview, setOverview] = useState("");
  const [duration, setDuration] = useState<number>(0);
  const [lessonsCount, setLessonsCount] = useState<number>(0);
  const [isCertificationProvide, setIsCertificationProvide] = useState(false);
  const [totalLearners, setTotalLearners] = useState<number>(0);

  // Thumbnail state
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Submission state
  const [saving, setSaving] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a course title");
      return;
    }

    setSaving(true);

    try {
      // Parse overview from textarea (one item per line)
      const overviewItems = overview
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      // Create course
      const result = await createPublicCourse(
        {
          title: title.trim(),
          shortDescription: shortDescription.trim(),
          instructorName: instructorName.trim(),
          price,
          discountPrice,
          status,
          slug: slug.trim() || undefined,
          level,
          overview: overviewItems,
          duration,
          lessonsCount,
          isCertificationProvide,
          totalLearners,
        },
        user.uid
      );

      if (!result.success) {
        toast.error(result.error || "Failed to create course");
        setSaving(false);
        return;
      }

      const courseId = result.data?.id;

      // Upload thumbnail if provided
      if (thumbnail && courseId) {
        const thumbResult = await uploadPublicCourseThumbnail(
          courseId,
          thumbnail,
          user.uid
        );
        if (!thumbResult.success) {
          toast.warning("Course created but thumbnail upload failed");
        }
      }

      toast.success("Course created successfully!");
      router.push("/admin/public-courses");
    } catch (error: any) {
      toast.error(error.message || "Failed to create course");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Public Course"
        subtitle="Create a new course for the public website"
      />

      <div className="max-w-3xl rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-40 h-28 object-cover rounded-lg border"
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
                <label className="w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
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
              <div className="text-sm text-gray-500">
                <p>Recommended size: 800x450px</p>
                <p>Max size: 5MB</p>
              </div>
            </div>
          </div>

          {/* Course Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Course Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter course title"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              URL Slug
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="auto-generated-from-title"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to auto-generate from title
            </p>
          </div>

          {/* Short Description */}
          <div>
            <label
              htmlFor="shortDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Short Description
            </label>
            <textarea
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Brief description shown in course cards"
            />
          </div>

          {/* Instructor Name */}
          <div>
            <label
              htmlFor="instructorName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Instructor Name
            </label>
            <input
              id="instructorName"
              type="text"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter instructor name"
            />
          </div>

          {/* Price and Discount Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label
                htmlFor="discountPrice"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Discount Price ($)
              </label>
              <input
                id="discountPrice"
                type="number"
                value={discountPrice}
                onChange={(e) =>
                  setDiscountPrice(parseFloat(e.target.value) || 0)
                }
                min={0}
                step={0.01}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Status and Level */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "Ongoing" | "Completed")
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="level"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Level
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Beginner to Advanced">
                  Beginner to Advanced
                </option>
              </select>
            </div>
          </div>

          {/* Duration and Lessons Count */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min={0}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label
                htmlFor="lessonsCount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Number of Lessons
              </label>
              <input
                id="lessonsCount"
                type="number"
                value={lessonsCount}
                onChange={(e) =>
                  setLessonsCount(parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Total Learners and Certification */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="totalLearners"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Total Learners
              </label>
              <input
                id="totalLearners"
                type="number"
                value={totalLearners}
                onChange={(e) =>
                  setTotalLearners(parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCertificationProvide}
                  onChange={(e) =>
                    setIsCertificationProvide(e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Provides Certification
                </span>
              </label>
            </div>
          </div>

          {/* Overview */}
          <div>
            <label
              htmlFor="overview"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Course Overview
            </label>
            <textarea
              id="overview"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter one overview point per line"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter each point on a new line
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/public-courses")}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <PlusIcon />
                  Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
