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

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function toNumber(word: string): number | null {
  const w = word.toLowerCase();
  if (NUMBER_WORDS[w] !== undefined) return NUMBER_WORDS[w];
  const n = Number.parseInt(w, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * The cap and the body size it applies to, e.g. {cap: 3, total: 5}.
 *
 * Both numbers are read out of the same cited sentence-pair they describe, for
 * the reason given on `hasPartisanBalanceCap` — a stored pair could drift from
 * the prose and then the badge would contradict its own source link.
 *
 * The numbers genuinely differ across these statutes (FEC 3 of 6, NCUA 2 of 3,
 * most commissions 3 of 5), which is exactly why the badge is worth computing
 * rather than writing one fixed string.
 *
 * Returns null when either number can't be read with confidence. Callers fall
 * back to the generic label rather than guessing — a wrong number here is
 * worse than a vaguer one, because the source link is right beside it.
 */
export function partisanCap(
  governanceStructure: string
): { cap: number; total: number } | null {
  if (!hasPartisanBalanceCap(governanceStructure)) return null;

  // "No more than three ... may belong to the same political party"
  // "Not more than two Board members may be of the same political party"
  const capMatch = governanceStructure.match(
    /(?:no|not)\s+more\s+than\s+([a-z]+|\d+)\b[^.]*?same political party/i
  );
  // First body-size mention: "Five commissioners", "Six voting members",
  // "five members", "a five-member Board of Directors", "three-member Board".
  const totalMatch = governanceStructure.match(
    /\b([a-z]+|\d+)[-\s]+(?:voting\s+)?(?:commissioners?|members?)\b/i
  );
  if (!capMatch || !totalMatch) return null;

  const cap = toNumber(capMatch[1]);
  const total = toNumber(totalMatch[1]);
  if (cap === null || total === null) return null;
  // A cap that isn't smaller than the body isn't a constraint; treat as
  // unreadable rather than publish something that reads as nonsense.
  if (cap >= total) return null;
  return { cap, total };
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
