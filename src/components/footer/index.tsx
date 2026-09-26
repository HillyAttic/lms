"use client";

import { useState } from "react";
import { Facebook, Instagram, LinkedinFill, Twitter, LogoWhite } from "@/lib/icons";
import Link from "next/link";
import Copyright from "./copyright";
import Button from "../ui/button";
import { toast } from "react-toastify";

/* Only routes that exist — the old footer was mostly `#` placeholders. */
const footerData = [
  {
    title: "Quick Links",
    links: [
      { text: "Home", url: "/" },
      { text: "Courses", url: "/courses" },
      { text: "Repository", url: "/repository" },
      { text: "Leaderboard", url: "/leaderboard" },
      { text: "About", url: "/about" },
      { text: "Contact", url: "/contact" },
    ],
  },
  {
    title: "Categories",
    links: [
      { text: "SCORM Courses", url: "/courses?category=scorm" },
      { text: "Video Courses", url: "/courses?category=video" },
      { text: "Game Courses", url: "/courses?category=game" },
      { text: "All Courses", url: "/courses" },
    ],
  },
  {
    title: "Legal",
    links: [
      { text: "Privacy Policy", url: "/" },
      { text: "Terms", url: "/" },
      { text: "Refund Policy", url: "/" },
    ],
  },
];

const socials = [
  { label: "Facebook", icon: <Facebook /> },
  { label: "Twitter", icon: <Twitter /> },
  { label: "Instagram", icon: <Instagram /> },
  { label: "LinkedIn", icon: <LinkedinFill /> },
];

const Footer = () => {
  const [email, setEmail] = useState("");

  /*
   * There is no newsletter backend yet. Rather than POST nowhere, the form
   * says so plainly — swap the body for the real action when one exists.
   */
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Newsletter signup isn't wired up yet — check back soon.");
  };

  return (
    <footer className="border-t-[1.5px] border-ink bg-dark text-white">
      <div className="container">
        <div className="grid gap-12 py-14 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <div className="lg:col-span-5">
            <LogoWhite />
            <p className="mt-6 max-w-sm leading-7 text-white/55 text-pretty">
              Empowering learners worldwide to master new skills and advance
              their careers through high-quality online education.
            </p>

            <form onSubmit={handleSubscribe} className="mt-9 max-w-sm">
              <label
                htmlFor="newsletter-email"
                className="text-xs font-semibold tracking-[0.1em] text-white/50 uppercase"
              >
                Newsletter
              </label>
              <div className="mt-3 flex gap-2">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-12 min-w-0 flex-1 rounded-full border-[1.5px] border-white/20 bg-transparent px-5 text-sm text-white placeholder:text-white/35 focus-visible:border-accent focus-visible:outline-none"
                />
                <Button type="submit" variant="accent" className="shrink-0">
                  Subscribe
                </Button>
              </div>
            </form>

            <ul className="mt-9 flex items-center gap-2.5">
              {socials.map(({ icon, label }) => (
                <li key={label}>
                  <Link
                    href="/"
                    aria-label={label}
                    className="grid size-10 place-items-center rounded-full border-[1.5px] border-white/20 text-white/70 transition-colors hover:border-accent hover:bg-accent hover:text-ink"
                  >
                    {icon}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-7">
            {footerData.map(({ links, title }) => (
              <nav key={title} aria-label={title}>
                <h2 className="text-xs font-semibold tracking-[0.1em] text-white/50 uppercase">
                  {title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {links.map(({ text, url }) => (
                    <li key={text}>
                      <Link
                        href={url}
                        className="text-sm text-white/70 transition-colors hover:text-accent"
                      >
                        {text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      <Copyright />
    </footer>
  );
};

export default Footer;
