import { notFound } from "next/navigation";
import { getVideoCourseById } from "@/app/actions/video-course-actions";
import Breadcrumb from "@/components/breadcrumb";
import VideoPlayer from "@/components/admin/video-player";

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

export default async function WatchVideoPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const result = await getVideoCourseById(itemId);

  if (!result.success || !("data" in result) || !result.data) {
    notFound();
  }

  const course = result.data as {
    title?: string;
    description?: string;
    duration?: number;
    videoUrl?: string;
    thumbnailUrl?: string | null;
  };

  if (!course.videoUrl) {
    notFound();
  }

  return (
    <main className="bg-background pb-20 pt-8 sm:pt-10">
      <div className="container">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Courses", href: "/courses" },
            { label: course.title || "Video course" },
          ]}
        />

        <div className="mx-auto mt-8 max-w-4xl">
          <VideoPlayer
            videoUrl={course.videoUrl}
            thumbnailUrl={course.thumbnailUrl}
            title={course.title || "Video course"}
            className="border-[1.5px] border-ink"
          />

          <h1 className="display-2 mt-8 text-balance">
            {course.title || "Untitled course"}
          </h1>

          {course.duration ? (
            <p className="mt-3 text-sm font-semibold tracking-[0.08em] text-secondary uppercase">
              {formatDuration(course.duration)}
            </p>
          ) : null}

          {course.description ? (
            <p className="mt-6 max-w-2xl leading-8 whitespace-pre-line text-secondary text-pretty">
              {course.description}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
