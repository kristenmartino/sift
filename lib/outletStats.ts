// Outlet-count + spectrum stats derived from the live curated outlet list
// (issue #153). One place computes "how many outlets, split how across the
// spectrum" so the landing, methodology, colophon, and footers can all stop
// hardcoding "~50" — a number that had drifted to ~77 in 28 places.
//
// `computeOutletStats` is PURE (only depends on the pure `bucketize`), so it is
// safe to import into client components — the landing already receives the
// outlet list as a server prop, so it derives its count on the client without a
// second fetch. The server-side entry point that reads `outlet_profiles` lives
// in `lib/db.ts` (`getOutletStats`) to keep this module free of the pg pool.

import { bucketize } from "./crossSpectrum";
import type { OutletAllSidesRating } from "./types";

export interface OutletStats {
  /** Total curated outlets (outlet_profiles rows). */
  total: number;
  left: number;
  center: number;
  right: number;
  /**
   * Outlets AllSides doesn't place on the L/C/R axis (mixed or no rating) —
   * peer-reviewed journals + sector specialists. Mirrors the methodology
   * page's "unrated or specialty" bucket and the manifesto's "Specialty".
   */
  specialty: number;
}

export const EMPTY_OUTLET_STATS: OutletStats = {
  total: 0,
  left: 0,
  center: 0,
  right: 0,
  specialty: 0,
};

/**
 * Bucket a curated outlet list into spectrum counts. Accepts anything with an
 * `allSidesRating` (OutletProfile or the landing's lighter SourceColophonOutlet)
 * — unknown/missing ratings fall through `bucketize` to `specialty`. Pure.
 */
export function computeOutletStats(
  outlets: ReadonlyArray<{ allSidesRating?: string | null }>,
): OutletStats {
  const stats: OutletStats = { ...EMPTY_OUTLET_STATS, total: outlets.length };
  for (const outlet of outlets) {
    const rating = (outlet.allSidesRating ?? null) as OutletAllSidesRating | null;
    switch (bucketize(rating)) {
      case "left":
        stats.left += 1;
        break;
      case "center":
        stats.center += 1;
        break;
      case "right":
        stats.right += 1;
        break;
      default:
        stats.specialty += 1;
    }
  }
  return stats;
}
