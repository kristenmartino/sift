"use client";

import { useState } from "react";
import { COPY } from "@/lib/copy";
import type { ContextPrimer } from "@/lib/types";

interface BackgroundPrimerProps {
  primer: ContextPrimer | null | undefined;
  /**
   * Default expanded state. Cards in dense feeds default to collapsed (a small
   * "Show context" toggle), while detail pages or hero positions can default
   * to expanded. Per-card collapse state is local; no localStorage persistence
   * in this first cut — Phase 1C just renders the affordance.
   */
  defaultExpanded?: boolean;
}

/**
 * Renders the "What you should know first" panel for an article.
 *
 * Hides itself entirely when there's no primer data. Otherwise renders a small
 * collapsed pill ("Show context ▾") that expands inline to reveal the
 * background paragraph and key terms, both AI-generated at ingest by the
 * primer pipeline (sift-api/services/primer_generator.py).
 *
 * The voice doc lives at sift-api/services/primer_generator.py — patient
 * teacher, never preachy, never partisan, never editorializing. The component
 * just plumbs the structured output into HTML; the editorial discipline is
 * upstream.
 *
 * z-index note: ArticleCard makes the entire card clickable via a stretched
 * <a><span absolute inset-0 z-[1]> overlay. Anything inside the card that
 * needs its own click target (bookmark button, primer toggle) must be
 * relatively-positioned with z-[2]+ to sit above that overlay. The wrapping
 * `relative z-[2]` on the outer div here makes the entire primer surface
 * (collapsed pill + expanded panel) opt out of the card-link click handler.
 */
export default function BackgroundPrimer({
  primer,
  defaultExpanded = false,
}: BackgroundPrimerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!primer) return null;

  const { background, terms } = primer;
  if (!background && terms.length === 0) return null;

  return (
    <div className="my-1 relative z-[2]">
      {!expanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          aria-expanded={false}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.04em] uppercase border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-colors duration-200 cursor-pointer"
        >
          <span aria-hidden>◆</span>
          <span>{COPY.primer.eyebrow}</span>
          <span aria-hidden className="text-[var(--text-muted)]">▾</span>
        </button>
      )}

      {expanded && (
        <div
          className="rounded-[10px] border border-[var(--border-subtle)] p-3.5"
          style={{
            background: "var(--well-bg)",
          }}
          // Defensive: stop bubbling to the card-link overlay even on
          // background clicks within the panel (text selection, e.g.).
          onClick={(e) => e.stopPropagation()}
        >
          {/* Eyebrow + collapse */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <p className="text-kicker font-bold uppercase text-[var(--text-muted)]">
              <span aria-hidden className="mr-1.5">◆</span>
              {COPY.primer.eyebrow}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              aria-expanded={true}
              className="text-meta uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer transition-colors duration-200 bg-transparent border-none p-0"
            >
              {COPY.primer.hide} <span aria-hidden>▴</span>
            </button>
          </div>

          {/* Background paragraph */}
          {background && (
            <p className="text-body text-[var(--text-secondary)] leading-relaxed mb-3">
              {background}
            </p>
          )}

          {/* Term/definition list — no "Key terms" label. Renders as a
              reference panel rather than a textbook glossary. */}
          {terms.length > 0 && (
            <dl className="flex flex-col gap-1.5">
              {terms.map((t) => (
                <div key={t.term} className="text-body leading-snug">
                  <dt className="inline font-semibold text-[var(--text)]">
                    {t.term}
                  </dt>
                  <dd className="inline text-[var(--text-secondary)]">
                    {" — "}
                    {t.definition}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
