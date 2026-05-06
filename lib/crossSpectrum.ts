// Cross-spectrum bucketing + threshold helpers — civic-literacy MVP
// Phase 2.C.2.
//
// Pure functions for grouping framings by political-lean bucket and deciding
// when a story qualifies for the side-by-side cross-spectrum view. Isolated
// from the React component so the bucketing logic is unit-testable on its
// own and CrossSpectrumCompare can stay declarative.

import type { OutletAllSidesRating, StoryFraming } from "./types";

/**
 * Three editorial buckets the cross-spectrum view groups outlets into.
 * "lean-left" + "left" both land in `left`; "lean-right" + "right" in
 * `right`; only literal `center` lands in `center`. AllSides' "mixed"
 * rating is intentionally not bucketable — those framings drop out of the
 * cross-spectrum view (they read as "doesn't take a consistent side").
 */
export type CrossSpectrumBucket = "left" | "center" | "right";

/** Stable column order: left → center → right (mirrors AllSides' L/C/R). */
export const CROSS_SPECTRUM_BUCKETS: readonly CrossSpectrumBucket[] = [
  "left",
  "center",
  "right",
];

/**
 * Map an AllSides rating to a cross-spectrum bucket. Returns null for
 * `mixed`, null, undefined, or any unexpected value — callers should drop
 * unbucketable framings from the cross-spectrum render.
 */
export function bucketize(
  rating: OutletAllSidesRating | null | undefined,
): CrossSpectrumBucket | null {
  if (rating === "left" || rating === "lean-left") return "left";
  if (rating === "center") return "center";
  if (rating === "right" || rating === "lean-right") return "right";
  return null;
}

/**
 * Group framings into the three cross-spectrum buckets. Framings without a
 * resolved outlet, or whose outlet has a null/`mixed` AllSides rating, are
 * collected under `unbucketed`. CrossSpectrumCompare drops `unbucketed`
 * from its render; the StoryCard's flat-list fallback still surfaces them.
 */
export interface BucketizedFramings {
  left: StoryFraming[];
  center: StoryFraming[];
  right: StoryFraming[];
  unbucketed: StoryFraming[];
}

export function groupFramingsByBucket(
  framings: StoryFraming[],
): BucketizedFramings {
  const groups: BucketizedFramings = {
    left: [],
    center: [],
    right: [],
    unbucketed: [],
  };
  for (const framing of framings) {
    const bucket = bucketize(framing.outlet?.allSidesRating);
    if (bucket) {
      groups[bucket].push(framing);
    } else {
      groups.unbucketed.push(framing);
    }
  }
  return groups;
}

/**
 * Plan-recommended threshold ("Moderate") for rendering cross-spectrum:
 *   - At least 3 framings whose outlets resolve to a L/C/R bucket
 *   - Those framings span at least 2 of the three buckets
 *
 * Stricter than `isMultiSource` (≥2 outlets) — a Left + Lean-Left
 * disagreement would clear `isMultiSource` but isn't editorially
 * cross-spectrum. Looser than the strict (L+C+R required) — most stories
 * never have all three by chance. Rejected unbucketed framings are still
 * surfaced via the StoryCard's flat-list fallback.
 */
export function shouldRenderCrossSpectrum(framings: StoryFraming[]): boolean {
  const groups = groupFramingsByBucket(framings);
  const bucketed = groups.left.length + groups.center.length + groups.right.length;
  if (bucketed < 3) return false;
  const occupied = (CROSS_SPECTRUM_BUCKETS).filter(
    (b) => groups[b].length > 0,
  ).length;
  return occupied >= 2;
}
