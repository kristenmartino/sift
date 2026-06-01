import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import { COPY } from "@/lib/copy";
import {
  formatBudgetUsd,
  formatOrgLeanLabel,
  formatOrgTypeLabel,
} from "@/lib/org";
import type { OrgProfile } from "@/lib/types";

interface OrgDossierProps {
  org: OrgProfile;
}

/**
 * Server-rendered org dossier — civic-literacy MVP Phase 3.D.
 *
 * Mirrors the editorial register of OutletDossier (2.C.1) and
 * PoliticianDossier (3.C): kicker eyebrows, hairline rules, mono labels,
 * Fraunces display type, max-w-800 single column.
 *
 * The headline disclosure is FARA. When `faraRegistered` is true, a
 * dedicated section calls out the registration with the country list,
 * cited and linkable. Symmetric across the political spectrum — same
 * panel for Brookings (Qatar) as for any other registered org.
 */
export default function OrgDossier({ org }: OrgDossierProps) {
  const c = COPY.orgDossier;
  const typeLabel = formatOrgTypeLabel(org.type);
  const leanLabel = formatOrgLeanLabel(org.politicalLean);
  const budgetLabel = formatBudgetUsd(org.annualBudgetUsd);

  // Lede bits: "{type} · Founded {year} · Annual budget ~{budget}"
  // Political lean is its own section heading below; not in the lede.
  const ledeBits: string[] = [];
  if (typeLabel) ledeBits.push(typeLabel);
  if (org.foundedYear) ledeBits.push(c.foundedYearLabel(org.foundedYear));
  if (budgetLabel) ledeBits.push(c.annualBudgetLabel(budgetLabel));

  // External links: stable order; forward-compat for unknown keys.
  const linkOrder: Array<keyof typeof c.externalLinkLabels> = [
    "propublica",
    "irs_990",
    "fara",
    "official",
    "wikipedia",
  ];
  const externalLinkEntries = linkOrder
    .map((key) => {
      const url = org.externalLinks[key];
      return url ? { key, url, label: c.externalLinkLabels[key] } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  for (const [key, url] of Object.entries(org.externalLinks)) {
    if (!linkOrder.includes(key as typeof linkOrder[number]) && url) {
      externalLinkEntries.push({
        key,
        url,
        label: c.externalLinkLabels[key] ?? key,
      });
    }
  }

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <LandingMasthead />

      <main
        id="main-content"
        className="max-w-[800px] mx-auto px-6 pt-12 pb-24"
      >
        {/* Eyebrow + headline */}
        <header className="mb-9">
          <p className="font-body text-kicker uppercase text-(--text-muted) mb-3 flex items-center">
            <span
              aria-hidden
              className="inline-block w-7 h-px bg-(--border) mr-3"
            />
            {c.eyebrow}
          </p>
          <h1 className="font-heading text-[36px] md:text-[44px] font-bold leading-[1.05] tracking-tight text-(--text)">
            {org.name}
          </h1>
          {ledeBits.length > 0 && (
            <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
              {ledeBits.join(" · ")}
            </p>
          )}
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Political lean — Fraunces display, citation muted below */}
        {leanLabel && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-muted) mb-3">
              {c.sections.politicalLean}
            </p>
            <p className="font-heading text-[26px] font-semibold text-(--text) leading-tight">
              {leanLabel}
            </p>
          </section>
        )}

        {/* FARA disclosure — headline civic-literacy reveal. Symmetric:
            same panel + tone for any registered org regardless of which
            country, with a link to FARA filings when available. */}
        {org.faraRegistered && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--accent) mb-3">
              {c.sections.fara}
            </p>
            <p className="font-heading text-[20px] font-semibold text-(--text) leading-snug mb-3">
              {c.faraRegisteredHeader}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[60ch] mb-3">
              {c.faraRegisteredBody(org.faraCountries)}
            </p>
            {org.externalLinks.fara && (
              <a
                href={org.externalLinks.fara}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-meta text-(--text-muted) no-underline hover:underline hover:text-(--accent)"
              >
                Source: FARA filings (justice.gov) <span aria-hidden>↗</span>
              </a>
            )}
          </section>
        )}

        {/* Major funders */}
        {org.majorFunders.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-muted) mb-3">
              {c.sections.majorFunders}
            </p>
            <ul className="space-y-1.5">
              {org.majorFunders.map((funder) => (
                <li
                  key={funder}
                  className="font-body text-[15px] text-(--text-secondary) leading-relaxed"
                >
                  {funder}
                </li>
              ))}
            </ul>
            {org.externalLinks.propublica && (
              <p className="font-body text-meta text-(--text-muted) mt-3">
                <a
                  href={org.externalLinks.propublica}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--text-muted) no-underline hover:underline hover:text-(--accent)"
                >
                  Source: ProPublica Nonprofit Explorer (latest 990){" "}
                  <span aria-hidden>↗</span>
                </a>
              </p>
            )}
          </section>
        )}

        {/* External links — public-record citations */}
        {externalLinkEntries.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-muted) mb-3">
              {c.sections.links}
            </p>
            <ul className="space-y-2.5">
              {externalLinkEntries.map(({ key, url, label }) => (
                // See BillDossier for the same pattern + rationale —
                // stack on mobile so long URLs aren't crammed into ~100px.
                <li
                  key={key}
                  className="flex flex-col gap-y-1 md:grid md:grid-cols-[200px_1fr] md:gap-y-0 md:gap-x-6 md:items-baseline border-b border-(--border-subtle) pb-2.5"
                >
                  <span className="font-body text-outlet uppercase tracking-wider text-(--text-muted)">
                    {label}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-[14px] text-(--text-secondary) no-underline hover:underline hover:text-(--accent) truncate"
                  >
                    {url} <span aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Free-form notes (curator commentary) */}
        {org.notes && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-muted) mb-3">
              {c.sections.notes}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[60ch] italic">
              {org.notes}
            </p>
          </section>
        )}

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Footer: methodology link + back to Sift */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="font-body text-outlet uppercase tracking-wider text-(--text-secondary) hover:text-(--accent) transition-colors no-underline inline-flex items-center gap-1.5"
          >
            <span aria-hidden>←</span> Back to Sift
          </Link>
          <Link
            href="/methodology"
            className="font-body text-meta text-(--text-muted) italic no-underline hover:text-(--accent) hover:not-italic transition-colors"
          >
            {c.methodologyHint}
          </Link>
        </div>
      </main>
    </div>
  );
}
