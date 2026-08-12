import { getOutletBySlug } from "@/lib/db";
import { OG_SIZE } from "@/lib/og";
import { createDossierOgImage } from "@/lib/ogImage";
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

export default createDossierOgImage({
  eyebrow: "Outlet dossier",
  load: ({ slug }: { slug: string }) => getOutletBySlug(slug),
  card: (outlet) => {
    // Ratings are attributed to their raters and rendered in neutral ink —
    // same rule as the on-page chips.
    const allSides = formatAllSidesLabel(outlet.allSidesRating);
    const mbfc = formatMbfcLabel(outlet.mbfcFactual);
    return {
      title: outlet.name,
      meta:
        [
          formatFundingLabel(outlet.fundingModel),
          outlet.parentCompany ? `Parent: ${outlet.parentCompany}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      chips: [
        allSides ? `AllSides: ${allSides}` : null,
        mbfc ? `MBFC factual: ${mbfc}` : null,
      ],
    };
  },
});
