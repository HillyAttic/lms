"use client";

import { useState } from "react";
import Button from "../ui/button";
import { CloseIcon, SearchIcon } from "@/lib/icons";
import Input from "../ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ButtonArrow from "../ui/buttonArrow";
import { useAuth } from "@/lib/auth-context";

const HeaderExtraInfo = () => {
  const [searchBarShow, setSearchBarShow] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, role, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
  };

  return (
    <div className="flex items-center gap-x-4">
      <div>
        {/* search input field */}
        <div
          className={cn(
            "relative z-50 h-12 w-full max-lg:absolute max-lg:top-0 max-lg:left-0 max-lg:z-999 lg:max-w-60",
            searchBarShow ? "max-lg:block" : "max-lg:hidden",
          )}
        >
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <button
            onClick={() => setSearchBarShow(false)}
            className="absolute top-1/2 right-3 z-30 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-gray-600 lg:hidden"
          >
            <CloseIcon />
          </button>
          <Input
            placeholder="Search course here..."
            className="h-full bg-gray-50 pr-7 pl-11 max-lg:rounded-none shadow-none"
          />
        </div>
        {searchBarShow && (
          <div className="absolute top-0 left-0 z-30 h-full min-h-screen w-full bg-gray-50"></div>
        )}
        {/* the search icon show less than larger devices */}
        <button
          onClick={() => setSearchBarShow(true)}
          className="flex h-4 w-4 items-center justify-center lg:hidden"
        >
          <SearchIcon />
        </button>
      </div>

      {/* Auth UI */}
      {user ? (
        <div className="flex items-center gap-x-3">
          {/* Admin button - shown next to profile when user is admin */}
          {role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 h-12 px-4 rounded-lg border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="hidden lg:block text-sm font-medium">
                Admin Panel
              </span>
            </Link>
          )}

          {/* Profile button + dropdown wrapper */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 h-12 px-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                {user.email?.[0].toUpperCase() || "U"}
              </div>
              <span className="hidden lg:block text-sm font-medium">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-100 py-3 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {role || "learner"}
                    </p>
                  </div>

                  <Link
                    href="/repository"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Repository
                  </Link>

                  {role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <Button
          asChild
          className="hidden h-12 justify-between gap-2.5 py-1.5 pr-1.5 pl-6 text-base tracking-base lg:flex"
        >
          <Link href={"/admin/login"}>
            Login / Sign up
            <ButtonArrow />
          </Link>
        </Button>
      )}
    </div>
  );
};

export default HeaderExtraInfo;
