import { CategoryType } from "@/types/CategoryType";

export const categoryData:CategoryType[] = [
  {
    _id: "1",
    courseCount: 15,
    description: "Interactive SCORM-compliant courses for standardized e-learning experiences.",
    slug:{
        current: "scorm-courses"
    },
    title: "SCORM Courses"
  },
  {
    _id: "2",
    courseCount: 12,
    description: "High-quality video courses with expert instructors and engaging content.",
    slug:{
        current: "video-courses"
    },
    title: "Video Courses"
  },
  {
    _id: "3",
    courseCount: 8,
    description: "Fun and interactive game-based courses to learn while playing.",
    slug:{
        current: "game-courses"
    },
    title: "Game Courses"
  },
]