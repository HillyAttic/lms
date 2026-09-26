"use client";
import { Play, QuoteLeft } from "@/lib/icons";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { testimonialData } from "./testimonialData";
import { Navigation } from "swiper/modules";

/* Real avatars and video thumbnails come from /public/images/testimonial. */
const TestimonialSlider = () => {
  return (
    <Swiper
      spaceBetween={20}
      slidesPerView={1.1}
      breakpoints={{
        640: { slidesPerView: 1.6 },
        1024: { slidesPerView: 2.2 },
        1280: { slidesPerView: 2.8 },
      }}
      navigation={{
        nextEl: ".testimonial-next-arrow",
        prevEl: ".testimonial-prev-arrow",
      }}
      modules={[Navigation]}
      className="!overflow-visible"
    >
      {testimonialData.map((item, index) => (
        <SwiperSlide key={index}>
          <div className="flex h-full min-h-80 flex-col justify-between rounded-[24px] border-[1.5px] border-white/20 bg-white/[0.04] p-7 sm:min-h-88 sm:p-8">
            {item.isVideoReview ? (
              <>
                <div className="relative aspect-16/10 overflow-hidden rounded-2xl">
                  <Image
                    width={392}
                    height={245}
                    sizes="(max-width: 640px) 100vw, 40vw"
                    src={item.videoThumb || ""}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Play ${item.user.name}'s video review`}
                    className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105"
                  >
                    <span className="ml-1">
                      <Play />
                    </span>
                  </a>
                </div>
                <Person user={item.user} />
              </>
            ) : (
              <>
                <div>
                  <span className="text-accent">
                    <QuoteLeft />
                  </span>
                  <p className="mt-6 text-lg leading-8 text-white/85 text-pretty">
                    {item.review}
                  </p>
                </div>
                <Person user={item.user} />
              </>
            )}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
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
