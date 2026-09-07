"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBlog } from "@/app/actions/blog-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Edit, Image, X } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import { BLOG_TOPICS } from "@/types/BlogType";

export default function NewBlogPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("draft");
  const [featureImage, setFeatureImage] = useState("");
  const [authorName, setAuthorName] = useState(user?.displayName || "");
  const [authorTitle, setAuthorTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }

    if (!shortDescription.trim()) {
      toast.error("Please enter a short description");
      return;
    }

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

      const result = await createBlog({
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        content: contentBlocks,
        topic,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        featureImage,
        author: {
          name: authorName || "Admin",
          photo: user.photoURL || "",
          title: authorTitle || "Author",
        },
        status,
        userId: user.uid,
      });

      if (result.success) {
        toast.success("Blog created successfully!");
        router.push("/admin/blogs");
      } else {
        toast.error(result.error || "Failed to create blog");
      }
    } catch (error) {
      toast.error("Failed to create blog");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Blog"
        subtitle="Write a new blog post"
      />

      <div className="max-w-3xl rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feature Image URL */}
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
                <div className="flex items-center gap-3">
                  <Image className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Enter an image URL below
                  </span>
                </div>
              )}
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
              placeholder="Enter blog title"
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
              placeholder="Brief summary of the blog post"
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
                placeholder="Author name"
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
                  Creating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Create Blog
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
