"use client";
import { QuoteLeft } from "@/lib/icons";
import Image from "next/image";
import { testimonialData } from "./testimonialData";

/*
 * Continuous marquee rather than a Swiper carousel. Swiper keeps its slides in
 * one long row and translates them, which is what made the old `!overflow-visible`
 * widen the document; a marquee wants an overflow-hidden track and a CSS
 * transform, so the library was doing nothing the animation doesn't do itself.
 *
 * Seamlessness: the track holds copies of the list and slides exactly -50%.
 * The spacing lives on each card as a right margin, NOT as `gap` on the track —
 * with `gap`, half the track is N cards + (N - 0.5) gaps, so the loop visibly
 * jumps on every cycle.
 *
 * Four copies, not two: the loop only covers half the track, so half has to be
 * wider than the widest viewport or the tail goes blank mid-cycle. One copy is
 * ~2080px, so 2 copies of headroom (4360px) clears an ultrawide monitor; two
 * copies would leave a gap above 2180px.
 */
const COPIES = 4;

const TestimonialSlider = ({ paused }: { paused: boolean }) => {
  const base = testimonialData.length;
  const cards = Array.from({ length: COPIES }, () => testimonialData).flat();

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
      <ul
        className={`flex w-max animate-marquee [animation-duration:120s] group-hover:[animation-play-state:paused] ${
          paused ? "[animation-play-state:paused]" : ""
        }`}
      >
        {cards.map((item, index) => (
          <li
            key={`${item.id}-${index}`}
            /* Only the first copy is announced; the rest are decoration. */
            aria-hidden={index >= base}
            className="mr-5 w-[min(85vw,26rem)] shrink-0"
          >
            <div className="flex h-full min-h-80 flex-col justify-between rounded-[24px] border-[1.5px] border-white/20 bg-white/[0.04] p-7 sm:min-h-88 sm:p-8">
              <div>
                <span className="text-accent">
                  <QuoteLeft />
                </span>
                <p className="mt-6 text-lg leading-8 text-white/85 text-pretty">
                  {item.review}
                </p>
              </div>
              <Person user={item.user} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Person = ({
  user,
}: {
  user: { name: string; position: string; image: string };
}) => (
  <div className="mt-7 flex items-center gap-4 border-t-[1.5px] border-white/15 pt-6">
    <Image
      width={44}
      height={44}
      sizes="44px"
      src={user.image}
      alt=""
      className="size-11 shrink-0 rounded-full object-cover"
    />
    <div className="min-w-0">
      <p className="truncate font-semibold">{user.name}</p>
      <p className="truncate text-sm text-white/55">{user.position}</p>
    </div>
  </div>
);

export default TestimonialSlider;
