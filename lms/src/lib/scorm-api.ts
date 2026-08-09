// SCORM API Bridge - Injected into iframe for SCORM content communication

export interface ScormApiBridge {
  courseId: string;
  userId: string;
  scormVersion: "1.2" | "2004";
  dataModel: Record<string, any>;
  saveProgress: (data: any) => Promise<void>;
}

// SCORM 1.2 API Implementation
export function createScorm12Api(bridge: ScormApiBridge) {
  return {
    LMSInitialize: (param: string = ""): string => {
      console.log("SCORM 1.2: LMSInitialize called");
      return "true";
    },

    LMSFinish: (param: string = ""): string => {
      console.log("SCORM 1.2: LMSFinish called");
      // Save final progress
      bridge.saveProgress({
        courseId: bridge.courseId,
        userId: bridge.userId,
        status: bridge.dataModel["cmi.core.lesson_status"] || "incomplete",
        score: bridge.dataModel["cmi.core.score.raw"] || null,
        sessionTime: bridge.dataModel["cmi.core.session_time"] || 0,
        suspendData: bridge.dataModel["cmi.suspend_data"] || "",
      });
      return "true";
    },

    LMSGetValue: (key: string): string => {
      console.log("SCORM 1.2: LMSGetValue", key);
      const value = bridge.dataModel[key];
      return value !== undefined ? String(value) : "";
    },

    LMSSetValue: (key: string, value: string): string => {
      console.log("SCORM 1.2: LMSSetValue", key, value);
      bridge.dataModel[key] = value;

      // Auto-save on certain keys
      if (key === "cmi.core.session_time" || key === "cmi.suspend_data") {
        bridge.saveProgress({
          courseId: bridge.courseId,
          userId: bridge.userId,
          status: bridge.dataModel["cmi.core.lesson_status"] || "incomplete",
          score: bridge.dataModel["cmi.core.score.raw"] || null,
          sessionTime: bridge.dataModel["cmi.core.session_time"] || 0,
          suspendData: bridge.dataModel["cmi.suspend_data"] || "",
        });
      }

      return "true";
    },

    LMSCommit: (param: string = ""): string => {
      console.log("SCORM 1.2: LMSCommit called");
      bridge.saveProgress({
        courseId: bridge.courseId,
        userId: bridge.userId,
        status: bridge.dataModel["cmi.core.lesson_status"] || "incomplete",
        score: bridge.dataModel["cmi.core.score.raw"] || null,
        sessionTime: bridge.dataModel["cmi.core.session_time"] || 0,
        suspendData: bridge.dataModel["cmi.suspend_data"] || "",
      });
      return "true";
    },

    LMSGetLastError: (): string => {
      return "0";
    },

    LMSGetErrorString: (errorCode: string): string => {
      return "";
    },

    LMSGetDiagnostic: (errorCode: string): string => {
      return "";
    },
  };
}

// SCORM 2004 API Implementation
export function createScorm2004Api(bridge: ScormApiBridge) {
  return {
    Initialize: (param: string = ""): string => {
      console.log("SCORM 2004: Initialize called");
      return "true";
    },

    Terminate: (param: string = ""): string => {
      console.log("SCORM 2004: Terminate called");
      bridge.saveProgress({
        courseId: bridge.courseId,
        userId: bridge.userId,
        status: bridge.dataModel["cmi.completion_status"] || "incomplete",
        score: bridge.dataModel["cmi.score.raw"] || null,
        sessionTime: bridge.dataModel["cmi.session_time"] || 0,
        suspendData: bridge.dataModel["cmi.suspend_data"] || "",
      });
      return "true";
    },

    GetValue: (key: string): string => {
      console.log("SCORM 2004: GetValue", key);
      const value = bridge.dataModel[key];
      return value !== undefined ? String(value) : "";
    },

    SetValue: (key: string, value: string): string => {
      console.log("SCORM 2004: SetValue", key, value);
      bridge.dataModel[key] = value;

      // Auto-save on certain keys
      if (key === "cmi.session_time" || key === "cmi.suspend_data") {
        bridge.saveProgress({
          courseId: bridge.courseId,
          userId: bridge.userId,
          status: bridge.dataModel["cmi.completion_status"] || "incomplete",
          score: bridge.dataModel["cmi.score.raw"] || null,
          sessionTime: bridge.dataModel["cmi.session_time"] || 0,
          suspendData: bridge.dataModel["cmi.suspend_data"] || "",
        });
      }

      return "true";
    },

    Commit: (param: string = ""): string => {
      console.log("SCORM 2004: Commit called");
      bridge.saveProgress({
        courseId: bridge.courseId,
        userId: bridge.userId,
        status: bridge.dataModel["cmi.completion_status"] || "incomplete",
        score: bridge.dataModel["cmi.score.raw"] || null,
        sessionTime: bridge.dataModel["cmi.session_time"] || 0,
        suspendData: bridge.dataModel["cmi.suspend_data"] || "",
      });
      return "true";
    },

    GetLastError: (): string => {
      return "0";
    },

    GetErrorString: (errorCode: string): string => {
      return "";
    },

    GetDiagnostic: (errorCode: string): string => {
      return "";
    },
  };
}

// Helper to inject SCORM API into iframe
export function injectScormApi(
  iframe: HTMLIFrameElement,
  courseId: string,
  userId: string,
  scormVersion: "1.2" | "2004",
  saveProgressFn: (data: any) => Promise<void>,
  initialData: Record<string, any> = {}
) {
  const bridge: ScormApiBridge = {
    courseId,
    userId,
    scormVersion,
    dataModel: {
      // Default values
      "cmi.core.student_id": userId,
      "cmi.learner_id": userId,
      "cmi.core.lesson_status": "incomplete",
      "cmi.completion_status": "incomplete",
      "cmi.core.score.raw": null,
      "cmi.score.raw": null,
      "cmi.core.session_time": "0",
      "cmi.session_time": "PT0H0M0S",
      "cmi.suspend_data": "",
      ...initialData,
    },
    saveProgress: saveProgressFn,
  };

  // Wait for iframe to load
  iframe.onload = () => {
    try {
      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) {
        console.error("Cannot access iframe content window");
        return;
      }

      // Inject appropriate API based on SCORM version
      if (scormVersion === "1.2") {
        (iframeWindow as any).API = createScorm12Api(bridge);
        console.log("SCORM 1.2 API injected");
      } else {
        (iframeWindow as any).API_1484_11 = createScorm2004Api(bridge);
        console.log("SCORM 2004 API injected");
      }
    } catch (error) {
      console.error("Failed to inject SCORM API:", error);
    }
  };
}
