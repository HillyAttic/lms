"use client";

import { X } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  isOpen?: boolean;
  className?: string;
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  onClose,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  isOpen = true,
  className,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", className)}>
      <div className="w-full max-w-md rounded-xl bg-white">
        <div className="flex items-center justify-between border-b p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h2>
          <button
            onClick={handleCancel}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end sm:p-6">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50",
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-purple-600 hover:bg-purple-700"
            )}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
