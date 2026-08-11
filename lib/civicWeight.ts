// Ranking v2 stage 2 (docs/RANKING_SIGNALS.md): civic-entity density — the
// D45 decision-relevance signal. An article whose entity links resolve to
// curated dossiers (bills, members of Congress, orgs) is decision-relevant
// to a reader-as-citizen in a way a wire curiosity is not.
//
// Weighted DISTINCT count: bills and politicians carry full weight, orgs
// half, outlets nothing (an outlet link says who wrote it, not what a
// citizen can act on). Capped at 3 before boosting so civic density
// re-orders within a tier but can never promote a routine item over a
// disaster: max effect is 1 + CIVIC_BOOST × 3 = +30%.
//
// Mirrored in SQL by CIVIC_BOOST_SQL in lib/db.ts — keep the weights, the
// cap, and the constant in lockstep with it.

import type { EntityLink } from "./types";

export const CIVIC_BOOST = 0.1;
export const CIVIC_WEIGHT_CAP = 3;

const TYPE_WEIGHTS: Record<string, number> = {
  bill: 1,
  politician: 1,
  org: 0.5,
  outlet: 0,
};

/** Weighted count of distinct (type, canonicalId) civic links. */
export function weightedCivicLinks(links: EntityLink[] | undefined): number {
  if (!links?.length) return 0;
  const seen = new Set<string>();
  let sum = 0;
  for (const link of links) {
    const key = `${link.type}:${link.canonicalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sum += TYPE_WEIGHTS[link.type] ?? 0;
  }
  return sum;
}

/** The rank multiplier for a given weighted civic-link count (1.0–1.3). */
export function civicBoost(weight: number): number {
  return 1 + CIVIC_BOOST * Math.min(Math.max(weight, 0), CIVIC_WEIGHT_CAP);
}
