"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/breadcrumb";
import ScormPlayer from "@/components/repository/scorm-player";
import VideoPlayer from "@/components/admin/video-player";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";
import {
  getPublicCourseBySlug,
  type PublicCourse,
} from "@/app/actions/public-course-actions";
import {
  getLaunchableItemById,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";

export default function CourseLaunchPage() {
  const { slug } = useParams<{ slug: string }>();
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<RepositoryContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const load = async () => {
      // The slug may name a `public_courses` record or, when none was created,
      // the repository upload itself — see the detail page for the same fallback.
      const publicResult = await getPublicCourseBySlug(slug);
      if (!isCurrent) return;

      const publicCourse = publicResult.success
        ? (publicResult.data as PublicCourse)
        : null;
      setTitle(publicCourse?.title || null);

      const itemResult = await getLaunchableItemById(
        publicCourse?.contentId || slug
      );
      if (!isCurrent) return;

      if (!itemResult.success) {
        setError(
          publicCourse
            ? "No content is linked to this course yet."
            : "Course not found"
        );
        setLoading(false);
        return;
      }

      const item = itemResult.data as RepositoryContentItem;
      setTitle((current) => current || item.name);
      setContent(item);
      setLoading(false);
    };

    void load();

    return () => {
      isCurrent = false;
    };
  }, [slug]);

  return (
    <main className="bg-gray-50 py-10 sm:py-14">
      <div className="container">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: title || "Course", href: `/courses/${slug}` },
            { label: "Assessment" },
          ]}
        />

        <div className="mx-auto mt-8 max-w-5xl">
          {loading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#7D52F4] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-card">
              <h2 className="text-xl font-semibold">{error}</h2>
              <p className="mt-2 text-sm text-secondary">
                Please check back later or browse the catalogue.
              </p>
              <Button asChild size="lg" className="mt-6 rounded-full px-8">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          ) : content?.type === "scorm" ? (
            <>
              <div className="aspect-16/9 overflow-hidden rounded-[2rem] shadow-card">
                <ScormPlayer
                  embedded
                  minimal
                  course={{
                    id: content.id,
                    title: content.name,
                    scormVersion: content.scormVersion || "1.2",
                    scormStructure: {
                      entryPoint: content.entryPoint || "story.html",
                      // Empty here routes the player through the launch proxy,
                      // which resolves the storage path on the server.
                      storagePath: "",
                    },
                  }}
                />
              </div>
              <h2 className="mt-8 text-center text-2xl font-semibold">
                {title || content.name}
              </h2>
            </>
          ) : content?.type === "video" ? (
            <VideoPlayer
              videoUrl={content.videoUrl || ""}
              thumbnailUrl={content.thumbnailUrl}
              title={content.name}
            />
          ) : content?.type === "game" ? (
            <div className="aspect-16/9 overflow-hidden rounded-[2rem] bg-black shadow-card">
              <iframe
                src={content.gameUrl || `/api/game/launch/${content.id}`}
                title={content.name}
                className="h-full w-full border-0"
                allowFullScreen
              />
            </div>
          ) : null}

          {!loading && !error && (
            <div className="mt-8 text-center">
              <Link
                href={`/courses/${slug}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#7D52F4] transition-colors hover:text-purple-700"
              >
                <ButtonArrow />
                Back to course details
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
