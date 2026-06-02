"use client";

import { formatMbfcLabel } from "@/lib/outlet";
import type { OutletMbfcRating } from "@/lib/types";

/**
 * MBFC factual-reporting tier as a NEUTRAL fill-level meter + cited label.
 *
 * Per sign-off (SIFT_THEME_MIGRATION.md §3): the factual tier is encoded
 * tonally/neutrally — a fill-level meter in neutral ink, NOT green-good /
 * red-bad — to stay consistent with Sift's symmetric-citation ethos. Cites +
 * links MBFC and shows the last-verified date.
 */
const LEVEL: Record<OutletMbfcRating, number> = {
  "very-high": 6,
  high: 5,
  "mostly-factual": 4,
  mixed: 3,
  low: 2,
  "very-low": 1,
};

interface FactualChipProps {
  rating: OutletMbfcRating | null | undefined;
  url?: string | null;
  lastChecked?: string | null;
  /**
   * Render ONLY the neutral fill-level meter — no "MBFC: …" text and no cited
   * link — for surfaces that already supply their own label + citation (the
   * outlet dossier). Default false → full label + cited link (reader/OutletChip).
   */
  meterOnly?: boolean;
  className?: string;
}

export default function FactualChip({
  rating,
  url,
  lastChecked,
  meterOnly = false,
  className = "",
}: FactualChipProps) {
  const label = formatMbfcLabel(rating);
  if (!rating || !label) return null;
  const level = LEVEL[rating];

  const meter = (
    <span aria-hidden className="inline-flex items-center gap-[2px] align-middle">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className="inline-block w-[3px] h-[9px] rounded-[1px]"
          style={{
            background:
              i <= level ? "var(--text-secondary)" : "var(--border-strong)",
          }}
        />
      ))}
    </span>
  );

  // Meter-only: the neutral ticks with an accessible label, no text, no link.
  // The host surface (e.g. the dossier) supplies the visible label + citation.
  if (meterOnly) {
    return (
      <span
        className={`inline-flex items-center align-middle ${className}`}
        role="img"
        aria-label={`MBFC factual reporting: ${label}`}
      >
        {meter}
      </span>
    );
  }

  const body = (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] whitespace-nowrap">
      Factual rating: {label}
      {meter}
    </span>
  );

  if (!url) return <span className={className}>{body}</span>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`MBFC factual reporting: ${label}${lastChecked ? `, verified ${lastChecked}` : ""} (opens MBFC in a new tab)`}
      className={`no-underline hover:text-[var(--text-secondary)] relative z-[2] ${className}`}
    >
      {body}
    </a>
  );
}
