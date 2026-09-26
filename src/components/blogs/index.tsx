"use client";

import { useEffect, useState } from "react";
import SectionTitle from "../sectionTitle";
import Button from "../ui/button";
import Link from "next/link";
import BlogCard from "./blogCard";
import ButtonArrow from "../ui/buttonArrow";
import Reveal from "../ui/reveal";
import { getPublishedBlogs } from "@/app/actions/blog-actions";
import { BlogType } from "@/types/BlogType";

/*
 * There is no public /blog route yet — only /admin/blogs. The template linked
 * here to "/blog" (404) and each card to "#". Both now point at the admin
 * posts list, which is the only place an article can actually be read today.
 */
const Blogs = () => {
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const result = await getPublishedBlogs(3);
        if (result.success && result.data) {
          setBlogs(result.data as BlogType[]);
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading || blogs.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            subTitle="Blog"
            description="Expert insights, tutorials, career advice and industry deep dives to fuel your learning."
          >
            From the <span className="marker">hub</span>
          </SectionTitle>
          <Button asChild variant="outline" size="lg" className="max-sm:w-full">
            <Link href="/admin/blogs">
              <span>All articles</span>
              <ButtonArrow />
            </Link>
          </Button>
        </div>

        <ul className="mt-12 grid gap-8 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.slice(0, 3).map((blog, i) => (
            <Reveal as="li" key={blog._id} delay={i * 80}>
              <BlogCard blog={blog} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Blogs;
