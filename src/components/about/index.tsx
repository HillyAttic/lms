import Image from "next/image";
import Link from "next/link";
import PageHeader from "../pageHeader";
import SectionTitle from "../sectionTitle";
import Cta from "../cta";
import Button from "../ui/button";
import ButtonArrow from "../ui/buttonArrow";
import Reveal from "../ui/reveal";
import { whyChooseData, storyHighlights } from "./data";
import { Check } from "@/lib/icons";

const About = () => {
  return (
    <main>
      <PageHeader
        subTitle="About Us"
        description="A learning platform built for people who want to actually finish what they start — and use it."
      >
        Learning that fits
        <br className="hidden sm:block" /> real <span className="marker">life</span>
      </PageHeader>

      {/* Story: copy left, real product screenshot right. */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <SectionTitle
                subTitle="Our story"
                description="EdventureHub started with a simple frustration: most online courses are long on theory and short on the skills people actually need at work."
              >
                Built for learners, not for completion rates
              </SectionTitle>

              <p className="mt-5 leading-7 text-secondary text-pretty">
                So we built something different. Every course is broken into
                short, focused lessons with something to do at the end of each
                one — a quiz, a project, a checkpoint. You move at your own pace,
                and your dashboard keeps score so progress is visible instead of
                imaginary.
              </p>

              <ul className="mt-7 space-y-3.5">
                {storyHighlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-ink">
                      <Check className="size-3.5" />
                    </span>
                    <p className="leading-6 text-secondary">{highlight}</p>
                  </li>
                ))}
              </ul>

              <Button asChild size="lg" className="mt-9 max-sm:w-full">
                <Link href="/courses">
                  <span>Browse courses</span>
                  <ButtonArrow />
                </Link>
              </Button>
            </div>

            <div className="lg:col-span-6">
              <div className="card-brutal overflow-hidden bg-white p-2.5">
                <Image
                  width={1216}
                  height={604}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  src="/images/about/about.png"
                  alt="Two learners working through a course together"
                  className="h-auto w-full rounded-[18px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six reasons, as numbered editorial rows rather than icon tiles. */}
      <section className="border-y-[1.5px] border-ink bg-dark py-16 text-white sm:py-20 lg:py-28">
        <div className="container">
          <SectionTitle
            subTitle="Why EdventureHub"
            titleClassName="text-white"
            descriptionClass="text-white/60"
            subTitleClass="border-white/30 [&_p]:text-white/70"
            description="Six reasons learners stay, finish, and come back for the next course."
          >
            Why learn with <span className="marker">us</span>
          </SectionTitle>

          <ul className="mt-12 grid gap-x-12 gap-y-0 border-t-[1.5px] border-white/20 sm:mt-16 md:grid-cols-2">
            {whyChooseData.map(({ id, title, description }, i) => (
              <Reveal as="li" key={id} delay={(i % 2) * 70}>
                <div className="flex h-full gap-5 border-b-[1.5px] border-white/20 py-7">
                  <span className="shrink-0 text-2xl font-bold tracking-[-0.03em] text-accent tabular-nums">
                    {String(id).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-[-0.02em]">
                      {title}
                    </h3>
                    <p className="mt-2 leading-7 text-white/60">
                      {description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Approach, on a plain panel — the old photograph background is gone. */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className="container">
          <div className="card-brutal bg-white p-8 sm:p-12 lg:p-14">
            <div className="max-w-2xl">
              <SectionTitle
                subTitle="Our approach"
                description="You are not watching a course — you are working through one. Every module ends with something you build, solve, or answer, so the skill compounds instead of fading."
              >
                Storytelling is how learning sticks
              </SectionTitle>
              <p className="mt-5 leading-7 text-secondary text-pretty">
                We design around context, practice, and feedback. That means
                shorter lessons, more doing, and a clear path from where you are
                now to where you want to be.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {["img-1", "img-2", "img-3", "img-4"].map((img) => (
                <div
                  key={img}
                  className="overflow-hidden rounded-[18px] border-[1.5px] border-ink/15"
                >
                  <Image
                    width={294}
                    height={320}
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    src={`/images/ourStory/${img}.png`}
                    alt=""
                    className="h-auto w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Cta className="pb-16 sm:pb-20 lg:pb-28" />
    </main>
  );
};

export default About;
