"use client";
import { useState } from "react";
import SectionTitle from "../sectionTitle";
import TestimonialSlider from "./testimonialSlider";
import { PauseIcon, Play } from "@/lib/icons";

/*
 * The arrows that used to sit here drove Swiper's Navigation module. A marquee
 * has no next/previous, so they're replaced by a single pause control — which
 * WCAG 2.2.2 requires anyway for content that moves on its own for more than
 * five seconds. Hovering the track pauses it too, via the group.
 */
const Testimonial = () => {
  const [paused, setPaused] = useState(false);

  return (
    <section className="border-t-[1.5px] border-ink bg-dark py-16 text-white sm:py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <SectionTitle
            subTitle="Testimonials"
            titleClassName="text-white"
            descriptionClass="text-white/60"
            subTitleClass="border-white/30 [&_p]:text-white/70"
            description="Grow your skills with expert-led lessons designed to help you achieve your goals — anytime, anywhere."
          >
            What our learners <span className="marker">say</span>
          </SectionTitle>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="grid size-12 place-items-center rounded-full border-[1.5px] border-white/25 text-white transition-colors hover:bg-accent hover:text-ink"
          >
            {paused ? <Play className="size-5" /> : <PauseIcon className="size-5" />}
            <span className="sr-only">
              {paused ? "Resume testimonials" : "Pause testimonials"}
            </span>
          </button>
        </div>
      </div>

      {/* No `overflow-visible` here or on the track: the cards sit in one long
          row and the overflow-hidden wrapper is what keeps the off-screen ones
          from widening the document. */}
      <div className="group container mt-12 pb-2 sm:mt-14">
        <TestimonialSlider paused={paused} />
      </div>
    </section>
  );
};

export default Testimonial;
