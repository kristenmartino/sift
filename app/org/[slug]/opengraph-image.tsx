import { getOrgBySlug } from "@/lib/db";
import { OG_SIZE } from "@/lib/og";
import { createDossierOgImage } from "@/lib/ogImage";
import { formatOrgTypeLabel } from "@/lib/org";

// Same heartbeat as the page — the unfurl should never outlive the dossier.
export const revalidate = 1800;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Organization dossier on Sift — the news, with footnotes";

export default createDossierOgImage({
  eyebrow: "Organization dossier",
  load: ({ slug }: { slug: string }) => getOrgBySlug(slug),
  // No budget figure here — annualBudgetKind exists because the number means
  // different things per source, and a card can't carry that citation.
  card: (org) => ({
    title: org.name,
    meta:
      [
        formatOrgTypeLabel(org.type),
        org.faraRegistered ? "FARA-registered" : null,
      ]
        .filter(Boolean)
        .join(" · ") || null,
  }),
});
