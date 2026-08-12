/**
 * Consistency tests for lib/constants.ts.
 *
 * Nothing here computes anything — these are the parallel tables the UI
 * indexes by category id, plus a per-category list of compare-source keys
 * that must exist in COMPARE_SOURCES. Nothing in the type system catches a
 * key that isn't a real source (`string[]`, not a union of the keys), so a
 * typo silently drops an outlet from that category's compare defaults with
 * no error anywhere. That's the failure these assertions exist for.
 */
import {
  API_TIMEOUT_MS,
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_COMPARE_DEFAULTS,
  COMPARE_SOURCES,
  CUSTOM_TOPIC_COLORS,
  DEFAULT_COMPARE_SOURCES,
  GRADIENTS,
  MAX_CUSTOM_TOPICS,
  SLOW_THRESHOLD_MS,
  STORAGE_KEYS,
  VALID_CATEGORIES,
} from "@/lib/constants";

const IDS = CATEGORIES.map((c) => c.id);

describe("category tables stay parallel", () => {
  it("ships the 10 documented categories, Top first", () => {
    expect(CATEGORIES).toHaveLength(10);
    expect(IDS[0]).toBe("top");
    expect(new Set(IDS).size).toBe(IDS.length);
  });

  it("gives every category a label and an icon", () => {
    for (const c of CATEGORIES) {
      expect(c.label).not.toBe("");
      expect(c.icon).not.toBe("");
    }
  });

  it("VALID_CATEGORIES is exactly the CATEGORIES ids", () => {
    expect([...VALID_CATEGORIES].sort()).toEqual([...IDS].sort());
  });

  it("keys CATEGORY_COLORS, GRADIENTS and CATEGORY_COMPARE_DEFAULTS by the same ids", () => {
    for (const table of [CATEGORY_COLORS, GRADIENTS, CATEGORY_COMPARE_DEFAULTS]) {
      expect(Object.keys(table).sort()).toEqual([...IDS].sort());
    }
  });

  it("states each category color as a hex pair and a matching rgb triple", () => {
    for (const id of IDS) {
      const { hex, rgb } = CATEGORY_COLORS[id];
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      const [r, g, b] = hex
        .slice(1)
        .match(/../g)!
        .map((h) => parseInt(h, 16));
      expect(rgb).toBe(`${r},${g},${b}`);
    }
  });
});

describe("compare sources", () => {
  const keys = new Set(COMPARE_SOURCES.map((s) => s.key));

  it("has unique keys and labels", () => {
    expect(keys.size).toBe(COMPARE_SOURCES.length);
    expect(new Set(COMPARE_SOURCES.map((s) => s.label)).size).toBe(
      COMPARE_SOURCES.length,
    );
  });

  it("keys are lowercase — they're matched against outlet names, not displayed", () => {
    for (const { key } of COMPARE_SOURCES) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  it("every per-category default names a real source", () => {
    for (const id of IDS) {
      for (const key of CATEGORY_COMPARE_DEFAULTS[id]) {
        expect(keys.has(key as (typeof COMPARE_SOURCES)[number]["key"])).toBe(
          true,
        );
      }
    }
  });

  it("offers exactly five defaults per category, none repeated", () => {
    for (const id of IDS) {
      const defaults = CATEGORY_COMPARE_DEFAULTS[id];
      expect(defaults).toHaveLength(5);
      expect(new Set(defaults).size).toBe(5);
    }
  });

  it("falls back to the Top defaults", () => {
    expect(DEFAULT_COMPARE_SOURCES).toBe(CATEGORY_COMPARE_DEFAULTS.top);
  });
});

describe("timing, storage keys, and custom-topic slots", () => {
  it("warns of slowness before the request times out", () => {
    expect(SLOW_THRESHOLD_MS).toBeLessThan(API_TIMEOUT_MS);
  });

  it("namespaces every localStorage key under sift-", () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(key).toMatch(/^sift-/);
    }
    expect(new Set(Object.values(STORAGE_KEYS)).size).toBe(
      Object.keys(STORAGE_KEYS).length,
    );
  });

  it("versions the first-run coach key so a new strip can reappear once", () => {
    expect(STORAGE_KEYS.seenIntro).toMatch(/-v\d+$/);
  });

  it("has one custom-topic color per slot", () => {
    expect(CUSTOM_TOPIC_COLORS).toHaveLength(MAX_CUSTOM_TOPICS);
    for (const { hex, rgb } of CUSTOM_TOPIC_COLORS) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(rgb).toMatch(/^\d{1,3},\d{1,3},\d{1,3}$/);
    }
  });
});
