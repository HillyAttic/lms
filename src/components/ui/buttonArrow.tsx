import { ArrowRight } from "@/lib/icons";

/*
 * The circular badge that rides inside a Button. Lime in every context: on ink
 * it is the accent, on white it is the only colour in an otherwise mono button.
 */
const ButtonArrow = () => {
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-ink">
      <span className="relative flex h-full w-full items-center justify-center">
        <span className="absolute transition-transform duration-300 ease-in-out group-hover:translate-x-10">
          <ArrowRight />
        </span>
        <span className="absolute -translate-x-10 transition-transform duration-300 ease-in-out group-hover:translate-x-0">
          <ArrowRight />
        </span>
      </span>
    </span>
  );
};

export default ButtonArrow;
