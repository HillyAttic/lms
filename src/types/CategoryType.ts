/** Matches `PublicCourse.category` in Firestore and the `?category=` query param. */
export type CategorySlug = "scorm" | "video" | "game";

export type CategoryType = {
  _id: string;
  title: string;
  description: string;
  courseCount: number;
  image?: string;
  slug: {
    current: CategorySlug;
  };
};
