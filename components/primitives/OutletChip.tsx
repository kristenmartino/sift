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
  /** Compact reader treatment: ratings remain one explicit step away. */
  compact?: boolean;
}

export default function OutletChip({
  outlet,
  fallback,
  showVerified = false,
  className = "",
  compact = false,
}: OutletChipProps) {
  if (!outlet) {
    return (
      <span className={`font-bold text-[var(--text-secondary)] ${className}`}>
        {fallback}
      </span>
    );
  }

  const allSides = formatAllSidesLabel(outlet.allSidesRating);

  const ratings = (<>
      {/* Line 2 — bias rating, on its own line so placement is deterministic
          regardless of column width / label length. Source (AllSides) named in
          the tooltip + as the link target; the visible label stays plain. */}
      {outlet.allSidesRating && allSides && (
        <a
          href={outlet.allSidesUrl ?? `/outlet/${outlet.slug}`}
          target={outlet.allSidesUrl ? "_blank" : undefined}
          rel={outlet.allSidesUrl ? "noopener noreferrer" : undefined}
          onClick={(e) => e.stopPropagation()}
          title={`AllSides political-bias rating: ${allSides}`}
          aria-label={`AllSides bias rating: ${allSides}${outlet.allSidesLastChecked ? `, verified ${outlet.allSidesLastChecked}` : ""}${outlet.allSidesUrl ? " (opens AllSides in a new tab)" : ""}`}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-[var(--text-secondary)] no-underline hover:text-[var(--text-secondary)] relative z-[2] whitespace-nowrap"
        >
          Bias rating: {allSides}
          <LeanGlyph rating={outlet.allSidesRating} />
        </a>
      )}

      {/* Line 3 — factual-reporting rating, on its own line. */}
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
  </>);
  const Container = compact ? "div" : "span";
  return <Container className={`inline-flex flex-col items-start gap-1 ${className}`}>
      {/* Line 1 — outlet name (the identity). */}
      <a
        href={`/outlet/${outlet.slug}`}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Outlet dossier for ${outlet.name}`}
        className="text-[13px] font-bold text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)] hover:underline relative z-[2]"
      >
        {outlet.name}
      </a>

    {compact ? <details className="relative z-2 text-xs" onClick={(e) => e.stopPropagation()}>
      <summary className="cursor-pointer text-(--text-secondary) hover:text-(--text-primary)">Outlet ratings</summary>
      <span className="flex flex-col gap-1.5 py-2">{ratings}</span>
      <a href="/methodology#outlet-ratings" className="text-xs text-(--text-secondary) hover:underline">About these ratings →</a>
    </details> : ratings}
  </Container>;
}
