// ─── Civic dossier index helpers ─────────────────────────
// Pure presentation helpers for the `/civic` route. State-name lookup +
// grouping. No DB reads here — the page passes pre-loaded lists in.

import type {
  OrgListItem,
  OrgPoliticalLean,
  OrgType,
  PoliticianChamber,
  PoliticianListItem,
} from "./types";

/**
 * USPS code → full state name. Includes DC and the five inhabited
 * territories so non-state-state members (delegates, resident commissioner)
 * still get a header. If a code falls through (it shouldn't), we render
 * the raw code as the heading.
 */
export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
  AS: "American Samoa", GU: "Guam", MP: "Northern Mariana Islands",
  PR: "Puerto Rico", VI: "U.S. Virgin Islands",
};

export function stateName(code: string | null | undefined): string {
  if (!code) return "Unknown";
  return STATE_NAMES[code.toUpperCase()] ?? code;
}

/** Filter politicians by chamber. `null` returns everyone. */
export function filterByChamber(
  politicians: PoliticianListItem[],
  chamber: PoliticianChamber | null,
): PoliticianListItem[] {
  if (!chamber) return politicians;
  return politicians.filter((p) => p.chamber === chamber);
}

/**
 * Group politicians by state, preserving incoming sort order within each
 * group (the DB query orders by state then name, so a forward iteration
 * captures alphabetical groups in alphabetical state order).
 *
 * Returns a list of `[state code, members]` tuples rather than a Map so
 * Server Components can serialize it cleanly to the wire.
 */
export function groupByState(
  politicians: PoliticianListItem[],
): Array<[string, PoliticianListItem[]]> {
  const groups = new Map<string, PoliticianListItem[]>();
  for (const p of politicians) {
    const key = p.state ?? "—";
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }
  return Array.from(groups.entries());
}

/** Pretty-printed type label for the org-index section heading. */
export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  "think-tank": "Think tanks",
  "advocacy": "Advocacy",
  "union": "Unions",
  "pac": "PACs",
  "super-pac": "Super PACs",
  "foundation": "Foundations",
  "industry-group": "Industry groups",
  "other": "Other",
};

export function orgTypeLabel(type: OrgType | null | undefined): string {
  if (!type) return "Other";
  return ORG_TYPE_LABELS[type] ?? "Other";
}

/** Pretty-printed lean label for sub-sorted listing inside type groups. */
export const ORG_LEAN_LABELS: Record<OrgPoliticalLean, string> = {
  "left": "Left",
  "lean-left": "Lean left",
  "center": "Center",
  "lean-right": "Lean right",
  "right": "Right",
  "mixed": "Mixed",
  "nonpartisan": "Nonpartisan",
};

export function orgLeanLabel(lean: OrgPoliticalLean | null | undefined): string {
  if (!lean) return "—";
  return ORG_LEAN_LABELS[lean] ?? "—";
}

/**
 * Group orgs by `type`, preserving incoming sort order within each group.
 * DB query orders by type then name, so a forward iteration captures
 * alphabetical-by-name groups in alphabetical-by-type order.
 */
export function groupByType(
  orgs: OrgListItem[],
): Array<[OrgType | "other", OrgListItem[]]> {
  const groups = new Map<OrgType | "other", OrgListItem[]>();
  for (const o of orgs) {
    const key: OrgType | "other" = o.type ?? "other";
    const arr = groups.get(key);
    if (arr) arr.push(o);
    else groups.set(key, [o]);
  }
  return Array.from(groups.entries());
}
