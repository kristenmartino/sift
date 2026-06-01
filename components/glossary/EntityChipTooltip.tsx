"use client";

import { COPY } from "@/lib/copy";
import type { CivicContext } from "@/lib/types";
import { formatUsdCompact } from "@/lib/utils";

interface EntityChipTooltipProps {
  context: CivicContext;
}

/**
 * Tooltip preview attached to an EntityLinksList chip — Phase 3.G.3.
 *
 * Reveals on `:hover` of the parent `<li class="group">` and on
 * `:focus-within` (keyboard tab onto the chip's `<Link>`). The chip
 * itself stays clickable; the tooltip is purely a preview hint.
 *
 * Mobile note: tap on the chip focuses the `<Link>` briefly before
 * navigating, so the tooltip flashes rather than parking. We don't try
 * to fight that — mobile users get the full dossier on tap, which is
 * the better experience anyway. The tooltip is a desktop affordance.
 *
 * Visibility uses Tailwind's `group-hover` / `group-focus-within`
 * utilities so we ship no client JS for the show/hide. The tooltip is
 * positioned `absolute bottom-full` so it renders above the chip,
 * pinned to the chip's left edge with a small gap.
 */
export default function EntityChipTooltip({ context }: EntityChipTooltipProps) {
  if (context.type !== "politician") return null;
  const { topIndustries } = context;

  return (
    <span
      role="tooltip"
      // The presentational layer. Hidden by default, revealed when the
      // wrapping <li class="group"> is hovered or contains focus.
      className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-20 w-[300px] max-w-[calc(100vw-2rem)] bg-(--surface-raised) border border-(--border) rounded-md shadow-lg p-3 text-left"
    >
      <p className="text-kicker font-bold uppercase text-(--text-tertiary) mb-2 leading-tight">
        {COPY.glossary.tooltip.politicianTopIndustries}
      </p>
      {topIndustries.length === 0 ? (
        <p className="text-[12px] text-(--text-secondary) italic">
          {COPY.glossary.tooltip.noPacData}
        </p>
      ) : (
        <ul className="space-y-1">
          {topIndustries.map((entry) => (
            <li
              key={entry.industry}
              className="grid grid-cols-[1fr_auto] gap-x-3 items-baseline border-b border-(--border-subtle) last:border-b-0 pb-1 last:pb-0"
            >
              <span className="text-[12px] text-(--text-secondary) truncate">
                {entry.industry}
              </span>
              {entry.amount_usd != null && (
                <span className="font-mono text-[11px] tabular-nums text-(--text-tertiary)">
                  {formatUsdCompact(entry.amount_usd)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-outlet uppercase tracking-wider text-(--text-tertiary) mt-2 pt-2 border-t border-(--border-subtle)">
        {COPY.glossary.tooltip.openDossierHint}
      </p>
    </span>
  );
}
