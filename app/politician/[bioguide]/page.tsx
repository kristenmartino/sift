import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PoliticianDossier from "@/components/politician/PoliticianDossier";
import JsonLd from "@/components/JsonLd";
import { getPoliticianByBioguide } from "@/lib/db";
import { dossierMetadata } from "@/lib/metadata";
import { isPublishablePolitician } from "@/lib/publishFloor";
import { politicianJsonLd } from "@/lib/structuredData";

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
  // politician's name, not the homepage's generic title. og:image comes from
  // the sibling opengraph-image.tsx (shared card factory in lib/og.tsx).
  const partyState =
    politician.party && politician.state
      ? ` (${politician.party}-${politician.state})`
      : "";
  return dossierMetadata({
    title: `${politician.name} — Politician dossier`,
    unfurlTitle: `${politician.name}${partyState} — Politician dossier | Sift`,
    description: `Committees, top industries by PAC contributions, and voting context for ${politician.name} on Sift.`,
    indexable: isPublishablePolitician(politician),
    ogType: "profile",
  });
}

export default async function PoliticianDossierPage({
  params,
}: PoliticianRouteProps) {
  const { bioguide } = await params;
  const politician = await getPoliticianByBioguide(bioguide);
  if (!politician) notFound();
  return (
    <>
      {/* Emits only fields the page itself renders — notably not `notes`. */}
      <JsonLd data={politicianJsonLd(politician)} />
      <PoliticianDossier politician={politician} />
    </>
  );
}
