import { COPY } from "./copy";
import type { CompareClaim, CompareProvenance } from "./types";

const key = (name: string) => name.trim().toLowerCase();

/** Old saved rows have no availability record; never infer it from model prose. */
export function comparisonProvenance(value: Partial<CompareProvenance>): CompareProvenance | null {
  const fields = ["sources_requested", "sources_retrieved", "sources_analyzed", "sources_unavailable"] as const;
  if (value.source_provenance_version !== 1) return null;
  for (const field of fields) {
    const list = value[field];
    if (!Array.isArray(list) || list.some((s) => typeof s !== "string" || !s.trim()) ||
        new Set(list.map(key)).size !== list.length) return null;
  }
  const record = value as CompareProvenance;
  const requested = new Set(record.sources_requested.map(key));
  const retrieved = new Set(record.sources_retrieved.map(key));
  const unavailable = new Set(record.sources_unavailable.map(key));
  if (record.sources_retrieved.some((s) => !requested.has(key(s))) ||
      record.sources_analyzed.some((s) => !retrieved.has(key(s))) ||
      record.sources_unavailable.some((s) => !requested.has(key(s)) || retrieved.has(key(s))) ||
      record.sources_requested.some((s) => !retrieved.has(key(s)) && !unavailable.has(key(s)))) return null;
  return record;
}

/** Source lists and agreement denominators refer only to completed analysis. */
export function normalizeCompareClaim(claim: CompareClaim, record: CompareProvenance): CompareClaim | null {
  const names = new Map(record.sources_analyzed.map((s) => [key(s), s]));
  const known = (list?: string[]) => [...new Set((Array.isArray(list) ? list : [])
    .filter((s) => typeof s === "string" && names.has(key(s))).map((s) => names.get(key(s))!))];
  if (claim.agreement === "disputed") {
    const sourcesFor = known(claim.sources_for), sourcesAgainst = known(claim.sources_against);
    const overlap = new Set(sourcesFor.filter((s) => sourcesAgainst.includes(s)));
    const supporters = sourcesFor.filter((s) => !overlap.has(s));
    const opponents = sourcesAgainst.filter((s) => !overlap.has(s));
    return supporters.length && opponents.length
      ? { ...claim, sources: [], sources_for: supporters, sources_against: opponents } : null;
  }
  const sources = known(claim.sources);
  if (!sources.length) return null;
  const count = sources.length, total = names.size;
  const agreement = count === 1 ? "unique" : count === total ? "unanimous"
    : count > total / 2 ? "majority" : "partial";
  return { ...claim, agreement, sources, sources_for: [], sources_against: [] };
}

export function comparisonClaimLabel(claim: CompareClaim, record: CompareProvenance | null): string {
  if (!record) return COPY.compare.agreementUnrecorded;
  const count = claim.agreement === "disputed"
    ? new Set([...(claim.sources_for ?? []), ...(claim.sources_against ?? [])]).size
    : (claim.sources ?? []).length;
  return COPY.compare.claimCoverage(count, record.sources_analyzed.length, claim.agreement === "disputed");
}

export function comparisonDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "date unavailable" : date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}
