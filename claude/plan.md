# Personal Site + System Design Blog — Build Plan for Claude Code

## Context
- Already have a bootstrapped Next.js project (App Router assumed — confirm and adjust if Pages Router).
- Owner: Bijay Sharma, Software Engineer at Acquia. Builds Kubernetes operators, distributed systems,
  and agentic AI tooling (LangGraph/LangChain). CKAD certified. Prepping for FAANG SDE roles alongside this.
- Blog posts live in a **separate GitHub repo** as markdown files, pulled in via **git submodule**.
- Site scope for this phase: landing page + `/blog` (list + individual post pages). No CMS, no comments yet.

## Design direction

Professional, editorial, mature — like a well-run engineering blog (Stripe/Increment-adjacent), NOT a
terminal/hacker/sci-fi aesthetic. Restraint and real typographic hierarchy over gimmicks. Must support
light and dark mode, toggleable, with both palettes feeling intentionally designed rather than auto-inverted.

- **Light palette**: bg `#FAFAF9`, text `#1A1A1A`, accent `#3B5D8C` (muted ink-blue), muted text `#6B6B68`, borders `#E4E2DD`.
- **Dark palette**: bg `#131315`, text `#EDEDEB`, accent `#7FA3CC` (same hue family, lightened), muted text `#8A8A87`, borders `#2A2A2C`.
- **Type**: serif for headings (Source Serif 4 or Lora), sans for body/UI (Inter or system-ui). Monospace is
  used ONLY inside actual code blocks in posts — never decoratively for headings, labels, or hero copy.
- **Layout signature**: editorial masthead, byline/date treatment borrowed from long-form publishing, prose
  capped at ~65ch line length. No fake terminal/status-line UI, no numbered 01/02/03 markers, no dashboard motifs.
- **Theming mechanism**: CSS custom properties per palette above, switched via a `data-theme="light|dark"`
  attribute on `<html>`, managed with `next-themes` (avoids flash-of-wrong-theme on SSR and handles
  system-preference + persistence correctly). Toggle control (sun/moon icon) lives in the header.

---

## Phase 0 — Repo & Content Setup

1. Create (or confirm) a separate GitHub repo for blog content, e.g. `bijay-blog-content`.
   - Structure (files can be `.md` or `.mdx` — both are compiled the same way via `next-mdx-remote`;
     use `.mdx` for any post that embeds a custom component like `<Callout>`, plain `.md` otherwise):
     ```
     /posts/
       2026-08-02-kubernetes-operators-101.md
       2026-08-10-consistent-hashing.mdx
     ```
   - Each post has YAML frontmatter:
     ```md
     ---
     title: "Consistent Hashing, Explained"
     slug: "consistent-hashing"
     date: "2026-08-02"
     tags: ["system-design", "distributed-systems"]
     excerpt: "How consistent hashing avoids the reshuffle problem in distributed caches."
     draft: false
     ---
     Post content in markdown...
     ```
2. Add it as a submodule in the Next.js repo:
   ```bash
   git submodule add https://github.com/<you>/bijay-blog-content.git content/blog
   git submodule update --init --recursive
   ```
3. Add a note to README about submodule init for future clones/CI:
   ```bash
   git clone --recurse-submodules <repo-url>
   # or after clone:
   git submodule update --init --recursive
   ```
4. **CI/deploy consideration**: whichever host is chosen later (Vercel/Netlify/etc.) must be configured
   to check out submodules on build. Vercel: enable "Automatically expose System Environment Variables"
   is unrelated — actually needs `GIT_SUBMODULE_TOKEN` or public repo (public repos work with no extra config
   on Vercel as of recent behavior — Claude Code should verify current platform docs at build time since
   this changes).

---

## Phase 1 — Dependencies

```bash
npm install gray-matter next-mdx-remote rehype-highlight rehype-slug remark-gfm reading-time next-themes
# gray-matter: parse frontmatter
# next-mdx-remote: compile + render MDX content at request/build time (works with content living outside
#   the app dir, e.g. a git submodule — @next/mdx alone only handles .mdx files inside app/)
# remark-gfm: GitHub-flavored markdown (tables, strikethrough, task lists) — useful for system design posts
# rehype-highlight: syntax highlighting for code blocks
# rehype-slug: adds anchor ids to headings (nice for linking to sections of long posts)
# reading-time: "8 min read" style metadata
# next-themes: light/dark mode toggle with correct SSR handling
```

