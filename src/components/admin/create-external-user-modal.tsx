"use client";

import { useState, useEffect, FormEvent } from "react";
import { X, LinkIcon } from "@/lib/icons";
import { createExternalShare, getCoursesForSelection } from "@/app/actions/external-share-actions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";

interface CourseItem {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  source?: "courses" | "repository";
}

interface CoursesData {
  scorm: CourseItem[];
  video: CourseItem[];
  game: CourseItem[];
}

interface CreateExternalUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateExternalUserModal({ onClose, onSuccess }: CreateExternalUserModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedScorm, setSelectedScorm] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<string[]>([]);
  const [courses, setCourses] = useState<CoursesData>({ scorm: [], video: [], game: [] });
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [expandedScorm, setExpandedScorm] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState(false);
  const [expandedGame, setExpandedGame] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadCourses();
    }
  }, [user?.uid]);

  const loadCourses = async () => {
    try {
      if (!user?.uid) return;
      const result = await getCoursesForSelection(user.uid);
      if (result.success) {
        setCourses(result.data as CoursesData);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const toggleCourse = (type: "scorm" | "video" | "game", id: string) => {
    const setter = type === "scorm" ? setSelectedScorm : type === "video" ? setSelectedVideo : setSelectedGame;
    setter((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = (type: "scorm" | "video" | "game") => {
    const list = courses[type];
    const setter = type === "scorm" ? setSelectedScorm : type === "video" ? setSelectedVideo : setSelectedGame;
    const selected = type === "scorm" ? selectedScorm : type === "video" ? selectedVideo : selectedGame;

    if (selected.length === list.length) {
      setter([]);
    } else {
      setter(list.map((c) => c.id));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!email.trim() && !mobile.trim()) {
      toast.error("At least email or mobile number is required");
      return;
    }

    const totalSelected = selectedScorm.length + selectedVideo.length + selectedGame.length;
    if (totalSelected === 0) {
      toast.error("Please select at least one course");
      return;
    }

    setLoading(true);
    try {
      if (!user?.uid) {
        toast.error("You must be logged in");
        return;
      }

      // Build SCORM items with source info
      const scormItems = selectedScorm.map((id) => {
        const course = courses.scorm.find((c) => c.id === id);
        return { id, source: course?.source || "courses" };
      });

      const result = await createExternalShare(
        {
          name: name.trim(),
          email: email.trim() || undefined,
          mobile: mobile.trim() || undefined,
          courseIds: {
            scorm: scormItems,
            video: selectedVideo,
            game: selectedGame,
          },
        },
        user.uid
      );

      if (result.success && result.data) {
        setGeneratedLink(result.data.shareUrl);
        toast.success("Share link generated successfully");
      } else {
        toast.error(result.error || "Failed to create share link");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareViaWhatsApp = () => {
    if (!generatedLink) return;
    const text = encodeURIComponent(`Check out this content: ${generatedLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaEmail = () => {
    if (!generatedLink) return;
    const subject = encodeURIComponent("Content Access Link");
    const body = encodeURIComponent(`Here is your access link: ${generatedLink}\n\nThis link is valid for 15 days.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // If link is generated, show success view
  if (generatedLink) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white">
          <div className="flex items-center justify-between border-b p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Share Link Generated</h2>
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Share link for <strong>{name}</strong> has been created successfully.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700"
                />
                <button
                  onClick={copyToClipboard}
                  className="shrink-0 rounded-lg bg-purple-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-purple-700"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share via
              </label>
              <div className="flex gap-3">
                <button
                  onClick={shareViaWhatsApp}
                  className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm text-white transition-colors hover:bg-green-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </button>
                <button
                  onClick={shareViaEmail}
                  className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm text-white transition-colors hover:bg-blue-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              This link is valid for 15 days and will expire on{" "}
              {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white">
        <div className="flex items-center justify-between border-b p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Add External User</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter email address"
            />
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm font-medium text-gray-500">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter mobile number"
            />
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Courses *
            </label>

            {loadingCourses ? (
              <div className="text-sm text-gray-500">Loading courses...</div>
            ) : (
              <div className="space-y-3">
                {/* SCORM Courses */}
                {courses.scorm.length > 0 && (
                  <div className="rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setExpandedScorm(!expandedScorm)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedScorm.length === courses.scorm.length && courses.scorm.length > 0}
                          onChange={() => toggleAll("scorm")}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          SCORM Courses ({selectedScorm.length}/{courses.scorm.length})
                        </span>
                      </div>
                      <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${expandedScorm ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedScorm && (
                      <div className="max-h-48 overflow-y-auto border-t border-gray-200 px-4 py-2">
                        {courses.scorm.map((course) => (
                          <label
                            key={course.id}
                            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedScorm.includes(course.id)}
                              onChange={() => toggleCourse("scorm", course.id)}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{course.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Video Courses */}
                {courses.video.length > 0 && (
                  <div className="rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setExpandedVideo(!expandedVideo)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedVideo.length === courses.video.length && courses.video.length > 0}
                          onChange={() => toggleAll("video")}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Video Courses ({selectedVideo.length}/{courses.video.length})
                        </span>
                      </div>
                      <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${expandedVideo ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedVideo && (
                      <div className="max-h-48 overflow-y-auto border-t border-gray-200 px-4 py-2">
                        {courses.video.map((course) => (
                          <label
                            key={course.id}
                            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedVideo.includes(course.id)}
                              onChange={() => toggleCourse("video", course.id)}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{course.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Game Courses */}
                {courses.game.length > 0 && (
                  <div className="rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setExpandedGame(!expandedGame)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedGame.length === courses.game.length && courses.game.length > 0}
                          onChange={() => toggleAll("game")}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Game Courses ({selectedGame.length}/{courses.game.length})
                        </span>
                      </div>
                      <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${expandedGame ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedGame && (
                      <div className="max-h-48 overflow-y-auto border-t border-gray-200 px-4 py-2">
                        {courses.game.map((course) => (
                          <label
                            key={course.id}
                            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedGame.includes(course.id)}
                              onChange={() => toggleCourse("game", course.id)}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{course.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {courses.scorm.length === 0 && courses.video.length === 0 && courses.game.length === 0 && (
                  <p className="text-sm text-gray-500">No courses available. Please create courses first.</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
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
              disabled={loading}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Generating..." : "Generate Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
