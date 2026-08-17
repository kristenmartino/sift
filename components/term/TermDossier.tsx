import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import ShareActions from "@/components/ShareActions";
import { LeanGlyph } from "@/components/primitives";
import { bucketize, CROSS_SPECTRUM_BUCKETS } from "@/lib/crossSpectrum";
import { COPY } from "@/lib/copy";
import { formatAllSidesLabel } from "@/lib/outlet";
import { timeAgo } from "@/lib/utils";
import type { Article, TermCoverage, TermProfile } from "@/lib/types";

interface TermDossierProps {
  term: TermProfile;
  coverage: TermCoverage;
  recentArticles: Article[];
}

const BUCKET_LABEL: Record<(typeof CROSS_SPECTRUM_BUCKETS)[number], string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

/**
 * Server-rendered term dossier. Same editorial register as the other four —
 * kicker eyebrows, hairline rules, one column at 800px.
 *
 * The page is two halves that are epistemically different, and the layout
 * says so rather than blending them:
 *
 * 1. **The definition** is a claim about the world, so it never appears
 *    without the authority it came from. `lib/term.ts` nulls the pair when
 *    the source is missing, so the section below simply doesn't render — the
 *    same shape as the org budget triple. There is no "definition pending"
 *    state on purpose: a half-cited definition is worse than none.
 * 2. **The coverage** is a count of Sift's own index. It needs no citation
 *    beyond the articles it links, and the copy is careful to scope it that
 *    way ("in Sift's index"), because the corpus is a sample of the press and
 *    a bare number would read as a claim about all of it.
 *
 * The spectrum block is the reason this route exists. Anyone can define
 * Temporary Protected Status — Cornell already did, and better. Nobody else
 * can show you that the same Haiti ruling was filed as "Trump gets
 * immigration victory" on the right and "Haitian migrants lose right to work"
 * on the left, in the same 48 hours.
 */
