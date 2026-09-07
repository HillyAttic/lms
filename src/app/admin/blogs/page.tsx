"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getBlogsPaginated,
  batchDeleteBlogs,
} from "@/app/actions/blog-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Trash2, Eye, Edit, CheckSquare, FileText } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import SearchFilterBar from "@/components/admin/search-filter-bar";
import Pagination from "@/components/admin/pagination";
import Badge from "@/components/admin/badge";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import LoadingSpinner from "@/components/admin/loading-spinner";
import EmptyState from "@/components/admin/empty-state";
import { BLOG_TOPICS } from "@/types/BlogType";

interface Blog {
  id: string;
  title: string;
  shortDescription: string;
  topic: string;
  status: "published" | "draft";
  featureImage: string;
  author: { name: string; photo: string; title: string };
  date: string;
  createdAt: any;
}

export default function BlogsPage() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadBlogs();
  }, [page, limit, searchQuery, filterStatus, filterTopic, sortBy, sortOrder]);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const result = await getBlogsPaginated(
        page,
        limit,
        searchQuery || undefined,
        filterStatus || undefined,
        filterTopic || undefined,
        sortBy,
        sortOrder
      );
      if (result.success) {
        setBlogs(result.data as Blog[]);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        toast.error("Failed to load blogs");
      }
    } catch (error) {
      toast.error("Failed to load blogs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!user || selectedIds.length === 0) return;

    try {
      const result = await batchDeleteBlogs(selectedIds, user.uid);
      if (result.success) {
        toast.success(`${selectedIds.length} blog(s) deleted successfully`);
        setSelectedIds([]);
        setShowDeleteConfirm(false);
        loadBlogs();
      } else {
        toast.error(result.error || "Failed to delete blogs");
      }
    } catch (error) {
      toast.error("Failed to delete blogs");
      console.error(error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === blogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(blogs.map((b) => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
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

  return (
    <div>
      <PageHeader
        title="Blogs"
        subtitle="Manage your blog posts"
        actions={
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete ({selectedIds.length})
              </button>
            )}
            <Link
              href="/admin/blogs/new"
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Create Blog
            </Link>
          </div>
        }
      />

      <SearchFilterBar
        searchPlaceholder="Search blogs..."
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        filters={[
          {
            label: "Status",
            value: filterStatus,
            options: [
              { label: "All Status", value: "all" },
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
            ],
            onChange: (value) => {
              setFilterStatus(value);
              setPage(1);
            },
          },
          {
            label: "Topic",
            value: filterTopic,
            options: [
              { label: "All Topics", value: "all" },
              ...BLOG_TOPICS.map((t) => ({ label: t, value: t })),
            ],
            onChange: (value) => {
              setFilterTopic(value);
              setPage(1);
            },
          },
        ]}
      />

      {loading ? (
        <LoadingSpinner />
      ) : blogs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No blogs yet"
          description="Get started by writing your first blog post"
          action={
            <Link
              href="/admin/blogs/new"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Create Blog
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {blogs.map((blog) => (
              <div key={blog.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleSelect(blog.id)}
                      className="shrink-0 p-1 hover:bg-gray-200 rounded"
                    >
                      <CheckSquare
                        className={`h-5 w-5 ${
                          selectedIds.includes(blog.id)
                            ? "text-purple-600"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    {blog.featureImage ? (
                      <img
                        src={blog.featureImage}
                        alt={blog.title}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">
                        {blog.title}
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        {blog.shortDescription}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/admin/blogs/${blog.id}`}
                    className="shrink-0 rounded-lg p-2 text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    label={
                      blog.status === "published" ? "Published" : "Draft"
                    }
                    variant={
                      blog.status === "published" ? "success" : "warning"
                    }
                  />
                  {blog.topic && (
                    <Badge label={blog.topic} variant="blue" />
                  )}
                  <span className="text-xs text-gray-500">
                    {blog.author?.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    · {formatDate(blog.createdAt)}
                  </span>
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
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={toggleSelectAll}
                        className="rounded p-1 hover:bg-gray-200"
                      >
                        <CheckSquare
                          className={`h-5 w-5 ${
                            selectedIds.length === blogs.length
                              ? "text-purple-600"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </th>
                    <th
                      onClick={() => handleSort("title")}
                      className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    >
                      Title{" "}
                      {sortBy === "title" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("topic")}
                      className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    >
                      Topic{" "}
                      {sortBy === "topic" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    >
                      Status{" "}
                      {sortBy === "status" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Author
                    </th>
                    <th
                      onClick={() => handleSort("createdAt")}
                      className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    >
                      Created{" "}
                      {sortBy === "createdAt" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {blogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleSelect(blog.id)}
                          className="rounded p-1 hover:bg-gray-200"
                        >
                          <CheckSquare
                            className={`h-5 w-5 ${
                              selectedIds.includes(blog.id)
                                ? "text-purple-600"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {blog.featureImage ? (
                            <img
                              src={blog.featureImage}
                              alt={blog.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                              <FileText className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {blog.title}
                            </div>
                            <div className="max-w-xs truncate text-sm text-gray-500">
                              {blog.shortDescription}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {blog.topic ? (
                          <Badge label={blog.topic} variant="blue" />
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          label={
                            blog.status === "published"
                              ? "Published"
                              : "Draft"
                          }
                          variant={
                            blog.status === "published"
                              ? "success"
                              : "warning"
                          }
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {blog.author?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(blog.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/blogs/${blog.id}`}
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Blogs"
          message={`Are you sure you want to delete ${selectedIds.length} blog(s)? This will also remove all uploaded images. This action cannot be undone.`}
          onConfirm={handleBatchDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
