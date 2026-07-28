import type { AgencyGovernance } from "./types";

/**
 * Helpers for /agencies — the cited-governance page.
 *
 * Everything here reads facts already written to `org_profiles` by
 * sift-api migration 012. Nothing on this page is AI-generated and nothing is
 * Sift's own characterization: each entry is a statutory fact with a link to
 * the section it came from.
 */

/**
 * Does the citing statute cap how many members may share a political party?
 *
 * Read off the stored statutory text rather than kept as its own column, and
 * that is deliberate. The claim only exists because the cited section says so;
 * a separate boolean could drift out of step with the prose it is supposed to
 * summarise, and then the badge would assert something the source link
 * contradicts. Deriving it keeps the two impossible to separate.
 *
 * Matches the phrasings Congress actually uses across these statutes:
 *   "no more than three ... may belong to the same political party"  (FCC)
 *   "Not more than three ... shall be members of the same political party" (FTC)
 *   "Not more than three ... may be affiliated with the same political party" (CPSC)
 *   "Not more than 3 members may be appointed from the same political party" (NTSB)
 */
export function hasPartisanBalanceCap(governanceStructure: string): boolean {
  return /same political party/i.test(governanceStructure);
}

/**
 * Capped agencies first, then alphabetical within each group.
 *
 * The cap is the reason this page is interesting — it is the fact that
 * explains deadlock coverage — so it leads. Alphabetical within group because
 * any other ordering would be an editorial ranking of agencies, which is
 * exactly the kind of Sift-assigned judgment migration 012 removed.
 */
export function sortAgencies(agencies: AgencyGovernance[]): AgencyGovernance[] {
  return [...agencies].sort((a, b) => {
    if (a.hasPartisanBalanceCap !== b.hasPartisanBalanceCap) {
      return a.hasPartisanBalanceCap ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "en");
  });
}

/** Short, checkable label for a citation link, e.g. "law.cornell.edu". */
export function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}
