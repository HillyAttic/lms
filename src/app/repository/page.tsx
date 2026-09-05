"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  getRepositoryItems,
} from "@/app/actions/repository-actions";
import { checkRepositoryAccess } from "@/app/actions/user-actions";
import { Search, Filter, Play, RefreshCw } from "@/lib/icons";

interface RepositoryItem {
  id: string;
  serialNumber: number;
  name: string;
  interactivityLevel: number;
  features: string;
  description: string;
  duration: number;
  scormVersion: string;
  entryPoint: string;
}

export default function RepositoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // User not logged in, redirect to login
        router.push("/admin/login");
      } else {
        checkAccess();
      }
    }
  }, [user, authLoading]);

  const checkAccess = async () => {
    if (!user) return;

    const result = await checkRepositoryAccess(user.uid);
    if (result.success) {
      setHasAccess(result.hasAccess);
      if (result.hasAccess) {
        loadItems();
      } else {
        setLoading(false);
      }
    } else {
      setHasAccess(false);
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const result = await getRepositoryItems();
      if (result.success) {
        setItems(result.data as RepositoryItem[]);
      }
    } catch (error) {
      console.error("Failed to load repository items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (item: RepositoryItem) => {
    setLaunchingId(item.id);
    try {
      // Open via proxy route — hides signed URL, serves all assets cleanly
      window.open(`/api/repository/launch/${item.id}/story.html`, "_blank");
    } catch (error) {
      console.error("Failed to launch SCORM:", error);
      alert("Failed to launch SCORM package. Please try again.");
    } finally {
      setLaunchingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.features?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel =
      filterLevel === null || item.interactivityLevel === filterLevel;
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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  // Not logged in state (shouldn't reach here due to redirect, but just in case)
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
        <p className="text-gray-600 mb-4">Please log in to access the repository.</p>
        <button
          onClick={() => router.push("/admin/login")}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  // No access state
  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don't have access to the repository. Please contact an administrator.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Go Home
        </button>
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

        {/* Excel-like Table */}
        {filteredItems.length === 0 ? (
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[60px]">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[200px]">
                      Module Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[120px]">
                      Interactivity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[150px]">
                      Features
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[250px]">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[100px]">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[100px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 text-center">
                        {item.serialNumber}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          SCORM {item.scormVersion}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        {getInteractivityBadge(item.interactivityLevel)}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <div className="text-sm text-gray-600" title={item.features}>
                          {item.features || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <div className="text-sm text-gray-600" title={item.description}>
                          {item.description || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <span className="text-sm text-gray-600">
                          {formatDuration(item.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleLaunch(item)}
                          disabled={launchingId === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {launchingId === item.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Launch
                            </>
                          )}
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
          Showing {filteredItems.length} of {items.length} courses
        </div>
      </div>
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
