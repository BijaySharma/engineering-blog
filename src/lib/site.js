/**
 * Canonical site origin, used for metadataBase (layout.js), sitemap.js, and
 * robots.js so absolute URLs stay in one place.
 *
 * Override via NEXT_PUBLIC_SITE_URL once the real production domain is
 * known; falls back to a placeholder so builds don't fail in the meantime.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bijaysharma.dev";
