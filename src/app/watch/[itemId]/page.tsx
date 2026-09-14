import { notFound } from "next/navigation";
import { getVideoCourseById } from "@/app/actions/video-course-actions";
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
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <VideoPlayer
          videoUrl={course.videoUrl}
          thumbnailUrl={course.thumbnailUrl}
          title={course.title || "Video course"}
        />

        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
          {course.title || "Untitled course"}
        </h1>

        {course.duration ? (
          <p className="mt-2 text-sm text-gray-400">
            {formatDuration(course.duration)}
          </p>
        ) : null}

        {course.description ? (
          <p className="mt-4 whitespace-pre-line text-gray-300">
            {course.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
