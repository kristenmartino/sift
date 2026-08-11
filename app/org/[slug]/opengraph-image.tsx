import { ImageResponse } from "next/og";

import { getOrgBySlug } from "@/lib/db";
import { dossierOgCard, loadOgFonts, OG_SIZE } from "@/lib/og";
import { formatOrgTypeLabel } from "@/lib/org";

// Same heartbeat as the page — the unfurl should never outlive the dossier.
export const revalidate = 600;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Organization dossier on Sift — the news, with footnotes";

interface OgProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: OgProps) {
  const { slug } = await params;
  const [org, fonts] = await Promise.all([getOrgBySlug(slug), loadOgFonts()]);

  if (!org) {
    return new ImageResponse(
      dossierOgCard({ eyebrow: "Organization dossier", title: "Sift" }),
      { ...size, fonts },
    );
  }

  // No budget figure here — annualBudgetKind exists because the number means
  // different things per source, and a card can't carry that citation.
  const meta = [
    formatOrgTypeLabel(org.type),
    org.faraRegistered ? "FARA-registered" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    dossierOgCard({
      eyebrow: "Organization dossier",
      title: org.name,
      meta: meta || null,
    }),
    { ...size, fonts },
  );
}
