"use client";

import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  className?: string;
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  className,
}: VideoPlayerProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl bg-black", className)}>
      <video
        className="h-auto w-full"
        controls
        preload="metadata"
        poster={thumbnailUrl || undefined}
        src={videoUrl}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
