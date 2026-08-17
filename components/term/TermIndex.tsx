import Link from "next/link";

import CorrectionPath from "@/components/CorrectionPath";
import LandingMasthead from "@/components/landing/LandingMasthead";
import { COPY } from "@/lib/copy";
import type { TermListItem } from "@/lib/types";

interface TermIndexProps {
  terms: TermListItem[];
  /** Terms defined but below the floor — for the honest gap note. */
  heldCount: number;
}

/** Section headings for `term_profiles.category`. */
const CATEGORY_LABELS: Record<string, string> = {
  congress: "Congress",
  courts: "Courts",
  executive: "The executive",
  elections: "Elections",
  constitution: "Constitution",
  immigration: "Immigration",
  "first-amendment": "Speech and the press",
  business: "Business and markets",
};

/** Stable order — the branches first, then the areas they act on. */
const CATEGORY_ORDER = [
  "constitution",
  "congress",
  "executive",
  "courts",
  "elections",
  "first-amendment",
  "immigration",
  "business",
];

function categoryRank(c: string | null): number {
  const i = CATEGORY_ORDER.indexOf(c ?? "");
  // Unknown or uncategorised sorts last rather than disappearing — a term
  // added with a new category still shows up, under its own raw label.
  return i === -1 ? CATEGORY_ORDER.length : i;
}

/**
 * `/glossary` — the index over `/term/<slug>`.
 *
 * Lives in components/term/ beside TermDossier rather than in
 * components/glossary/, which belongs to the inline entity-chip layer.
 *
 * Named `/glossary` rather than `/terms` for two reasons: `/terms` is the
 * Terms of Service, and `/agencies` and `/think-tanks` already establish that
 * a collection page takes a plain-English name rather than the route segment
 * its children live under.
 *
 * The page leads with a finding rather than the list, following `/agencies`:
 * a reader who stops after the first screen should still leave with the one
 * fact that makes it worth sending on. Here that fact is that roughly one
 * story in five turns on a term the coverage never names — which is precisely
 * why a reader cannot look the term up, and so precisely why these pages
 * exist. Every number in it is computed from the live corpus.
 */
export default function TermIndex({ terms, heldCount }: TermIndexProps) {
  const c = COPY.termIndex;

  const totalArticles = terms.reduce((n, t) => n + t.articleCount, 0);
  const totalUnnamed = terms.reduce((n, t) => n + t.unnamedCount, 0);
  // The starkest example, for the finding sentence. Ties broken by volume so
  // the named term is one a reader plausibly recognises.
  const worst = [...terms].sort(
    (a, b) =>
      b.unnamedCount / b.articleCount - a.unnamedCount / a.articleCount ||
      b.articleCount - a.articleCount,
  )[0];

  const groups = [...new Set(terms.map((t) => t.category))]
    .sort((a, b) => categoryRank(a) - categoryRank(b))
    .map((cat) => ({
      key: cat ?? "other",
      label: cat ? (CATEGORY_LABELS[cat] ?? cat) : "Other",
      items: terms.filter((t) => t.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const gapNote = c.gapNote(terms.length, terms.length + heldCount);

  return (
    <div className="min-h-screen bg-(--surface-base) text-(--text-primary)">
      <LandingMasthead />

      <main id="main-content" className="max-w-[800px] mx-auto px-6 pt-12 pb-24">
        <header className="mb-9">
          <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3 flex items-center">
            <span aria-hidden className="inline-block w-7 h-px bg-(--border) mr-3" />
            {c.eyebrow}
          </p>
          <h1 className="font-heading text-[36px] md:text-[44px] font-bold leading-[1.05] tracking-tight text-(--text-primary)">
            {c.headline}
          </h1>
          <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[62ch] leading-relaxed">
            {c.dek}
          </p>
          <p className="font-body text-[15px] text-(--text-tertiary) mt-4 max-w-[62ch] leading-relaxed">
            {c.contextNote}
          </p>
        </header>

        <hr className="border-0 border-t border-(--border) mb-10" />

        {terms.length === 0 ? (
          <p className="font-body text-[15px] text-(--text-tertiary) italic leading-relaxed">
            {c.empty}
          </p>
        ) : (
          <>
            {/* The finding, before the list. Only rendered when there is one
                to state — a corpus where every term is named in its own
                coverage would make this paragraph a lie. */}
            {totalUnnamed > 0 && worst && (
              <section className="mb-12 border-l-2 border-(--accent) pl-5">
                <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
                  {c.findingHeading}
                </p>
                <p className="font-body text-[16px] text-(--text-secondary) leading-relaxed max-w-[62ch]">
                  {c.finding(totalUnnamed, totalArticles, worst.term)}
                </p>
              </section>
            )}

            <p className="font-body text-[14px] text-(--text-tertiary) mb-1.5 leading-relaxed">
              {c.countLabel(terms.length)}
            </p>
            {gapNote && (
              <p className="font-body text-[14px] text-(--text-tertiary) mb-8 max-w-[62ch] leading-relaxed">
                {gapNote}
              </p>
            )}

            <div className={gapNote ? "" : "mt-8"}>
              {groups.map((g) => (
                <section key={g.key} className="mb-10">
                  <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-tertiary) mb-3">
                    {g.label}
                  </p>
                  <ul className="space-y-0">
                    {g.items.map((t) => {
                      const unnamed = c.rowUnnamed(t.unnamedCount, t.articleCount);
                      return (
                        <li
                          key={t.slug}
                          className="border-b border-(--border-subtle) last:border-b-0 py-3"
                        >
                          <Link
                            href={`/term/${t.slug}`}
                            className="group no-underline flex flex-wrap items-baseline gap-x-3 gap-y-1"
                          >
                            <span className="font-heading text-[17px] text-(--text-primary) group-hover:text-(--accent) transition-colors flex-1 min-w-[160px]">
                              {t.term}
                            </span>
                            <span className="font-body text-[13px] text-(--text-tertiary) tabular-nums">
                              {c.rowCoverage(t.articleCount, t.outletCount)}
                            </span>
                            {unnamed && (
                              <span className="font-body text-[12px] text-(--text-secondary) tabular-nums">
                                {unnamed}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}

        <hr className="border-0 border-t border-(--border) my-10" />

        <CorrectionPath />

        <p className="font-body text-[14px] mt-8">
          <Link
            href="/"
            className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
          >
            {c.backLink}
          </Link>
        </p>
      </main>
    </div>
  );
}
