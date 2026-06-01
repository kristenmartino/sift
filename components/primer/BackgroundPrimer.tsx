"use client";

import Link from "next/link";
import { useState } from "react";
import { COPY } from "@/lib/copy";
import { entityHref } from "@/lib/entityLinks";
import type { ContextPrimer, ContextPrimerTerm } from "@/lib/types";

interface BackgroundPrimerProps {
  primer: ContextPrimer | null | undefined;
  /**
   * Default expanded state. Cards in dense feeds default to collapsed (a small
   * "Show context" toggle), while detail pages or hero positions can default
   * to expanded. Per-card collapse state is local; no localStorage persistence
   * in this first cut — Phase 1C just renders the affordance.
   */
  defaultExpanded?: boolean;
  /**
   * Optional article id + surface for Phase 1 primer-expand instrumentation.
   * When both are present, the first user-initiated expand fires a single
   * fire-and-forget POST to /api/primer/expand so we can measure how often
   * anyone actually opens the panel. Default-expanded cards (e.g. featured
   * hero) do NOT count as user expands — we only fire on the click that
   * flips state from collapsed → expanded.
   */
  articleId?: string;
  surface?: "feed" | "bookmarks";
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
 * `relative z-2` on the outer div here makes the entire primer surface
 * (collapsed pill + expanded panel) opt out of the card-link click handler.
 */
export default function BackgroundPrimer({
  primer,
  defaultExpanded = false,
  articleId,
  surface,
}: BackgroundPrimerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!primer) return null;

  const { background, terms } = primer;
  if (!background && terms.length === 0) return null;

  // Fire-and-forget analytics POST when the user-initiated click flips
  // state collapsed → expanded. Skipped on the auto-expanded path (e.g.
  // featured hero card) since that's not a user action. Failure is
  // swallowed; the UI flips state either way.
  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
    if (articleId) {
      // Body is null-safe — surface omitted is fine (server logs null).
      fetch("/api/primer/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, ...(surface ? { surface } : {}) }),
        // Keep the request lightweight; no need to wait, no need to retry.
        keepalive: true,
      }).catch(() => {
        /* analytics is best-effort; ignore */
      });
    }
  };

  return (
    <div className="my-1 relative z-2">
      {!expanded && (
        <button
          type="button"
          onClick={handleExpand}
          aria-expanded={false}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.04em] uppercase border border-(--border) bg-transparent text-(--text-secondary) hover:text-(--text-primary) hover:border-(--text-tertiary) transition-colors duration-200 cursor-pointer"
        >
          <span aria-hidden>◆</span>
          <span>{COPY.primer.eyebrow}</span>
          <span aria-hidden className="text-(--text-tertiary)">▾</span>
        </button>
      )}

      {expanded && (
        <div
          className="rounded-[10px] border border-(--border-subtle) p-3.5"
          style={{
            background: "var(--well-bg)",
          }}
          // Defensive: stop bubbling to the card-link overlay even on
          // background clicks within the panel (text selection, e.g.).
          onClick={(e) => e.stopPropagation()}
        >
          {/* Eyebrow + collapse */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <p className="text-kicker font-bold uppercase text-(--text-tertiary)">
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
              className="text-meta uppercase tracking-wider text-(--text-secondary) hover:text-(--text-primary) cursor-pointer transition-colors duration-200 bg-transparent border-none p-0"
            >
              {COPY.primer.hide} <span aria-hidden>▴</span>
            </button>
          </div>

          {/* Background paragraph */}
          {background && (
            <p className="text-body text-(--text-secondary) leading-relaxed mb-3">
              {background}
            </p>
          )}

          {/* Term/definition list — no "Key terms" label. Renders as a
              reference panel rather than a textbook glossary.

              Phase 3.G.4: terms whose text contains a curated entity (FCC,
              Schumer, IRA, etc.) get a `link` attached server-side via
              `attachPrimerTermLinks`. Linked terms render as click-through
              into the dossier; unlinked terms remain plain text. */}
          {terms.length > 0 && (
            <dl className="flex flex-col gap-1.5">
              {terms.map((t) => (
                <div key={t.term} className="text-body leading-snug">
                  <PrimerTermLabel term={t} />
                  <dd className="inline text-(--text-secondary)">
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

/**
 * Term label inside the primer's term list. When the term has a `link`
 * (Phase 3.G.4 — server-attached when the term text contains a curated
 * entity surface form), renders as a click-through to the dossier with
 * subtle accent styling. Otherwise renders as plain bold text matching
 * the previous look.
 *
 * Click handler stops propagation so the surrounding card-link doesn't
 * fire on term-tap (same pattern as EntityLinksList chips).
 */
function PrimerTermLabel({ term }: { term: ContextPrimerTerm }) {
  if (!term.link) {
    return (
      <dt className="inline font-semibold text-(--text-primary)">{term.term}</dt>
    );
  }
  // Reuse the shared dossier-routing helper so primer-term links + chip
  // links can never drift apart.
  const href = entityHref({
    type: term.link.type,
    canonicalId: term.link.canonicalId,
    surfaceForm: term.term,
  });
  return (
    <dt className="inline">
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Open dossier for ${term.term}`}
        className="font-semibold text-(--text-primary) no-underline border-b border-dotted border-(--accent) hover:text-(--accent) hover:border-solid transition-colors"
      >
        {term.term}
      </Link>
    </dt>
  );
}
