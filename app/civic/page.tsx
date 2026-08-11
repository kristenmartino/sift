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
// Count-free on purpose: the hardcoded "536 sitting members" froze stale
// while the corpus grew past 600 (executives, foreign leaders, SCOTUS).
// Same rule as the outlet count — quote a number only where it's derived.
const CIVIC_DESC =
  "Browse Sift's curated politician, organization, and bill dossiers. Every sitting member of Congress, federal agencies, the major think-tanks shaping policy, and landmark bills.";

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
  // 'executive' and 'foreign-executive' were unreachable from this index
  // until migration 015 gave those rows sourced content worth linking to.
  const CHAMBER_FILTERS: readonly PoliticianChamber[] = [
    "senate",
    "house",
    "executive",
    "foreign-executive",
    "scotus",
  ];
  const chamberFilter: PoliticianChamber | null =
    CHAMBER_FILTERS.includes(params.chamber as PoliticianChamber)
      ? (params.chamber as PoliticianChamber)
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
