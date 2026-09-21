import { CategoryType } from "@/types/CategoryType";
import { CourseType } from "@/types/CourseType";
import SectionTitle from "../sectionTitle";
import { getPublicCourses } from "@/app/actions/public-course-actions";

import CategoryCard from "./categoryCard";
import { categoryData } from "./categoryData";

const Categories = async () => {
  // Counts come from `public_courses.category` so a card can never advertise
  // more courses than clicking through actually shows.
  const courses: CourseType[] = await getPublicCourses().catch(() => []);

  const categories: CategoryType[] = categoryData.map((category) => ({
    ...category,
    courseCount: courses.filter(
      (course) => course.category === category.slug.current,
    ).length,
  }));

  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-28">
      <div className="container">
        <SectionTitle subTitle="Categories">Explore Category</SectionTitle>
        <div className="grid gap-4 pt-11 sm:grid-cols-2 sm:pt-14 lg:grid-cols-3 lg:pt-16">
          {categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
