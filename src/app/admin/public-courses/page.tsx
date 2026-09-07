"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPublicCoursesPaginated,
  batchDeletePublicCourses,
} from "@/app/actions/public-course-actions";
import { seedPublicCourses } from "@/app/actions/seed-public-courses";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Trash2, Eye, PlusIcon, CheckSquare, Pencil } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import SearchFilterBar from "@/components/admin/search-filter-bar";
import Pagination from "@/components/admin/pagination";
import Badge from "@/components/admin/badge";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import LoadingSpinner from "@/components/admin/loading-spinner";
import EmptyState from "@/components/admin/empty-state";

interface PublicCourse {
  id: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  instructor: { name: string };
  price: number;
  discountPrice: number;
  status: "Ongoing" | "Completed";
  level: string;
  duration: number;
  lessonsCount: number;
  isCertificationProvide: boolean;
  createdAt: any;
}

export default function PublicCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [page, limit, searchQuery, filterStatus, sortBy, sortOrder]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await getPublicCoursesPaginated(
        page,
        limit,
        searchQuery || undefined,
        filterStatus || undefined,
        sortBy,
        sortOrder
      );
      if (result.success) {
        setCourses(result.data as PublicCourse[]);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        toast.error("Failed to load courses");
      }
    } catch (error) {
      toast.error("Failed to load courses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!user || selectedIds.length === 0) return;

    try {
      const result = await batchDeletePublicCourses(selectedIds, user.uid);
      if (result.success) {
        toast.success(`${selectedIds.length} course(s) deleted successfully`);
        setSelectedIds([]);
        setShowDeleteConfirm(false);
        loadCourses();
      } else {
        toast.error(result.error || "Failed to delete courses");
      }
    } catch (error) {
      toast.error("Failed to delete courses");
      console.error(error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === courses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(courses.map((c) => c.id));
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

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedPublicCourses();
      if (result.success) {
        toast.success(`Seeded ${result.data?.count || 0} courses successfully`);
        loadCourses();
      } else {
        toast.error(result.error || "Failed to seed courses");
      }
    } catch (error) {
      toast.error("Failed to seed courses");
      console.error(error);
    } finally {
      setSeeding(false);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div>
      <PageHeader
        title="Public Courses"
        subtitle="Manage courses displayed on the public website"
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
              href="/admin/public-courses/new"
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon />
              Add Course
            </Link>
          </div>
        }
      />

      <SearchFilterBar
        searchPlaceholder="Search courses..."
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
              { label: "Ongoing", value: "Ongoing" },
              { label: "Completed", value: "Completed" },
            ],
            onChange: (value) => {
              setFilterStatus(value);
              setPage(1);
            },
          },
        ]}
      />

      {loading ? (
        <LoadingSpinner />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon className="w-16 h-16" />}
          title="No courses yet"
          description="Get started by adding your first public course, or seed the default courses"
          action={
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/admin/public-courses/new"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon />
                Add Course
              </Link>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Seeding...
                  </>
                ) : (
                  "Seed Default Courses"
                )}
              </button>
            </div>
          }
        />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {courses.map((course) => (
              <div key={course.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleSelect(course.id)}
                      className="shrink-0 p-1 hover:bg-gray-200 rounded"
                    >
                      <CheckSquare
                        className={`h-5 w-5 ${
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <BookOpenIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">
                        {course.title}
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        {course.instructor?.name || "No instructor"}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/admin/public-courses/${course.id}`}
                    className="shrink-0 rounded-lg p-2 text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    label={course.status}
                    variant={course.status === "Ongoing" ? "success" : "gray"}
                  />
                  <span className="text-xs text-gray-500">{course.level}</span>
                  <span className="text-xs text-gray-500">
                    {formatPrice(course.discountPrice || course.price)}
                  </span>
                  {course.isCertificationProvide && (
                    <Badge label="Certified" variant="blue" />
                  )}
                  <span className="text-xs text-gray-500">
                    {formatDate(course.createdAt)}
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
                            selectedIds.length === courses.length
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
                      Course{" "}
                      {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Instructor
                    </th>
                    <th
                      onClick={() => handleSort("price")}
                      className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    >
                      Price{" "}
                      {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
                    >
                      Status{" "}
                      {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Certified
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
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleSelect(course.id)}
                          className="rounded p-1 hover:bg-gray-200"
                        >
                          <CheckSquare
                            className={`h-5 w-5 ${
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                              <BookOpenIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {course.title}
                            </div>
                            <div className="max-w-xs truncate text-sm text-gray-500">
                              {course.shortDescription}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.instructor?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {course.discountPrice > 0 &&
                          course.discountPrice < course.price ? (
                            <>
                              <span className="font-medium text-gray-900">
                                {formatPrice(course.discountPrice)}
                              </span>
                              <span className="ml-1 text-gray-400 line-through">
                                {formatPrice(course.price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-gray-900">
                              {formatPrice(course.price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          label={course.status}
                          variant={
                            course.status === "Ongoing" ? "success" : "gray"
                          }
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.level}
                      </td>
                      <td className="px-6 py-4">
                        {course.isCertificationProvide ? (
                          <Badge label="Yes" variant="blue" />
                        ) : (
                          <span className="text-sm text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(course.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/public-courses/${course.id}`}
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                          >
                            <Pencil className="h-4 w-4" />
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
          title="Delete Courses"
          message={`Are you sure you want to delete ${selectedIds.length} course(s)? This will also remove all uploaded thumbnails. This action cannot be undone.`}
          onConfirm={handleBatchDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}

function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
