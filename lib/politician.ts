// Politician-provenance helpers — civic-literacy MVP Phase 3.C.
//
// Parses curated rows from `politician_profiles` into the typed
// `PoliticianProfile` shape the UI consumes, plus label formatters for
// party / chamber / role-from-chamber. Pure functions only — trivially
// unit-testable; no React or DB coupling.

import type {
  IndustryDonation,
  PoliticianChamber,
  PoliticianExternalLinks,
  PoliticianProfile,
} from "./types";

// ─── Enums (kept in sync with sift-api/scripts/seed_politician_profiles.py) ──

const CHAMBER_VALUES: ReadonlySet<string> = new Set([
  "senate",
  "house",
  "former",
  "executive",
]);

// ─── Display labels ───────────────────────────────────────────────────

const PARTY_LABELS: Record<string, string> = {
  D: "Democrat",
  R: "Republican",
  I: "Independent",
};

/**
 * Human label for a single-letter party code, e.g. "D" → "Democrat".
 * Returns the input verbatim when it isn't a known code (covers minor
 * parties like "L" / "G" / "DFL" without the UI rendering empty).
 * Returns null only for empty / null inputs.
 */
export function formatPartyLabel(party: string | null | undefined): string | null {
  if (!party) return null;
  const trimmed = party.trim();
  if (!trimmed) return null;
  return PARTY_LABELS[trimmed.toUpperCase()] ?? trimmed;
}

const CHAMBER_LABELS: Record<PoliticianChamber, string> = {
  senate: "U.S. Senate",
  house: "U.S. House of Representatives",
  former: "Former member of Congress",
  executive: "Executive branch",
};

/** Human label for a chamber enum, e.g. "senate" → "U.S. Senate". */
export function formatChamberLabel(
  chamber: PoliticianChamber | null | undefined,
): string | null {
  if (!chamber) return null;
  return CHAMBER_LABELS[chamber] ?? null;
}

const ROLE_FROM_CHAMBER: Record<PoliticianChamber, string> = {
  senate: "Senator",
  house: "Representative",
  former: "Former member of Congress",
  executive: "Executive branch official",
};

/**
 * Compact role title used in the dossier lede, e.g.
 *   { chamber: "senate", party: "D", state: "NY" } → "Senator (D-NY)"
 *   { chamber: "house",  party: "R", state: "LA" } → "Representative (R-LA)"
 *   { chamber: null,     party: null, state: null } → null
 */
export function formatPoliticianLede(
  chamber: PoliticianChamber | null | undefined,
  party: string | null | undefined,
  state: string | null | undefined,
): string | null {
  const role = chamber ? ROLE_FROM_CHAMBER[chamber] : null;
  const partyTrimmed = party?.trim() || null;
  const stateTrimmed = state?.trim() || null;
  const partyState =
    partyTrimmed && stateTrimmed
      ? `(${partyTrimmed}-${stateTrimmed})`
      : partyTrimmed
        ? `(${partyTrimmed})`
        : stateTrimmed
          ? `(${stateTrimmed})`
          : null;
  if (role && partyState) return `${role} ${partyState}`;
  if (role) return role;
  return partyState;
}

// ─── DB-row parsing ───────────────────────────────────────────────────

/**
 * Shape of a row from `politician_profiles`. JSONB columns arrive parsed by
 * `pg`; we re-validate here because the contents are untrusted (CSV-seeded,
 * later API-scraped). Date-stamped timestamps (`refreshed_at`, `updated_at`)
 * are intentionally omitted — they're operational metadata, not surfaced.
 */
export interface DbPoliticianProfileRow {
  bioguide_id: string;
  name: string;
  party: string | null;
  state: string | null;
  chamber: string | null;
  committees: unknown;                    // expected: string[]
  top_industries_current_cycle: unknown;  // expected: IndustryDonation[]
  interest_group_ratings: unknown;        // expected: Record<string, number | string>
  external_links: unknown;                // expected: PoliticianExternalLinks
  notes: string | null;
}

function asChamber(v: string | null): PoliticianChamber | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  return CHAMBER_VALUES.has(lower) ? (lower as PoliticianChamber) : null;
}

function asCommittees(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function asTopIndustries(v: unknown): IndustryDonation[] {
  if (!Array.isArray(v)) return [];
  const out: IndustryDonation[] = [];
  for (const entry of v) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const industry = typeof e.industry === "string" ? e.industry.trim() : "";
    if (!industry) continue;
    const amount =
      typeof e.amount_usd === "number" && Number.isFinite(e.amount_usd)
        ? e.amount_usd
        : null;
    out.push({ industry, amount_usd: amount });
  }
  return out;
}

function asInterestGroupRatings(v: unknown): Record<string, number | string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, number | string> = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;
    if (typeof value === "number" && Number.isFinite(value)) {
      out[trimmedKey] = value;
    } else if (typeof value === "string" && value.trim().length > 0) {
      out[trimmedKey] = value.trim();
    }
  }
  return out;
}

function asExternalLinks(v: unknown): PoliticianExternalLinks {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: PoliticianExternalLinks = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim().length > 0) {
      out[key] = value.trim();
    }
  }
  return out;
}

/**
 * Validate + shape a raw `politician_profiles` row. Returns null if the
 * required identity fields (bioguide_id, name) are missing. Unknown
 * `chamber` values null out (UI tolerates absence rather than rendering
 * a bad enum). JSONB columns degrade to empty list/object on malformed
 * input — the dossier conditionally renders sections only when they
 * have content, so empty inputs result in clean partial dossiers.
 */
export function parseDbPoliticianProfile(
  row: DbPoliticianProfileRow | null | undefined,
): PoliticianProfile | null {
  if (!row) return null;
  const bioguide = (row.bioguide_id ?? "").trim();
  const name = (row.name ?? "").trim();
  if (!bioguide || !name) return null;

  return {
    bioguideId: bioguide,
    name,
    party: row.party?.trim() || null,
    state: row.state?.trim() || null,
    chamber: asChamber(row.chamber),
    committees: asCommittees(row.committees),
    topIndustriesCurrentCycle: asTopIndustries(row.top_industries_current_cycle),
    interestGroupRatings: asInterestGroupRatings(row.interest_group_ratings),
    externalLinks: asExternalLinks(row.external_links),
    notes: row.notes?.trim() || null,
  };
}
