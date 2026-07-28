import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import { sourceLabel } from "@/lib/agencies";
import { COPY } from "@/lib/copy";
import { sortSelfDescribed } from "@/lib/thinkTanks";
import type { SelfDescribedOrg } from "@/lib/types";

interface SelfDescriptionsProps {
  orgs: SelfDescribedOrg[];
}

/**
 * /think-tanks — policy organizations in their own words.
 *
 * The quote is the page. Everything else is scaffolding around it: a source
 * link, a verification date, and two public-record facts (FARA registration,
 * the org type). Sift assigns nothing here — which is the point, and the
 * reason this replaced the Sift-authored `political_lean` on these rows.
 *
 * Same posture as /agencies: no AI text, no ratings, no auth, no comparison.
 * Reference rather than news.
 */
export default function SelfDescriptions({ orgs }: SelfDescriptionsProps) {
  const c = COPY.thinkTanks;
  const sorted = sortSelfDescribed(orgs);
  const claiming = sorted.filter((o) => o.claimsNonPartisanship).length;

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
            {/* The observation, before the quotes. Deliberately stops short of
                calling it a contradiction — party and ideology are different
                things, and the reader has both halves right below. */}
            {claiming > 0 && (
              <section className="mb-12 border-l-2 border-(--accent) pl-5">
                <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
                  {c.findingHeading}
                </p>
                <p className="font-body text-[16px] text-(--text-secondary) leading-relaxed max-w-[62ch]">
                  {c.finding(claiming, sorted.length)}
                </p>
              </section>
            )}

            <ul className="space-y-12">
              {sorted.map((org) => (
                <li key={org.slug}>
                  <article>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-3">
                      <h2 className="font-heading text-[22px] font-semibold leading-snug tracking-tight text-(--text-primary)">
                        <Link
                          href={`/org/${org.slug}`}
                          className="text-(--text-primary) no-underline hover:underline"
                        >
                          {org.name}
                        </Link>
                      </h2>
                      {org.claimsNonPartisanship && (
                        <span className="font-body text-meta uppercase tracking-wide text-(--accent) border border-(--accent) rounded-sm px-2 py-0.5 whitespace-nowrap">
                          {c.nonPartisanBadge}
                        </span>
                      )}
                      {org.faraRegistered && (
                        <span className="font-body text-meta uppercase tracking-wide text-(--text-tertiary) border border-(--border) rounded-sm px-2 py-0.5">
                          {c.faraBadge(org.faraCountries)}
                        </span>
                      )}
                    </div>

                    {/* The quote is the content. Given display weight so it
                        reads as theirs, not as Sift's prose about them. */}
                    <blockquote className="font-heading text-[20px] text-(--text-primary) leading-snug max-w-[60ch] border-l-2 border-(--border) pl-4">
                      &ldquo;{org.selfDescription}&rdquo;
                    </blockquote>

                    <p className="font-body text-meta text-(--text-tertiary) mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      <a
                        href={org.selfDescriptionSource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
                      >
                        {c.sourcePrefix} {sourceLabel(org.selfDescriptionSource)}
                        {org.selfDescriptionChecked
                          ? ` · ${c.checkedPrefix} ${org.selfDescriptionChecked}`
                          : ""}{" "}
                        <span aria-hidden>↗</span>
                      </a>
                      <Link
                        href={`/org/${org.slug}`}
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

        <section className="mb-10">
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
