"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getPublicCourseById,
  updatePublicCourse,
  deletePublicCourse,
  uploadPublicCourseThumbnail,
} from "@/app/actions/public-course-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Save, ArrowLeft, Image, X, Trash2 } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import LoadingSpinner from "@/components/admin/loading-spinner";
import ConfirmDialog from "@/components/admin/confirm-dialog";

interface PublicCourse {
  id: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  instructor: { name: string };
  price: number;
  discountPrice: number;
  status: "Ongoing" | "Completed";
  slug: string;
  level: string;
  overview: string[];
  duration: number;
  lessonsCount: number;
  isCertificationProvide: boolean;
  totalLearners: number;
  createdAt: any;
  updatedAt: any;
}

export default function EditPublicCoursePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const result = await getPublicCourseById(courseId);
      if (result.success && result.data) {
        const courseData = result.data as PublicCourse;
        setCourse(courseData);
        setTitle(courseData.title);
        setShortDescription(courseData.shortDescription || "");
        setInstructorName(courseData.instructor?.name || "");
        setPrice(courseData.price || 0);
        setDiscountPrice(courseData.discountPrice || 0);
        setStatus(courseData.status || "Ongoing");
        setSlug(courseData.slug || "");
        setLevel(courseData.level || "Beginner");
        setOverview(
          Array.isArray(courseData.overview) ? courseData.overview.join("\n") : ""
        );
        setDuration(courseData.duration || 0);
        setLessonsCount(courseData.lessonsCount || 0);
        setIsCertificationProvide(courseData.isCertificationProvide || false);
        setTotalLearners(courseData.totalLearners || 0);
        setThumbnailPreview(courseData.thumbnailUrl);
      } else {
        toast.error("Course not found");
        router.push("/admin/public-courses");
      }
    } catch (error) {
      toast.error("Failed to load course");
      console.error(error);
    } finally {
      setLoading(false);
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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Upload thumbnail if changed
      if (thumbnail) {
        const thumbResult = await uploadPublicCourseThumbnail(
          courseId,
          thumbnail,
          user.uid
        );
        if (!thumbResult.success) {
          toast.error("Failed to upload thumbnail");
          setSaving(false);
          return;
        }
      }

      // Parse overview from textarea (one item per line)
      const overviewItems = overview
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      // Update course
      const result = await updatePublicCourse(
        courseId,
        {
          title: title.trim(),
          shortDescription: shortDescription.trim(),
          instructorName: instructorName.trim(),
          price,
          discountPrice,
          status,
          slug: slug.trim(),
          level,
          overview: overviewItems,
          duration,
          lessonsCount,
          isCertificationProvide,
          totalLearners,
        },
        user.uid
      );

      if (result.success) {
        toast.success("Course updated successfully");
        router.push("/admin/public-courses");
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

    try {
      const result = await deletePublicCourse(courseId, user.uid);
      if (result.success) {
        toast.success("Course deleted successfully");
        router.push("/admin/public-courses");
      } else {
        toast.error(result.error || "Failed to delete course");
      }
    } catch (error) {
      toast.error("Failed to delete course");
      console.error(error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!course) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Edit Public Course"
        subtitle={course.title}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Delete
            </button>
            <button
              onClick={() => router.push("/admin/public-courses")}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        }
      />

      <div className="max-w-3xl rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Thumbnail */}
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
                      setThumbnailPreview(course.thumbnailUrl);
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
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
            />
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

          {/* Course Info (read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Course Info
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-gray-500">Created:</span>{" "}
                <span className="text-gray-900">
                  {course.createdAt?.seconds
                    ? new Date(
                        course.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>{" "}
                <span className="text-gray-900">
                  {course.updatedAt?.seconds
                    ? new Date(
                        course.updatedAt.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
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
              disabled={saving}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Course"
          message="Are you sure you want to delete this course? This will also remove all uploaded thumbnails. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
