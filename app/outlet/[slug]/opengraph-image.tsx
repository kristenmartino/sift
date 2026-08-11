import { ImageResponse } from "next/og";

import { getOutletBySlug } from "@/lib/db";
import { dossierOgCard, loadOgFonts, OG_SIZE } from "@/lib/og";
import {
  formatAllSidesLabel,
  formatFundingLabel,
  formatMbfcLabel,
} from "@/lib/outlet";

// Same heartbeat as the page — the unfurl should never outlive the dossier.
export const revalidate = 600;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Outlet dossier on Sift — the news, with footnotes";

interface OgProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: OgProps) {
  const { slug } = await params;
  const [outlet, fonts] = await Promise.all([
    getOutletBySlug(slug),
    loadOgFonts(),
  ]);

  if (!outlet) {
    return new ImageResponse(
      dossierOgCard({ eyebrow: "Outlet dossier", title: "Sift" }),
      { ...size, fonts },
    );
  }

  const meta = [
    formatFundingLabel(outlet.fundingModel),
    outlet.parentCompany ? `Parent: ${outlet.parentCompany}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Ratings are attributed to their raters and rendered in neutral ink —
  // same rule as the on-page chips.
  const allSides = formatAllSidesLabel(outlet.allSidesRating);
  const mbfc = formatMbfcLabel(outlet.mbfcFactual);

  return new ImageResponse(
    dossierOgCard({
      eyebrow: "Outlet dossier",
      title: outlet.name,
      meta: meta || null,
      chips: [
        allSides ? `AllSides: ${allSides}` : null,
        mbfc ? `MBFC factual: ${mbfc}` : null,
      ],
    }),
    { ...size, fonts },
  );
}
