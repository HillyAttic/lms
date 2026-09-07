"use client";

import { cn } from "@/lib/utils";

interface GamePlayerProps {
  gameUrl: string;
  title: string;
  className?: string;
}

export default function GamePlayer({
  gameUrl,
  title,
  className,
}: GamePlayerProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white", className)}>
      <iframe
        src={gameUrl}
        title={title}
        className="h-[500px] w-full"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
