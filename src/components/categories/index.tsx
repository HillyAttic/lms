import { CategoryType } from "@/types/CategoryType";
import SectionTitle from "../sectionTitle";
import {
  getRepositoryItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";

import CategoryCard from "./categoryCard";
import { categoryData } from "./categoryData";
import Reveal from "../ui/reveal";

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
    <section className="py-16 sm:py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            subTitle="Categories"
            description="Three formats, one library — pick the way you learn best."
          >
            Explore what you
            <br className="hidden sm:block" /> can <span className="marker">learn</span>
          </SectionTitle>
        </div>

        <ul className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal as="li" key={category._id} delay={index * 80}>
              <CategoryCard category={category} index={index} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Categories;
