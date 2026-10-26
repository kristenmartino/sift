/** Authored reference summaries, cited separately from statutory governance.
 * An absent entry means no purpose has been curated; it is not inferred.
 */
const AGENCY_PURPOSES: Record<string, { summary: string; source: string; label: string; checked: string }> = {
  "food-and-drug-administration": {
    summary: "The FDA regulates human and veterinary medicines, biological products and medical devices. Its responsibilities also cover food safety, cosmetics, radiation-emitting products and tobacco.",
    source: "https://www.fda.gov/about-fda/what-we-do",
    label: "FDA: What we do",
    checked: "2026-10-26",
  },
};

export function agencyPurpose(slug: string) {
  return Object.hasOwn(AGENCY_PURPOSES, slug) ? AGENCY_PURPOSES[slug] : null;
}

/** Keep unfamiliar citation keys readable without exposing internal names. */
export function organizationLinkLabel(key: string): string {
  if (key === "budget_source") return "Budget and financial data";
  return key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().replace(/^./, (letter) => letter.toUpperCase()) || "Source";
}
