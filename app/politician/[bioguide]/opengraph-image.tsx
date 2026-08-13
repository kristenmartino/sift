import { getPoliticianByBioguide } from "@/lib/db";
import { OG_SIZE } from "@/lib/og";
import { createDossierOgImage } from "@/lib/ogImage";
import { formatChamberLabel } from "@/lib/politician";

// Same heartbeat as the page — the unfurl should never outlive the dossier.
export const revalidate = 600;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Politician dossier on Sift — the news, with footnotes";

export default createDossierOgImage({
  eyebrow: "Politician dossier",
  load: ({ bioguide }: { bioguide: string }) =>
    getPoliticianByBioguide(bioguide),
  card: (politician) => {
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
    return {
      title: politician.name,
      meta: [
        partyState,
        politician.role.roleTitle ?? formatChamberLabel(politician.chamber),
        committeeCount,
      ]
        .filter(Boolean)
        .join(" · "),
    };
  },
});
