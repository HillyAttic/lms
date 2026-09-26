"use client";
import Link from "next/link";
import { MenuType } from "./index";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

/*
 * Inline nav. A pill slides in behind whichever label is hovered (CSS only, via
 * a scale-x transform), and the active route keeps a permanent ink underline.
 */
const Navigation = ({ data }: { data: MenuType[] }) => {
  const pathName = usePathname();

  return (
    <nav className="hidden lg:block" aria-label="Main">
      <ul className="flex items-center gap-1">
        {data.map(({ href, id, label }) => {
          const isActive = pathName === href;

          return (
            <li key={id}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative inline-flex items-center rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive ? "text-ink" : "text-secondary hover:text-ink",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-1 bottom-1 h-1.5 origin-left scale-x-0 rounded-full bg-accent transition-transform duration-300 group-hover:scale-x-100",
                    isActive && "scale-x-100",
                  )}
                />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
