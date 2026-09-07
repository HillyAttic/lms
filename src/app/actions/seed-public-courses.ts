"use server";

import { adminDb, FieldValue } from "@/lib/firebase-admin";

const COLLECTION = "public_courses";

const coursesToSeed = [
  {
    title: "Complete React Developer Course",
    shortDescription: "Learn React from basics to advanced with real-world projects.",
    thumbnailUrl: "/images/courses/img-1.png",
    instructor: { name: "John Doe" },
    totalLearners: 1200,
    isCertificationProvide: true,
    price: 120,
    discountPrice: 79,
    status: "Ongoing",
    slug: "complete-react-developer",
    level: "Beginner to Advanced",
    overview: [],
    duration: 120,
    lessonsCount: 24,
  },
  {
    title: "Next.js Full Stack Bootcamp",
    shortDescription: "Build full-stack applications using Next.js and modern tools.",
    thumbnailUrl: "/images/courses/img-2.png",
    instructor: { name: "Sarah Ahmed" },
    totalLearners: 850,
    isCertificationProvide: true,
    price: 150,
    discountPrice: 99,
    status: "Ongoing",
    slug: "nextjs-fullstack-bootcamp",
    level: "Intermediate",
    overview: [],
    duration: 180,
    lessonsCount: 30,
  },
  {
    title: "JavaScript Mastery",
    shortDescription: "Master core JavaScript concepts and advanced patterns.",
    thumbnailUrl: "/images/courses/img-3.png",
    instructor: { name: "Michael Lee" },
    totalLearners: 2000,
    isCertificationProvide: true,
    price: 100,
    discountPrice: 69,
    status: "Completed",
    slug: "javascript-mastery",
    level: "Beginner",
    overview: [],
    duration: 200,
    lessonsCount: 28,
  },
  {
    title: "UI/UX Design Fundamentals",
    shortDescription: "Learn the basics of UI/UX design and Figma workflows.",
    thumbnailUrl: "/images/courses/img-4.png",
    instructor: { name: "Emily Carter" },
    totalLearners: 640,
    isCertificationProvide: false,
    price: 80,
    discountPrice: 49,
    status: "Completed",
    slug: "ui-ux-design-fundamentals",
    level: "Beginner",
    overview: [],
    duration: 190,
    lessonsCount: 26,
  },
  {
    title: "Node.js & Express API Development",
    shortDescription: "Build scalable backend APIs using Node.js and Express.",
    thumbnailUrl: "/images/courses/img-5.png",
    instructor: { name: "David Kim" },
    totalLearners: 950,
    isCertificationProvide: true,
    price: 110,
    discountPrice: 75,
    status: "Ongoing",
    slug: "node-express-api",
    level: "Intermediate",
    overview: [],
    duration: 300,
    lessonsCount: 58,
  },
  {
    title: "Digital Marketing Complete Guide",
    shortDescription: "Learn SEO, social media marketing, and paid ads strategies.",
    thumbnailUrl: "/images/courses/img-6.png",
    instructor: { name: "Nusrat Jahan" },
    totalLearners: 720,
    isCertificationProvide: true,
    price: 90,
    discountPrice: 59,
    status: "Completed",
    slug: "digital-marketing-guide",
    level: "Beginner",
    overview: [],
    duration: 120,
    lessonsCount: 24,
  },
];

export async function seedPublicCourses() {
  try {
    // Check if courses already exist
    const existingSnapshot = await adminDb.collection(COLLECTION).get();
    if (!existingSnapshot.empty) {
      return {
        success: false,
        error: "Courses already exist in the database. Skipping seed.",
      };
    }

    // Add all courses
    const batch = adminDb.batch();

    for (const course of coursesToSeed) {
      const docRef = adminDb.collection(COLLECTION).doc();
      batch.set(docRef, {
        ...course,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return {
      success: true,
      data: { count: coursesToSeed.length },
    };
  } catch (error: any) {
    console.error("Seed public courses error:", error);
    return { success: false, error: error.message };
  }
}
