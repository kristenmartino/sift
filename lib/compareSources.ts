import { COMPARE_SOURCES, CATEGORY_COMPARE_DEFAULTS } from "./constants";
import type { CategoryId, OutletProfile } from "./types";

export interface CompareSource {
  key: string;
  label: string;
  aliases?: string[];
}

/** Preserve existing shared-link keys while exposing every curated publisher. */
export function compareSourcesFromMap(outlets: Map<string, OutletProfile>): CompareSource[] {
  const profiles = new Map([...outlets.values()].map((outlet) => [outlet.slug, outlet]));
  return [...profiles.values()].map((outlet) => {
    const aliases = [...outlets].filter(([, value]) => value.slug === outlet.slug).map(([key]) => key);
    const previous = COMPARE_SOURCES.find((source) => aliases.includes(source.key));
    return { key: previous?.key ?? outlet.name.toLowerCase(), label: outlet.name,
      aliases: [...new Set([...aliases, outlet.slug, outlet.name.toLowerCase()])] };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

export function resolveCompareSource(name: string, sources: readonly CompareSource[]): CompareSource | undefined {
  const key = name.trim().toLowerCase();
  return sources.find((source) => source.key === key || source.aliases?.includes(key));
}

export function compareDefaults(category: CategoryId, sources: readonly CompareSource[]): string[] {
  const defaults = [...new Set(CATEGORY_COMPARE_DEFAULTS[category].flatMap((key) => {
    const match = resolveCompareSource(key, sources);
    return match ? [match.key] : [];
  }))];
  return (defaults.length >= 2 ? defaults : sources.map((source) => source.key)).slice(0, 5);
}
