"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Certificate,
  DashboardIcon,
  GraduationHat,
  Heart,
  UserRoundIcon,
} from "@/lib/icons";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Profile", href: "/dashboard/profile", icon: UserRoundIcon },
  { label: "Enrolled Courses", href: "/dashboard/enrolled", icon: GraduationHat },
  { label: "Certificates", href: "/dashboard/certificates", icon: Certificate },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
];

/*
 * Ink panel with a lime active state, matching the header's accent language.
 * The nav scrolls horizontally under `lg` instead of collapsing into a menu —
 * five short labels fit, and it keeps the destinations one tap away.
 */
export default function LearnerSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const name = user?.displayName || user?.email?.split("@")[0] || "Learner";

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-[24px] border-[1.5px] border-ink bg-dark p-4 text-white sm:p-6 lg:w-72">
      <div className="flex items-center gap-3 pb-5">
        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-ink">
          {user?.photoURL ? (
            // Provider avatars come from Google, which next/image is not configured for.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={name}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold">{name}</p>
          <p className="truncate text-xs text-white/50">{user?.email}</p>
        </div>
      </div>

      <nav aria-label="Dashboard">
        <ul className="-mx-4 flex gap-1 overflow-x-auto border-t-[1.5px] border-white/15 px-4 pt-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors lg:rounded-xl",
                    isActive
                      ? "bg-accent text-ink"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
