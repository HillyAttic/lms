"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getUsersPaginated,
  batchUpdateUserRole,
  batchDeleteUsers,
  toggleRepositoryAccess,
} from "@/app/actions/user-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Trash2, Eye, UserPlus, CheckSquare, Key } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import SearchFilterBar from "@/components/admin/search-filter-bar";
import Pagination from "@/components/admin/pagination";
import Badge from "@/components/admin/badge";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import LoadingSpinner from "@/components/admin/loading-spinner";
import EmptyState from "@/components/admin/empty-state";
import CreateUserModal from "@/components/admin/create-user-modal";
import ChangePasswordModal from "@/components/admin/change-password-modal";

interface UserData {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "instructor" | "learner";
  repositoryAccess: boolean;
  createdAt: any;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [bulkRole, setBulkRole] = useState<"admin" | "instructor" | "learner">("learner");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [togglingAccessId, setTogglingAccessId] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState("");
  const [passwordUserEmail, setPasswordUserEmail] = useState("");

  useEffect(() => {
    loadUsers();
  }, [page, limit, searchQuery, filterRole, sortBy, sortOrder]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsersPaginated(
        page,
        limit,
        searchQuery || undefined,
        filterRole || undefined
      );
      if (result.success) {
        setUsers(result.data as UserData[]);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (!user || selectedIds.length === 0) return;

    try {
      const result = await batchUpdateUserRole(selectedIds, bulkRole, user.uid);
      if (result.success) {
        toast.success(`${selectedIds.length} user(s) role updated to ${bulkRole}`);
        setSelectedIds([]);
        setShowRoleConfirm(false);
        loadUsers();
      } else {
        toast.error(result.error || "Failed to update roles");
      }
    } catch (error) {
      toast.error("Failed to update roles");
      console.error(error);
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.length === 0) return;

    try {
      const result = await batchDeleteUsers(selectedIds, user.uid);
      if (result.success) {
        toast.success(`${selectedIds.length} user(s) deleted successfully`);
        setSelectedIds([]);
        setShowDeleteConfirm(false);
        loadUsers();
      } else {
        toast.error(result.error || "Failed to delete users");
      }
    } catch (error) {
      toast.error("Failed to delete users");
      console.error(error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
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

  const handleToggleRepositoryAccess = async (userId: string) => {
    if (!user) return;

    setTogglingAccessId(userId);
    try {
      const result = await toggleRepositoryAccess(userId, user.uid);
      if (result.success) {
        toast.success(`Repository access ${result.repositoryAccess ? "enabled" : "disabled"}`);
        loadUsers();
      } else {
        toast.error(result.error || "Failed to toggle repository access");
      }
    } catch (error) {
      toast.error("Failed to toggle repository access");
      console.error(error);
    } finally {
      setTogglingAccessId(null);
    }
  };

  const openChangePassword = (userId: string, email: string) => {
    setPasswordUserId(userId);
    setPasswordUserEmail(email);
    setShowChangePassword(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage platform users and their roles"
        actions={
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={() => setShowRoleConfirm(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Change Role ({selectedIds.length})
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete ({selectedIds.length})
                </button>
              </>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Create User
            </button>
          </div>
        }
      />

      <SearchFilterBar
        searchPlaceholder="Search users by name or email..."
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        filters={[
          {
            label: "Role",
            value: filterRole,
            options: [
              { label: "All Roles", value: "all" },
              { label: "Admin", value: "admin" },
              { label: "Instructor", value: "instructor" },
              { label: "Learner", value: "learner" },
            ],
            onChange: (value) => {
              setFilterRole(value);
              setPage(1);
            },
          },
        ]}
      />

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-16 h-16" />}
          title="No users yet"
          description="Users will appear here after they register or are created"
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Create User
            </button>
          }
        />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <CheckSquare
                        className={`w-5 h-5 ${
                          selectedIds.length === users.length
                            ? "text-purple-600"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  </th>
                  <th
                    onClick={() => handleSort("displayName")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  >
                    User {sortBy === "displayName" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("role")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  >
                    Role {sortBy === "role" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  >
                    Joined {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Repository
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelect(userItem.id)}
                        disabled={userItem.uid === user?.uid}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        <CheckSquare
                          className={`w-5 h-5 ${
                            selectedIds.includes(userItem.id)
                              ? "text-purple-600"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {(userItem.displayName || userItem.email || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {userItem.displayName || "No name"}
                          </div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(userItem.role)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(userItem.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleRepositoryAccess(userItem.id)}
                        disabled={togglingAccessId === userItem.id}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          userItem.repositoryAccess ? "bg-purple-600" : "bg-gray-200"
                        }`}
                        title={userItem.repositoryAccess ? "Repository access enabled" : "Repository access disabled"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            userItem.repositoryAccess ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openChangePassword(userItem.id, userItem.email)}
                          disabled={userItem.uid === user?.uid}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Change password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/admin/users/${userItem.id}`}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
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

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadUsers();
          }}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          userId={passwordUserId}
          userEmail={passwordUserEmail}
          onClose={() => {
            setShowChangePassword(false);
            setPasswordUserId("");
            setPasswordUserEmail("");
          }}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Users"
          message={`Are you sure you want to delete ${selectedIds.length} user(s)? This action cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          variant="danger"
        />
      )}

      {showRoleConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Change User Role</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Change role for {selectedIds.length} user(s) to:
              </p>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as "admin" | "instructor" | "learner")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="learner">Learner</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowRoleConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRoleChange}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersIcon(props: any) {
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
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
