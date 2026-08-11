import { ImageResponse } from "next/og";

import { getPoliticianByBioguide } from "@/lib/db";
import { dossierOgCard, loadOgFonts, OG_SIZE } from "@/lib/og";
import { formatChamberLabel } from "@/lib/politician";

// Same heartbeat as the page — the unfurl should never outlive the dossier.
export const revalidate = 600;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Politician dossier on Sift — the news, with footnotes";

interface OgProps {
  params: Promise<{ bioguide: string }>;
}

export default async function Image({ params }: OgProps) {
  const { bioguide } = await params;
  const [politician, fonts] = await Promise.all([
    getPoliticianByBioguide(bioguide),
    loadOgFonts(),
  ]);

  if (!politician) {
    return new ImageResponse(
      dossierOgCard({ eyebrow: "Politician dossier", title: "Sift" }),
      { ...size, fonts },
    );
  }

  // Party stays a plain letter in neutral ink — the page never hue-codes
  // lean or party, and neither does the unfurl.
  const partyState =
    politician.party && politician.state
      ? `${politician.party}-${politician.state}`
      : null;
  const committeeCount =
    politician.committees.length > 0
      ? `${politician.committees.length} ${
          politician.committees.length === 1 ? "committee" : "committees"
        }`
      : null;
  const meta = [
    partyState,
    politician.role.roleTitle ?? formatChamberLabel(politician.chamber),
    committeeCount,
  ]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    dossierOgCard({
      eyebrow: "Politician dossier",
      title: politician.name,
      meta,
    }),
    { ...size, fonts },
  );
}
