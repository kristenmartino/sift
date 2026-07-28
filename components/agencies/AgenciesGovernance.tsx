import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import { partisanCap, sortAgencies, sourceLabel } from "@/lib/agencies";
import { COPY } from "@/lib/copy";
import type { AgencyGovernance } from "@/lib/types";

interface AgenciesGovernanceProps {
  agencies: AgencyGovernance[];
  /** Total agency dossiers held, cited or not — for the honest gap note. */
  totalAgencies: number;
}

/**
 * /agencies — statutory governance for the agencies whose law has been cited.
 *
 * Deliberately narrow. No AI text, no ratings, no auth, no comparison. Every
 * claim is a statutory fact with a link to the section it came from, so the
 * page carries none of the exposure the rest of the product does: no
 * Cohere/Meltwater question, no Art. 50(4) disclosure obligation, no
 * AllSides/MBFC licence dependency, and no news-avoidance problem — this is
 * reference, not news.
 *
 * Mirrors the dossier pages' visual register (eyebrow, hairline rules, mono
 * labels, Fraunces display, max-w-800) rather than inventing a layout.
 */
export default function AgenciesGovernance({
  agencies,
  totalAgencies,
}: AgenciesGovernanceProps) {
  const c = COPY.agencies;
  const sorted = sortAgencies(agencies);
  const cappedCount = sorted.filter((a) => a.hasPartisanBalanceCap).length;

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
          {sorted.length > 0 && (
            <p className="font-body text-meta uppercase text-(--text-tertiary) mt-4 tracking-wide">
              {c.countLine(sorted.length)}
            </p>
          )}
        </header>

        <hr className="border-0 border-t border-(--border) mb-10" />

        {sorted.length === 0 ? (
          <p className="font-body text-[15px] text-(--text-tertiary) italic leading-relaxed">
            {c.empty}
          </p>
        ) : (
          <>
            {/* The finding, before the list. A reader who stops here should
                still leave with the one fact that makes the page worth
                sending on. */}
            {cappedCount > 0 && (
              <section className="mb-12 border-l-2 border-(--accent) pl-5">
                <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
                  {c.capExplainerHeading}
                </p>
                <p className="font-body text-[16px] text-(--text-secondary) leading-relaxed max-w-[62ch]">
                  {c.capExplainer(cappedCount, sorted.length)}
                </p>
              </section>
            )}

            <ul className="space-y-10">
              {sorted.map((agency) => (
                <li key={agency.slug}>
                  <article>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-2">
                      <h2 className="font-heading text-[22px] font-semibold leading-snug tracking-tight text-(--text-primary)">
                        <Link
                          href={`/org/${agency.slug}`}
                          className="text-(--text-primary) no-underline hover:underline"
                        >
                          {agency.name}
                        </Link>
                      </h2>
                      {agency.hasPartisanBalanceCap &&
                        (() => {
                          // Prefer the concrete numbers; fall back only when
                          // the statute can't be read confidently.
                          const cap = partisanCap(agency.governanceStructure);
                          return (
                            <span className="font-body text-meta uppercase tracking-wide text-(--accent) border border-(--accent) rounded-sm px-2 py-0.5 whitespace-nowrap">
                              {cap
                                ? c.capLabel(cap.cap, cap.total)
                                : c.capLabelFallback}
                            </span>
                          );
                        })()}
                    </div>

                    <p className="font-body text-[16px] text-(--text-secondary) leading-relaxed max-w-[62ch]">
                      {agency.governanceStructure}
                    </p>

                    <p className="font-body text-meta text-(--text-tertiary) mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      <a
                        href={agency.governanceSource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
                      >
                        {c.sourcePrefix} {sourceLabel(agency.governanceSource)}{" "}
                        <span aria-hidden>↗</span>
                      </a>
                      <Link
                        href={`/org/${agency.slug}`}
                        className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
                      >
                        {c.dossierLink} →
                      </Link>
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </>
        )}

        <hr className="border-0 border-t border-(--border) my-12" />

        {/* Provenance and the gap. Stating what is missing is the point:
            omitting 78 agencies is a choice, and a reader who can see the
            choice can trust the 15 that are here. */}
        <section className="mb-8">
          <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
            {c.provenanceHeading}
          </p>
          <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[62ch] mb-4">
            {c.provenance}
          </p>
          <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[62ch]">
            {c.notAiNote}
          </p>
        </section>

        {totalAgencies > sorted.length && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.incompleteHeading}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[62ch]">
              {c.incomplete(sorted.length, totalAgencies)}
            </p>
          </section>
        )}

        <Link
          href="/"
          className="font-body text-meta text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
        >
          <span aria-hidden>←</span> {c.backLink}
        </Link>
      </main>
    </div>
  );
}
