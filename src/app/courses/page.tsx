import PageHeader from "@/components/pageHeader";
import CoursesDsiplay from "./coursesDsiplay";
import { siteName } from "@/utils/envExport";
import { Metadata } from "next";
import {
  getRepositoryItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";

export const metadata: Metadata = {
  title: `Courses | ${siteName}`,
  description: "EdventureHub Online Learning Platform",
};

const Courses = async ({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) => {
  const { category } = await searchParams;

  // The catalogue is whatever has actually been uploaded in the admin panel —
  // SCORM, video and game content all arrive through this one call.
  const result = await getRepositoryItems().catch(() => null);
  const courses =
    result?.success ? (result.data as RepositoryContentItem[]) : [];

  return (
    <main>
      <PageHeader
        description="Learn practical skills from industry experts — self-paced, project-based, and built around work you can show."
        subTitle="Courses"
      >
        Courses to <span className="marker">start</span> today
      </PageHeader>
      <CoursesDsiplay courses={courses} initialCategory={category ?? ""} />
    </main>
  );
};

export default Courses;
