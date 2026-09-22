"use client";

import { Facebook, Instagram, LinkedinFill, Twitter } from "@/lib/icons";
import Link from "next/link";
import Copyright from "./copyright";
import Image from "next/image";

const footerData = [
  {
    title: "Quick Link",
    links: [
      { text: "Home", url: "#" },
      { text: "All Courses", url: "#" },
      { text: "Categories", url: "#" },
      { text: "Contact", url: "/contact" },
      { text: "FAQ's", url: "#" },
    ],
  },
  {
    title: "Categories",
    links: [
      { text: "Web Development", url: "#" },
      { text: "UI/UX Design", url: "#" },
      { text: "Digital Marketing", url: "#" },
      { text: "Artificial Intelligence", url: "#" },
      { text: "Cyber Security", url: "#" },
    ],
  },
  {
    title: "Help & Legal",
    links: [
      { text: "Help Center", url: "#" },
      { text: "Terms & Conditions", url: "#" },
      { text: "Privacy Policy", url: "#" },
      { text: "Refund Policy", url: "#" },
      { text: "Affiliate Program", url: "#" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="relative z-10 overflow-hidden bg-gray-950">
      <Image
        width={1440}
        height={652}
        src={"/images/footer/bg-img.svg"}
        alt="img"
        sizes="100vw"
        loading="eager"
        className="absolute top-[119.438px] -left-[578px] z-[-1] h-full w-full"
      />
      <div className="container py-11 sm:py-14 lg:py-20">
        {/* logo and link */}
        <div className="flex flex-col justify-between gap-x-12 gap-y-10 lg:flex-row">
          <div className="max-w-[297px] flex-1">
            <p className="mt-4 text-sm leading-5 tracking-sm text-gray-400">
              Empowering learners worldwide to master new skills and advance
              their careers through high-quality online education.
            </p>
            <ul className="mt-10 flex items-center gap-2">
              <li>
                <Link
                  href={"#"}
                  className="flex size-9 items-center justify-center rounded-full bg-gray-800 text-gray-500 transition-all duration-500 hover:bg-purple-500 hover:text-primary"
                >
                  <Facebook />
                </Link>
              </li>
              <li>
                <Link
                  href={"#"}
                  className="flex size-9 items-center justify-center rounded-full bg-gray-800 text-gray-500 transition-all duration-500 hover:bg-purple-500 hover:text-primary"
                >
                  <Twitter />
                </Link>
              </li>
              <li>
                <Link
                  href={"#"}
                  className="flex size-9 items-center justify-center rounded-full bg-gray-800 text-gray-500 transition-all duration-500 hover:bg-purple-500 hover:text-primary"
                >
                  <Instagram />
                </Link>
              </li>
              <li>
                <Link
                  href={"#"}
                  className="flex size-9 items-center justify-center rounded-full bg-gray-800 text-gray-500 transition-all duration-500 hover:bg-purple-500 hover:text-primary"
                >
                  <LinkedinFill />
                </Link>
              </li>
            </ul>
          </div>
          <div className="grid max-w-[712px] flex-1 gap-x-20 gap-y-10 sm:grid-cols-3">
            {footerData.map(({ links, title }, index) => (
              <div key={index}>
                <h6 className="leading-7 font-medium tracking-base text-primary">
                  {title}
                </h6>
                <ul className="mt-5 space-y-3">
                  {links.map(({ text, url }, index) => (
                    <li key={index} className="leading-5">
                      <Link
                        href={url}
                        className="text-sm leading-5 tracking-sm text-gray-400 transition-all duration-500 hover:text-purple-500"
                      >
                        {text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Copyright />
    </footer>
  );
};

export default Footer;
