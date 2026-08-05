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
  PoliticianRoleProvenance,
} from "./types";

// ─── Enums (kept in sync with sift-api/scripts/seed_politician_profiles.py) ──

const CHAMBER_VALUES: ReadonlySet<string> = new Set([
  "senate",
  "house",
  "former",
  "executive",
  // 46 prod rows have carried this since before Phase 4 and were silently
  // nulled out here, so every foreign head of state rendered with no chamber
  // label at all.
  "foreign-executive",
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
  "foreign-executive": "Head of state or government",
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
  "foreign-executive": "Head of state or government",
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
  // Migration 015 role provenance. Optional so a pre-015 database (and every
  // existing test fixture) still parses — the fields simply come back null.
  id_source?: string | null;
  role_title?: string | null;
  role_title_source?: string | null;
  role_start_date?: string | Date | null;
  role_end_date?: string | Date | null;
  role_dates_source?: string | null;
  nomination_date?: string | Date | null;
  nomination_url?: string | null;
  confirmation_date?: string | Date | null;
  confirmation_vote_url?: string | null;
  confirmation_vote_result?: string | null;
  predecessor_name?: string | null;
  predecessor_source?: string | null;
}

/** `pg` hands DATE columns back as Date objects; normalize to YYYY-MM-DD. */
function asIsoDate(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  }
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, 10) : null;
}

/**
 * Pull the migration-015 columns into their typed shape.
 *
 * Every claim is dropped unless its source came with it. `roleTitle` without
 * `roleTitleSource` is exactly the uncited-claim-about-a-living-person that
 * `docs/OPERATING_CONTEXT.md` §5 forbids, so it does not survive parsing —
 * enforced here rather than in JSX so no future caller can render around it.
 * Same pattern as `lib/org.ts`, which nulls the whole budget triple unless
 * value, fiscal year and source are all present.
 */
function asRoleProvenance(
  row: DbPoliticianProfileRow,
): PoliticianRoleProvenance {
  const source = row.role_title_source?.trim() || null;
  const title = row.role_title?.trim() || null;
  const sourced = title && source;

  const datesSource = row.role_dates_source?.trim() || null;
  const nominationUrl = row.nomination_url?.trim() || null;
  const voteUrl = row.confirmation_vote_url?.trim() || null;
  const predecessorSource = row.predecessor_source?.trim() || null;

  return {
    idSource: row.id_source?.trim() || null,
    roleTitle: sourced ? title : null,
    roleTitleSource: sourced ? source : null,
    // Dates and the predecessor each hang off the record that states them.
    roleStartDate: datesSource ? asIsoDate(row.role_start_date) : null,
    roleEndDate: datesSource ? asIsoDate(row.role_end_date) : null,
    roleDatesSource: datesSource,
    nominationDate: nominationUrl ? asIsoDate(row.nomination_date) : null,
    nominationUrl,
    predecessorName: predecessorSource
      ? row.predecessor_name?.trim() || null
      : null,
    predecessorSource,
    confirmationDate: voteUrl ? asIsoDate(row.confirmation_date) : null,
    confirmationVoteResult: voteUrl
      ? row.confirmation_vote_result?.trim() || null
      : null,
    confirmationVoteUrl: voteUrl,
  };
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
    role: asRoleProvenance(row),
  };
}