**Why MDX instead of plain markdown→HTML**: posts are still authored as plain `.md`/`.mdx` in the content
repo, but MDX gives the option to embed real React components inline later (e.g. an interactive diagram,
a callout/aside component, an embedded chart) without changing the pipeline again. `next-mdx-remote/rsc`
compiles MDX on the server (App Router, React Server Components) and lets you register custom components
for elements like `<pre>`, `<a>`, `<h2>`, etc. so the rendered output automatically matches the site's design
tokens instead of needing a separate `prose` override.

Optional nice-to-haves:
- `@tailwindcss/typography` — still useful as a base layer even with MDX, for anything not explicitly
  overridden by a custom MDX component.

---

## Phase 2 — File/Folder Structure

```
app/
  layout.tsx
  page.tsx                    # Landing page
  blog/
    page.tsx                  # Blog index (list all posts)
    [slug]/
      page.tsx                # Individual post page
lib/
  posts.ts                    # getAllPosts(), getPostBySlug() — reads from content/blog/posts
  mdx-components.tsx           # custom component mapping for MDX elements (h1, h2, pre, a, blockquote, etc.)
content/
  blog/                       # git submodule root
    posts/
      *.md / *.mdx
components/
  Header.tsx
  Footer.tsx
  PostCard.tsx
  ThemeToggle.tsx               # sun/moon light/dark switch, uses next-themes
  ThemeProvider.tsx              # wraps next-themes provider for app/layout.tsx
public/
  ...
```

---

## Phase 3 — `lib/posts.ts` (content layer)

Responsibilities:
- Read all `.md`/`.mdx` files from `content/blog/posts/`.
- Parse frontmatter with `gray-matter`; keep the raw MDX body (a string) separate — it gets compiled
  later by `next-mdx-remote/rsc`'s `<MDXRemote>` at render time, not here.
- Filter out `draft: true` posts in production.
- Sort by date descending.
- `getAllPosts()` → array of `{ slug, title, date, tags, excerpt, readingTime }` (frontmatter only, no
  compiled body — for the index page; use `reading-time` on the raw MDX string).
- `getPostBySlug(slug)` → `{ frontmatter, content }` where `content` is the raw MDX source string, passed
  to `<MDXRemote source={content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, rehypeHighlight] } }} />` in the post page.
- Generate `generateStaticParams()` in `app/blog/[slug]/page.tsx` from `getAllPosts()` so pages are statically generated at build time (fits with git submodule = content pinned at build time).

`lib/mdx-components.tsx` maps standard markdown output to the site's design tokens directly (instead of
relying on a generic `prose` class), e.g.:
```tsx
export const mdxComponents = {
  h2: (props) => <h2 className="font-serif text-2xl mt-10 mb-4" {...props} />,
  a: (props) => <a className="text-accent underline underline-offset-2" {...props} />,
  pre: (props) => <pre className="rounded-md border border-border bg-muted/30 p-4 overflow-x-auto" {...props} />,
  blockquote: (props) => <blockquote className="border-l-2 border-accent pl-4 italic text-muted" {...props} />,
  // extend with a custom <Callout> or <Aside> component later if posts need it
};
```

---

## Phase 4 — Landing Page (`app/page.tsx`)

Sections, in order:

1. **Hero** — editorial masthead, not a status dashboard. Large serif headline (name + a single clear
   positioning line, e.g. "Software engineer building infrastructure for the agentic era"), followed by a
   calm 1–2 sentence sans-serif line giving real human context (what he actually does day to day at Acquia).
   No monospace, no animated "typed" reveal, no jargon-as-decoration. If any motion is used at all, keep it
   subtle (e.g. a gentle fade/slide-up on load) and respect `prefers-reduced-motion`.

2. **What I work on** — 3–4 concise cards/blocks pulled from resume highlights, NOT the full resume dump:
   - Kubernetes-native systems (operators, CRDs, service mesh)
   - Agentic AI infra (LangGraph multi-agent orchestration)
   - Distributed systems fundamentals (Kafka, Temporal, consensus/reconciliation)
   Each with one real, specific detail (e.g. "85% infra cost cut," "zero-trust SSH gateway") — specificity over buzzwords.

