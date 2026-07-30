import type { SelfDescribedOrg } from "./types";

/**
 * Helpers for /think-tanks — the self-description page.
 *
 * Everything rendered there is the organization's own wording, quoted verbatim
 * and linked to the page it came from. Sift does not characterize these
 * organizations, which is the whole reason this page replaced the Sift-assigned
 * `political_lean` (sift-api migration 012, D37).
 */

/**
 * Does the organization's own description claim non-partisanship, or disclaim
 * taking policy positions?
 *
 * This is a fact about the quoted text, not a judgment about the organization —
 * and the quote is rendered directly beside the badge, so a reader can check it
 * in the same glance. That is the only reason it is safe to compute: an
 * assessment a reader cannot verify on the spot would be exactly the
 * Sift-assigned characterization D37 forbids.
 *
 * Covers the phrasings these organizations actually use:
 *   "nonpartisan research and policy strategies"          (Brookings)
 *   "assiduously nonpartisan and independent"             (Cato)
 *   "independent, nonpartisan policy institute"           (CAP)
 *   "a nonprofit, nonpartisan think tank"                 (EPI)
 *   "takes no public policy positions"                    (Federalist Society)
 */
export function claimsNonPartisanship(selfDescription: string): boolean {
  const t = selfDescription.toLowerCase();
  return (
    /\bnon-?partisan\b/.test(t) ||
    /takes no public policy positions/.test(t) ||
    /any special interest or political party/.test(t)
  );
}

/**
 * Organizations that claim non-partisanship first, then alphabetical.
 *
 * The juxtaposition is the finding — a stated ideology and a stated
 * non-partisanship in the same breath — so those lead. Alphabetical within
 * each group, because ranking policy organizations against each other would be
 * an editorial judgment, which is what this page exists to avoid making.
 */
export function sortSelfDescribed(orgs: SelfDescribedOrg[]): SelfDescribedOrg[] {
  return [...orgs].sort((a, b) => {
    if (a.claimsNonPartisanship !== b.claimsNonPartisanship) {
      return a.claimsNonPartisanship ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "en");
  });
}
