"use client";

import { formatAllSidesLabel } from "@/lib/outlet";
import type { OutletProfile } from "@/lib/types";

interface OutletBadgeProps {
  /**
   * Curated outlet provenance from the API. When null/undefined the component
   * falls back to plain `fallback` text — graceful degradation while
   * source_name_aliases is still being populated in prod.
   */
  outlet?: OutletProfile | null;
  /** Plain source-name string used when no curated outlet matches. */
  fallback: string;
  /**
   * Visual register:
   *   - "meta": small mixed-case meta line (ArticleCard footer). Default.
   *   - "rail": uppercase rail style (StoryCard expanded child rows).
   */
  variant?: "meta" | "rail";
  /**
   * Optional extra Tailwind classes appended to the wrapper. Lets parent
   * cards continue controlling sizing (e.g. `min-w-[88px]` on the rail).
   */
  className?: string;
}

/**
 * Renders an outlet name with optional inline AllSides rating.
 *
 * Two click affordances when the outlet is matched:
 *   1. Outlet name → /outlet/[slug]   (Sift-internal dossier, Phase 2.C)
 *   2. AllSides label → outlet's AllSides page  (citation, opens new tab)
 *
 * z-index note: ArticleCard wraps its title in a stretched `<a>` overlay
 * (`<span class="absolute inset-0 z-[1]">`). Anchors here use `relative z-[2]`
 * + `e.stopPropagation()` to opt out of that overlay, mirroring how the
 * bookmark button and primer toggle escape the card-link.
 *
 * Phase 2.C will add the dossier route. Until then `/outlet/[slug]` 404s
 * gracefully — no soft-broken interactions, just a not-found page.
 */
export default function OutletBadge({
  outlet,
  fallback,
  variant = "meta",
  className,
}: OutletBadgeProps) {
  const isRail = variant === "rail";

  // Fallback: no curated outlet match → render plain text matching the
  // existing visual register at each callsite.
  if (!outlet) {
    if (isRail) {
      return (
        <span
          className={`text-outlet font-semibold uppercase text-[var(--text)] ${className ?? ""}`}
        >
          {fallback}
        </span>
      );
    }
    return (
      <span className={`font-bold text-[var(--text-secondary)] ${className ?? ""}`}>
        {fallback}
      </span>
    );
  }

  const allSides = formatAllSidesLabel(outlet.allSidesRating);

  // Rail variant (StoryCard rows): tight uppercase, no AllSides chip yet —
  // the row already has limited horizontal space and Phase 2.C's
  // CrossSpectrumCompare is the better surface for the lean indicator.
  if (isRail) {
    return (
      <span className={`inline-flex items-center ${className ?? ""}`}>
        <a
          href={`/outlet/${outlet.slug}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Outlet dossier for ${outlet.name}`}
          className="text-outlet font-semibold uppercase text-[var(--text)] no-underline hover:underline relative z-[2]"
        >
          {outlet.name}
        </a>
      </span>
    );
  }

  // Meta variant (ArticleCard footer): outlet name link + small mono
  // AllSides chip linking to the citation source. Whole thing wraps if the
  // meta line wraps on narrow viewports.
  return (
    <span
      className={`inline-flex items-center gap-1.5 flex-wrap ${className ?? ""}`}
    >
      <a
        href={`/outlet/${outlet.slug}`}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Outlet dossier for ${outlet.name}`}
        className="font-bold text-[var(--text-secondary)] no-underline hover:underline hover:text-[var(--text)] relative z-[2]"
      >
        {outlet.name}
      </a>
      {allSides && (
        <a
          href={outlet.allSidesUrl ?? `/outlet/${outlet.slug}`}
          target={outlet.allSidesUrl ? "_blank" : undefined}
          rel={outlet.allSidesUrl ? "noopener noreferrer" : undefined}
          onClick={(e) => e.stopPropagation()}
          aria-label={`AllSides bias rating: ${allSides}${outlet.allSidesUrl ? " (opens AllSides in a new tab)" : ""}`}
          className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] no-underline hover:text-[var(--text-secondary)] hover:underline relative z-[2] whitespace-nowrap"
        >
          {allSides}
        </a>
      )}
    </span>
  );
}
