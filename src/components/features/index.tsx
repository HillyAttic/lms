import SectionTitle from "../sectionTitle";
import Reveal from "../ui/reveal";
import { featuresData } from "./featuresData";

/*
 * No icon tiles and no stock thumbnails: numbered editorial rows on the ink
 * band, each separated by a hairline. The numbers carry the hierarchy.
 */
const Features = () => {
  return (
    <section className="border-y-[1.5px] border-ink bg-dark py-16 text-white sm:py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            subTitle="Why EdventureHub"
            titleClassName="text-white"
            descriptionClass="text-white/60"
            subTitleClass="border-white/30 [&_p]:text-white/70 [&_span:first-child]:bg-accent"
            description="Everything here is built around doing the work — not watching someone else do it."
          >
            Why learn with
            <br className="hidden sm:block" /> <span className="marker">EdventureHub</span>?
          </SectionTitle>

          <p className="max-w-xs text-sm leading-6 text-white/50">
            Four things every course on the platform has in common.
          </p>
        </div>

        <ul className="mt-12 border-t-[1.5px] border-white/20 sm:mt-16">
          {featuresData.map((feature, i) => (
            <Reveal as="li" key={feature.id} delay={i * 70}>
              <div className="group grid gap-4 border-b-[1.5px] border-white/20 py-7 transition-colors hover:bg-white/[0.04] sm:grid-cols-12 sm:gap-8 sm:py-9">
                <span className="text-3xl font-bold tracking-[-0.04em] text-accent sm:col-span-2 sm:text-4xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-2xl font-bold tracking-[-0.02em] sm:col-span-4 sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="leading-7 text-white/60 sm:col-span-6">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Features;
