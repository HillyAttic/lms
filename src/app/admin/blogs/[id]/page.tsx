"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getBlogById,
  updateBlog,
  deleteBlog,
} from "@/app/actions/blog-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Trash2, Save, ArrowLeft, Image, X } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import LoadingSpinner from "@/components/admin/loading-spinner";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import { BLOG_TOPICS } from "@/types/BlogType";

interface Blog {
  id: string;
  title: string;
  slug: { current: string };
  shortDescription: string;
  content: any[];
  topic: string;
  tags: string[];
  featureImage: string;
  author: { name: string; photo: string; title: string };
  date: string;
  status: "published" | "draft";
  createdAt: any;
}

export default function BlogEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("draft");
  const [featureImage, setFeatureImage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");

  useEffect(() => {
    loadBlog();
  }, [blogId]);

  const loadBlog = async () => {
    try {
      const result = await getBlogById(blogId);
      if (result.success && result.data) {
        const blogData = result.data as Blog;
        setBlog(blogData);
        setTitle(blogData.title);
        setShortDescription(blogData.shortDescription || "");
        setFeatureImage(blogData.featureImage || "");
        setTopic(blogData.topic || "");
        setTags(blogData.tags?.join(", ") || "");
        setStatus(blogData.status || "draft");
        setAuthorName(blogData.author?.name || "");
        setAuthorTitle(blogData.author?.title || "");

        // Convert content blocks back to text
        if (blogData.content && Array.isArray(blogData.content)) {
          const text = blogData.content
            .map((block: any) =>
              block.children?.map((c: any) => c.text).join("") || ""
            )
            .join("\n\n");
          setContent(text);
        }
      } else {
        toast.error("Blog not found");
        router.push("/admin/blogs");
      }
    } catch (error) {
      toast.error("Failed to load blog");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Convert content string to blocks array
      const contentBlocks = content
        .split("\n\n")
        .filter((block) => block.trim())
        .map((block) => ({
          _type: "block",
          children: [{ _type: "span", text: block.trim() }],
        }));

      const result = await updateBlog(blogId, user.uid, {
        title,
        shortDescription,
        content: contentBlocks,
        topic,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        featureImage,
        author: {
          name: authorName || "Admin",
          photo: blog?.author?.photo || "",
          title: authorTitle || "Author",
        },
        status,
      });

      if (result.success) {
        toast.success("Blog updated successfully");
        router.push("/admin/blogs");
      } else {
        toast.error(result.error || "Failed to update blog");
      }
    } catch (error) {
      toast.error("Failed to update blog");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      const result = await deleteBlog(blogId, user.uid);
      if (result.success) {
        toast.success("Blog deleted successfully");
        router.push("/admin/blogs");
      } else {
        toast.error(result.error || "Failed to delete blog");
      }
    } catch (error) {
      toast.error("Failed to delete blog");
      console.error(error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!blog) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Edit Blog"
        subtitle={blog.title}
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
              onClick={() => router.push("/admin/blogs")}
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
          {/* Feature Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feature Image URL
            </label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {featureImage ? (
                <div className="relative">
                  <img
                    src={featureImage}
                    alt="Feature preview"
                    className="w-40 h-28 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setFeatureImage("")}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <Image className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload</span>
                </label>
              )}
              <div className="text-sm text-gray-500">
                <p>Enter an image URL</p>
                <p>Supported formats: JPG, PNG, GIF</p>
              </div>
            </div>
            <input
              type="url"
              value={featureImage}
              onChange={(e) => setFeatureImage(e.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Blog Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Blog Title *
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

          {/* Short Description */}
          <div>
            <label
              htmlFor="shortDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Short Description *
            </label>
            <textarea
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
          </div>

          {/* Topic */}
          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Topic *
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            >
              <option value="">Select a topic</option>
              {BLOG_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
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
                setStatus(e.target.value as "published" | "draft")
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
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

          {/* Author */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="authorName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Author Name
              </label>
              <input
                id="authorName"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label
                htmlFor="authorTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Author Title
              </label>
              <input
                id="authorTitle"
                type="text"
                value={authorTitle}
                onChange={(e) => setAuthorTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="e.g. EdTech Specialist"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-sm"
              placeholder="Write your blog content here. Separate paragraphs with blank lines."
            />
          </div>

          {/* Blog Info (read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Blog Info
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-gray-500">Slug:</span>{" "}
                <span className="text-gray-900">{blog.slug?.current}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>{" "}
                <span className="text-gray-900">
                  {blog.createdAt?.seconds
                    ? new Date(
                        blog.createdAt.seconds * 1000
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
              onClick={() => router.push("/admin/blogs")}
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
          title="Delete Blog"
          message="Are you sure you want to delete this blog? This will also remove all uploaded images. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
