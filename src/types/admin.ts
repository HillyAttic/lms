export type UserRole = "admin" | "instructor" | "learner";

export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  features: string;
  interactivityLevel: number;
  duration: number;
  status: "active" | "draft";
  scormVersion: string;
  thumbnailUrl: string | null;
  categories: string[];
  tags: string[];
  objectives: string;
  prerequisites: string;
  targetAudience: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  scormStructure: {
    entryPoint: string;
    storagePath: string;
    sourceZipPath: string;
    scos: Array<{
      identifier: string;
      title: string;
      href: string;
      resources: string[];
    }>;
  };
}

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  createdAt: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

export interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  draftCourses: number;
  totalUsers: number;
  adminCount: number;
  instructorCount: number;
  learnerCount: number;
  recentUploads: AdminCourse[];
}

export interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string | null;
  primaryColor: string;
  allowSelfRegistration: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityItem {
  id: string;
  type: "course_created" | "course_updated" | "course_deleted" | "user_created" | "user_role_changed";
  description: string;
  userId: string;
  userName: string;
  targetId: string;
  targetName: string;
  createdAt: any;
}
