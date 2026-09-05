"use client";

import { useEffect, useState } from "react";
import { getActiveCourses } from "@/app/actions/course-actions";
import { Search, Filter, Play } from "@/lib/icons";
import ScormPlayer from "@/components/repository/scorm-player";

interface Course {
  id: string;
  title: string;
  description: string;
  features: string;
  interactivityLevel: number;
  duration: number;
  status: "active" | "draft";
  scormVersion: string;
  scormStructure: {
    entryPoint: string;
    storagePath: string;
  };
}

export default function RepositoryPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await getActiveCourses();
      setCourses(coursesData as Course[]);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === null || course.interactivityLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getInteractivityBadge = (level: number) => {
    const colors: Record<number, string> = {
      1: "bg-gray-100 text-gray-800 border-gray-200",
      2: "bg-blue-50 text-blue-700 border-blue-200",
      2.5: "bg-purple-50 text-purple-700 border-purple-200",
      3: "bg-green-50 text-green-700 border-green-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[level] || colors[1]}`}
      >
        Level {level}
      </span>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SCORM Repository</h1>
          <p className="text-gray-600 mt-2">
            Browse and launch interactive SCORM courses
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterLevel === null ? "" : filterLevel}
                onChange={(e) =>
                  setFilterLevel(e.target.value === "" ? null : parseFloat(e.target.value))
                }
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">All Levels</option>
                <option value="1">Level 1 - Read Only</option>
                <option value="2">Level 2 - Limited</option>
                <option value="2.5">Level 2.5 - Complex</option>
                <option value="3">Level 3 - Full Simulation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Course Table */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              {searchTerm || filterLevel
                ? "Try adjusting your search or filters"
                : "No SCORM courses available yet"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interactivity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          SCORM {course.scormVersion}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getInteractivityBadge(course.interactivityLevel)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={course.features}>
                          {course.features || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate" title={course.description}>
                          {course.description || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {formatDuration(course.duration)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Launch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      </div>

      {/* SCORM Player Modal */}
      {selectedCourse && (
        <ScormPlayer
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}

function BookOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
