/**
 * Tests for lib/civic.ts — the pure grouping/labelling helpers behind the
 * `/civic` index. The contract these encode is order preservation: the DB
 * query does the sorting, so the helpers must group without reshuffling,
 * and must fall back readably on the rows that don't fit (no state, no
 * type, an unknown code).
 */
import {
  ORG_TYPE_LABELS,
  STATE_NAMES,
  filterByChamber,
  groupByState,
  groupByType,
  orgTypeLabel,
  stateName,
} from "@/lib/civic";
import type { OrgListItem, OrgType, PoliticianListItem } from "@/lib/types";

function politician(
  name: string,
  state: string | null,
  chamber: PoliticianListItem["chamber"],
): PoliticianListItem {
  return { bioguideId: name.toLowerCase(), name, party: "D", state, chamber };
}

function org(name: string, type: OrgType | null): OrgListItem {
  return { slug: name.toLowerCase().replace(/\s+/g, "-"), name, type };
}

describe("stateName", () => {
  it("maps a USPS code to the full state name", () => {
    expect(stateName("NY")).toBe("New York");
    expect(stateName("WY")).toBe("Wyoming");
  });

  it("uppercases before lookup", () => {
    expect(stateName("ca")).toBe("California");
    expect(stateName("Tx")).toBe("Texas");
  });

  it("covers DC and the five inhabited territories, which seat non-state members", () => {
    expect(stateName("DC")).toBe("District of Columbia");
    expect(stateName("PR")).toBe("Puerto Rico");
    expect(stateName("GU")).toBe("Guam");
    expect(stateName("AS")).toBe("American Samoa");
    expect(stateName("MP")).toBe("Northern Mariana Islands");
    expect(stateName("VI")).toBe("U.S. Virgin Islands");
  });

  it("returns Unknown for null/undefined/empty", () => {
    expect(stateName(null)).toBe("Unknown");
    expect(stateName(undefined)).toBe("Unknown");
    expect(stateName("")).toBe("Unknown");
  });

  it("echoes an unrecognized code rather than dropping the heading", () => {
    expect(stateName("ZZ")).toBe("ZZ");
    expect(stateName("—")).toBe("—");
  });

  it("has an entry for all 50 states plus DC and five territories", () => {
    expect(Object.keys(STATE_NAMES)).toHaveLength(56);
  });
});

describe("filterByChamber", () => {
  const roster = [
    politician("Senator One", "NY", "senate"),
    politician("Rep Two", "NY", "house"),
    politician("Justice Three", null, "scotus"),
    politician("Former Four", "TX", "former"),
  ];

  it("returns everyone when chamber is null", () => {
    expect(filterByChamber(roster, null)).toHaveLength(4);
  });

  it("keeps only the requested chamber", () => {
    expect(filterByChamber(roster, "senate").map((p) => p.name)).toEqual([
      "Senator One",
    ]);
    expect(filterByChamber(roster, "scotus").map((p) => p.name)).toEqual([
      "Justice Three",
    ]);
  });

  it("returns an empty list when no one matches", () => {
    expect(filterByChamber(roster, "executive")).toEqual([]);
    expect(filterByChamber([], "house")).toEqual([]);
  });

  it("does not mutate the input", () => {
    const input = [...roster];
    filterByChamber(input, "house");
    expect(input).toEqual(roster);
  });
});

describe("groupByState", () => {
  it("groups members under their state code", () => {
    const groups = groupByState([
      politician("A", "AK", "house"),
      politician("B", "AK", "senate"),
      politician("C", "NY", "senate"),
    ]);
    expect(groups).toEqual([
      ["AK", [politician("A", "AK", "house"), politician("B", "AK", "senate")]],
      ["NY", [politician("C", "NY", "senate")]],
    ]);
  });

  it("preserves both group order and within-group order from the query", () => {
    const groups = groupByState([
      politician("Zed", "NY", "senate"),
      politician("Abe", "NY", "house"),
      politician("Moe", "AK", "house"),
    ]);
    expect(groups.map(([code]) => code)).toEqual(["NY", "AK"]);
    expect(groups[0][1].map((p) => p.name)).toEqual(["Zed", "Abe"]);
  });

  it("re-uses an existing group when a state reappears later in the list", () => {
    const groups = groupByState([
      politician("A", "NY", "senate"),
      politician("B", "AK", "house"),
      politician("C", "NY", "house"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0][1].map((p) => p.name)).toEqual(["A", "C"]);
  });

  it("buckets stateless members (justices, executive) under an em dash", () => {
    const groups = groupByState([politician("Justice", null, "scotus")]);
    expect(groups).toEqual([["—", [politician("Justice", null, "scotus")]]]);
  });

  it("returns an empty list for no members", () => {
    expect(groupByState([])).toEqual([]);
  });
});

describe("orgTypeLabel", () => {
  it("labels every known org type", () => {
    const expected: Array<[OrgType, string]> = [
      ["think-tank", "Think tanks"],
      ["advocacy", "Advocacy"],
      ["union", "Unions"],
      ["pac", "PACs"],
      ["super-pac", "Super PACs"],
      ["foundation", "Foundations"],
      ["industry-group", "Industry groups"],
      ["agency", "Federal agencies"],
      ["igo", "International organizations"],
      ["other", "Other"],
    ];
    for (const [type, label] of expected) {
      expect(orgTypeLabel(type)).toBe(label);
    }
    expect(Object.keys(ORG_TYPE_LABELS)).toHaveLength(expected.length);
  });

  it("falls back to Other for null/undefined and for a type it doesn't know", () => {
    expect(orgTypeLabel(null)).toBe("Other");
    expect(orgTypeLabel(undefined)).toBe("Other");
    expect(orgTypeLabel("ministry" as OrgType)).toBe("Other");
  });
});

describe("groupByType", () => {
  it("groups orgs under their type, preserving query order", () => {
    const groups = groupByType([
      org("Brookings", "think-tank"),
      org("Cato", "think-tank"),
      org("ACLU", "advocacy"),
    ]);
    expect(groups.map(([type]) => type)).toEqual(["think-tank", "advocacy"]);
    expect(groups[0][1].map((o) => o.name)).toEqual(["Brookings", "Cato"]);
  });

  it("buckets a typeless org under 'other'", () => {
    const groups = groupByType([org("Mystery Group", null)]);
    expect(groups).toEqual([["other", [org("Mystery Group", null)]]]);
  });

  it("merges typeless orgs with explicitly-'other' ones", () => {
    const groups = groupByType([
      org("Explicit Other", "other"),
      org("Null Type", null),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0][1].map((o) => o.name)).toEqual([
      "Explicit Other",
      "Null Type",
    ]);
  });

  it("returns an empty list for no orgs", () => {
    expect(groupByType([])).toEqual([]);
  });
});
