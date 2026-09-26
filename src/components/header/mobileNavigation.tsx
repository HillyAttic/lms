"use client";
import { useEffect, useRef, useState } from "react";
import { MenuType } from ".";
import Link from "next/link";
import { CloseIcon, MenuIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import Button from "../ui/button";
import ButtonArrow from "../ui/buttonArrow";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessAdminPanel } from "@/lib/roles";

/*
 * Slide-down panel that lives inside the sticky header, so it needs no overlay
 * and no z-index games. Closes on route change and on Escape.
 */
const MobileNavigation = ({ data }: { data: MenuType[] }) => {
  const pathName = usePathname();
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const lastPath = useRef(pathName);

  // Close on navigation. Compared against the previous path rather than run on
  // mount, so this doesn't fire a no-op state update on first render.
  useEffect(() => {
    if (lastPath.current !== pathName) {
      lastPath.current = pathName;
      setOpen(false);
    }
  }, [pathName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-10 place-items-center rounded-full border-[1.5px] border-ink bg-white"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      <div
        id="mobile-nav"
        className={cn(
          "absolute inset-x-0 top-full overflow-hidden border-b-[1.5px] border-ink bg-background transition-[max-height,opacity] duration-300 ease-out",
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="container py-6" aria-label="Mobile">
          <ul className="flex flex-col">
            {data.map(({ href, id, label }) => {
              const isActive = pathName === href;

              return (
                <li key={id}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 border-b border-ink/10 py-3.5 text-2xl font-semibold tracking-[-0.02em] transition-colors",
                      isActive ? "text-ink" : "text-secondary hover:text-ink",
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full bg-accent"
                      />
                    )}
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            {user ? (
              <>
                <Button asChild variant="accent" size="lg" className="w-full">
                  <Link href="/dashboard">
                    My Dashboard
                    <ButtonArrow />
                  </Link>
                </Button>
                {canAccessAdminPanel(role) && (
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link href="/admin">Admin Panel</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button asChild variant="accent" size="lg" className="w-full">
                  <Link href="/admin/login">
                    Start Learning
                    <ButtonArrow />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/admin/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MobileNavigation;
