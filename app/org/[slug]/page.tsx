import type { Metadata } from "next";
import { notFound } from "next/navigation";

import OrgDossier from "@/components/org/OrgDossier";
import JsonLd from "@/components/JsonLd";
import { getFundingEdgesForOrg, getOrgBySlug } from "@/lib/db";
import { dossierMetadata } from "@/lib/metadata";
import { einFromOrgLinks } from "@/lib/org";
import { isPublishableOrg } from "@/lib/publishFloor";
import { orgJsonLd } from "@/lib/structuredData";

// ISR — same heartbeat as the landing + outlet/politician dossiers.
// Org metadata changes slowly (annual budgets refresh on 990 cycles,
// FARA registrations are sporadic), so 600s is well-matched.
export const revalidate = 600;

interface OrgRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: OrgRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return { title: "Organization not found" };

  // Per-route metadata override so shared org-dossier links carry the
  // org's name in the unfurl card. og:image comes from the sibling
  // opengraph-image.tsx (shared card factory in lib/og.tsx).
  // No "political lean" here — migration 013 dropped the column precisely so
  // Sift stops characterizing organizations. The description shouldn't keep
  // advertising a field the page no longer has.
  return dossierMetadata({
    title: `${org.name} — Org dossier`,
    description: `Governance, cited annual expenses, self-description, and FARA disclosure for ${org.name} on Sift.`,
    indexable: isPublishableOrg(org),
    ogType: "profile",
  });
}

export default async function OrgDossierPage({ params }: OrgRouteProps) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  // Filed 990 edges, matched by the EIN inside the org's ProPublica link.
  // Guarded so a funding-table miss degrades to a dossier without the
  // sections rather than a broken page — same posture as the lead-story
  // and outlet-map fetches on the landing route.
  const funding = await getFundingEdgesForOrg(einFromOrgLinks(org.externalLinks))
    .catch(() => undefined);
  return (
    <>
      <JsonLd data={orgJsonLd(org)} />
      <OrgDossier org={org} funding={funding} />
    </>
  );
}
