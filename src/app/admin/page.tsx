"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-toastify";
import UploadScormModal from "./upload-scorm-modal";
import { Upload, Trash2, Edit, Play } from "@/lib/icons";

interface Course {
  id: string;
  title: string;
  description: string;
  features: string;
  interactivityLevel: number;
  duration: number;
  status: "active" | "draft";
  scormVersion: string;
  createdAt: any;
}

export default function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const snapshot = await getDocs(collection(db, "courses"));
      const coursesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setCourses(coursesData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (error) {
      toast.error("Failed to load courses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await deleteDoc(doc(db, "courses", courseId));
      toast.success("Course deleted successfully");
      loadCourses();
    } catch (error) {
      toast.error("Failed to delete course");
      console.error(error);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    loadCourses();
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
        Draft
      </span>
    );
  };

  const getInteractivityBadge = (level: number) => {
    const colors: Record<number, string> = {
      1: "bg-gray-100 text-gray-800",
      2: "bg-blue-100 text-blue-800",
      2.5: "bg-purple-100 text-purple-800",
      3: "bg-green-100 text-green-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colors[level] || colors[1]}`}
      >
        Level {level}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your SCORM courses</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          Upload SCORM
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">Get started by uploading your first SCORM package</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Upload SCORM
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Course Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Interactivity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SCORM Version
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{course.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {course.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                  <td className="px-6 py-4">
                    {getInteractivityBadge(course.interactivityLevel)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {course.duration} min
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{course.scormVersion}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUploadModal && (
        <UploadScormModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
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
