import Link from "next/link";
import { BlogType } from "@/types/BlogType";
import { formatDate } from "@/lib/utils";

/*
 * `next/image` is replaced with a plain <img>: blog feature images come from
 * arbitrary Firestore-hosted URLs the admin pastes in, which `next/image`
 * can't optimise without every host in next.config.
 */
const BlogCard = ({ blog }: { blog: BlogType }) => {
  const href = `/admin/blogs/${blog._id}`;

  return (
    <article className="card-brutal card-brutal-hover group flex h-full flex-col overflow-hidden bg-white">
      <Link href={href} className="block p-2.5 pb-0">
        {blog.featureImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blog.featureImage}
            alt=""
            loading="lazy"
            className="aspect-16/10 w-full rounded-[18px] border-[1.5px] border-ink/15 object-cover"
          />
        ) : (
          <span className="grid aspect-16/10 w-full place-items-center rounded-[18px] border-[1.5px] border-ink/15 text-xs text-secondary">
            No image
          </span>
        )}
      </Link>

      <div className="flex grow flex-col p-6">
        {blog.topic ? (
          <span className="self-start rounded-full bg-accent px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.08em] text-ink uppercase">
            {blog.topic}
          </span>
        ) : null}

        <h3 className="mt-3 text-lg leading-7 font-bold tracking-[-0.02em] text-balance sm:text-xl">
          <Link href={href} className="transition-opacity hover:opacity-70">
            {blog.title}
          </Link>
        </h3>

        <p className="mt-3 grow text-sm leading-6 text-secondary line-clamp-2">
          {blog.shortDescription}
        </p>

        <div className="mt-6 flex items-center gap-3 border-t-[1.5px] border-ink/15 pt-5">
          {blog.author.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blog.author.photo}
              alt=""
              loading="lazy"
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">
              {blog.author.name.charAt(0)}
            </span>
          )}
          <p className="truncate text-sm font-medium">{blog.author.name}</p>
          <span
            aria-hidden="true"
            className="size-1 shrink-0 rounded-full bg-gray-400"
          />
          <p className="shrink-0 text-sm text-secondary">
            {formatDate(blog.date)}
          </p>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
