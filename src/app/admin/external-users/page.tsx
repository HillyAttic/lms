"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getExternalShares,
  revokeExternalShare,
  deleteExternalShare,
  batchDeleteExternalShares,
} from "@/app/actions/external-share-actions";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";
import { Trash2, UserPlus, CheckSquare, LinkIcon } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import SearchFilterBar from "@/components/admin/search-filter-bar";
import Pagination from "@/components/admin/pagination";
import Badge from "@/components/admin/badge";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import LoadingSpinner from "@/components/admin/loading-spinner";
import EmptyState from "@/components/admin/empty-state";
import CreateExternalUserModal from "@/components/admin/create-external-user-modal";

interface ExternalShare {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  accessTypes: string[];
  courseIds: { scorm: string[]; video: string[]; game: string[] };
  token: string;
  createdBy: string;
  createdAt: any;
  expiresAt: any;
  isActive: boolean;
}

export default function ExternalUsersPage() {
  const { user } = useAuth();
  const [shares, setShares] = useState<ExternalShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getExternalShares(
        page,
        limit,
        searchQuery || undefined,
        user?.uid
      );
      if (result.success) {
        setShares(result.data as ExternalShare[]);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        toast.error(result.error || "Failed to load external shares");
      }
    } catch (error) {
      toast.error("Failed to load external shares");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, user?.uid]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleBulkDelete = async () => {
    if (!user || selectedIds.length === 0) return;

    try {
      const result = await batchDeleteExternalShares(selectedIds, user.uid);
      if (result.success) {
        toast.success(`${selectedIds.length} share(s) deleted successfully`);
        setSelectedIds([]);
        setShowDeleteConfirm(false);
        loadShares();
      } else {
        toast.error(result.error || "Failed to delete shares");
      }
    } catch (error) {
      toast.error("Failed to delete shares");
      console.error(error);
    }
  };

  const handleRevoke = async () => {
    if (!user || !revokeTargetId) return;

    try {
      const result = await revokeExternalShare(revokeTargetId, user.uid);
      if (result.success) {
        toast.success("Share link revoked successfully");
        setShowRevokeConfirm(false);
        setRevokeTargetId(null);
        loadShares();
      } else {
        toast.error(result.error || "Failed to revoke share");
      }
    } catch (error) {
      toast.error("Failed to revoke share");
      console.error(error);
    }
  };

  const handleDelete = async (shareId: string) => {
    if (!user) return;

    try {
      const result = await deleteExternalShare(shareId, user.uid);
      if (result.success) {
        toast.success("Share deleted successfully");
        loadShares();
      } else {
        toast.error(result.error || "Failed to delete share");
      }
    } catch (error) {
      toast.error("Failed to delete share");
      console.error(error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === shares.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(shares.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (share: ExternalShare) => {
    if (!share.isActive) {
      return <Badge label="Revoked" variant="warning" />;
    }
    const expiresAt = share.expiresAt?.toDate?.() || (share.expiresAt?.seconds ? new Date(share.expiresAt.seconds * 1000) : null);
    if (expiresAt && expiresAt < new Date()) {
      return <Badge label="Expired" variant="warning" />;
    }
    return <Badge label="Active" variant="success" />;
  };

  const getAccessTypesBadges = (share: ExternalShare) => {
    const types = share.accessTypes || [];
    return (
      <div className="flex flex-wrap gap-1">
        {types.includes("scorm") && <Badge label="SCORM" variant="purple" />}
        {types.includes("video") && <Badge label="Video" variant="blue" />}
        {types.includes("game") && <Badge label="Game" variant="green" />}
      </div>
    );
  };

  const copyShareLink = async (token: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/shared/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div>
      <PageHeader
        title="External Users"
        subtitle="Manage shareable links for external users"
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm text-white transition-colors hover:bg-red-700 sm:px-4"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Delete</span>
                <span className="sm:hidden">Del</span>
                ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2.5 text-sm text-white transition-colors hover:bg-purple-700 sm:px-4"
            >
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Add External User</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        }
      />

      <SearchFilterBar
        searchPlaceholder="Search by name, email, or mobile..."
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
      />

      {loading ? (
        <LoadingSpinner />
      ) : shares.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-16 h-16" />}
          title="No external users yet"
          description="Create shareable links for external users to access specific content"
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add External User
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {shares.map((share) => (
              <div key={share.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleSelect(share.id)}
                      className="shrink-0 rounded p-1 hover:bg-gray-200"
                    >
                      <CheckSquare
                        className={`h-5 w-5 ${
                          selectedIds.includes(share.id)
                            ? "text-purple-600"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                      <span className="text-sm font-medium text-purple-600">
                        {share.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">
                        {share.name}
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        {share.email || share.mobile || "No contact"}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => copyShareLink(share.token)}
                      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                      title="Copy share link"
                    >
                      <LinkIcon />
                    </button>
                    <button
                      onClick={() => {
                        setRevokeTargetId(share.id);
                        setShowRevokeConfirm(true);
                      }}
                      disabled={!share.isActive}
                      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                      title="Revoke link"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(share.id)}
                      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {getStatusBadge(share)}
                  {getAccessTypesBadges(share)}
                  <span className="text-xs text-gray-500">{formatDate(share.createdAt)}</span>
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
                            selectedIds.length === shares.length
                              ? "text-purple-600"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Access
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shares.map((share) => (
                    <tr key={share.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleSelect(share.id)}
                          className="rounded p-1 hover:bg-gray-200"
                        >
                          <CheckSquare
                            className={`h-5 w-5 ${
                              selectedIds.includes(share.id)
                                ? "text-purple-600"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <span className="text-sm font-medium text-purple-600">
                              {share.name?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">
                            {share.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {share.email || share.mobile || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {getAccessTypesBadges(share)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(share.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(share.expiresAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(share)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyShareLink(share.token)}
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                            title="Copy share link"
                          >
                            <LinkIcon />
                          </button>
                          <button
                            onClick={() => {
                              setRevokeTargetId(share.id);
                              setShowRevokeConfirm(true);
                            }}
                            disabled={!share.isActive}
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Revoke link"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(share.id)}
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {showCreateModal && (
        <CreateExternalUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadShares();
          }}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Shares"
          message={`Are you sure you want to delete ${selectedIds.length} share(s)? This action cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          variant="danger"
        />
      )}

      {showRevokeConfirm && (
        <ConfirmDialog
          title="Revoke Share Link"
          message="Are you sure you want to revoke this share link? The external user will no longer be able to access the content."
          onConfirm={handleRevoke}
          onCancel={() => {
            setShowRevokeConfirm(false);
            setRevokeTargetId(null);
          }}
          confirmText="Revoke"
          variant="danger"
        />
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
