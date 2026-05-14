import type { Metadata } from "next";

import CivicIndex from "@/components/civic/CivicIndex";
import {
  listAllBillsLite,
  listAllOrgsLite,
  listAllPoliticiansLite,
} from "@/lib/db";
import type { PoliticianChamber } from "@/lib/types";

// ISR — committee/dossier metadata changes slowly (politician roster ~6mo,
// org curation ~quarterly, bills as we add them). 10-minute cache keeps the
// page snappy without staleness mattering at this cadence.
export const revalidate = 600;

// Per-route metadata override so shared /civic links carry the index's
// own title/description in unfurl cards (not the homepage default).
const CIVIC_TITLE = "Civic dossiers — Sift";
const CIVIC_DESC =
  "Browse Sift's curated politician, organization, and bill dossiers. 536 sitting members of Congress, federal agencies, the major think-tanks shaping policy, and landmark bills.";

export const metadata: Metadata = {
  title: CIVIC_TITLE,
  description: CIVIC_DESC,
  openGraph: {
    title: CIVIC_TITLE,
    description: CIVIC_DESC,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: CIVIC_TITLE,
    description: CIVIC_DESC,
  },
};

interface CivicPageProps {
  searchParams: Promise<{ chamber?: string }>;
}

export default async function CivicPage({ searchParams }: CivicPageProps) {
  const params = await searchParams;
  const chamberFilter: PoliticianChamber | null =
    params.chamber === "senate" || params.chamber === "house"
      ? params.chamber
      : null;

  const [politicians, orgs, bills] = await Promise.all([
    listAllPoliticiansLite(),
    listAllOrgsLite(),
    listAllBillsLite(),
  ]);

  return (
    <CivicIndex
      politicians={politicians}
      orgs={orgs}
      bills={bills}
      chamberFilter={chamberFilter}
    />
  );
}
