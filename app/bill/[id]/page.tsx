import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BillDossier from "@/components/bill/BillDossier";
import { getBillById, getPoliticianByBioguide } from "@/lib/db";
import { formatBillIdDisplay } from "@/lib/bill";

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
  return {
    title: `${display} — Bill dossier`,
    description: `Sponsor, cosponsors, status, and lobbying spend for ${
      bill.shortTitle ?? display
    } on Sift.`,
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

  return <BillDossier bill={bill} sponsor={sponsor} />;
}
