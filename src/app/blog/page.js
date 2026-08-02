import PostCard from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "Blog | Bijay Sharma",
  description:
    "Writing on Kubernetes operators, distributed systems, and agentic AI tooling.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:py-20">
      <section>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Blog
        </h1>
      </section>

      <section aria-label="All posts">
        {posts.length > 0 ? (
          <div>
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-6 font-sans text-sm text-muted">
            No posts yet &mdash; first one&apos;s in progress.
          </p>
        )}
      </section>
    </main>
  );
}
