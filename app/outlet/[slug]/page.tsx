import type { Metadata } from "next";
import { notFound } from "next/navigation";

import OutletDossier from "@/components/outlet/OutletDossier";
import { getOutletBySlug, getRecentArticlesByOutletSlug } from "@/lib/db";
import { parseContextPrimer } from "@/lib/primer";
import type { Article, CategoryId } from "@/lib/types";

// ISR — same heartbeat as the landing page (10 minutes). The dossier reads
// curated metadata that changes quarterly + recent articles that change every
// pipeline cycle, so a 600s edge cache is well-matched on both sides.
export const revalidate = 600;

interface DossierRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DossierRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const outlet = await getOutletBySlug(slug);
  if (!outlet) return { title: "Outlet not found" };
  return {
    title: `${outlet.name} — Outlet dossier`,
    description: `Ownership, funding, bias, and factual-reporting context for ${outlet.name} on Sift.`,
  };
}

export default async function OutletDossierPage({ params }: DossierRouteProps) {
  const { slug } = await params;

  const [outlet, recentRows] = await Promise.all([
    getOutletBySlug(slug),
    // Best-effort prefetch — if the outlet doesn't exist we'll 404 below
    // anyway, but running these in parallel saves a round-trip on the happy
    // path. The query is slug-keyed and tolerates a non-curated slug (returns
    // []) so this is safe to issue speculatively.
    getRecentArticlesByOutletSlug(slug, 20),
  ]);

  if (!outlet) notFound();

  const recentArticles: Article[] = recentRows.map((row) => {
    const primer = parseContextPrimer(row.context_primer);
    return {
      id: row.id,
      title: row.title,
      summary: row.summary || "",
      sourceUrl: row.source_url,
      sourceName: row.source_name,
      publishedDate: row.published_date ? row.published_date.toISOString() : null,
      imageUrl: row.image_url,
      category: row.category as CategoryId,
      readTime: row.read_time || 1,
      ...(row.why_it_matters ? { whyItMatters: row.why_it_matters } : {}),
      ...(row.importance_score ? { importanceScore: row.importance_score } : {}),
      ...(primer ? { contextPrimer: primer } : {}),
      // Outlet field intentionally omitted from the dossier's recent-stories
      // list — every article here is from this outlet by construction; the
      // OutletBadge in those rows would be redundant noise.
    };
  });

  return <OutletDossier outlet={outlet} recentArticles={recentArticles} />;
}
