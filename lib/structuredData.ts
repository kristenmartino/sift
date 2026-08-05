/**
 * schema.org JSON-LD for the four dossier types.
 *
 * These builders live outside the dossier components on purpose: structured
 * data is a document-level concern, and keeping it in `page.tsx` next to
 * `generateMetadata` means the markup and the meta tags can't drift.
 *
 * ── The rule that governs every field below ──
 *
 * **JSON-LD must never assert more than the page renders, and never more
 * than the row can source.** Structured data is a machine-readable claim
 * that search engines may surface as fact, detached from the page's own
 * caveats and citation links — so it is the *worst* place for an unsourced
 * value, not a harmless one.
 *
 * Concretely, and each for a reason already established in this repo:
 *
 * - **No `foundingDate`, for orgs or outlets.** `founded_year` was dropped
 *   from the 10 think-tank rows rather than sourced to Wikipedia, and
 *   STATUS.md:117 records that the 93 agency rows still carry it "rendered
 *   and still unsourced". Emitting it here would turn a known-unsourced
 *   field into machine-readable data.
 * - **No `description` from `notes`.** Uncited prose, and on politicians it
 *   is uncited prose about a living person.
 * - **No budget, lobbying, or PAC figures.** Sift surfaces public-record
 *   numbers with attribution; JSON-LD strips the attribution.
 * - **No AllSides / MBFC ratings.** They are third-party assessments the
 *   page presents verbatim with a link. Restating them as Sift's own
 *   structured claim about a named organization is exactly the framing D37
 *   rejected — and `sameAs` would be wrong too, since a rating page is not
 *   another identity for the outlet.
 * - **`description` for orgs only when `selfDescriptionSource` exists**,
 *   mirroring the render gate. It is the org's own words, not Sift's.
 */
import { formatBillIdDisplay } from "./bill";
import type {
  BillProfile,
  OrgProfile,
  OutletProfile,
  PoliticianProfile,
} from "./types";

/** Matches `metadataBase` in app/layout.tsx and BASE in app/sitemap.ts. */
const BASE = "https://siftnews.io";

/**
 * `sameAs` by allowlisted key — never by taking every value in the blob.
 *
 * schema.org defines `sameAs` as another *identity* for the entity: its own
 * site, its Wikipedia/Wikidata page, its profile on a directory. A source
 * document is not an identity. `org_profiles.external_links` carries
 * `budget_source` on 89 rows (and a non-URL `budget_source_fiscal_year` on
 * 23), so a value-based filter published a White House budget spreadsheet as
 * "another EPA". These blobs are open dictionaries, so a new provenance key
 * added later would silently reintroduce that — an allowlist fails closed.
 */
