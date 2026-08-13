import type { Metadata } from "next";
import { notFound } from "next/navigation";

import OrgDossier from "@/components/org/OrgDossier";
import { getFundingEdgesForOrg, getOrgBySlug } from "@/lib/db";
import { einFromOrgLinks } from "@/lib/org";
import { dossierRobotsMeta, isPublishableOrg } from "@/lib/publishFloor";
import { jsonLdString, orgJsonLd } from "@/lib/structuredData";

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
  const fullTitle = `${org.name} — Org dossier | Sift`;
  // No "political lean" here — migration 013 dropped the column precisely so
  // Sift stops characterizing organizations. The description shouldn't keep
  // advertising a field the page no longer has.
  const description = `Governance, cited annual expenses, self-description, and FARA disclosure for ${org.name} on Sift.`;
  return {
    title: `${org.name} — Org dossier`,
    description,
    // Below-floor dossiers are not advertised. Spread, not assign: a
    // `robots` key present here would override the root config even when
    // undefined, dropping max-image-preview. See lib/publishFloor.ts.
    ...dossierRobotsMeta(isPublishableOrg(org)),
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

export default async function OrgDossierPage({ params }: OrgRouteProps) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  // Filed 990 edges, matched by the EIN inside the org's ProPublica link.
  // Guarded so a funding-table miss degrades to a dossier without the
  // sections rather than a broken page — same posture as the lead-story
  // and outlet-map fetches on the landing route.
  // getFundingEdgesForOrg already swallows the one expected failure (a local
  // DB predating migration 027). Anything reaching here is unexpected, so it
  // gets logged before the page degrades — a silent catch turned a broken
  // query into an org that simply appears to fund nobody, which is the one
  // wrong impression these sections must never leave.
  const funding = await getFundingEdgesForOrg(
    einFromOrgLinks(org.externalLinks),
  ).catch((err) => {
    console.error(`Funding edges failed for org ${slug}:`, err);
    return undefined;
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(orgJsonLd(org)) }}
      />
      <OrgDossier org={org} funding={funding} />
    </>
  );
}
