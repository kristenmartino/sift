import type { Metadata } from "next";
import { notFound } from "next/navigation";

import OrgDossier from "@/components/org/OrgDossier";
import { getOrgBySlug } from "@/lib/db";

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
  // org's name in the unfurl card. og:image inherits the site default
  // for now; per-route images are a Phase 2 polish.
  const fullTitle = `${org.name} — Org dossier | Sift`;
  const description = `Type, funding, political lean, and FARA disclosure for ${org.name} on Sift.`;
  return {
    title: `${org.name} — Org dossier`,
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

export default async function OrgDossierPage({ params }: OrgRouteProps) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  return <OrgDossier org={org} />;
}
