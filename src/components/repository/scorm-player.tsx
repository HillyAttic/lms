"use client";

import { useEffect, useRef, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { injectScormApi } from "@/lib/scorm-api";
import { saveProgress } from "@/app/actions/progress-actions";
import { X, Maximize2, Minimize2 } from "@/lib/icons";
import { toast } from "react-toastify";

interface Course {
  id: string;
  title: string;
  scormVersion: string;
  scormStructure: {
    entryPoint: string;
    storagePath: string;
  };
}

interface ScormPlayerProps {
  course: Course;
  onClose: () => void;
}

export default function ScormPlayer({ course, onClose }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState({
    status: "incomplete",
    score: null as number | null,
    sessionTime: 0,
  });

  useEffect(() => {
    if (course && user) {
      loadScormContent();
    }
  }, [course, user]);

  const loadScormContent = async () => {
    try {
      setLoading(true);

      // Get the entry point file URL from Firebase Storage
      const entryPointPath = `${course.scormStructure.storagePath}/${course.scormStructure.entryPoint}`;
      const fileRef = ref(storage, entryPointPath);
      const url = await getDownloadURL(fileRef);

      setIframeUrl(url);

      // Load existing progress
      const { getProgress } = await import("@/app/actions/progress-actions");
      const result = await getProgress(user!.uid, course.id);
      if (result.data) {
        setProgress({
          status: result.data.status || "incomplete",
          score: result.data.score || null,
          sessionTime: result.data.sessionTime || 0,
        });
      }
    } catch (error) {
      console.error("Failed to load SCORM content:", error);
      toast.error("Failed to load course content");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = async (data: any) => {
    try {
      await saveProgress({
        courseId: course.id,
        userId: user!.uid,
        status: data.status || "incomplete",
        score: data.score || null,
        sessionTime: data.sessionTime || 0,
        suspendData: data.suspendData || "",
      });

      setProgress({
        status: data.status || "incomplete",
        score: data.score || null,
        sessionTime: data.sessionTime || 0,
      });

      toast.success("Progress saved");
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  // Inject SCORM API when iframe loads
  useEffect(() => {
    if (iframeRef.current && iframeUrl && user) {
      injectScormApi(
        iframeRef.current,
        course.id,
        user.uid,
        course.scormVersion as "1.2" | "2004",
        handleSaveProgress,
        {
          "cmi.core.lesson_status": progress.status,
          "cmi.completion_status": progress.status,
          "cmi.core.score.raw": progress.score?.toString() || "",
          "cmi.score.raw": progress.score?.toString() || "",
          "cmi.core.session_time": progress.sessionTime.toString(),
          "cmi.session_time": formatTimeForScorm2004(progress.sessionTime),
        }
      );
    }
  }, [iframeUrl, user]);

  const formatTimeForScorm2004 = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `PT${hours}H${minutes}M${secs}S`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getStatusBadge = () => {
    const colors: Record<string, string> = {
      incomplete: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      passed: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors[progress.status] || colors.incomplete}`}
      >
        {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">{course.title}</h3>
          {getStatusBadge()}
          {progress.score !== null && (
            <span className="text-sm text-gray-300">
              Score: {progress.score}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Close player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-white">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading SCORM content...</p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full border-0"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white px-6 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">SCORM {course.scormVersion}</span>
          <span className="text-gray-400">
            Time: {Math.floor(progress.sessionTime / 60)}m {progress.sessionTime % 60}s
          </span>
        </div>
        <div className="text-gray-400">
          Progress auto-saves as you interact with the course
        </div>
      </div>
    </div>
  );
}
