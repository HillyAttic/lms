import { stats } from "./stats";

/*
 * Trust strip: an infinite marquee on the ink band. The track holds two copies
 * of the list and slides exactly -50%, so the loop is seamless; the clone is
 * aria-hidden so a screen reader hears the four figures once.
 *
 * Copy is the app's own `stats` — the same numbers the homepage always claimed.
 */
const TrustStrip = () => {
  const items = stats.map(({ id, label, value, suffix }) => (
    <li
      key={id}
      className="flex shrink-0 items-baseline gap-2.5 whitespace-nowrap"
    >
      <span className="text-3xl font-bold tracking-[-0.03em] text-accent sm:text-4xl">
        {value}
        {suffix}
      </span>
      <span className="text-xs font-semibold tracking-[0.1em] text-white/60 uppercase">
        {label}
      </span>
    </li>
  ));

  return (
    <section className="border-y-[1.5px] border-ink bg-dark py-6 sm:py-7">
      <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <ul className="flex shrink-0 animate-marquee items-center gap-10 pr-10 group-hover:[animation-play-state:paused] sm:gap-16 sm:pr-16">
          {items}
        </ul>
        <ul
          aria-hidden="true"
          className="flex shrink-0 animate-marquee items-center gap-10 pr-10 group-hover:[animation-play-state:paused] sm:gap-16 sm:pr-16"
        >
          {items}
        </ul>
      </div>
    </section>
  );
};

export default TrustStrip;
