import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BillDossier from "@/components/bill/BillDossier";
import { getBillById, getPoliticianByBioguide } from "@/lib/db";
import { formatBillIdDisplay } from "@/lib/bill";
import { dossierRobotsMeta, isPublishableBill } from "@/lib/publishFloor";
import { billJsonLd, jsonLdString } from "@/lib/structuredData";

// ISR — same heartbeat as the other dossier routes.
export const revalidate = 600;

interface BillRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BillRouteProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);
  if (!bill) return { title: "Bill not found" };
  const display = formatBillIdDisplay(bill.billId);

  // Per-route metadata override so shared bill links carry the bill's
  // name in the unfurl card. og:image comes from the sibling
  // opengraph-image.tsx (shared card factory in lib/og.tsx).
  const fullTitle = `${display} (${bill.shortTitle ?? "Bill"}) — Sift`;
  const description = `Sponsor, cosponsors, status, and lobbying spend for ${
    bill.shortTitle ?? display
  } on Sift.`;
  return {
    title: `${display} — Bill dossier`,
    description,
    // Below-floor dossiers are not advertised. Spread, not assign: a
    // `robots` key present here would override the root config even when
    // undefined, dropping max-image-preview. See lib/publishFloor.ts.
    ...dossierRobotsMeta(isPublishableBill(bill)),
    openGraph: {
      title: fullTitle,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export default async function BillDossierPage({ params }: BillRouteProps) {
  const { id } = await params;
  const bill = await getBillById(id);
  if (!bill) notFound();

  // Resolve the sponsor's politician profile so the dossier can render
  // their name as a clickable link to /politician/[bioguide]. Tolerant
  // of misses — a sponsor whose bioguide hasn't been curated yet renders
  // as plain text (no broken link).
  const sponsor = bill.sponsorBioguide
    ? await getPoliticianByBioguide(bill.sponsorBioguide)
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(billJsonLd(bill)) }}
      />
      <BillDossier bill={bill} sponsor={sponsor} />
    </>
  );
}
