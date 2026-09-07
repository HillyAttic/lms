"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/app/actions/stats-actions";
import { toast } from "react-toastify";
import { BookOpen, Users, Upload, ArrowRight, BarChart, TrendingUp, Video, Sparkles, FileArchive } from "@/lib/icons";
import StatCard from "@/components/admin/stat-card";
import Badge from "@/components/admin/badge";
import LoadingSpinner from "@/components/admin/loading-spinner";
import PageHeader from "@/components/admin/page-header";

interface DashboardData {
  totalCourses: number;
  activeCourses: number;
  draftCourses: number;
  totalVideoCourses: number;
  activeVideoCourses: number;
  totalGameCourses: number;
  activeGameCourses: number;
  totalUsers: number;
  adminCount: number;
  instructorCount: number;
  learnerCount: number;
  recentUploads: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: any;
    scormVersion: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const result = await getDashboardStats();
      if (result.success) {
        setStats(result.data as DashboardData);
      } else {
        toast.error("Failed to load dashboard stats");
      }
    } catch (error) {
      toast.error("Failed to load dashboard stats");
      console.error(error);
    } finally {
      setLoading(false);
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
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to the admin panel"
        actions={
          <Link
            href="/admin/upload"
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload SCORM
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          icon={<BookOpen className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Video Courses"
          value={stats?.totalVideoCourses || 0}
          icon={<Video className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Game Courses"
          value={stats?.totalGameCourses || 0}
          icon={<Sparkles className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Active Courses"
          value={stats?.activeCourses || 0}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Admins"
          value={stats?.adminCount || 0}
          icon={<BarChart className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/upload"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Upload className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-medium text-gray-900">Upload SCORM</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/admin/courses"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium text-gray-900">Manage Courses</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/admin/video-courses"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Video className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="font-medium text-gray-900">Video Courses</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/admin/game-courses"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-medium text-gray-900">Game Courses</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium text-gray-900">Manage Users</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link
          href="/admin/repository"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileArchive className="w-5 h-5 text-slate-600" />
            </div>
            <span className="font-medium text-gray-900">Repository</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Recent Uploads */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
        </div>
        {stats?.recentUploads && stats.recentUploads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Course Name
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:table-cell">
                    Status
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 md:table-cell">
                    SCORM Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Uploaded
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentUploads.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="font-medium text-gray-900 hover:text-purple-600"
                      >
                        {course.title}
                      </Link>
                      <div className="mt-1 sm:hidden">
                        <Badge
                          label={course.status === "active" ? "Active" : "Draft"}
                          variant={course.status === "active" ? "success" : "warning"}
                        />
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 sm:table-cell">
                      <Badge
                        label={course.status === "active" ? "Active" : "Draft"}
                        variant={course.status === "active" ? "success" : "warning"}
                      />
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-gray-600 md:table-cell">
                      {course.scormVersion}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(course.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No courses uploaded yet
          </div>
        )}
      </div>

      {/* User Role Breakdown */}
      <div className="mt-8 rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">User Roles</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats?.adminCount || 0}</p>
            <p className="text-sm text-gray-600">Admins</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.instructorCount || 0}</p>
            <p className="text-sm text-gray-600">Instructors</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.learnerCount || 0}</p>
            <p className="text-sm text-gray-600">Learners</p>
          </div>
        </div>
      </div>
    </div>
  );
}
