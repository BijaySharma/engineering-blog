import Link from "next/link";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Renders a single post summary card.
 *
 * @param {{ post: {
 *   slug: string,
 *   title: string,
 *   date: string,
 *   tags: string[],
 *   excerpt: string,
 *   readingTime: string,
 * } }} props
 */
export default function PostCard({ post }) {
  const { slug, title, date, tags, excerpt, readingTime } = post;

  return (
    <article className="border-b border-border py-8 first:pt-0 last:border-b-0">
      <h2 className="font-serif text-2xl font-semibold leading-snug text-foreground">
        <Link
          href={`/blog/${slug}`}
          className="transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
        >
          {title}
        </Link>
      </h2>

      <div className="mt-2 flex items-center gap-3 font-sans text-sm text-muted">
        <time dateTime={date}>{formatDate(date)}</time>
        <span aria-hidden="true">&middot;</span>
        <span>{readingTime}</span>
      </div>

      {excerpt ? (
        <p className="mt-3 max-w-[150ch] font-sans text-base leading-relaxed text-foreground/90">
          {excerpt}
        </p>
      ) : null}

      {tags && tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border bg-muted/10 px-3 py-1 font-sans text-xs text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
