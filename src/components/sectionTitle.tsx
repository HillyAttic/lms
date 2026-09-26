import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SectionTitleProps = {
  children: ReactNode;
  subTitle?: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClass?: string;
  subTitleClass?: string;
};

/*
 * Editorial section header. `subTitle` renders as a numbered-looking badge
 * rather than the old pill-with-gradient-border, and the heading takes the
 * display scale.
 */
const SectionTitle = ({
  children,
  subTitle,
  description,
  className,
  titleClassName,
  descriptionClass,
  subTitleClass,
}: SectionTitleProps) => {
  return (
    <div className={cn("", className)}>
      {subTitle ? (
        <div
          className={cn(
            "mb-5 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink px-3 py-1",
            subTitleClass,
          )}
        >
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          <p className="text-[0.6875rem] leading-4 font-semibold tracking-[0.08em] text-ink uppercase">
            {subTitle}
          </p>
        </div>
      ) : null}
      <h2 className={cn("display-2 text-balance", titleClassName)}>
        {children}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-140 text-base leading-7 text-secondary text-pretty",
            descriptionClass,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
};

export default SectionTitle;
