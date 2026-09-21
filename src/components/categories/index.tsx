import { CategoryType } from "@/types/CategoryType";
import SectionTitle from "../sectionTitle";
import {
  getRepositoryItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";

import CategoryCard from "./categoryCard";
import { categoryData } from "./categoryData";

const Categories = async () => {
  // Counts come from the repository so a card can never advertise more courses
  // than `/courses?category=` actually shows — both read the same three collections.
  const result = await getRepositoryItems().catch(() => null);
  const items = result?.success ? (result.data as RepositoryContentItem[]) : [];

  const categories: CategoryType[] = categoryData.map((category) => ({
    ...category,
    courseCount: items.filter((item) => item.type === category.slug.current)
      .length,
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
