import SectionTitle from "../sectionTitle";
import TestimonialSlider from "./testimonialSlider";
import { ChevronLeft, ChevronRight } from "@/lib/icons";

/*
 * Keeps the Swiper carousel the page already used — the arrows drive it through
 * the `.testimonial-prev/next-arrow` hooks in testimonialSlider, so no rewrite
 * was needed to change the look.
 */
const Testimonial = () => {
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous testimonial"
              className="testimonial-prev-arrow grid size-12 place-items-center rounded-full border-[1.5px] border-white/25 text-white transition-colors hover:bg-accent hover:text-ink"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              className="testimonial-next-arrow grid size-12 place-items-center rounded-full border-[1.5px] border-white/25 text-white transition-colors hover:bg-accent hover:text-ink"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      <div className="container mt-12 overflow-visible pb-2 sm:mt-14">
        <TestimonialSlider />
      </div>
    </section>
  );
};

export default Testimonial;
