import { Logo } from "@/lib/icons";
import Link from "next/link";
import Navigation from "./navigation";
import MobileNavigation from "./mobileNavigation";
import HeaderExtraInfo from "./headerExtraInfo";

export type MenuType = {
  id: number;
  label: string;
  href: string;
  subMenu?: {
    id: number;
    label: string;
    href: string;
  }[];
};

/*
 * Only routes that exist. The old menu carried an "All Pages" dropdown of
 * `#` placeholders and a second link to /admin/login labelled "Sign Up";
 * both are gone rather than restyled. `Blog` from the brief is absent because
 * there is no public /blog route yet — see /admin/blogs for the editorial side.
 */
const menuList: MenuType[] = [
  { id: 1, label: "Home", href: "/" },
  { id: 2, label: "Courses", href: "/courses" },
  { id: 3, label: "Repository", href: "/repository" },
  { id: 4, label: "Leaderboard", href: "/leaderboard" },
  { id: 5, label: "About", href: "/about" },
  { id: 6, label: "Contact", href: "/contact" },
];

const Header = () => {
  return (
    <header className="sticky top-0 left-0 z-50 w-full overflow-x-clip border-b-[1.5px] border-ink bg-background">
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-3 lg:h-20">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              aria-label="EdventureHub home"
              className="shrink-0 py-1 transition-opacity hover:opacity-70"
            >
              <Logo />
            </Link>
            <Navigation data={menuList} />
          </div>
          <div className="flex items-center gap-3 lg:gap-5">
            <HeaderExtraInfo />
            <MobileNavigation data={menuList} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
