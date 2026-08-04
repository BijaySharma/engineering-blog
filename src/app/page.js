import Link from "next/link";
import PostCard from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";

const FOCUS_AREAS = [
  {
    title: "Agentic backend systems",
    body: "I build multi-agent workflows with LangGraph and MCP, modeling agent handoffs as explicit state graphs rather than one long prompt, so different steps can use different tools, context, and failure handling.",
  },
  {
    title: "Kubernetes-native systems",
    body: "I write custom controllers and CRDs that teach Kubernetes new vocabulary — reconciliation loops that continuously bring a cluster's real state in line with its declared spec, and service mesh configuration for traffic that has to survive rollouts and failures.",
  },
  {
    title: "Distributed systems",
    body: "Kafka for durable event streams, Temporal for long-running workflows that have to survive restarts, and consensus/reconciliation patterns for keeping distributed state convergent under partial failure.",
  },
];

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-6 py-16 sm:py-20">
      {/* Hero */}
      <section className="animate-fade-slide-up">
        <p className="font-sans text-sm font-medium uppercase tracking-wide text-muted">
          Bijay Sharma
        </p>
        <h1 className="mt-3 max-w-[20ch] font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Software engineer building agentic backend systems
        </h1>
        <p className="mt-5 max-w-[150ch] font-sans text-base leading-relaxed text-muted sm:text-lg">
          At Acquia, I build agentic backend systems — multi-agent workflows
          and tooling with LangGraph, LangChain, and MCP. Before this I spent
          time in platform engineering: Kubernetes operators, control/data
          plane architecture, and distributed systems (Kafka, Temporal).
          I&apos;m CKAD certified and still spend a lot of time where
          orchestration meets infra.
        </p>
      </section>

      {/* What I work on */}
      <section aria-labelledby="focus-heading">
        <h2
          id="focus-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          What I work on
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FOCUS_AREAS.map(({ title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-border p-5"
            >
              <h3 className="font-serif text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent writing */}
      <section aria-labelledby="recent-writing-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="recent-writing-heading"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            Recent writing
          </h2>
          <Link
            href="/blog"
            className="font-sans text-sm text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            View all
          </Link>
        </div>

        {recentPosts.length > 0 ? (
          <div className="mt-2">
            {recentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-6 font-sans text-sm text-muted">
            Nothing published yet — check back soon.
          </p>
        )}
      </section>

      {/* Currently learning */}
      <section aria-labelledby="currently-learning-heading">
        <h2
          id="currently-learning-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          Currently learning
        </h2>
        <p className="mt-3 font-sans text-base text-muted">
          Currently deep in distributed systems + DSA prep — writing up what
          I learn.
        </p>
      </section>
    </main>
  );
}
