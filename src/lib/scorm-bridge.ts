/**
 * The LMS side of the SCORM bridge, rendered into the launch page *before* the
 * iframe so it runs before the package starts.
 *
 * Storyline's SCORM driver searches its own window and then every parent for
 * `API` / `API_1484_11`. Defining them on this page means the driver finds a
 * working LMS no matter how late React hydrates — the previous approach injected
 * the API from the parent's `onload`, which is after the driver has already
 * given up. Results are kept on `window.__scormProgress` and dispatched as a
 * `scorm-progress` event for the player to persist.
 *
 * The `index_lms.html` entry point is the one to launch: `story.html` is the
 * web-only build (`lmsPresent: false`) and never talks to an LMS at all.
 */
export const scormBridgeScript = `(function () {
  if (window.API || window.API_1484_11) return;

  var model = {
    "cmi.core.student_id": "learner",
    "cmi.learner_id": "learner",
    "cmi.core.lesson_status": "incomplete",
    "cmi.completion_status": "incomplete",
    "cmi.success_status": "",
    "cmi.core.score.raw": "",
    "cmi.score.raw": "",
    "cmi.core.session_time": "0",
    "cmi.session_time": "PT0H0M0S",
    "cmi.suspend_data": ""
  };

  var finished = false;

  function currentStatus() {
    var status = model["cmi.core.lesson_status"];
    if (!status || status === "not attempted" || status === "browsed") {
      status = model["cmi.success_status"] || model["cmi.completion_status"] || "incomplete";
    }
    return status === "not attempted" ? "incomplete" : status;
  }

  function hasScore() {
    return model["cmi.core.score.raw"] !== "" || model["cmi.score.raw"] !== "";
  }

  function hasTerminalStatus() {
    var status = currentStatus();
    return status === "passed" || status === "failed" || status === "completed";
  }

  function hasResult() {
    return hasScore() || hasTerminalStatus();
  }

  // A retake: the course clears its own score/status. The page must drop the
  // stored result too, so the last score survives only until this point.
  function clearModel() {
    model["cmi.core.score.raw"] = "";
    model["cmi.score.raw"] = "";
    model["cmi.core.lesson_status"] = "incomplete";
    model["cmi.completion_status"] = "incomplete";
    model["cmi.success_status"] = "";
    model["cmi.suspend_data"] = "";
    model["cmi.core.session_time"] = "0";
    model["cmi.session_time"] = "PT0H0M0S";
    window.__scormProgress = null;
    try {
      window.dispatchEvent(new CustomEvent("scorm-reset"));
    } catch (error) {
      if (typeof window.__scormOnReset === "function") window.__scormOnReset();
    }
  }

  function resetModel() {
    if (hasResult()) clearModel();
  }

  // The page's Retake button reloads the frame; the new attempt must start
  // empty rather than resume the attempt being redone.
  window.__scormReset = function () {
    finished = false;
    clearModel();
  };

  function report() {
    var progress = {
      status: currentStatus(),
      score: model["cmi.core.score.raw"] || model["cmi.score.raw"] || null,
      sessionTime: Number(model["cmi.core.session_time"]) || Number(model["cmi.session_time"]) || 0,
      suspendData: model["cmi.suspend_data"] || ""
    };
    window.__scormProgress = progress;
    try {
      window.dispatchEvent(new CustomEvent("scorm-progress", { detail: progress }));
    } catch (error) {
      if (typeof window.__scormOnProgress === "function") window.__scormOnProgress(progress);
    }
  }

  function setValue(key, value) {
    var next = value === null || value === undefined ? "" : String(value);
    /* A fresh attempt clears the old result: the score is blanked, or a
       finished attempt is flipped back to incomplete. A mid-quiz "incomplete"
       write is ordinary, so it only counts once a terminal status is set. */
    var clearing =
      (key.indexOf("score") !== -1 && next === "" && hasScore()) ||
      (key.indexOf("status") !== -1 && next === "incomplete" && hasTerminalStatus());
    if (clearing) clearModel();
    model[key] = next;
    if (key.indexOf("score") !== -1 || key.indexOf("status") !== -1 || key.indexOf("session_time") !== -1) {
      report();
    }
    return "true";
  }

  window.API = {
    LMSInitialize: function () {
      if (finished) {
        finished = false;
        resetModel();
      }
      return "true";
    },
    LMSFinish: function () { finished = true; report(); return "true"; },
    LMSGetValue: function (key) { return model[key] === undefined ? "" : String(model[key]); },
    LMSSetValue: setValue,
    LMSCommit: function () { report(); return "true"; },
    LMSGetLastError: function () { return "0"; },
    LMSGetErrorString: function () { return ""; },
    LMSGetDiagnostic: function () { return ""; }
  };

  window.API_1484_11 = {
    Initialize: function () {
      if (finished) {
        finished = false;
        resetModel();
      }
      return "true";
    },
    Terminate: function () { finished = true; report(); return "true"; },
    GetValue: function (key) { return model[key] === undefined ? "" : String(model[key]); },
    SetValue: setValue,
    Commit: function () { report(); return "true"; },
    GetLastError: function () { return "0"; },
    GetErrorString: function () { return ""; },
    GetDiagnostic: function () { return ""; }
  };
})();`;
