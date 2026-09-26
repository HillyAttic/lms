/*
 * Titles and copy are the template's own; the icon and stock-thumbnail fields
 * are gone because the new section is typographic — numbering carries the
 * hierarchy instead of icon tiles.
 */
type featureType = {
  id: number;
  title: string;
  description: string;
};

export const featuresData: featureType[] = [
  {
    id: 1,
    title: "Learn from experts",
    description:
      "Earn from experienced professionals who bring real-world expertise to every lesson.",
  },
  {
    id: 2,
    title: "Learn by doing",
    description:
      "Engage with video lessons, assignments and quizzes that make learning practical from the first module.",
  },
  {
    id: 3,
    title: "Build real skills",
    description:
      "Every course is built around work you can show — projects, modules and assessments, not passive watching.",
  },
  {
    id: 4,
    title: "Earn recognised certificates",
    description:
      "Boost your portfolio with verified certificates issued to your dashboard after you complete a course.",
  },
];
