import type { MetadataRoute } from "next";

import { listSitemapEntries } from "@/lib/db";

/**
 * XML sitemap at /sitemap.xml.
 *
 * Until this existed there was no declared crawl path to any dossier — no
 * sitemap, no robots.txt, no structured data — so the 838-row dossier set
 * that OPERATING_CONTEXT §2 calls the sellable asset was invisible to search.
 *
 * Dossier URLs come from `listSitemapEntries`, which applies the publish
 * floor (see its docstring). Thin rows are deliberately absent: they still
 * render and still resolve entity chips, they just aren't advertised.
 *
 * `siftnews.io` matches `metadataBase` in app/layout.tsx — keep them in step
 * or canonical URLs and sitemap URLs will disagree.
 */
const BASE = "https://siftnews.io";

// Hand-maintained because it's short and the tradeoffs differ per page.
// Excluded on purpose: /(auth)/sign-in and /sign-up (nothing to index and no
// value in advertising an auth surface), and every /api/* route.
const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "hourly", priority: 1.0 },
  { path: "/news", changeFrequency: "hourly", priority: 0.9 },
  { path: "/civic", changeFrequency: "weekly", priority: 0.8 },
  { path: "/agencies", changeFrequency: "monthly", priority: 0.7 },
  { path: "/think-tanks", changeFrequency: "monthly", priority: 0.7 },
  { path: "/methodology", changeFrequency: "monthly", priority: 0.5 },
  { path: "/colophon", changeFrequency: "monthly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

// Revalidate hourly. The dossier set changes on a seeder run, not per request,
// and regenerating a ~650-URL document on every crawler hit is wasted work.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // A DB blip must not take the sitemap down entirely — serving the static
  // routes is strictly better than serving a 500 to a crawler.
  let dossierEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await listSitemapEntries();
    dossierEntries = rows.map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified: r.lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error("sitemap: dossier query failed, serving static routes only", err);
  }

  return [...staticEntries, ...dossierEntries];
}
