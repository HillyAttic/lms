"use client";

import { useState, FormEvent } from "react";
import { X, Key } from "@/lib/icons";
import { updateUserPassword } from "@/app/actions/user-actions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";

interface ChangePasswordModalProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
}

export default function ChangePasswordModal({
  userId,
  userEmail,
  onClose,
}: ChangePasswordModalProps) {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserPassword(userId, newPassword, user.uid);
      if (result.success) {
        toast.success("Password updated successfully");
        onClose();
      } else {
        toast.error(result.error || "Failed to update password");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter new password (min 6 characters)"
              minLength={6}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Confirm new password"
              minLength={6}
              required
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
