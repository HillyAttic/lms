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

export default function LearnerSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const name = user?.displayName || user?.email?.split("@")[0] || "Learner";

  return (
    <aside className="w-full shrink-0 rounded-3xl bg-purple-500 p-4 text-primary sm:p-6 lg:w-72">
      <div className="flex items-center gap-3 pb-6">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20">
          {user?.photoURL ? (
            // Provider avatars come from Google, which next/image is not configured for.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={name}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <p className="min-w-0 truncate text-lg font-semibold">{name}</p>
      </div>

      <nav>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors",
                    isActive
                      ? "bg-white/20 text-primary"
                      : "text-primary/75 hover:bg-white/10 hover:text-primary",
                  )}
                >
                  <item.icon className="size-5" />
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
