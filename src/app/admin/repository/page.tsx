"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getRepositoryItemsPaginated,
  uploadRepositoryScorm,
  updateRepositoryItem,
  deleteRepositoryItem,
  batchDeleteRepositoryItems,
} from "@/app/actions/repository-actions";
import PageHeader from "@/components/admin/page-header";
import Badge from "@/components/admin/badge";
import LoadingSpinner from "@/components/admin/loading-spinner";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import Pagination from "@/components/admin/pagination";
import SearchFilterBar from "@/components/admin/search-filter-bar";
import EmptyState from "@/components/admin/empty-state";
import { Edit, Trash2, Upload, X, Save, Eye } from "@/lib/icons";

interface RepositoryItem {
  id: string;
  serialNumber: number;
  name: string;
  interactivityLevel: number;
  features: string;
  description: string;
  duration: number;
  scormVersion: string;
  entryPoint: string;
  storagePath: string;
}

export default function AdminRepositoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState<RepositoryItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    features: "",
    interactivityLevel: "2",
    duration: "30",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");

  const limit = 10;

  useEffect(() => {
    loadItems();
  }, [page, searchTerm, filterLevel]);

  const loadItems = async () => {
    setLoading(true);
    const result = await getRepositoryItemsPaginated(
      page,
      limit,
      searchTerm || undefined,
      filterLevel ?? undefined
    );
    if (result.success) {
      setItems(result.data as RepositoryItem[]);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!formData.name || !selectedFile) {
      setFormError("Name and ZIP file are required");
      return;
    }

    setUploading(true);
    setFormError("");

    try {
      const form = new FormData();
      form.append("userId", user?.uid || "");
      form.append("file", selectedFile);
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("features", formData.features);
      form.append("interactivityLevel", formData.interactivityLevel);
      form.append("duration", formData.duration);

      console.log("Starting upload...", {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        name: formData.name,
      });

      const result = await uploadRepositoryScorm(form);

      console.log("Upload result:", result);

      if (result.success) {
        setShowUploadModal(false);
        resetForm();
        await loadItems();
      } else {
        setFormError(result.error || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setFormError(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem || !formData.name) {
      setFormError("Name is required");
      return;
    }

    const result = await updateRepositoryItem(editingItem.id, user?.uid || "", {
      name: formData.name,
      description: formData.description,
      features: formData.features,
      interactivityLevel: parseFloat(formData.interactivityLevel),
      duration: parseInt(formData.duration),
    });

    if (result.success) {
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      loadItems();
    } else {
      setFormError(result.error || "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;

    const result = await deleteRepositoryItem(editingItem.id, user?.uid || "");
    if (result.success) {
      setShowDeleteConfirm(false);
      setEditingItem(null);
      loadItems();
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;

    const result = await batchDeleteRepositoryItems(selectedItems, user?.uid || "");
    if (result.success) {
      setShowBatchDeleteConfirm(false);
      setSelectedItems([]);
      loadItems();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      features: "",
      interactivityLevel: "2",
      duration: "30",
    });
    setSelectedFile(null);
    setFormError("");
  };

  const openEditModal = (item: RepositoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      features: item.features || "",
      interactivityLevel: item.interactivityLevel.toString(),
      duration: item.duration.toString(),
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (item: RepositoryItem) => {
    setEditingItem(item);
    setShowDeleteConfirm(true);
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getInteractivityBadge = (level: number) => {
    const colors: Record<number, string> = {
      1: "gray",
      2: "blue",
      2.5: "purple",
      3: "green",
    };
    return <Badge label={`Level ${level}`} variant={colors[level] as any || "gray"} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repository Management"
        subtitle="Manage SCORM packages in the repository"
        actions={
          <button
            onClick={() => {
              resetForm();
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add SCORM Package
          </button>
        }
      />

      {/* Batch actions */}
      {selectedItems.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-purple-700">
            {selectedItems.length} item(s) selected
          </span>
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <SearchFilterBar
        searchPlaceholder="Search repository items..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[
          {
            label: "All Levels",
            value: filterLevel?.toString() || "",
            options: [
              { label: "Level 1", value: "1" },
              { label: "Level 2", value: "2" },
              { label: "Level 2.5", value: "2.5" },
              { label: "Level 3", value: "3" },
            ],
            onChange: (value) => setFilterLevel(value ? parseFloat(value) : null),
          },
        ]}
      />

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Upload className="w-12 h-12" />}
          title="No repository items"
          description="Upload your first SCORM package to get started"
          action={
            <button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add SCORM Package
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interactivity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.serialNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">SCORM {item.scormVersion}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getInteractivityBadge(item.interactivityLevel)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 max-w-xs truncate" title={item.features}>
                        {item.features || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 max-w-md truncate" title={item.description}>
                        {item.description || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {formatDuration(item.duration)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            // Handle limit change if needed
          }}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Add SCORM Package</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Enter module name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features
                </label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g., Interactive, Quiz, Animation"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interactivity Level *
                  </label>
                  <select
                    value={formData.interactivityLevel}
                    onChange={(e) => setFormData({ ...formData, interactivityLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="1">Level 1 - Read Only</option>
                    <option value="2">Level 2 - Limited</option>
                    <option value="2.5">Level 2.5 - Complex</option>
                    <option value="3">Level 3 - Full Simulation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    min="1"
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SCORM ZIP File *
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a SCORM package ZIP file (max 200MB)
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Package
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Repository Item</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features
                </label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interactivity Level *
                  </label>
                  <select
                    value={formData.interactivityLevel}
                    onChange={(e) => setFormData({ ...formData, interactivityLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="1">Level 1 - Read Only</option>
                    <option value="2">Level 2 - Limited</option>
                    <option value="2.5">Level 2.5 - Complex</option>
                    <option value="3">Level 3 - Full Simulation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    min="1"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Repository Item"
          message={`Are you sure you want to delete "${editingItem?.name}"? This will also delete all associated SCORM files from storage. This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setEditingItem(null);
          }}
          confirmText="Delete"
          variant="danger"
        />
      )}

      {/* Batch Delete Confirmation */}
      {showBatchDeleteConfirm && (
        <ConfirmDialog
          title="Delete Selected Items"
          message={`Are you sure you want to delete ${selectedItems.length} item(s)? This will also delete all associated SCORM files from storage. This action cannot be undone.`}
          onConfirm={handleBatchDelete}
          onCancel={() => setShowBatchDeleteConfirm(false)}
          confirmText="Delete All"
          variant="danger"
        />
      )}
    </div>
  );
}
