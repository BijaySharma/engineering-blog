# SDD Task Plan — Personal Site + System Design Blog

Source design doc: `claude/plan.md`. This file restructures that plan into
discrete, independently-reviewable tasks for subagent-driven development.
Do not edit `claude/plan.md` — it is the design reference; this file is the
execution breakdown.

## Global Constraints (apply to every task)

- **Plain JavaScript, not TypeScript.** This project has no `tsconfig.json`,
  only `jsconfig.json` with path alias `@/*` → `./src/*`. Existing files are
  `.js`/`.jsx` (`src/app/layout.js`, `src/app/page.js`). Every file you add
  or reference from the original design doc's `.ts`/`.tsx` paths must use
  `.js` (plain modules) or `.jsx` (files containing JSX) instead. Do not
  install TypeScript or add a tsconfig.
- **App Router only**, root at `src/app/` (not top-level `app/`).
- **Next.js version is 16.2.12.** `AGENTS.md` in the repo root explicitly
  warns this build may differ from training-data assumptions. Before using
  any Next.js API or file convention (routing, `generateStaticParams`,
  `generateMetadata`, `sitemap`/`robots` file conventions, `next/font`,
  etc.), read the relevant page(s) under `node_modules/next/dist/docs/01-app/`
  in this repo and follow what they say over prior training knowledge. Note
  in your report if anything differs from the plan's assumptions.
- **Tailwind v4, CSS-first config.** No `tailwind.config.js` exists or should
  be created. Config lives in `src/app/globals.css` via `@import "tailwindcss";`
  and an `@theme inline { ... }` block mapping `--color-*` / `--font-*` vars.
  Follow this existing pattern when adding design tokens.
- **Content location:** `content/blog/posts/` inside this repo (scaffolded
  locally, not yet a git submodule — user decision: wire up the real
  submodule later once the content repo exists). Do not attempt to create a
  GitHub repo or `git submodule add`.
- **Working directly on `main`** (user declined an isolated worktree/branch
  for this build) — commit directly to the current branch.
- **Skip `@tailwindcss/typography`.** The plan lists it as an optional
  nice-to-have "base layer," but Task 3 builds explicit MDX component
  mappings that cover all rendered elements — an unused generic prose layer
  would be dead weight (YAGNI). Do not install it.
- **Design tokens — copy these values verbatim:**
  - Light: bg `#FAFAF9`, text `#1A1A1A`, accent `#3B5D8C`, muted text `#6B6B68`, borders `#E4E2DD`.
  - Dark: bg `#131315`, text `#EDEDEB`, accent `#7FA3CC`, muted text `#8A8A87`, borders `#2A2A2C`.
  - Headings: serif — Source Serif 4 or Lora (via `next/font/google`). Body/UI: sans — Inter or `system-ui`.
  - Monospace only inside rendered code blocks (from `rehype-highlight`), never decoratively.
  - Prose measure: cap at ~65ch.
  - Theme switching: `next-themes`, attribute `data-theme` (not the default `class`), values `"light"`/`"dark"`, with system-preference default and persistence. No flash-of-wrong-theme on load.
- **Aesthetic guardrails** (apply when building UI, not just content): editorial/masthead feel, no terminal/hacker aesthetic, no numbered 01/02/03 markers (unless a genuine sequence like a career timeline — not used in this plan), no fake dashboard/status-line UI, no "passionate developer" generic copy, no services/hire-me pitch section.
- Owner bio facts (for landing page copy — Task 6): Bijay Sharma, Software
  Engineer at Acquia. Builds Kubernetes operators, distributed systems, and
  agentic AI tooling (LangGraph/LangChain). CKAD certified. Prepping for
  FAANG SDE roles alongside this work.

---

## Task 1: Content scaffold + submodule documentation

Create the local content directory structure (standing in for the future
separate content repo/submodule):

```
content/blog/posts/
  2026-08-02-kubernetes-operators-101.md
  2026-08-10-consistent-hashing.mdx
```

Each post needs YAML frontmatter with exactly these fields:

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

- The `.md` post should be plain markdown, a few real paragraphs on
  Kubernetes operators (topic: what operators are, why CRDs+controllers
  exist, one concrete reconciliation-loop example). No lorem ipsum.
