import type { Metadata } from "next";
import { notFound } from "next/navigation";

import OutletDossier from "@/components/outlet/OutletDossier";
import JsonLd from "@/components/JsonLd";
import { mapArticleRows } from "@/lib/articleMapping";
import { getOutletBySlug, getRecentArticlesByOutletSlug } from "@/lib/db";
import { dossierMetadata } from "@/lib/metadata";
import { isPublishableOutlet } from "@/lib/publishFloor";
import { outletJsonLd } from "@/lib/structuredData";
import type { Article } from "@/lib/types";

// ISR — same heartbeat as the landing page (30 minutes). The dossier reads
// curated metadata that changes quarterly + recent articles that change every
// pipeline cycle, so a 1800s edge cache is well-matched on both sides.
export const revalidate = 1800;

interface DossierRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DossierRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const outlet = await getOutletBySlug(slug);
  if (!outlet) return { title: "Outlet not found" };

  // Per-route metadata override so shared outlet links carry the
  // outlet's name in the unfurl card.
  return dossierMetadata({
    title: `${outlet.name} — Outlet dossier`,
    description: `Ownership, funding, bias, and factual-reporting context for ${outlet.name} on Sift.`,
    indexable: isPublishableOutlet(outlet),
    ogType: "profile",
  });
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

  // Outlet field intentionally omitted from the dossier's recent-stories
  // list — every article here is from this outlet by construction; the
  // OutletBadge in those rows would be redundant noise.
  const recentArticles: Article[] = mapArticleRows(recentRows, { clean: false });

  return (
    <>
      <JsonLd data={outletJsonLd(outlet)} />
      <OutletDossier outlet={outlet} recentArticles={recentArticles} />
    </>
  );
}
