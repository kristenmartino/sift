"use client";

import { COPY } from "@/lib/copy";
import {
  CROSS_SPECTRUM_BUCKETS,
  groupFramingsByBucket,
  shouldRenderCrossSpectrum,
  type CrossSpectrumBucket,
} from "@/lib/crossSpectrum";
import type { StoryFraming } from "@/lib/types";
import OutletBadge from "./outlet/OutletBadge";

interface CrossSpectrumCompareProps {
  framings: StoryFraming[];
}

/**
 * Side-by-side cross-spectrum view of how outlets across the political
 * spectrum framed the same story. Civic-literacy MVP Phase 2.C.2.
 *
 * Renders as a 2- or 3-column grid (one column per occupied bucket) on
 * desktop, stacked sections on mobile. Each column shows its bucketed
 * framings as `outlet name + headline-style framing text`.
 *
 * Returns null when the story doesn't clear the cross-spectrum threshold
 * (≥3 bucketed framings, ≥2 buckets). The caller should fall back to the
 * flat-list framings render in that case — see StoryCard for the
 * integration. Unbucketed framings (mixed-rated outlets, unmatched
 * source_names) drop out of this view entirely; the StoryCard's expanded
 * "View N articles" list still surfaces them.
 *
 * Visual register matches StoryCard's existing framings block — same
 * `.story-row` hover affordance, same `text-outlet` register on outlet
 * names, just laid out in columns instead of rows.
 */
export default function CrossSpectrumCompare({
  framings,
}: CrossSpectrumCompareProps) {
  if (!shouldRenderCrossSpectrum(framings)) return null;

  const groups = groupFramingsByBucket(framings);
  const occupied = CROSS_SPECTRUM_BUCKETS.filter(
    (b) => groups[b].length > 0,
  );

  // Adapt the grid to the number of populated buckets so 2-column stories
  // (Left + Right but no Center, e.g.) don't render an empty third column.
  // Mobile always single-column; desktop 2 or 3 columns matching `occupied`.
  const desktopCols =
    occupied.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <div className="mt-1">
      <div className="flex items-center gap-3 mb-3">
        <p className="text-kicker font-bold uppercase text-(--text-tertiary) shrink-0">
          {COPY.stories.crossSpectrumHeader}
        </p>
        <span
          aria-hidden
          className="flex-1 h-px bg-linear-to-r from-(--border) to-transparent"
        />
      </div>
      <div className={`grid grid-cols-1 ${desktopCols} gap-x-5 gap-y-4`}>
        {occupied.map((bucket) => (
          <CrossSpectrumColumn
            key={bucket}
            bucket={bucket}
            framings={groups[bucket]}
          />
        ))}
      </div>
    </div>
  );
}

interface CrossSpectrumColumnProps {
  bucket: CrossSpectrumBucket;
  framings: StoryFraming[];
}

function CrossSpectrumColumn({ bucket, framings }: CrossSpectrumColumnProps) {
  const label = COPY.stories.crossSpectrumBucketLabels[bucket];
  return (
    <div className="flex flex-col">
      {/* Bucket header — uppercase rail-style label with hairline underline.
          Same register as the outer "Across the spectrum" eyebrow but
          tighter, so the column hierarchy reads at a glance. */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-outlet font-semibold uppercase text-(--text-primary) shrink-0">
          {label}
        </span>
        <span
          aria-hidden
          className="flex-1 h-px bg-(--border-subtle)"
        />
      </div>
      <div className="flex flex-col">
        {framings.map((f) => (
          <div
            key={f.sourceName}
            className="story-row flex flex-col gap-1.5 py-2.5 border-b border-(--border-subtle) last:border-b-0"
          >
            <span aria-hidden className="story-row__rail" />
            <OutletBadge
              outlet={f.outlet}
              fallback={f.sourceName}
              variant="rail"
              className="story-row__source shrink-0"
            />
            <span className="text-body text-(--text-secondary) leading-snug">
              {f.framing}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
