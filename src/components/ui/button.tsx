"use client";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, RefObject } from "react";

/*
 * Buttons carry the hard offset shadow so they read as physical objects, and
 * lift 2px on hover. `primary` is ink-on-white, `accent` is ink-on-lime — the
 * only two fills the design system allows for a call to action.
 */
const buttonVariants = cva(
  "group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-sm font-medium leading-5 transition-[transform,box-shadow,background-color,color] duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg",
        accent:
          "bg-accent text-ink shadow-md hover:-translate-y-0.5 hover:shadow-lg",
        outline:
          "border-[1.5px] border-ink bg-white text-ink shadow-md hover:-translate-y-0.5 hover:bg-ink hover:text-white hover:shadow-lg",
        ghost: "border-[1.5px] border-ink/20 text-ink hover:border-ink",
        secondary: "bg-muted text-ink hover:bg-gray-200",
        link: "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-3",
        lg: "h-12 px-6 py-3 text-base sm:h-13",
        sm: "h-9 px-4 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ref?: RefObject<any>;
}

const Button = ({
  className,
  variant,
  size,
  children,
  asChild,
  ref,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      {...props}
      className={cn(buttonVariants({ variant, size, className }))}
    >
      {children}
    </Comp>
  );
};

export default Button;
