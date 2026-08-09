const EXPERIENCE = [
  {
    company: "Acquia — Enterprise Cloud Platform",
    role: "Software Engineer",
    meta: "Jan 2024 – Present · Pune, India",
    note: "Promoted from Associate Software Engineer, Nov 2025",
  },
  {
    company: "Authnull (formerly Kloudone) — Identity & Access Management",
    role: "Associate Software Engineer",
    meta: "Apr 2022 – Jan 2024 · Chennai, India",
    note: null,
  },
];

const SKILLS = [
  {
    category: "Languages",
    items: "Java, Python, Go, TypeScript, Kotlin, Ruby",
  },
  {
    category: "Backend & Systems",
    items:
      "Spring Boot, Node.js, gRPC/Protobuf, REST APIs, event-driven architecture",
  },
  {
    category: "Data & Pipelines",
    items: "Kafka, Temporal, PostgreSQL, Redis, DynamoDB",
  },
  {
    category: "AI & ML Tooling",
    items: "LangChain, LangGraph, MCP (Model Context Protocol)",
  },
  {
    category: "Cloud & DevOps",
    items: "Kubernetes (CKAD certified), Docker, AWS, GCP, Terraform, ArgoCD",
  },
];

export const metadata = {
  title: "Profile",
  description:
    "Bijay Sharma — software engineer building growth platforms, data pipelines, and agentic AI tooling.",
};

export default function Profile() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16 sm:py-20">
      {/* Header */}
      <section>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Bijay Sharma
        </h1>
        <p className="mt-2 font-sans text-base text-muted">
          Software Engineer · Bengaluru, India
        </p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-sans text-sm">
          <a
            href="mailto:bijay.sharma.swe@gmail.com"
            className="text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            Email
          </a>
          <a
            href="https://linkedin.com/in/bijay-sharma"
            className="text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/BijaySharma"
            className="text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            GitHub
          </a>
          <a
            href="https://bijay.dev"
            className="text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            bijay.dev
          </a>
        </p>
      </section>

      {/* Bio */}
      <section aria-labelledby="bio-heading">
        <h2
          id="bio-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          About
        </h2>
        <p className="mt-4 max-w-[150ch] font-sans text-base leading-relaxed text-muted sm:text-lg">
          4+ years building high-scale growth platforms, data pipelines, and
          AI-ready backend systems. I&apos;ve led technical design on
          cross-functional initiatives, shipped APIs adopted across 15+
          internal services, and worked deep in event-driven architecture
          with Kafka and Temporal. Most recently I&apos;ve been building
          agentic tooling with LangChain, LangGraph, and MCP, and I&apos;m
          CKAD certified.
        </p>
      </section>

      {/* Experience */}
      <section aria-labelledby="experience-heading">
        <h2
          id="experience-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          Experience
        </h2>
        <div className="mt-6 flex flex-col gap-6">
          {EXPERIENCE.map(({ company, role, meta, note }) => (
            <div key={company} className="border-l-2 border-border pl-5">
              <p className="font-serif text-lg font-semibold text-foreground">
                {role}
              </p>
              <p className="mt-1 font-sans text-sm text-foreground">
                {company}
              </p>
              <p className="mt-1 font-sans text-sm text-muted">{meta}</p>
              {note ? (
                <p className="mt-1 font-sans text-sm text-muted">{note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section aria-labelledby="skills-heading">
        <h2
          id="skills-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          Skills
        </h2>
        <dl className="mt-6 flex flex-col gap-3 font-sans text-sm">
          {SKILLS.map(({ category, items }) => (
            <div key={category} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="w-full shrink-0 font-medium text-foreground sm:w-44">
                {category}
              </dt>
              <dd className="text-muted">{items}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Education */}
      <section aria-labelledby="education-heading">
        <h2
          id="education-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          Education
        </h2>
        <p className="mt-4 font-sans text-base text-muted">
          B.Tech, Computer Science and Engineering — Sikkim University,
          2019–2023
        </p>
      </section>
    </main>
  );
}