export default function TermDossier({
  term,
  coverage,
  recentArticles,
}: TermDossierProps) {
  // Bucket by AllSides rating using the same rule the cross-spectrum compare
  // view uses — one bucketing in the codebase, not two that can disagree.
  // Unrated outlets fall out here and are named in `spreadNote`; absence of
  // a rating is never treated as evidence of position.
  const buckets = CROSS_SPECTRUM_BUCKETS.map((b) => ({
    key: b,
    label: BUCKET_LABEL[b],
    articles: coverage.outlets
      .filter((o) => bucketize(o.allSidesRating) === b)
      .reduce((n, o) => n + o.articleCount, 0),
    outlets: coverage.outlets.filter((o) => bucketize(o.allSidesRating) === b).length,
  }));
  const bucketedTotal = buckets.reduce((n, b) => n + b.articles, 0);
  const widest = Math.max(1, ...buckets.map((b) => b.articles));

  return (
    <div className="min-h-screen bg-(--surface-base) text-(--text-primary)">
      <LandingMasthead />

      <main id="main-content" className="max-w-[800px] mx-auto px-6 pt-12 pb-24">
        <header className="mb-9">
          <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3 flex items-center">
            <span aria-hidden className="inline-block w-7 h-px bg-(--border) mr-3" />
            {COPY.term.eyebrow}
          </p>
          <h1 className="font-heading text-[36px] md:text-[44px] font-bold leading-[1.05] tracking-tight text-(--text-primary)">
            {term.term}
          </h1>
          {term.aliases.length > 0 && (
            <p className="font-body text-[15px] text-(--text-secondary) mt-3">
              <span className="text-(--text-tertiary)">
                {COPY.term.aliasLabel}:{" "}
              </span>
              {term.aliases.join(", ")}
            </p>
          )}
          <ShareActions
            citeEntry={`${term.term} — Civic term`}
            citeSources={term.definitionSource ? [term.definitionSource] : []}
          />
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Definition. Renders only as a sourced pair — see lib/term.ts. */}
        {term.definition && term.definitionSource && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {COPY.term.definitionLabel}
            </p>
            <p className="font-body text-[18px] text-(--text-primary) leading-relaxed max-w-[62ch]">
              {term.definition}
            </p>
            <p className="font-body text-[12px] text-(--text-tertiary) leading-relaxed mt-4">
              <a
                href={term.definitionSource}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--text-secondary) no-underline hover:underline hover:text-(--accent)"
              >
                {COPY.term.definitionCitation(
                  hostOf(term.definitionSource),
                  term.definitionChecked,
                )}{" "}
                <span aria-hidden>↗</span>
              </a>
            </p>
            <p className="font-body text-[12px] text-(--text-tertiary) leading-relaxed mt-1.5 italic">
              {COPY.term.definitionNote}
            </p>
          </section>
        )}

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Coverage — the half that is reportage about Sift's own index. */}
        <section className="mb-12">
          <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
            {COPY.term.coverageLabel}
          </p>

          {coverage.articleCount === 0 ? (
            <p className="font-body text-[15px] text-(--text-tertiary) italic max-w-[60ch] leading-relaxed">
              {COPY.term.noCoverage}
            </p>
          ) : (
            <>
              <p className="font-heading text-[24px] font-semibold text-(--text-primary) leading-snug max-w-[60ch]">
                {COPY.term.coverageSummary(
                  coverage.articleCount,
                  coverage.outlets.length,
                )}
              </p>
              {coverage.firstSeen && coverage.lastSeen && (
                <p className="font-body text-[13px] text-(--text-tertiary) mt-2">
                  {COPY.term.dateSpan(coverage.firstSeen, coverage.lastSeen)}
                </p>
              )}
              {/* How the count was reached. The list below contains stories
                  that never print the term — they were matched by the primer
                  — so a reader who clicks through would otherwise think the
                  count was wrong. */}
              <p className="font-body text-[12px] text-(--text-tertiary) leading-relaxed mt-4 max-w-[60ch]">
                {COPY.term.coverageMethod}
              </p>
            </>
          )}
        </section>

        {/* Spectrum spread. Needs at least one rated outlet to say anything. */}
        {bucketedTotal > 0 && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-5">
              {COPY.term.spreadLabel}
            </p>
            <ul className="space-y-3.5">
              {buckets.map((b) => (
                <li
                  key={b.key}
                  className="grid grid-cols-[68px_1fr_auto] gap-x-4 items-center"
                >
                  <span className="font-body text-outlet uppercase tracking-wider text-(--text-tertiary)">
                    {b.label}
                  </span>
                  {/* Position, never hue — same neutral-ink rule as
                      LeanGlyph and LeanSpread (SIFT_THEME_MIGRATION.md §3). */}
                  <span
                    aria-hidden
                    className="block h-[6px] rounded-[1px] bg-(--border-strong) overflow-hidden"
                  >
                    <span
                      className="block h-full bg-(--text-secondary)"
                      style={{ width: `${(b.articles / widest) * 100}%` }}
                    />
                  </span>
                  <span className="font-body text-[13px] text-(--text-secondary) tabular-nums">
                    {b.articles}{" "}
                    <span className="text-(--text-tertiary)">
                      {b.articles === 1 ? "story" : "stories"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-body text-[12px] text-(--text-tertiary) leading-relaxed mt-5 max-w-[60ch]">
              {COPY.term.spreadNote(coverage.articleCount - bucketedTotal)}
            </p>
          </section>
        )}

        {/* Per-outlet breakdown, ordered by volume. */}
        {coverage.outlets.length > 0 && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-5">
              {COPY.term.outletsLabel}
            </p>
            <ul className="space-y-0">
              {coverage.outlets.map((o) => {
                const leanLabel = formatAllSidesLabel(o.allSidesRating);
                return (
                  <li
                    key={`${o.slug ?? "unmatched"}:${o.sourceName}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-(--border-subtle) last:border-b-0 py-3"
                  >
                    <span className="font-heading text-[16px] text-(--text-primary) flex-1 min-w-[140px]">
                      {o.slug ? (
                        <Link
                          href={`/outlet/${o.slug}`}
                          className="no-underline text-(--text-primary) hover:underline hover:text-(--accent)"
                        >
                          {o.sourceName}
                        </Link>
                      ) : (
                        o.sourceName
                      )}
                    </span>
                    {/* The rating is a third-party judgement, so it appears
                        verbatim and linked to whoever made it — D37. No
                        link, no label. */}
                    {leanLabel && o.allSidesUrl && (
                      <span className="flex items-center gap-2">
                        <LeanGlyph rating={o.allSidesRating} />
                        <a
                          href={o.allSidesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-[12px] text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
                        >
                          {leanLabel} <span aria-hidden>↗</span>
                        </a>
                      </span>
                    )}
                    <span className="font-body text-[13px] text-(--text-secondary) tabular-nums">
                      {o.articleCount}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {recentArticles.length > 0 && (
          <>
            <hr className="border-0 border-t border-(--border) my-10" />
            <section className="mb-12">
              <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-5">
                {COPY.term.recentLabel}
              </p>
              <ul className="space-y-0">
                {recentArticles.map((article) => (
                  <li
                    key={article.id}
                    className="border-b border-(--border-subtle) last:border-b-0 py-3.5"
                  >
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group no-underline"
                    >
                      <p className="font-heading text-[17px] leading-snug text-(--text-primary) group-hover:text-(--accent) transition-colors">
                        {article.title}
                      </p>
                      <p className="font-body text-meta text-(--text-tertiary) mt-1.5 flex items-center gap-3 flex-wrap">
                        <span>{article.sourceName}</span>
                        <span className="opacity-30">·</span>
                        <span>{timeAgo(article.publishedDate)}</span>
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/** Bare host for the citation line — "law.cornell.edu", not the full URL. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
