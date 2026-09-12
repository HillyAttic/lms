"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getExternalShareByToken } from "@/app/actions/external-share-actions";
import LoadingSpinner from "@/components/admin/loading-spinner";

interface CourseItem {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  status?: string;
}

interface ShareData {
  name: string;
  email: string | null;
  mobile: string | null;
  accessTypes: string[];
  expiresAt: any;
  courses: {
    scorm: CourseItem[];
    video: CourseItem[];
    game: CourseItem[];
  };
}

export default function SharedPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ShareData | null>(null);

  useEffect(() => {
    if (token) {
      loadShareData();
    }
  }, [token]);

  const loadShareData = async () => {
    try {
      const result = await getExternalShareByToken(token);
      if (result.success) {
        setData(result.data as ShareData);
      } else {
        setError(result.error || "Failed to load content");
      }
    } catch (err) {
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const launchScorm = (course: any) => {
    // Launch based on source collection
    if (course.source === "repository") {
      window.open(`/api/repository/launch/${course.id}/story.html`, "_blank");
    } else {
      // For courses collection, try the same launch endpoint
      window.open(`/api/repository/launch/${course.id}/story.html`, "_blank");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalCourses =
    (data.courses?.scorm?.length || 0) +
    (data.courses?.video?.length || 0) +
    (data.courses?.game?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <span className="text-lg font-medium text-purple-600">
                {data.name?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {data.name}
              </h1>
              <p className="text-sm text-gray-500">
                {totalCourses} course{totalCourses !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.accessTypes.includes("scorm") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                SCORM Content
              </span>
            )}
            {data.accessTypes.includes("video") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Video Content
              </span>
            )}
            {data.accessTypes.includes("game") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Game Content
              </span>
            )}
          </div>
          {data.expiresAt && (
            <p className="mt-3 text-xs text-gray-400">
              This link expires on {formatDate(data.expiresAt)}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        {/* SCORM Courses */}
        {data.courses?.scorm?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-purple-100">
                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              SCORM Courses
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.courses.scorm.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-gray-900 mb-3">{course.title}</h3>
                  <button
                    onClick={() => launchScorm(course)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-purple-700"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Launch Course
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video Courses */}
        {data.courses?.video?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
              Video Courses
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.courses.video.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="mb-3 w-full h-40 object-cover rounded-lg"
                    />
                  )}
                  <h3 className="font-medium text-gray-900 mb-3">{course.title}</h3>
                  <p className="text-sm text-gray-500">Video Course</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Game Courses */}
        {data.courses?.game?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Game Courses
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.courses.game.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="mb-3 w-full h-40 object-cover rounded-lg"
                    />
                  )}
                  <h3 className="font-medium text-gray-900 mb-3">{course.title}</h3>
                  <p className="text-sm text-gray-500">Game Course</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No courses fallback */}
        {totalCourses === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No courses available for this share link.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 text-center">
          <p className="text-xs text-gray-400">
            This content is shared via a secure link. Do not share this link with others.
          </p>
        </div>
      </div>
    </div>
  );
}
