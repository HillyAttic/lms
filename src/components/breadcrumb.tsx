import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

/** The last crumb is the current page, so it is never a link. */
const Breadcrumb = ({ items, className }: { items: Crumb[]; className?: string }) => (
  <nav aria-label="Breadcrumb" className={cn("text-sm leading-5", className)}>
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex items-center gap-3">
          {index > 0 && <span className="text-gray-400">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="font-medium text-secondary underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-ink">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export default Breadcrumb;
