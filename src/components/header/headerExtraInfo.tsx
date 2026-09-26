"use client";

import { useEffect, useRef, useState } from "react";
import Button from "../ui/button";
import ButtonArrow from "../ui/buttonArrow";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { canAccessAdminPanel } from "@/lib/roles";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";

/*
 * Auth-aware header actions. Unauthenticated: Login (quiet) + Start Learning
 * (lime). Authenticated: the avatar menu, which keeps every destination the
 * previous purple dropdown offered.
 *
 * The template's decorative search box is gone — it had no value/onChange and
 * filtered nothing; real search lives on /courses.
 */
const HeaderExtraInfo = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, role, signOut } = useAuth();

  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDropdownOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  if (!user) {
    return (
      <div className="flex items-center gap-2 lg:gap-4">
        <Link
          href="/admin/login"
          className="hidden text-sm font-medium text-secondary underline-offset-4 transition-colors hover:text-ink hover:underline lg:block"
        >
          Login
        </Link>
        <Button asChild variant="accent" className="hidden lg:inline-flex">
          <Link href="/admin/login">
            Start Learning
            <ButtonArrow />
          </Link>
        </Button>
      </div>
    );
  }

  const initial = (user.displayName || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white py-1 pr-3 pl-1 transition-colors hover:bg-muted"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-ink">
            {initial}
          </span>
          <span className="hidden max-w-32 truncate text-sm font-medium lg:block">
            {user.displayName || user.email?.split("@")[0] || "Account"}
          </span>
          <ChevronDown
            className={cn(
              "hidden size-4 transition-transform duration-200 lg:block",
              dropdownOpen && "rotate-180",
            )}
          />
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-2xl border-[1.5px] border-ink bg-white shadow-lg"
          >
            <div className="border-b-[1.5px] border-ink/10 px-4 py-3">
              <p className="truncate text-sm font-semibold">{user.email}</p>
              <p className="mt-0.5 text-xs text-secondary capitalize">
                {role || "learner"}
              </p>
            </div>

            <div className="p-1.5">
              {[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Repository", href: "/repository" },
                { label: "Leaderboard", href: "/leaderboard" },
                ...(canAccessAdminPanel(role)
                  ? [{ label: "Admin Panel", href: "/admin" }]
                  : []),
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-muted hover:text-ink"
                >
                  {label}
                </Link>
              ))}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  void signOut();
                }}
                className="mt-1 block w-full rounded-xl border-t-[1.5px] border-ink/10 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderExtraInfo;
