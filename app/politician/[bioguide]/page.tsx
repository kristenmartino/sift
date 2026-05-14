import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PoliticianDossier from "@/components/politician/PoliticianDossier";
import { getPoliticianByBioguide } from "@/lib/db";

// ISR — same heartbeat as the landing + outlet dossier (10 minutes).
// Politician metadata changes slowly (committees shift quarterly,
// donor/voting data updates daily via the Phase 3.E refresh job), so a
// 600s edge cache is well-matched on both sides.
export const revalidate = 600;

interface PoliticianRouteProps {
  params: Promise<{ bioguide: string }>;
}

export async function generateMetadata({
  params,
}: PoliticianRouteProps): Promise<Metadata> {
  const { bioguide } = await params;
  const politician = await getPoliticianByBioguide(bioguide);
  if (!politician) return { title: "Politician not found" };

  // Per-route metadata override so shared dossier links carry the
  // politician's name, not the homepage's generic title. og:image still
  // inherits the homepage OG — route-specific images are a Phase 2 polish.
  const partyState =
    politician.party && politician.state
      ? ` (${politician.party}-${politician.state})`
      : "";
  const fullTitle = `${politician.name}${partyState} — Politician dossier | Sift`;
  const description = `Committees, top industries by PAC contributions, and voting context for ${politician.name} on Sift.`;
  return {
    title: `${politician.name} — Politician dossier`,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export default async function PoliticianDossierPage({
  params,
}: PoliticianRouteProps) {
  const { bioguide } = await params;
  const politician = await getPoliticianByBioguide(bioguide);
  if (!politician) notFound();
  return <PoliticianDossier politician={politician} />;
}
