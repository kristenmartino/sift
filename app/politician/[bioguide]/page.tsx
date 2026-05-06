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
  return {
    title: `${politician.name} — Politician dossier`,
    description: `Committees, donor industries, and voting context for ${politician.name} on Sift.`,
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
