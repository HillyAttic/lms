"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";
import {
  Video,
  PlusIcon,
  Eye,
  Trash2,
  CheckSquare,
  Search,
} from "@/lib/icons";
import {
  getVideoCoursesPaginated,
  batchDeleteVideoCourses,
} from "@/app/actions/video-course-actions";
import PageHeader from "@/components/admin/page-header";
import SearchFilterBar from "@/components/admin/search-filter-bar";
import Pagination from "@/components/admin/pagination";
import Badge from "@/components/admin/badge";
import LoadingSpinner from "@/components/admin/loading-spinner";
import EmptyState from "@/components/admin/empty-state";
import ConfirmDialog from "@/components/admin/confirm-dialog";

interface VideoCourse {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: "active" | "draft";
  thumbnailUrl: string | null;
  createdAt: any;
}

export default function VideoCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<VideoCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [page, limit, searchQuery, filterStatus, sortBy, sortOrder]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await getVideoCoursesPaginated(
        page,
        limit,
        searchQuery,
        filterStatus,
        sortBy,
        sortOrder
      );
      if (result.success) {
        setCourses(result.data as VideoCourse[]);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } else {
        toast.error("Failed to load video courses");
      }
    } catch (error) {
      toast.error("Failed to load video courses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === courses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(courses.map((c) => c.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const result = await batchDeleteVideoCourses(selectedIds, user.uid);
      if (result.success) {
        toast.success(`${selectedIds.length} course(s) deleted successfully`);
        setSelectedIds([]);
        setShowDeleteDialog(false);
        loadCourses();
      } else {
        toast.error(result.error || "Failed to delete courses");
      }
    } catch (error) {
      toast.error("Failed to delete courses");
    } finally {
      setDeleting(false);
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

  const formatDuration = (minutes: number) => {
    if (!minutes) return "N/A";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (loading && courses.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Video Courses"
        subtitle="Manage your video courses"
        actions={
          <Link
            href="/admin/video-courses/new"
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Upload Video
          </Link>
        }
      />

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        filterValue={filterStatus}
        onFilterChange={(value) => {
          setFilterStatus(value);
          setPage(1);
        }}
        filterOptions={[
          { value: "all", label: "All Status" },
          { value: "active", label: "Active" },
          { value: "draft", label: "Draft" },
        ]}
      />

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {selectedIds.length} selected
          </span>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {courses.length === 0 ? (
        <EmptyState
          icon={<Video className="w-12 h-12" />}
          title="No video courses yet"
          description="Upload your first video course to get started."
          action={
            <Link
              href="/admin/video-courses/new"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Upload Video
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleSelectOne(course.id)}
                    className="mt-1"
                  >
                    <CheckSquare
                      className={`w-5 h-5 ${
                        selectedIds.includes(course.id)
                          ? "text-purple-600"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                      <Video className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/video-courses/${course.id}`}
                      className="font-medium text-gray-900 hover:text-purple-600"
                    >
                      {course.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      {formatDuration(course.duration)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    label={course.status === "active" ? "Active" : "Draft"}
                    variant={course.status === "active" ? "success" : "warning"}
                  />
                  <span className="text-xs text-gray-500">
                    {formatDate(course.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <button onClick={handleSelectAll}>
                      <CheckSquare
                        className={`w-5 h-5 ${
                          selectedIds.length === courses.length && courses.length > 0
                            ? "text-purple-600"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    onClick={() => handleSort("title")}
                  >
                    Title{" "}
                    {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    onClick={() => handleSort("status")}
                  >
                    Status{" "}
                    {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    onClick={() => handleSort("duration")}
                  >
                    Duration{" "}
                    {sortBy === "duration" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created{" "}
                    {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button onClick={() => handleSelectOne(course.id)}>
                        <CheckSquare
                          className={`w-5 h-5 ${
                            selectedIds.includes(course.id)
                              ? "text-purple-600"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                            <Video className="h-5 w-5 text-indigo-600" />
                          </div>
                        )}
                        <Link
                          href={`/admin/video-courses/${course.id}`}
                          className="font-medium text-gray-900 hover:text-purple-600"
                        >
                          {course.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        label={course.status === "active" ? "Active" : "Draft"}
                        variant={
                          course.status === "active" ? "success" : "warning"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDuration(course.duration)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(course.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/video-courses/${course.id}`}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {showDeleteDialog && (
        <ConfirmDialog
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleBatchDelete}
          title="Delete Video Courses"
          message={`Are you sure you want to delete ${selectedIds.length} course(s)? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          loading={deleting}
        />
      )}
    </div>
  );
}
