import {
  Bolt,
  Certificate,
  DesktopComputer,
  LifeRing,
  Sparkles,
  TargetIcon,
} from "@/lib/icons";
import { ReactElement } from "react";

type reasonType = {
  id: number;
  icon: ReactElement;
  title: string;
  description: string;
};

export const whyChooseData: reasonType[] = [
  {
    id: 1,
    icon: <Sparkles />,
    title: "Built by Practitioners",
    description:
      "Courses are designed and taught by people who do the work — not just talk about it.",
  },
  {
    id: 2,
    icon: <TargetIcon />,
    title: "Progress You Can See",
    description:
      "Lessons, quizzes, and milestones are tracked in your dashboard, so you always know where you stand.",
  },
  {
    id: 3,
    icon: <Certificate />,
    title: "Certificates That Count",
    description:
      "Finish a course and earn a verified certificate you can add to your portfolio and LinkedIn.",
  },
  {
    id: 4,
    icon: <Bolt />,
    title: "Practical, Not Theoretical",
    description:
      "Hands-on projects and real scenarios instead of passive video watching.",
  },
  {
    id: 5,
    icon: <DesktopComputer />,
    title: "Learn on Any Device",
    description:
      "Pick up exactly where you left off on desktop, tablet, or phone.",
  },
  {
    id: 6,
    icon: <LifeRing />,
    title: "Support That Responds",
    description:
      "Real help when you get stuck — from our team and from learners on the same path.",
  },
];

export const storyHighlights = [
  "Self-paced learning that fits around a full-time schedule",
  "Curated paths from first lesson to job-ready skills",
  "A growing library across design, tech, and business",
];
