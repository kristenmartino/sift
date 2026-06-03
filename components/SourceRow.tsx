"use client";

import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/utils";
import { OutletChip } from "./primitives";
import type { SourceUnit } from "@/lib/storySources";

interface SourceRowProps {
  unit: SourceUnit;
  /** Wire the per-row "See angles" compare CTA. */
  onCompare?: (topic: string, sourceName?: string) => void;
}

/**
 * One outlet's complete contribution to a clustered story, in a single block:
 *
 *   OUTLET NAME · ▏▏█▏▏ Center · MBFC: High        ← OutletChip (neutral, cited)
 *   How the outlet framed the story.                ← framing (when synthesized)
 *   → the outlet's actual headline            2h   ← link to the original
 *   +2 more from OUTLET ▸                           ← same-outlet extras (native disclosure)
 *
 * Provenance is rendered by the shared OutletChip so lean + factual look
 * identical here and on /news (SIFT_THEME_MIGRATION.md §3 — position/fill, never
 * hue). Used by both the flat framings list and the cross-spectrum columns.
 */
export default function SourceRow({ unit, onCompare }: SourceRowProps) {
  const lead = unit.articles[0];
  const extras = unit.articles.slice(1);

  return (
    <div className="story-row flex flex-col gap-2 py-3 border-b border-(--border-subtle) last:border-b-0">
      <span aria-hidden className="story-row__rail" />

      {/* Provenance — neutral lean + factual, cited; shared with /news */}
      <OutletChip
        outlet={unit.outlet}
        fallback={unit.sourceName}
        className="story-row__source"
      />

      {/* How this outlet framed the story */}
      {unit.framing && (
        <p className="text-body text-(--text-secondary) leading-snug">
          {unit.framing}
        </p>
      )}

      {/* The outlet's actual headline → the original article */}
      {lead && (
        <div className="flex items-baseline gap-2 text-meta">
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-baseline gap-1.5 flex-1 min-w-0 text-(--accent) no-underline hover:underline relative z-2"
          >
            <span aria-hidden className="shrink-0">
              &rarr;
            </span>
            <span className="truncate">{lead.title}</span>
          </a>
          <span className="shrink-0 text-(--text-tertiary)">
            {timeAgo(lead.publishedDate)}
          </span>
          {onCompare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCompare(lead.title, unit.sourceName);
              }}
              className="story-row__cta shrink-0 bg-transparent border-none p-0 cursor-pointer font-medium text-(--accent)"
            >
              {COPY.stories.compareRow}
            </button>
          )}
        </div>
      )}

      {/* Same-outlet extras — only when one outlet published several pieces */}
      {extras.length > 0 && (
        <details className="text-meta">
          <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-(--text-tertiary) hover:text-(--text-secondary) transition-colors">
            {COPY.stories.moreFromOutlet(
              extras.length,
              unit.outlet?.name ?? unit.sourceName,
            )}
          </summary>
          <div className="flex flex-col gap-1.5 mt-1.5 pl-3 border-l border-(--border-subtle)">
            {extras.map((a) => (
              <a
                key={a.id}
                href={a.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="truncate text-(--text-secondary) no-underline hover:text-(--text-primary) hover:underline relative z-2"
              >
                {a.title}
              </a>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