function sameAs(
  links: Record<string, string | undefined>,
  allowedKeys: readonly string[],
): string[] {
  return allowedKeys
    .map((k) => links[k])
    .filter((v): v is string => typeof v === "string" && /^https?:\/\//i.test(v))
    .sort();
}

// Identity links only. Deliberately excluded: org `budget_source` /
// `budget_source_fiscal_year` (provenance for a figure), and any `irs_990`
// or `fara` filing — a document about the entity, not the entity.
const POLITICIAN_SAME_AS = [
  "official", "wikipedia", "wikidata", "govtrack", "opensecrets",
  "ballotpedia", "votesmart",
] as const;
const ORG_SAME_AS = ["official", "wikipedia", "propublica"] as const;
const BILL_SAME_AS = ["congress", "govtrack", "wikipedia"] as const;
const OUTLET_SAME_AS = ["official", "wikipedia"] as const;

/** Drop null/undefined/empty-array keys so the emitted JSON stays tight. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    }),
  ) as T;
}

const CHAMBER_ORG: Record<string, string> = {
  senate: "United States Senate",
  house: "United States House of Representatives",
};

const CHAMBER_ROLE: Record<string, string> = {
  senate: "United States Senator",
  house: "United States Representative",
};

export function politicianJsonLd(p: PoliticianProfile): Record<string, unknown> {
  const url = `${BASE}/politician/${p.bioguideId}`;
  const chamber = p.chamber ?? "";
  const affiliationName = CHAMBER_ORG[chamber];

  return compact({
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": url,
    mainEntityOfPage: url,
    url,
    name: p.name,
    // Congress.gov's canonical id. A stable public identifier, not a claim.
    identifier: p.bioguideId,
    jobTitle: CHAMBER_ROLE[chamber] ?? undefined,
    // Committees are rendered on the page and come from the canonical
    // unitedstates/congress-legislators YAMLs via scripts/scrape_committees.py.
    memberOf: [
      ...(affiliationName
        ? [{ "@type": "GovernmentOrganization", name: affiliationName }]
        : []),
      ...p.committees.map((c) => ({ "@type": "Organization", name: c })),
    ],
    sameAs: sameAs(p.externalLinks as Record<string, string | undefined>, POLITICIAN_SAME_AS),
  });
}

export function orgJsonLd(o: OrgProfile): Record<string, unknown> {
  const url = `${BASE}/org/${o.slug}`;
  return compact({
    "@context": "https://schema.org",
    // Agencies get the more specific type; everything else stays generic
    // rather than guessing between NGO, Corporation and the rest.
    "@type": o.type === "agency" ? "GovernmentOrganization" : "Organization",
    "@id": url,
    mainEntityOfPage: url,
    url,
    name: o.name,
    identifier: o.slug,
    // The organization's own characterization, verbatim, and only when it
    // carries the source the renderer also requires.
    description:
      o.selfDescription && o.selfDescriptionSource ? o.selfDescription : undefined,
    sameAs: sameAs(o.externalLinks as Record<string, string | undefined>, ORG_SAME_AS),
  });
}

export function billJsonLd(b: BillProfile): Record<string, unknown> {
  const url = `${BASE}/bill/${b.billId}`;
  return compact({
    "@context": "https://schema.org",
    "@type": "Legislation",
    "@id": url,
    mainEntityOfPage: url,
    url,
    name: b.shortTitle || b.title,
    // Full official title when a short title is what we're showing as `name`.
    alternateName: b.shortTitle ? b.title : undefined,
    legislationIdentifier: formatBillIdDisplay(b.billId),
    // Introduction date is a public record on congress.gov.
    legislationDate: b.introducedDate ?? undefined,
    // Only for bills that actually became law. schema.org reads
    // `legislationPassedBy` as "who passed or made this law", so emitting it
    // unconditionally would assert that an introduced-and-died bill is a
    // statute — the machine-readable version of the error the status label
    // on the page exists to prevent.
    legislationPassedBy:
      b.status === "enacted"
        ? { "@type": "GovernmentOrganization", name: "United States Congress" }
        : undefined,
    sameAs: sameAs(b.externalLinks as Record<string, string | undefined>, BILL_SAME_AS),
  });
}

export function outletJsonLd(o: OutletProfile): Record<string, unknown> {
  const url = `${BASE}/outlet/${o.slug}`;
  return compact({
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": url,
    mainEntityOfPage: url,
    url,
    name: o.name,
    identifier: o.slug,
    parentOrganization: o.parentCompany
      ? compact({
          "@type": "Organization",
          name: o.parentCompany,
          url: o.parentCompanyUrl ?? undefined,
        })
      : undefined,
    sameAs: sameAs(o.externalLinks as Record<string, string | undefined>, OUTLET_SAME_AS),
  });
}

/**
 * Serialize for a `<script type="application/ld+json">` body.
 *
 * `<` is escaped because the JSON sits inside a script element: a value
 * containing `</script` would otherwise close the tag early. Dossier values
 * are curated, but they are still data rendered into markup.
 */
export function jsonLdString(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
