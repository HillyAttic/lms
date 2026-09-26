import Button from "../ui/button";
import Link from "next/link";
import ButtonArrow from "../ui/buttonArrow";
import { cn } from "@/lib/utils";
import { CtaIllustration } from "../illustrations";
import Reveal from "../ui/reveal";

/*
 * Ink panel on the off-white ground, with the drawn artwork bleeding off the
 * right edge. Same section is reused at the foot of most inner pages, so it
 * takes a `className` for spacing only.
 */
const Cta = ({ className }: { className?: string }) => {
  return (
    <section className={cn("pt-16 sm:pt-20 lg:pt-28", className)}>
      <div className="container">
        <Reveal>
          <div className="card-brutal relative overflow-hidden bg-dark text-white">
            <div className="relative z-10 grid items-center lg:grid-cols-12">
              <div className="p-8 sm:p-12 lg:col-span-7 lg:p-14">
                <h2 className="display-2 text-balance">
                  Ready to build your{" "}
                  <span className="marker">future</span>?
                </h2>
                <p className="mt-5 max-w-lg text-lg leading-8 text-white/65 text-pretty">
                  Start learning practical skills today and take your career to
                  the next level.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    variant="accent"
                    size="lg"
                    className="max-sm:w-full"
                  >
                    <Link
                      href="/courses"
                      className="[&_span:last-child]:bg-ink [&_span:last-child]:text-accent"
                    >
                      <span>Explore Courses</span>
                      <ButtonArrow />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="border-[1.5px] border-white/30 bg-transparent text-white shadow-none hover:bg-white hover:text-ink max-sm:w-full"
                  >
                    <Link href="/contact">Talk to us</Link>
                  </Button>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="hidden px-6 pb-6 lg:col-span-5 lg:block lg:pr-0 lg:pb-0"
              >
                <div className="translate-y-4 lg:translate-x-6">
                  <CtaIllustration />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Cta;
