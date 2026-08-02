import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const POSTS_DIR = path.join(process.cwd(), "content", "blog", "posts");

const POST_EXTENSIONS = [".md", ".mdx"];

function isPostFile(filename) {
  return POST_EXTENSIONS.includes(path.extname(filename));
}

function slugFromFilename(filename) {
  const withoutExt = filename.replace(/\.(md|mdx)$/, "");
  // Strip a leading date prefix like "2026-08-02-" if present.
  return withoutExt.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

function assertValidFrontmatter(frontmatter, slug, fullPath) {
  const missing = [];

  if (!frontmatter.title) missing.push("title");
  if (!slug) missing.push("slug");
  if (!frontmatter.date) missing.push("date");
  else if (Number.isNaN(new Date(frontmatter.date).getTime())) {
    missing.push("date (invalid date value)");
  }
  if (!frontmatter.excerpt) missing.push("excerpt");

  if (missing.length > 0) {
    throw new Error(
      `Invalid frontmatter in "${fullPath}": missing required field(s): ${missing.join(", ")}`
    );
  }
}

function readPostFile(filename) {
  const fullPath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data: frontmatter, content } = matter(raw);
  const slug = frontmatter.slug || slugFromFilename(filename);
  assertValidFrontmatter(frontmatter, slug, fullPath);
  return { filename, frontmatter, content, slug };
}

function listPostFiles() {
  return fs.readdirSync(POSTS_DIR).filter(isPostFile);
}

/**
 * Reads every post in content/blog/posts/, parses frontmatter, filters out
 * drafts in production, and returns summary objects sorted by date
 * descending.
 *
 * @returns {Array<{
 *   slug: string,
 *   title: string,
 *   date: string,
 *   tags: string[],
 *   excerpt: string,
 *   readingTime: string,
 * }>}
 */
export function getAllPosts() {
  const files = listPostFiles();

  const posts = files
    .map(readPostFile)
    .filter(({ frontmatter }) => {
      if (process.env.NODE_ENV === "production") {
        return frontmatter.draft !== true;
      }
      return true;
    })
    .map(({ frontmatter, content, slug }) => ({
      slug,
      title: frontmatter.title,
      date: frontmatter.date,
      tags: frontmatter.tags || [],
      excerpt: frontmatter.excerpt || "",
      readingTime: readingTime(content).text,
    }));

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  return posts;
}

/**
 * Finds the post matching the given slug and returns its full frontmatter
 * plus the raw (uncompiled) markdown/MDX body.
 *
 * @param {string} slug
 * @returns {{ frontmatter: object, content: string } | null}
 */
export function getPostBySlug(slug) {
  const files = listPostFiles();

  for (const filename of files) {
    const post = readPostFile(filename);
    if (post.slug === slug) {
      return { frontmatter: post.frontmatter, content: post.content };
    }
  }

  return null;
}
