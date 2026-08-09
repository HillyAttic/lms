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
const menuList: MenuType[] = [
  {
    id: 1,
    label: "Home",
    href: "/",
  },
  {
    id: 2,
    label: "Courses",
    href: "/courses",
  },
  {
    id: 3,
    label: "Repository",
    href: "/repository",
  },
  {
    id: 4,
    label: "About",
    href: "#",
  },
  {
    id: 5,
    label: "All Pages",
    href: "#",
    subMenu: [
      { id: 1, label: "Contact", href: "/contact" },
      { id: 2, label: "Blog", href: "#" },
      { id: 4, label: "Admin Login", href: "/admin/login" },
      { id: 5, label: "Sign Up", href: "/admin/login" },
      { id: 6, label: "Login", href: "/admin/login" },
      { id: 7, label: "Reset password", href: "#" },
      { id: 8, label: "Terms and Conditions", href: "#" },
      { id: 9, label: "Privacy Policy", href: "#" },
      { id: 10, label: "404 Error", href: "/not-found" },
    ],
  },
];

const Header = () => {

  return (
    <header className="sticky top-0 left-0 z-50 w-full overflow-x-clip bg-primary py-4">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href={"/"} className="inline-block shrink-0 py-1.75">
              <Logo className="text-purple-500 max-sm:w-27" />
            </Link>
            <Navigation data={menuList} />
          </div>
          <div className="flex items-center gap-7">
            <HeaderExtraInfo  />
            <MobileNavigation data={menuList}  />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
