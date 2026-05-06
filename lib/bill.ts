// Bill-provenance helpers — civic-literacy MVP Phase 3.E.
//
// Parses curated rows from `bill_profiles` into the typed `BillProfile`
// shape the UI consumes, plus label formatters for status, the canonical
// "H.R. 5376 (117th Congress)" display form, and the lobbying-spend USD
// scale. Pure functions only.

import type {
  BillExternalLinks,
  BillProfile,
  BillStatus,
} from "./types";

// ─── Enums (in sync with sift-api/scripts/seed_bill_profiles.py) ─────

const BILL_STATUS_VALUES: ReadonlySet<string> = new Set([
  "introduced",
  "committee",
  "passed-chamber",
  "enacted",
  "vetoed",
  "failed",
]);

// ─── Display labels ───────────────────────────────────────────────────

const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  introduced: "Introduced",
  committee: "In committee",
  "passed-chamber": "Passed chamber",
  enacted: "Enacted into law",
  vetoed: "Vetoed",
  failed: "Failed",
};

/** Human label for a bill status enum, e.g. `"passed-chamber"` → `"Passed chamber"`. */
export function formatBillStatusLabel(
  status: BillStatus | null | undefined,
): string | null {
  if (!status) return null;
  return BILL_STATUS_LABELS[status] ?? null;
}

/**
 * Convert the canonical `<chamber>-<number>-<congress>` slug into a
 * publication-style display name.
 *   "hr-5376-117"  → "H.R. 5376 (117th Congress)"
 *   "s-1234-119"   → "S. 1234 (119th Congress)"
 *   "hres-42-118"  → "H.Res. 42 (118th Congress)"
 *   malformed      → returns the raw input verbatim (forward-compat)
 */
export function formatBillIdDisplay(billId: string | null | undefined): string {
  if (!billId) return "";
  const parts = billId.trim().toLowerCase().split("-");
  if (parts.length < 3) return billId;
  const chamberPart = parts[0];
  const number = parts[1];
  const congress = parts[parts.length - 1];
  if (!/^\d+$/.test(number) || !/^\d+$/.test(congress)) return billId;

  const chamberMap: Record<string, string> = {
    hr: "H.R.",
    s: "S.",
    hres: "H.Res.",
    sres: "S.Res.",
    hjres: "H.J.Res.",
    sjres: "S.J.Res.",
    hconres: "H.Con.Res.",
    sconres: "S.Con.Res.",
  };
  const chamberLabel = chamberMap[chamberPart] ?? chamberPart.toUpperCase();
  return `${chamberLabel} ${number} (${ordinalSuffix(parseInt(congress, 10))} Congress)`;
}

function ordinalSuffix(n: number): string {
  const lastTwo = n % 100;
  const lastOne = n % 10;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  if (lastOne === 1) return `${n}st`;
  if (lastOne === 2) return `${n}nd`;
  if (lastOne === 3) return `${n}rd`;
  return `${n}th`;
}

/**
 * Compact USD formatter for lobbying spend (typically millions for major
 * bills). Same scaling rule as the budget formatter elsewhere — see
 * `lib/org.ts`. Duplicated here to keep this module self-contained.
 *   14_000_000  → "$14M"
 *   8_500_000   → "$8.5M"
 *   500_000     → "$500K"
 *   500         → "$500"
 *   null/NaN    → null
 */
export function formatLobbyingUsd(amount: number | null | undefined): string | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const a = Math.abs(amount);
  if (a >= 1_000_000_000) {
    const v = amount / 1_000_000_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (a >= 1_000_000) {
    const v = amount / 1_000_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (a >= 1_000) {
    const v = amount / 1_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return `$${amount.toLocaleString("en-US")}`;
}

// ─── DB-row parsing ───────────────────────────────────────────────────

/**
 * Shape of a row from `bill_profiles`. Numerics arrive as JS numbers from
 * `pg`; JSONB columns arrive parsed; dates as `Date` instances or ISO
 * strings depending on type-parser config.
 */
export interface DbBillProfileRow {
  bill_id: string;
  congress: number;
  title: string;
  short_title: string | null;
  sponsor_bioguide: string | null;
  cosponsors: unknown;                     // expected: string[] of bioguide IDs
  status: string | null;
  introduced_date: Date | string | null;
  lobbying_for_usd: number | string | null;
  lobbying_against_usd: number | string | null;
  external_links: unknown;                 // expected: BillExternalLinks
  notes: string | null;
}

function asStatus(v: string | null): BillStatus | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  return BILL_STATUS_VALUES.has(lower) ? (lower as BillStatus) : null;
}

function asIsoDate(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  const trimmed = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return null;
}

function asNumeric(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function asExternalLinks(v: unknown): BillExternalLinks {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: BillExternalLinks = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim().length > 0) {
      out[key] = value.trim();
    }
  }
  return out;
}

/**
 * Validate + shape a raw `bill_profiles` row. Returns null when the
 * required identity fields (bill_id, title, congress) are missing.
 * Unknown enum values null out. Malformed JSONB degrades to empty
 * list/object so the dossier renders partial sections cleanly.
 */
export function parseDbBillProfile(
  row: DbBillProfileRow | null | undefined,
): BillProfile | null {
  if (!row) return null;
  const billId = (row.bill_id ?? "").trim().toLowerCase();
  const title = (row.title ?? "").trim();
  if (!billId || !title) return null;
  if (typeof row.congress !== "number" || !Number.isFinite(row.congress)) {
    return null;
  }

  return {
    billId,
    congress: row.congress,
    title,
    shortTitle: row.short_title?.trim() || null,
    sponsorBioguide: row.sponsor_bioguide?.trim() || null,
    cosponsors: asStringArray(row.cosponsors),
    status: asStatus(row.status),
    introducedDate: asIsoDate(row.introduced_date),
    lobbyingForUsd: asNumeric(row.lobbying_for_usd),
    lobbyingAgainstUsd: asNumeric(row.lobbying_against_usd),
    externalLinks: asExternalLinks(row.external_links),
    notes: row.notes?.trim() || null,
  };
}
