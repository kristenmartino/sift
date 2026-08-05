import type { MetadataRoute } from "next";

/**
 * robots.txt at /robots.txt.
 *
 * Note on `max-image-preview: large` (GROWTH_STRATEGY.md:68): it does *not*
 * belong here. Google reads it from the robots meta tag or the X-Robots-Tag
 * header and ignores it in robots.txt, so it lives in the root `robots`
 * metadata in app/layout.tsx instead.
 *
 * Keep the host in step with `metadataBase` in app/layout.tsx and BASE in
 * app/sitemap.ts.
 */
const BASE = "https://siftnews.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // JSON endpoints — nothing to index, and crawling /api/news or
          // /api/compare would run the live AI paths on crawler traffic.
          "/api/",
          // Auth surfaces: no content, and no reason to advertise them.
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
