import Button from "../ui/button";
import Link from "next/link";
import ButtonArrow from "../ui/buttonArrow";
import { HeroIllustration } from "../illustrations";

const Hero = () => {
  return (
    <section className="overflow-x-clip pt-10 pb-12 sm:pt-14 lg:pt-16 lg:pb-20">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white py-1 pr-3.5 pl-1.5">
              <span className="grid size-6 place-items-center rounded-full bg-accent text-[0.6875rem] font-bold text-ink">
                ★
              </span>
              <span className="text-xs font-semibold tracking-[0.06em] uppercase">
                Trusted by 85K+ learners
              </span>
            </p>

            {/* Above the fold: deliberately not wrapped in <Reveal>. Reveal
                renders `opacity-0` until hydration, which would hold the LCP
                element — the h1 — invisible on first paint. */}
            <h1 className="display-1 mt-6 text-balance">
              Learn skills.
              <br />
              Build your <span className="marker">future</span>.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-secondary text-pretty">
              Practical courses designed to help you learn, build real projects
              and grow your career — at your own pace, from people who do the
              work.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                variant="accent"
                size="lg"
                className="max-sm:w-full"
              >
                <Link href="/courses">
                  <span>Explore Courses</span>
                  <ButtonArrow />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="max-sm:w-full"
              >
                <Link href="/about">Learn More</Link>
              </Button>
            </div>

            <ul className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t-[1.5px] border-ink/15 pt-6">
              {[
                "Self-paced learning",
                "Recognised certificates",
                "Expert instructors",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm font-medium text-secondary"
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-ink"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Hand-drawn scene. Hidden from AT: it carries no information the
              headline and list above don't already state. */}
          <div
            aria-hidden="true"
            className="animate-float lg:col-span-5 lg:-mr-6 xl:-mr-12"
          >
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
