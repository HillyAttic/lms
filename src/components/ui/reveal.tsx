"use client";

import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
 * Fade-up on first scroll into view. Everything here is CSS (`animate-fade-up`),
 * so `prefers-reduced-motion` in globals.css turns it off for free.
 */
const Reveal = ({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Stagger, in ms. Keep under ~200ms so a grid doesn't feel like a queue. */
  delay?: number;
  as?: "div" | "li" | "section";
}) => {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true });

  return (
    <Tag
      ref={ref}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(inView ? "animate-fade-up" : "opacity-0", className)}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
