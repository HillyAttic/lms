"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { injectScormApi } from "@/lib/scorm-api";
import { getProgress, saveProgress } from "@/app/actions/progress-actions";
import { X, Maximize2, Minimize2 } from "@/lib/icons";

interface Course {
  id: string;
  title: string;
  scormVersion: string;
  scormStructure: {
    entryPoint: string;
  };
}

interface ScormPlayerProps {
  course: Course;
  onClose?: () => void;
  /** Fired when the content reports completion, so a page can offer "next". */
  onComplete?: () => void;
  /** Fill the parent box instead of taking over the viewport, and drop the modal chrome. */
  embedded?: boolean;
  /** Bare frame for the public detail page: no header/footer, just a floating zoom button. */
  minimal?: boolean;
}

export default function ScormPlayer({ course, onClose, onComplete, embedded, minimal }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState({
    status: "incomplete",
    score: null as number | null,
    sessionTime: 0,
  });

  /* Built during render, not in an effect: the iframe is in the first HTML the
     browser gets, so the package starts downloading while the JS hydrates. */
  const iframeUrl = `/api/repository/launch/${course.id}/${course.scormStructure.entryPoint}`;

  // Signed-in learners resume their own record.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getProgress(user.uid, course.id)
      .then((result) => {        if (cancelled || !result.data) return;
        setProgress({
          status: result.data.status || "incomplete",
          score: result.data.score || null,
          sessionTime: result.data.sessionTime || 0,
        });
      })
      .catch((error) => console.error("Failed to load progress:", error));

    return () => {
      cancelled = true;
    };
  }, [user, course.id]);

  const handleSaveProgress = async (data: {
    status?: "incomplete" | "completed" | "passed" | "failed";
    score?: number | null;
    sessionTime?: number;
    suspendData?: string;
  }) => {
    const status = data.status || "incomplete";

    if (status === "completed" || status === "passed") {
      onComplete?.();
    }

    try {
      // Anonymous visitors still get the in-page status, just nothing persisted.
      if (user) {
        await saveProgress({
          courseId: course.id,
          userId: user.uid,
          status,
          score: data.score || null,
          sessionTime: data.sessionTime || 0,
          suspendData: data.suspendData || "",
        });
      }

      setProgress({
        status,
        score: data.score || null,
        sessionTime: data.sessionTime || 0,
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  // Inject SCORM API when the iframe is in the document.
  const formatTimeForScorm2004 = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `PT${hours}H${minutes}M${secs}S`;
  };

  useEffect(() => {
    if (iframeRef.current) {
      injectScormApi(
        iframeRef.current,
        course.id,
        user?.uid || "guest",
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
    // Intentionally keyed on the learner only: re-running on each progress save
    // would swap the API object out from under the running course.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // The player's own zoom control. In minimal mode the browser is already in
  // fullscreen, so the iframe element itself is what has to grow.
  const toggleZoom = () => {
    const container = minimal ? iframeRef.current : containerRef.current;
    void container?.requestFullscreen();
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
    <div
      ref={containerRef}
      className={
        minimal
          ? "relative h-full w-full bg-gray-900"
          : embedded
            ? "flex h-full w-full flex-col bg-white"
            : "fixed inset-0 bg-black/80 z-50 flex flex-col"
      }
    >
      {/* Header */}
      <div
        className={`bg-gray-900 text-white px-6 py-3 ${minimal ? "hidden" : "flex"} items-center justify-between ${
          embedded ? "rounded-t-3xl" : ""
        }`}
      >
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
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Close player"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={minimal ? "absolute inset-0" : "flex-1 relative bg-white"}>
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-0"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* Footer */}
      <div
        className={`bg-gray-900 text-white px-6 py-2 ${minimal ? "hidden" : "flex"} items-center justify-between text-sm ${
          embedded ? "rounded-b-3xl" : ""
        }`}
      >
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

      {/* Minimal chrome: the one button the mock shows, floating over the frame. */}
      {minimal && (
        <button
          type="button"
          onClick={toggleZoom}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-white text-gray-900 shadow-md transition-colors hover:bg-gray-100"
        >
          {isFullscreen ? (
            <Minimize2 className="size-5" />
          ) : (
            <Maximize2 className="size-5" />
          )}
        </button>
      )}
    </div>
  );
}
