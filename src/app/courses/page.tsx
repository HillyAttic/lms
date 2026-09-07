import PageHeader from "@/components/pageHeader";
import CoursesDsiplay from "./coursesDsiplay";
import { siteName } from "@/utils/envExport";
import { Metadata } from "next";
import { getPublicCourses } from "@/app/actions/public-course-actions";

export const metadata: Metadata = {
  title: `Courses | ${siteName}`,
  description: "EdventureHub Online Learning Platform",
};

const Courses = async () => {
  let courses = [];

  try {
    const result = await getPublicCourses();
    if (Array.isArray(result)) {
      courses = result;
    }
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    // Fallback to empty array on error
    courses = [];
  }

  return (
    <main>
      <PageHeader
        description="Grow your skills with expert-led lessons designed to help you achieve your goals — anytime, anywhere."
        subTitle="Our Courses"
      >
        Our Popular Courses
      </PageHeader>
      <CoursesDsiplay courses={courses} />
    </main>
  );
};

export default Courses;