- The `.mdx` post should be a genuine system-design explainer on consistent
  hashing, and must embed one custom component call, e.g. `<Callout>Some
  aside text</Callout>`, to prove the MDX pipeline can render custom
  components later (Task 3/8 will supply the actual `<Callout>`
  implementation — for this task, just author the MDX source using it; it
  does not need to render correctly yet).
- Both posts: `draft: false`, realistic `tags`, a one-sentence `excerpt`.
- Update `README.md`: add a short section documenting that
  `content/blog/posts/` will become a git submodule pointing at a separate
  content repo, with the future commands:
  ```bash
  git clone --recurse-submodules <repo-url>
  # or after clone:
  git submodule update --init --recursive
  ```
  Also note that whichever deploy host is chosen later must run
  `git submodule update --init --recursive` before `next build` (or natively
  support recursive submodule checkout).

**Acceptance:** two posts exist under `content/blog/posts/` with the exact
frontmatter schema above; README has the submodule note; nothing else in
the app changes yet (this task doesn't read/render the posts).

---

## Task 2: Install content-pipeline dependencies

Run:

```bash
npm install gray-matter next-mdx-remote rehype-highlight rehype-slug remark-gfm reading-time next-themes
```

Do **not** add `@tailwindcss/typography` (see Global Constraints — skipped
by design decision).

**Acceptance:** `package.json`/`package-lock.json` updated with exactly
these six new dependencies; `npm run build` still succeeds (app is
otherwise unchanged so this just proves the install didn't break anything).

---

## Task 3: Content layer — `lib/posts.js` + `lib/mdx-components.jsx`

Depends on: Task 1 (sample posts to parse against), Task 2 (`gray-matter`,
`reading-time` installed).

Create `src/lib/posts.js` (plain `.js`, no JSX) with:

- `getAllPosts()` — reads every `.md`/`.mdx` file in
  `content/blog/posts/`, parses frontmatter with `gray-matter`, filters out
  `draft: true` posts when `process.env.NODE_ENV === 'production'`, sorts by
  `date` descending, and returns an array of
  `{ slug, title, date, tags, excerpt, readingTime }` objects — frontmatter
  only, no compiled MDX body. Compute `readingTime` from the raw markdown
  body using the `reading-time` package (e.g. `.text` field, "X min read").
  `slug` comes from frontmatter if present, otherwise derive it from the
  filename (strip date prefix and extension).
- `getPostBySlug(slug)` — finds the matching file, parses it, and returns
  `{ frontmatter, content }` where `content` is the **raw** MDX/markdown
  source string (not compiled — compilation happens later via
  `<MDXRemote>` in the page component, Task 8).
- Both functions read from disk each call (no caching layer needed — build
  count is small; don't add memoization, that's premature for this size).

Create `src/lib/mdx-components.jsx` (JSX) exporting `mdxComponents`, an
object mapping MDX/markdown elements to styled components matching this
project's Tailwind v4 design tokens (tokens land in Task 4 — write the
class names now using the token names from Global Constraints; they'll
resolve visually once Task 4 lands, this task doesn't need to wait on it):

```jsx
export const mdxComponents = {
  h2: (props) => <h2 className="font-serif text-2xl mt-10 mb-4" {...props} />,
  a: (props) => <a className="text-accent underline underline-offset-2" {...props} />,
  pre: (props) => <pre className="rounded-md border border-border bg-muted/30 p-4 overflow-x-auto" {...props} />,
  blockquote: (props) => <blockquote className="border-l-2 border-accent pl-4 italic text-muted" {...props} />,
};
```

Extend this mapping with at minimum `h1`, `h3`, `ul`, `ol`, `li`, `p`,
`code` (inline), and `img` following the same token-based styling approach
(serif for headings, sans body, muted borders) — the plan explicitly wants
per-element mapping instead of a generic `prose` wrapper. Also add a
`Callout` component to the exported map (a simple bordered/tinted aside box
using the accent/border tokens) so the sample MDX post from Task 1 has
something real to render against in Task 8.

Write a throwaway verification script (e.g. run via `node -e` or a
temporary script you delete before finishing) that calls `getAllPosts()`
and `getPostBySlug()` against the two sample posts from Task 1 and confirms
the shape/values are correct. Do not leave a permanent test file unless
this project already has a test runner configured (it doesn't — don't
introduce one just for this).

**Acceptance:** `getAllPosts()` returns both sample posts sorted by date
descending with correct fields; `getPostBySlug('consistent-hashing')`
(or whatever slug Task 1 used) returns the right frontmatter + raw content;
draft filtering logic is present and correct even though no current sample
post is a draft.

---

## Task 4: Design tokens + theme switching

Depends on: Task 2 (`next-themes` installed).

1. Rewrite `src/app/globals.css` to define both palettes as CSS custom
   properties, switched by `[data-theme="light"]` / `[data-theme="dark"]`
   attribute selectors on `:root` (or `html`), then map them into Tailwind's
   `@theme inline` block as `--color-background`, `--color-foreground`,
   `--color-accent`, `--color-muted`, `--color-border` (adjust names as
   needed but keep them consistent with what Task 3's `mdxComponents` and
   later component tasks reference: `bg-background`, `text-foreground`,
   `text-accent`, `text-muted`, `border-border`, `bg-muted/30`, etc.). Use
   the exact hex values from Global Constraints for light and dark. Remove
   the old Geist-only `--background`/`--foreground` light/dark-media-query
   scheme — it's being replaced by the `data-theme`-driven one.
2. Add `next/font/google` font loading in `src/app/layout.js` for a serif
   heading font (Source Serif 4 or Lora) and a sans body font (Inter),
   replacing the current Geist Sans/Geist Mono setup. Wire both as CSS
   variables into `@theme inline` (`--font-serif`, `--font-sans`), and
   apply `font-sans` as the default body font, `font-serif` used explicitly
   on headings (don't make headings inherit serif globally via `<h1>`
   element selector — component-level classes only, since MDX components in
   Task 3 already set this explicitly).
3. Create `src/components/ThemeProvider.jsx` wrapping `next-themes`'s
   `ThemeProvider` with `attribute="data-theme"`, `defaultTheme="system"`,
   `enableSystem`, and `disableTransitionOnChange` (check
   `node_modules/next/dist/docs` and `next-themes`'s own README in
   `node_modules/next-themes` for current correct usage/props — don't rely
   on memorized defaults given the "not the Next.js you know" warning may
   extend to how these two integrate, e.g. `suppressHydrationWarning`
   requirements on `<html>`).
4. Update `src/app/layout.js` to wrap `children` in `<ThemeProvider>` and
   add `suppressHydrationWarning` to the `<html>` tag (required by
   `next-themes` to avoid a hydration mismatch warning — verify this is
   still accurate for the installed version before relying on it).
5. Create `src/components/ThemeToggle.jsx` — a sun/moon icon button (plain
   inline SVG icons are fine, no icon library dependency needed for two
   icons) that toggles between light/dark via `next-themes`'s `useTheme()`
   hook. Must be keyboard-operable (a real `<button>`, visible focus ring
   using the border/accent tokens) and must not render anything
   theme-dependent until mounted client-side (avoid hydration mismatch —
   standard `next-themes` pattern of gating on a `mounted` state).

**Acceptance:** app builds and runs; toggling theme (once wired into a
page — later tasks place the toggle in the Header) flips the `data-theme`
attribute and visually swaps the palette with no flash on reload; both
palettes render text/background/border/accent colors matching the exact
hex values.

---

## Task 5: Shared components — Header, Footer, PostCard

Depends on: Task 4 (tokens + `ThemeToggle` exist).

- `src/components/Header.jsx` — editorial masthead style (not a
  navbar-with-logo SaaS look): site name/wordmark in serif, nav links (Home,
  Blog), and the `ThemeToggle` from Task 4. Sticky or static per your
  judgment — keep it simple, no scroll-triggered shrink/blur effects (that
  reads as a gimmick per the design direction).
- `src/components/Footer.jsx` — links: GitHub, LinkedIn, email, resume
  (resume link can point to a placeholder path like `/resume.pdf` in
  `public/` — don't fabricate a real resume file; a placeholder link is
  fine, note it in your report as needing a real file later).
- `src/components/PostCard.jsx` — takes one post object (the shape returned
  by `getAllPosts()` from Task 3: `{ slug, title, date, tags, excerpt,
  readingTime }`) and renders title (serif, linked to `/blog/[slug]`), date,
  reading time, excerpt, and tag pills. This component is shared between the
  landing page's "Recent writing" section (Task 6) and the blog index
  (Task 7) — build it generically now so both can reuse it without
  modification.

**Acceptance:** all three components render with real (not placeholder
lorem) content when given real props; keyboard focus is visible on all
interactive elements (links, theme toggle button); no console warnings.

---

## Task 6: Landing page (`src/app/page.js`)

Depends on: Task 3 (`getAllPosts`), Task 4 (tokens/fonts), Task 5 (Header,
Footer, PostCard).

Replace the current create-next-app boilerplate `src/app/page.js` entirely.
Sections, in this order:

1. **Hero** — large serif headline: name + one positioning line (e.g.
   "Software engineer building infrastructure for the agentic era"),
   followed by a calm 1–2 sentence sans-serif line giving real context on
   what Bijay does day to day at Acquia (see Global Constraints bio facts).
   No monospace, no typed/animated text reveal. If you add any motion at
   all (e.g. a subtle fade/slide-up on load), it must respect
   `prefers-reduced-motion` (wrap in a CSS media query or check the media
   feature before animating — do not use a motion library for one subtle
   effect).
2. **What I work on** — 3 cards/blocks, each with one specific, non-generic
   detail:
   - Kubernetes-native systems (operators, CRDs, service mesh)
   - Agentic AI infra (LangGraph multi-agent orchestration)
   - Distributed systems fundamentals (Kafka, Temporal, consensus/reconciliation)
   Do not invent specific metrics (e.g. "85% cost cut") that aren't given to
   you — the original plan's example numbers are illustrative, not real
   figures to fabricate. Write each block with one concrete, real technical
   detail instead (e.g. name the actual technology/pattern), not an
   invented statistic.
3. **Recent writing** — call `getAllPosts()`, take the first 3, render as
   `PostCard`s, with a link to `/blog`. This section must break gracefully
   if there are fewer than 3 posts (there are exactly 2 right now from Task
   1) — render whatever exists, don't hardcode a length-3 assumption.
4. **Currently learning** — one short line: "Currently deep in distributed
   systems + DSA prep — writing up what I learn."
5. **Footer** — reuse the `Footer` component from Task 5.

Do not add: a services/hire-me pitch, generic "passionate developer" copy,
or numbered 01/02/03 markers.

Add `Header` from Task 5 to `src/app/layout.js` if not already placed there
by an earlier task (Header/Footer should wrap all pages via the root
layout, not be duplicated per-page) — check Task 4/5's work before deciding
whether this belongs in `layout.js` or `page.js`.

**Acceptance:** landing page renders all 5 sections with real content, no
placeholder/lorem text, "Recent writing" pulls live data from
`getAllPosts()` (verify by temporarily changing a sample post's title and
confirming it reflects on the page, then revert), responsive on mobile
width, keyboard-navigable.

---

## Task 7: Blog index (`src/app/blog/page.js`)

Depends on: Task 3 (`getAllPosts`), Task 5 (`PostCard`).

- List all non-draft posts, most recent first, each rendered as a
  `PostCard`.
- Skip the tag-filter feature — plan explicitly says skip for v1 since post
  count (2) is well under the 10-post threshold it names. Don't build it.
- Empty state: if `getAllPosts()` returns zero posts, render an on-voice
  message like "No posts yet — first one's in progress." instead of a blank
  page. (Not reachable right now with 2 sample posts, but must be correct —
  verify by temporarily pointing at an empty directory or mocking the
  return value, then revert/remove the temporary change.)

**Acceptance:** page lists both sample posts with correct metadata; empty
state verified to work (per above) and reverted; no console warnings.

---

## Task 8: Individual post page (`src/app/blog/[slug]/page.js`)

Depends on: Task 2 (`next-mdx-remote`, `remark-gfm`, `rehype-highlight`,
`rehype-slug` installed), Task 3 (`getPostBySlug`, `mdxComponents`).

- Render via `<MDXRemote source={content} components={mdxComponents}
  options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins:
  [rehypeSlug, rehypeHighlight] } }} />` from `next-mdx-remote/rsc`. No
  `dangerouslySetInnerHTML`, no generic `prose` class carrying the styling —
  `mdxComponents` from Task 3 does that.
- Before wiring this up, read `node_modules/next/dist/docs` guidance (and
  `next-mdx-remote`'s own docs/README in `node_modules/next-mdx-remote`) for
  the RSC entry point's current API — confirm `next-mdx-remote/rsc` exists
  and the options shape matches what's written above for the installed
  version; adjust if it doesn't and note the discrepancy in your report.
- `generateStaticParams()` built from `getAllPosts()` so all post pages are
  statically generated at build time.
- `generateMetadata({ params })` for per-post SEO: `title`, `description`
  (from `excerpt`), and basic OG tags (title, description, type "article").
  Read the Next.js metadata API docs under `node_modules/next/dist/docs`
  first to confirm current `generateMetadata` signature/return shape (note
  in your report if `params` needs to be awaited in this version — this has
  changed across Next.js versions and the repo's AGENTS.md specifically
  warns about this kind of drift).
- Render post metadata at the top: title, date, reading time, tags.
- A "back to blog" link to `/blog`.
- Skip next/previous post navigation — plan marks it optional, not needed
  for 2 posts.

**Acceptance:** both sample posts render correctly at `/blog/<slug>`,
including the `.mdx` post's `<Callout>` usage from Task 1 actually
rendering as a styled callout (not raw text or a crash); code blocks (if
any exist in the sample posts — add one to the Kubernetes post if it
doesn't already have one, to prove `rehype-highlight` works) are
syntax-highlighted; `generateMetadata` produces correct per-post title.

---

## Task 9: SEO — site metadata, sitemap, robots

Depends on: Task 3 (`getAllPosts`), Task 8 (post URLs pattern established).

- `src/app/layout.js`: add site-wide `metadata` export — title template
  (e.g. `"%s | Bijay Sharma"` with a default), description, and a favicon
  reference (check what's already in `public/` before adding a new one —
  `src/app/favicon.ico` already exists from the bootstrap).
- `src/app/sitemap.js` — Next.js App Router native sitemap convention.
  Read the current API for this under `node_modules/next/dist/docs` first
  (return shape / file convention may differ from older versions per the
  AGENTS.md warning). Include the landing page, `/blog`, and every post URL
  from `getAllPosts()`.
- `src/app/robots.js` — same verification step; standard allow-all plus a
  pointer to the sitemap.
- Skip the RSS feed (`feed` package) — plan marks it optional for v1.

**Acceptance:** `next build` produces `sitemap.xml` and `robots.txt` (or
their App-Router-native equivalents) listing all current routes including
both post slugs; page titles follow the template pattern.

---

## Task 10: Responsive + accessibility pass

Depends on: all prior tasks (this is a cross-cutting pass over everything
built).

Go through every page/component built in Tasks 4–9 and verify/fix:

- Mobile breakpoints: hero, cards, header nav, and post content all remain
  usable and readable at narrow (~375px) width — adjust Tailwind responsive
  classes where something breaks (e.g. card grids collapsing to one column,
  header nav not overflowing).
- Keyboard focus states: every interactive element (nav links, theme
  toggle, post links, footer links) has a visible focus ring using the
  border/accent tokens — don't rely on the browser default outline alone if
  it's been suppressed anywhere; don't suppress it anywhere.
- `prefers-reduced-motion`: any animation added in Task 6's hero (or
  elsewhere) is skipped/reduced when this media feature is set.
- Color contrast: check text/background and accent/background combinations
  against the exact hex values in Global Constraints for both palettes meet
  WCAG AA (4.5:1 for normal text, 3:1 for large text/UI components) — if
  any combination fails, adjust that specific token's shade slightly and
  report the change; do not change the whole palette without cause.
- Theme toggle: confirm it's operable via keyboard alone (Tab to it, Enter
  to activate) and that there's no flash-of-wrong-theme on a hard page
  reload in both light and dark starting states.

**Acceptance:** report lists each check above with pass/fail and any fix
applied; no remaining failures at task completion (fix everything found,
this task's job is exactly that pass).
