"use client";

import { useEffect, useState } from "react";
import type { OutletProfile } from "@/lib/types";
import { OutletChip } from "./primitives";

/** One cited rating block per requested outlet, independent of retrieval status. */
export default function CompareOutletRatings({ sources }: { sources: string[] }) {
  const names = [...new Map(sources.map((source) => [source.trim().toLowerCase(), source.trim()])).values()];
  const sourceKey = JSON.stringify(names);
  const [loaded, setLoaded] = useState<{ key: string; outlets: Record<string, OutletProfile | null> } | null>(null);

  useEffect(() => {
    if (!sources.length) return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 8000);
    const query = new URLSearchParams();
    for (const name of JSON.parse(sourceKey) as string[]) query.append("source", name);
    fetch(`/api/compare/outlets?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Outlet ratings unavailable");
        return response.json() as Promise<{ outlets: Record<string, OutletProfile | null> }>;
      })
      .then((data) => { if (active) setLoaded({ key: sourceKey, outlets: data.outlets ?? {} }); })
      .catch(() => { if (active) setLoaded({ key: sourceKey, outlets: {} }); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [sourceKey, sources.length]);

  if (!names.length) return null;
  const ready = loaded?.key === sourceKey;
  return (
    <section aria-label="Compared outlet ratings" className="mb-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-(--text-tertiary) mb-3">Outlet ratings</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {names.map((source) => {
          const outlet = ready ? loaded.outlets[source.toLowerCase()] : null;
          return <li key={source.toLowerCase()} className="min-w-0 rounded-[12px] border border-(--border) bg-(--surface-raised) p-4">
            {ready ? <OutletChip outlet={outlet} fallback={source} /> : <>
              <span className="font-bold text-(--text-secondary)">{source}</span>
              <p className="mt-1 text-xs text-(--text-tertiary)">Loading ratings…</p>
            </>}
          </li>;
        })}
      </ul>
    </section>
  );
}
