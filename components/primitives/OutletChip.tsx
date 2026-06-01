"use client";

import { formatAllSidesLabel } from "@/lib/outlet";
import type { OutletProfile } from "@/lib/types";
import LeanGlyph from "./LeanGlyph";
import FactualChip from "./FactualChip";

/**
 * One neutral, sourced outlet rating treatment shared by the reader, the
 * comparison view, and every dossier (§3). Outlet name links to the Sift
 * dossier; the AllSides lean (neutral LeanGlyph + label) links to AllSides;
 * the MBFC factual tier (FactualChip) links to MBFC. Nothing is hue-coded by
 * political lean. Falls back to plain neutral text when no curated outlet
 * matches (graceful degradation).
 */
interface OutletChipProps {
  outlet?: OutletProfile | null;
  /** Plain source-name used when no curated outlet matches. */
  fallback: string;
  /** Show the last-verified date captions (dossier context). Default: false. */
  showVerified?: boolean;
  className?: string;
}

export default function OutletChip({
  outlet,
  fallback,
  showVerified = false,
  className = "",
}: OutletChipProps) {
  if (!outlet) {
    return (
      <span className={`font-bold text-[var(--text-secondary)] ${className}`}>
        {fallback}
      </span>
    );
  }

  const allSides = formatAllSidesLabel(outlet.allSidesRating);

  return (
    <span className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <a
        href={`/outlet/${outlet.slug}`}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Outlet dossier for ${outlet.name}`}
        className="font-bold text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)] hover:underline relative z-[2]"
      >
        {outlet.name}
      </a>

      {outlet.allSidesRating && allSides && (
        <a
          href={outlet.allSidesUrl ?? `/outlet/${outlet.slug}`}
          target={outlet.allSidesUrl ? "_blank" : undefined}
          rel={outlet.allSidesUrl ? "noopener noreferrer" : undefined}
          onClick={(e) => e.stopPropagation()}
          aria-label={`AllSides bias rating: ${allSides}${outlet.allSidesLastChecked ? `, verified ${outlet.allSidesLastChecked}` : ""}${outlet.allSidesUrl ? " (opens AllSides in a new tab)" : ""}`}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] no-underline hover:text-[var(--text-secondary)] relative z-[2] whitespace-nowrap"
        >
          <LeanGlyph rating={outlet.allSidesRating} />
          {allSides}
        </a>
      )}

      <FactualChip
        rating={outlet.mbfcFactual}
        url={outlet.mbfcUrl}
        lastChecked={outlet.mbfcLastChecked}
      />

      {showVerified && (outlet.allSidesLastChecked || outlet.mbfcLastChecked) && (
        <span className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-tertiary)] w-full">
          Ratings cited from AllSides &amp; MBFC
          {outlet.mbfcLastChecked
            ? ` · verified ${outlet.mbfcLastChecked}`
            : outlet.allSidesLastChecked
              ? ` · verified ${outlet.allSidesLastChecked}`
              : ""}
        </span>
      )}
    </span>
  );
}