3. **Recent writing** — pull latest 3 posts from `getAllPosts()`, render as `PostCard`s, link to `/blog`.
   This is the connective tissue between landing page and blog — keep it live-data, not hardcoded.

4. **Currently learning / building in public** (optional but fits the "engineer prepping for FAANG + writing system design" identity) — short line: "Currently deep in distributed systems + DSA prep — writing up what I learn."

5. **Footer** — GitHub, LinkedIn, email, resume link (can host resume as a static PDF/HTML in `/public`).

Do NOT include: a services/hire-me pitch, generic "passionate developer" copy, or numbered 01/02/03 markers unless something is a genuine sequence (career timeline could justify it — optional).

---

## Phase 5 — Blog Index (`app/blog/page.tsx`)

- List all non-draft posts, most recent first.
- Each `PostCard`: title, date, reading time, excerpt, tag pills.
- Optional: tag filter (client component) if post count grows — skip for v1 if <10 posts.
- Empty state (if content submodule not yet populated): a real, on-voice empty state per the writing guidance — e.g. "No posts yet — first one's in progress." not a broken blank page.

---

## Phase 6 — Individual Post Page (`app/blog/[slug]/page.tsx`)

- Render with `<MDXRemote source={content} components={mdxComponents} options={{...}} />` (see Phase 3) —
  no `dangerouslySetInnerHTML`, no generic `prose` wrapper doing the heavy lifting. Custom component mapping
  handles theme-correct styling (light/dark) automatically since it uses the same CSS variables as the rest
  of the site, rather than needing a separate `prose-invert` dark-mode override.
- Syntax-highlighted code blocks via `rehype-highlight` (wired into `MDXRemote`'s `rehypePlugins` option).
- Metadata: title, date, reading time, tags at top.
- `generateMetadata()` for per-post SEO (title, description from excerpt, OG tags).
- Back-to-blog link.
- Optional: simple "next/previous post" nav.

---

## Phase 7 — SEO / Metadata basics

- `app/layout.tsx`: site-wide metadata (title template, description, OG image, favicon).
- Per-post `generateMetadata()` as above.
- `sitemap.ts` and `robots.ts` (Next.js App Router supports these natively) — include blog post URLs dynamically from `getAllPosts()`.
- Consider RSS feed generation (`feed` npm package) at `/blog/rss.xml` — nice touch for a technical blog audience, optional for v1.

---

## Phase 8 — Deploy considerations (host TBD)

Whichever host is picked later, Claude Code should confirm current docs for submodule support since this
changes over time. Key ask regardless of host: **build step must run `git submodule update --init --recursive`
before `next build`**, or the platform must natively support recursive submodule checkout.

---

## Suggested build order for Claude Code (as literal prompts/steps)

1. Confirm Next.js version, App Router vs Pages Router, and whether Tailwind is already installed.
2. Add the blog content submodule (or scaffold `content/blog/posts/` with 1–2 sample `.md`/`.mdx` files if
   the content repo doesn't exist yet, so the pipeline can be built/tested immediately).
3. Install dependencies (Phase 1).
4. Build `lib/posts.ts` content layer + write a quick test/script to confirm it parses sample posts correctly.
5. Build design tokens (Tailwind config or CSS variables) for both light and dark palettes per above, and wire up `next-themes` in `app/layout.tsx`.
6. Build shared components: `Header` (incl. `ThemeToggle`), `Footer`, `PostCard`.
7. Build landing page (Phase 4).
8. Build `/blog` index (Phase 5).
9. Build `/blog/[slug]` post page (Phase 6).
10. Add SEO metadata, sitemap, robots (Phase 7).
11. Responsive + accessibility pass: mobile breakpoints, keyboard focus states, reduced-motion fallback for any hero motion, verify color contrast (WCAG AA) in both light and dark palettes, confirm theme toggle is keyboard-operable and has no flash-of-wrong-theme on load/refresh.
12. Manual review against design plan — cut anything that reads templated (per frontend-design self-critique step).