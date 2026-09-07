"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCourseById } from "@/app/actions/course-actions";
import { updateCourse, deleteCourse, uploadThumbnail } from "@/app/actions/scorm-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Trash2, Save, ArrowLeft, Image, X } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import LoadingSpinner from "@/components/admin/loading-spinner";
import ConfirmDialog from "@/components/admin/confirm-dialog";

interface Course {
  id: string;
  title: string;
  description: string;
  features: string;
  interactivityLevel: number;
  duration: number;
  status: "active" | "draft";
  scormVersion: string;
  thumbnailUrl: string | null;
  categories: string[];
  tags: string[];
  objectives: string;
  prerequisites: string;
  targetAudience: string;
  createdAt: any;
}

export default function CourseEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [interactivityLevel, setInteractivityLevel] = useState<number>(1);
  const [duration, setDuration] = useState<number>(30);
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [objectives, setObjectives] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const result = await getCourseById(courseId);
      if (result.success && result.data) {
        const courseData = result.data as Course;
        setCourse(courseData);
        setTitle(courseData.title);
        setDescription(courseData.description || "");
        setFeatures(courseData.features || "");
        setInteractivityLevel(courseData.interactivityLevel);
        setDuration(courseData.duration);
        setStatus(courseData.status);
        setCategories(courseData.categories?.join(", ") || "");
        setTags(courseData.tags?.join(", ") || "");
        setObjectives(courseData.objectives || "");
        setPrerequisites(courseData.prerequisites || "");
        setTargetAudience(courseData.targetAudience || "");
        setThumbnailPreview(courseData.thumbnailUrl);
      } else {
        toast.error("Course not found");
        router.push("/admin/courses");
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
        const thumbResult = await uploadThumbnail(courseId, thumbnail, user.uid);
        if (!thumbResult.success) {
          toast.error("Failed to upload thumbnail");
          setSaving(false);
          return;
        }
      }

      // Update course
      const result = await updateCourse(courseId, user.uid, {
        title,
        description,
        features,
        interactivityLevel,
        duration,
        status,
        categories: categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        objectives,
        prerequisites,
        targetAudience,
      });

      if (result.success) {
        toast.success("Course updated successfully");
        router.push("/admin/courses");
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
      const result = await deleteCourse(courseId, user.uid);
      if (result.success) {
        toast.success("Course deleted successfully");
        router.push("/admin/courses");
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
        title="Edit Course"
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
              onClick={() => router.push("/admin/courses")}
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
                <p>Supported formats: JPG, PNG, GIF</p>
              </div>
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
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "draft")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
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

          {/* Objectives, Prerequisites, Target Audience */}
          <div>
            <label htmlFor="objectives" className="block text-sm font-medium text-gray-700 mb-2">
              Learning Objectives
            </label>
            <textarea
              id="objectives"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="What learners will achieve"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700 mb-2">
                Prerequisites
              </label>
              <input
                id="prerequisites"
                type="text"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Required knowledge"
              />
            </div>
            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <input
                id="targetAudience"
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Who this course is for"
              />
            </div>
          </div>

          {/* SCORM Info (read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">SCORM Package Info</h3>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-gray-500">Version:</span>{" "}
                <span className="text-gray-900">{course.scormVersion}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>{" "}
                <span className="text-gray-900">
                  {course.createdAt?.seconds
                    ? new Date(course.createdAt.seconds * 1000).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/courses")}
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
          message="Are you sure you want to delete this course? This will also remove all uploaded files. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
