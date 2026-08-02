import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import readingTime from "reading-time";

import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { mdxComponents } from "@/lib/mdx-components";

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, rehypeHighlight],
  },
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// Only slugs returned by generateStaticParams() (i.e. non-draft posts) may
// resolve. Any other slug — a draft in production, or a nonexistent one —
// 404s instead of falling through to on-demand rendering.
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Post not found" };
  }

  const { frontmatter } = post;

  return {
    title: frontmatter.title,
    description: frontmatter.excerpt,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.excerpt,
      type: "article",
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { frontmatter, content } = post;
  const stats = readingTime(content);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16 sm:py-20">
      <Link
        href="/blog"
        className="w-fit font-sans text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
      >
        &larr; Back to blog
      </Link>

      <article className="mt-8">
        <header>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {frontmatter.title}
          </h1>

          <div className="mt-3 flex items-center gap-3 font-sans text-sm text-muted">
            <time dateTime={frontmatter.date}>
              {formatDate(frontmatter.date)}
            </time>
            <span aria-hidden="true">&middot;</span>
            <span>{stats.text}</span>
          </div>

          {frontmatter.tags && frontmatter.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {frontmatter.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border bg-muted/10 px-3 py-1 font-sans text-xs text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <div className="mt-10 max-w-[65ch]">
          <MDXRemote
            source={content}
            components={mdxComponents}
            options={mdxOptions}
          />
        </div>
      </article>
    </main>
  );
}
