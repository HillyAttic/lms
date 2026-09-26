import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

type InputProps = ComponentProps<"input"> & {
  dataState?: "error" | "default" | "success";
};

const Input = ({ type, className, ref, dataState, ...props }: InputProps) => {
  return (
    <input
      data-state={dataState}
      type={type}
      ref={ref}
      className={cn(
        "h-11 w-full rounded-full border-[1.5px] border-ink/15 bg-white px-5 py-2.5 text-sm leading-5 outline-0 placeholder:text-gray-400 focus-visible:border-ink focus-visible:outline-none data-[state=error]:border-[#FB3748] sm:h-12",
        className,
      )}
      {...props}
    />
  );
};

export default Input;
