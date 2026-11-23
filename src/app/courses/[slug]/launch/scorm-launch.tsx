"use client";

import { useRef, useState, type ComponentProps } from "react";
import ScormPlayer, {
  type ScormProgress,
} from "@/components/repository/scorm-player";
import Button from "@/components/ui/button";
import { scormBridgeScript } from "@/lib/scorm-bridge";

type Course = ComponentProps<typeof ScormPlayer>["course"];

const STATUS: Record<
  ScormProgress["status"],
  { label: string; className: string }
> = {
  incomplete: { label: "In progress", className: "bg-[#f1f5f9] text-[#475569]" },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-800" },
  passed: { label: "Passed", className: "bg-green-100 text-green-800" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800" },
};

/*
 * The SCORM package shows status and score inside its own frame. The player
 * mirrors them out through `onProgress`, so the same result is also on the
 * page itself — visible without hunting for the results slide.
 */
export default function ScormLaunch({ course }: { course: Course }) {
  const [progress, setProgress] = useState<ScormProgress>({
    status: "incomplete",
    score: null,
    sessionTime: 0,
  });
  const badge = STATUS[progress.status] ?? STATUS.incomplete;

  /* Remounting the player reloads the frame. Clear the bridge first, or the
     restarted course would resume the attempt it is being asked to redo. */
  const [attempt, setAttempt] = useState(0);
  const retake = () => {
    const bridge = window as {
      __scormReset?: () => void;
      API?: { LMSSetValue?: (key: string, value: string) => string };
    };
    if (bridge.__scormReset) {
      bridge.__scormReset();
    } else {
      // A page served before the bridge could reset: blank what the course reads.
      bridge.API?.LMSSetValue?.("cmi.core.score.raw", "");
      bridge.API?.LMSSetValue?.("cmi.core.lesson_status", "incomplete");
      bridge.API?.LMSSetValue?.("cmi.suspend_data", "");
      window.dispatchEvent(new CustomEvent("scorm-reset"));
    }
    setAttempt((n) => n + 1);
  };

  // A native <dialog>: focus trap, Esc and backdrop come for free.
  const confirmRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      {/* Must precede the iframe: the package's SCORM driver looks for the API
          as soon as it runs, and never looks again. */}
      <script dangerouslySetInnerHTML={{ __html: scormBridgeScript }} />

      <div className="aspect-16/9 overflow-hidden rounded-[24px] border-[1.5px] border-ink">
        <ScormPlayer
          key={attempt}
          embedded
          minimal
          course={course}
          onProgress={setProgress}
        />
      </div>

      <section
        aria-label="Your result"
        className="card-brutal mt-6 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            Your result
          </p>
          <p
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => confirmRef.current?.showModal()}
        >
          Retake
        </Button>
        <div className="text-right">
          <p className="text-3xl font-bold leading-none text-ink">
            {progress.score === null ? "—" : `${progress.score}%`}
          </p>
          <p className="mt-1.5 text-xs text-secondary">
            {progress.score === null
              ? "Complete the assessment to see your score"
              : "Score reported by the course"}
          </p>
        </div>
      </section>

      <dialog
        ref={confirmRef}
        aria-labelledby="retake-title"
        onClick={(event) => {
          // The backdrop is part of the <dialog> element; padding clicks are not.
          const rect = event.currentTarget.getBoundingClientRect();
          const outside =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;
          if (outside) event.currentTarget.close();
        }}
        className="card-brutal m-auto w-[calc(100%-2rem)] max-w-md bg-white p-6 backdrop:bg-black/40"
      >
        <h2 id="retake-title" className="text-lg font-bold text-ink">
          Retake this course?
        </h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          All saved progress will be wiped — your score and your answers — and
          the course will start from the beginning. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => confirmRef.current?.close()}
          >
            Keep my progress
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              confirmRef.current?.close();
              retake();
            }}
          >
            Wipe progress & retake
          </Button>
        </div>
      </dialog>
    </>
  );
}
