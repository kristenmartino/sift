/**
 * Civic-context enrichment for EntityLink chips — Phase 3.G.3.
 *
 * The entity-linker pipeline node attaches resolved (type, canonicalId,
 * surfaceForm) tuples to every article. That's enough to make the chip
 * navigate to the right dossier, but the chip itself is opaque — a reader
 * sees "Chuck Schumer" without any civic context unless they click in.
 *
 * This module batches a single SQL query per page render to attach a small
 * `civicContext` payload to each chip. For politician chips, it's the top
 * 3 PAC industries by 2022-cycle dollar amount. EntityChipTooltip renders
 * those inline on hover/focus so the connection between "story" and
 * "civic context" is tactile without leaving the feed.
 *
 * Why server-enrichment vs client-fetch:
 * - One batched query per page render vs N round-trips on hover.
 * - Tooltip is instant — no loading state on hover.
 * - The data is small (~3 industries × ~30 chars = ~150 bytes/chip).
 *
 * Tolerant of missing tables/columns the same way `lib/db.ts` is — returns
 * silently without enrichment so the chip still navigates correctly even
 * when prod is mid-migration.
 */
import pool from "./db";
import { asTopIndustries } from "./politician";
import type { EntityLink, IndustryDonation } from "./types";

interface PoliticianContextRow {
  bioguide_id: string;
  top_industries_current_cycle: unknown;
}

/**
 * In-place enrichment: scans `links` for politician chips, batches one
 * SQL query, attaches `civicContext` where data exists.
 *
 * Mutates `links` rather than returning new objects so callers don't have
 * to thread the result through their existing object-spread mappers. The
 * function returns void on purpose.
 */
export async function enrichLinksWithContext(
  links: EntityLink[],
): Promise<void> {
  if (links.length === 0) return;

  const politicianIds = Array.from(
    new Set(
      links.filter((l) => l.type === "politician").map((l) => l.canonicalId),
    ),
  );
  if (politicianIds.length === 0) return;

  let rows: PoliticianContextRow[];
  try {
    const result = await pool.query<PoliticianContextRow>(
      `SELECT bioguide_id, top_industries_current_cycle
         FROM politician_profiles
        WHERE bioguide_id = ANY($1::text[])`,
      [politicianIds],
    );
    rows = result.rows;
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return; // pre-Phase-3.A prod
    throw err;
  }

  const byBioguide = new Map<string, IndustryDonation[]>();
  for (const row of rows) {
    const industries = asTopIndustries(row.top_industries_current_cycle);
    if (industries.length > 0) {
      byBioguide.set(row.bioguide_id, industries.slice(0, 3));
    }
  }

  for (const link of links) {
    if (link.type !== "politician") continue;
    const industries = byBioguide.get(link.canonicalId);
    if (industries && industries.length > 0) {
      link.civicContext = { type: "politician", topIndustries: industries };
    }
  }
}
