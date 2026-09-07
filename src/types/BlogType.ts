export type BlogTopic =
  | "LMS"
  | "SCORM"
  | "EdTech"
  | "E-Learning"
  | "Digital Learning"
  | "Instructional Design"
  | "Corporate Training"
  | "Gamification"
  | "AI in Education"
  | "Assessment"
  | "Learning Analytics"
  | "Content Development";

export const BLOG_TOPICS: BlogTopic[] = [
  "LMS",
  "SCORM",
  "EdTech",
  "E-Learning",
  "Digital Learning",
  "Instructional Design",
  "Corporate Training",
  "Gamification",
  "AI in Education",
  "Assessment",
  "Learning Analytics",
  "Content Development",
];

export type BlogType = {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  featureImage: string;
  shortDescription: string;
  content: any[];
  author: {
    name: string;
    photo: string;
    title: string;
  };
  date: string;
  topic?: BlogTopic;
  status?: "published" | "draft";
  tags?: string[];
};
