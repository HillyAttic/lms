"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUserById, updateUserRole, getUserProgress, toggleRepositoryAccess } from "@/app/actions/user-actions";
import { getCourses } from "@/app/actions/course-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Save, Trash2, Key } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import LoadingSpinner from "@/components/admin/loading-spinner";
import Badge from "@/components/admin/badge";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import ChangePasswordModal from "@/components/admin/change-password-modal";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserData {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: "admin" | "instructor" | "learner";
  repositoryAccess: boolean;
  createdAt: any;
}

interface ProgressData {
  id: string;
  courseId: string;
  status: string;
  score: number | null;
  sessionTime: number;
  lastUpdated: any;
}

interface CourseData {
  id: string;
  title: string;
}

export default function UserDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [courses, setCourses] = useState<Record<string, string>>({});

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "instructor" | "learner">("learner");
  const [repositoryAccess, setRepositoryAccess] = useState(false);
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    loadUser();
    loadProgress();
  }, [userId]);

  const loadUser = async () => {
    try {
      const result = await getUserById(userId);
      if (result.success && result.data) {
        const data = result.data as UserData;
        setUserData(data);
        setDisplayName(data.displayName);
        setRole(data.role);
        setRepositoryAccess(data.repositoryAccess || false);
      } else {
        toast.error("User not found");
        router.push("/admin/users");
      }
    } catch (error) {
      toast.error("Failed to load user");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const result = await getUserProgress(userId);
      if (result.success && result.data) {
        setProgress(result.data as ProgressData[]);

        // Load course titles
        const coursesResult = await getCourses();
        if (coursesResult) {
          const courseMap: Record<string, string> = {};
          (coursesResult as CourseData[]).forEach((c) => {
            courseMap[c.id] = c.title;
          });
          setCourses(courseMap);
        }
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const result = await updateUserRole(userId, role, user.uid);
      if (result.success) {
        toast.success("User updated successfully");
        loadUser();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("User deleted successfully");
      router.push("/admin/users");
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    }
  };

  const handleToggleRepositoryAccess = async () => {
    if (!user) return;

    setTogglingAccess(true);
    try {
      const result = await toggleRepositoryAccess(userId, user.uid);
      if (result.success) {
        setRepositoryAccess(result.repositoryAccess || false);
        toast.success(`Repository access ${result.repositoryAccess ? "enabled" : "disabled"}`);
      } else {
        toast.error(result.error || "Failed to toggle repository access");
      }
    } catch (error) {
      toast.error("Failed to toggle repository access");
      console.error(error);
    } finally {
      setTogglingAccess(false);
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "danger" | "info"> = {
      completed: "success",
      passed: "success",
      incomplete: "warning",
      failed: "danger",
    };
    return <Badge label={status} variant={variants[status] || "info"} />;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "purple" | "blue" | "green"> = {
      admin: "purple",
      instructor: "blue",
      learner: "green",
    };
    return (
      <Badge
        label={role.charAt(0).toUpperCase() + role.slice(1)}
        variant={variants[role] || "gray"}
      />
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!userData) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="User Details"
        subtitle={userData.email}
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 sm:px-4"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Delete
            </button>
            <button
              onClick={() => router.push("/admin/users")}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              Back
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="text-center mb-6">
              <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">
                  {(userData.displayName || userData.email || "?")[0].toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {userData.displayName || "No name"}
              </h2>
              <p className="text-gray-500">{userData.email}</p>
              <div className="mt-2">{getRoleBadge(userData.role)}</div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Joined</span>
                <span className="text-gray-900">{formatDate(userData.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Courses Enrolled</span>
                <span className="text-gray-900">{progress.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Completed</span>
                <span className="text-gray-900">
                  {progress.filter((p) => p.status === "completed" || p.status === "passed").length}
                </span>
              </div>
            </div>

            {/* Repository Access Toggle */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Repository Access</p>
                  <p className="text-xs text-gray-500">Allow access to SCORM repository</p>
                </div>
                <button
                  onClick={handleToggleRepositoryAccess}
                  disabled={togglingAccess}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    repositoryAccess ? "bg-purple-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      repositoryAccess ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Key className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form */}
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "instructor" | "learner")}
                  disabled={userData.uid === user?.uid}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                >
                  <option value="learner">Learner</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
                {userData.uid === user?.uid && (
                  <p className="text-xs text-gray-500 mt-1">Cannot change your own role</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
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

          {/* Course Progress */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b px-4 py-4 sm:px-6">
              <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
            </div>
            {progress.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Status
                      </th>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:table-cell">
                        Score
                      </th>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:table-cell">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {progress.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {courses[p.courseId] || "Unknown Course"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 sm:hidden">
                            {p.score !== null ? `Score: ${p.score}%` : "N/A"} · {formatTime(p.sessionTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                        <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">
                          {p.score !== null ? `${p.score}%` : "N/A"}
                        </td>
                        <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">
                          {formatTime(p.sessionTime)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(p.lastUpdated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No course progress recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete ${userData.email}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          variant="danger"
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          userId={userId}
          userEmail={userData.email}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
