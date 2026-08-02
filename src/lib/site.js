/**
 * Canonical site origin, used for metadataBase (layout.js), sitemap.js, and
 * robots.js so absolute URLs stay in one place.
 *
 * Override via SITE_URL once the real production domain is known; falls
 * back to the IANA-reserved placeholder domain so builds don't fail (and
 * don't accidentally point search engines at an unowned domain) in the
 * meantime. This is a server-only value (consumed by layout.js, sitemap.js,
 * robots.js only) so it intentionally does not use the NEXT_PUBLIC_ prefix.
 */
export const SITE_URL = process.env.SITE_URL || "https://example.com";
