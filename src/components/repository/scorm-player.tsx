"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
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

export interface ScormProgress {
  status: "incomplete" | "completed" | "passed" | "failed";
  score: number | null;
  sessionTime: number;
}

interface ScormPlayerProps {
  course: Course;
  onClose?: () => void;
  /** Fired when the content reports completion, so a page can offer "next". */
  onComplete?: () => void;
  /** Mirrors the current status/score out of the frame, for chrome outside it. */
  onProgress?: (progress: ScormProgress) => void;
  /** Fill the parent box instead of taking over the viewport, and drop the modal chrome. */
  embedded?: boolean;
  /** Bare frame for the public detail page: no header/footer, just a floating zoom button. */
  minimal?: boolean;
}

/** The SCORM bridge reports values as strings; normalise to a number. */
function toScore(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

/** Every launch re-reports a blank status before the course starts. */
const BLANK: ScormProgress = { status: "incomplete", score: null, sessionTime: 0 };

/**
 * A report only replaces a stored result when it carries one. Without this the
 * course's "incomplete" on launch would wipe the score it just earned, and the
 * card would be empty again on every visit. A retake clears through
 * `scorm-reset`, not through a blank report.
 */
function mergeProgress(current: ScormProgress, next: ScormProgress): ScormProgress {
  const blank = next.score === null && next.status === "incomplete";
  return {
    status: blank ? current.status : next.status,
    score: next.score ?? current.score,
    sessionTime: next.sessionTime || current.sessionTime,
  };
}

/** Kept in the browser too, so the result shows before (or without) a fetch. */
function readStored(key: string): ScormProgress | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ScormProgress>;
    return {
      status: value.status ?? "incomplete",
      score: toScore(value.score),
      sessionTime: Number(value.sessionTime) || 0,
    };
  } catch {
    return null;
  }
}

export default function ScormPlayer({ course, onClose, onComplete, onProgress, embedded, minimal }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState<ScormProgress>(BLANK);
  const latest = useRef<ScormProgress>(BLANK);
  /* A local record is the truth for this browser: it was written last, so the
     server copy may still be the one a retake just cleared. */
  const localSeen = useRef(false);
  const storageKey = `scorm-result:${course.id}:${user?.uid ?? "anon"}`;

  /* Built during render, not in an effect: the iframe is in the first HTML the
     browser gets, so the package starts downloading while the JS hydrates. */
  const iframeUrl = `/api/repository/launch/${course.id}/${course.scormStructure.entryPoint}`;

  const applyProgress = (next: ScormProgress) => {
    latest.current = next;
    setProgress(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Private mode / storage disabled: the server record still applies.
    }
  };

  // The stored result comes back immediately — no fetch, no flicker.
  useEffect(() => {
    const stored = readStored(storageKey);
    localSeen.current = stored !== null;
    if (stored) applyProgress(mergeProgress(latest.current, stored));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Signed-in learners also have their record on the server — but only when
  // this browser has nothing stored.
  useEffect(() => {
    if (!user || localSeen.current) return;
    let cancelled = false;

    getProgress(user.uid, course.id)
      .then((result) => {
        if (cancelled || !result.data) return;
        const server: ScormProgress = {
          status: result.data.status || "incomplete",
          score: toScore(result.data.score),
          sessionTime: result.data.sessionTime || 0,
        };
        if (server.score !== null) {
          applyProgress(mergeProgress(latest.current, server));
        }
      })
      .catch((error) => console.error("Failed to load progress:", error));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, course.id]);

  const handleSaveProgress = async (data: {
    status?: "incomplete" | "completed" | "passed" | "failed";
    score?: number | string | null;
    sessionTime?: number;
    suspendData?: string;
  }) => {
    const merged = mergeProgress(latest.current, {
      status: data.status || "incomplete",
      score: toScore(data.score),
      sessionTime: data.sessionTime || 0,
    });

    if (merged.status === "completed" || merged.status === "passed") {
      onComplete?.();
    }

    applyProgress(merged);

    try {
      // Anonymous visitors still get the in-page status, just nothing persisted.
      if (user) {
        await saveProgress({
          courseId: course.id,
          userId: user.uid,
          ...merged,
          suspendData: data.suspendData || "",
        });
      }
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  // The course restarted: a retake clears the old result everywhere.
  useEffect(() => {
    const onReset = () => {
      // The blank lands in local storage on purpose: it outranks the server
      // record the reload would otherwise read back while the clear is still
      // in flight.
      applyProgress(BLANK);
      if (user) {
        void saveProgress({
          courseId: course.id,
          userId: user.uid,
          ...BLANK,
          suspendData: "",
        }).catch((error) => console.error("Failed to clear progress:", error));
      }
    };

    window.addEventListener("scorm-reset", onReset);
    return () => window.removeEventListener("scorm-reset", onReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, user, course.id]);

  // Mirror the result out so the page can show it below the frame.
  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  // Results come from the bridge script the page puts in front of the frame
  // (see scorm-bridge.ts) — the package reports straight to this window.
  useEffect(() => {
    const onReported = (event: Event) => {
      const detail = (event as CustomEvent<ScormProgress & { suspendData?: string }>)
        .detail;
      if (!detail) return;
      void handleSaveProgress({
        status: detail.status,
        score: detail.score,
        sessionTime: detail.sessionTime,
        suspendData: detail.suspendData,
      });
    };

    window.addEventListener("scorm-progress", onReported);

    // The course can report before hydration; the bridge keeps the last result.
    const reported = (window as { __scormProgress?: ScormProgress & { suspendData?: string } })
      .__scormProgress;
    if (reported) {
      onReported(new CustomEvent("scorm-progress", { detail: reported }));
    }

    return () => window.removeEventListener("scorm-progress", onReported);
    // Keyed on the learner so persistence picks up the signed-in user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, course.id]);

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
