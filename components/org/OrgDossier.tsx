import Link from "next/link";

import CorrectionPath from "@/components/CorrectionPath";
import LandingMasthead from "@/components/landing/LandingMasthead";
import ShareActions from "@/components/ShareActions";
import { COPY } from "@/lib/copy";
import {
  formatBudgetUsd,
  formatOrgTypeLabel,
} from "@/lib/org";
import type { OrgFundingEdges, OrgProfile } from "@/lib/types";

interface OrgDossierProps {
  org: OrgProfile;
  /** Filed edges to other orgs, already gated to the publishable set. */
  funding?: OrgFundingEdges;
}

const NO_FUNDING: OrgFundingEdges = {
  grants: [],
  related: [],
  heldForReview: 0,
  heldEinAbsent: 0,
  fiscalPeriods: [],
};

/** "202412" -> "the year ending December 2024". */
function formatFiscalPeriod(period: string | undefined): string {
  if (!period || period.length !== 6) return "that year";
  const year = period.slice(0, 4);
  const month = Number(period.slice(4, 6));
  const name = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][month - 1];
  return name ? `the year ending ${name} ${year}` : `fiscal ${year}`;
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
export default function OrgDossier({
  org,
  funding = NO_FUNDING,
}: OrgDossierProps) {
  const c = COPY.orgDossier;
  const fc = c.fundingEdges;
  const grantTotal = funding.grants.reduce((sum, e) => sum + (e.amountUsd ?? 0), 0);
  const typeLabel = formatOrgTypeLabel(org.type);
  const budgetLabel = formatBudgetUsd(org.annualBudgetUsd);

  // Lede bits: "{type} · Founded {year} · Annual budget ~{budget}"
  // Political lean is its own section heading below; not in the lede.
  const ledeBits: string[] = [];
  if (typeLabel) ledeBits.push(typeLabel);
  if (org.foundedYear) ledeBits.push(c.foundedYearLabel(org.foundedYear));
  // Source is required here as well as on the citation line below. lib/org.ts
  // already nulls the whole triple unless usd + fy + source are all present,
  // so this is defense in depth against a profile built by another path —
  // the lede must never be the one place an uncited figure gets through.
  if (budgetLabel && org.annualBudgetFy && org.annualBudgetSource)
    ledeBits.push(
      c.annualBudgetLabel(budgetLabel, org.annualBudgetFy, org.annualBudgetKind),
    );

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
    <div className="min-h-screen bg-(--surface-base) text-(--text-primary)">
      <LandingMasthead />

      <main
        id="main-content"
        className="max-w-[800px] mx-auto px-6 pt-12 pb-24"
      >
        {/* Eyebrow + headline */}
        <header className="mb-9">
          <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3 flex items-center">
            <span
              aria-hidden
              className="inline-block w-7 h-px bg-(--border) mr-3"
            />
            {c.eyebrow}
          </p>
          <h1 className="font-heading text-[36px] md:text-[44px] font-bold leading-[1.05] tracking-tight text-(--text-primary)">
            {org.name}
          </h1>
          {ledeBits.length > 0 && (
            <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
              {ledeBits.join(" · ")}
            </p>
          )}
          {/* The budget figure is only meaningful with the filing it came
              from — lib/org.ts refuses to surface one without a source. */}
          {org.annualBudgetUsd !== null && org.annualBudgetSource && (
            <p className="font-body text-meta text-(--text-tertiary) mt-2">
              <a
                href={org.annualBudgetSource}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
              >
                {c.budgetSourceLabel(org.annualBudgetKind)} <span aria-hidden>↗</span>
              </a>
            </p>
          )}
          <ShareActions
            citeEntry={`${org.name} — Org dossier`}
            citeSources={[
              org.externalLinks.propublica ? "ProPublica Nonprofit Explorer" : null,
              org.externalLinks.irs_990 ? "IRS Form 990" : null,
              org.externalLinks.fara ? "FARA" : null,
            ].filter((s): s is string => s !== null)}
          />
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* In its own words — replaces the Sift-assigned political_lean
            (migration 012). The quote is the organization's, not Sift's, and
            it renders only with the source it came from: lib/org.ts nulls the
            pair otherwise, so an uncited characterization cannot reach the
            page. The label does the load-bearing work — a reader must not
            mistake a self-description for an independent assessment. */}
        {org.selfDescription && org.selfDescriptionSource && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.selfDescription}
            </p>
            <blockquote className="font-heading text-[22px] text-(--text-primary) leading-snug max-w-[60ch] border-l-2 border-(--accent) pl-4">
              &ldquo;{org.selfDescription}&rdquo;
            </blockquote>
            <p className="font-body text-meta text-(--text-tertiary) mt-3">
              <a
                href={org.selfDescriptionSource}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
              >
                {c.selfDescriptionCitation(org.selfDescriptionChecked)}{" "}
                <span aria-hidden>↗</span>
              </a>
            </p>
            <p className="font-body text-meta text-(--text-tertiary) mt-2 max-w-[60ch] leading-relaxed">
              {c.selfDescriptionCaveat}
            </p>
          </section>
        )}

        {/* Agencies: statutory governance facts instead of a lean. Same
            citation rule. */}
        {org.governanceStructure && org.governanceSource && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.governance}
            </p>
            <p className="font-body text-[16px] text-(--text-secondary) leading-relaxed max-w-[60ch]">
              {org.governanceStructure}
            </p>
            <p className="font-body text-meta text-(--text-tertiary) mt-3">
              <a
                href={org.governanceSource}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
              >
                Source: statute / agency record <span aria-hidden>↗</span>
              </a>
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
            <p className="font-heading text-[20px] font-semibold text-(--text-primary) leading-snug mb-3">
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
                className="font-body text-meta text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
              >
                Source: FARA filings (justice.gov) <span aria-hidden>↗</span>
              </a>
            )}
          </section>
        )}

        {/* Major funders */}
        {org.majorFunders.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
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
            <p className="font-body text-meta text-(--text-tertiary) mt-3 max-w-[60ch] leading-relaxed">
              {c.fundersProvenance}
            </p>
            {org.externalLinks.propublica && (
              <p className="font-body text-meta text-(--text-tertiary) mt-2">
                {c.fundersFinancialsNote}{" "}
                <a
                  href={org.externalLinks.propublica}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
                >
                  ProPublica Nonprofit Explorer (latest 990){" "}
                  <span aria-hidden>↗</span>
                </a>
              </p>
            )}
          </section>
        )}

        {/* Grants paid — filed edges to other organizations (sift-api
            migration 027). Only rows whose EIN and filed name agree with
            the IRS record render; the rest are counted, not dropped. */}
        {funding.grants.length > 0 && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.grantsPaid}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[60ch] mb-4">
              {fc.grantsIntro(
                funding.grants.length,
                formatBudgetUsd(grantTotal) ?? `$${grantTotal.toLocaleString()}`,
                formatFiscalPeriod(funding.fiscalPeriods[0]),
              )}
            </p>
            <ul className="space-y-2.5 mb-3">
              {funding.grants.map((edge) => (
                <li
                  key={`${edge.targetEin}-${edge.amountUsd}-${edge.purpose}`}
                  className="flex flex-col gap-y-1 md:grid md:grid-cols-[1fr_auto] md:gap-x-6 md:items-baseline border-b border-(--border-subtle) pb-2.5"
                >
                  <span className="font-body text-[15px] text-(--text-secondary) leading-snug">
                    {edge.targetNameAsFiled}
                    {edge.purpose && (
                      <span className="block font-body text-meta text-(--text-tertiary) mt-0.5">
                        {edge.purpose}
                      </span>
                    )}
                  </span>
                  <span className="font-body text-[15px] text-(--text-primary) tabular-nums md:text-right shrink-0">
                    {edge.amountUsd !== null
                      ? formatBudgetUsd(edge.amountUsd)
                      : fc.amountUnknown}
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-body text-meta text-(--text-tertiary) max-w-[60ch] leading-relaxed">
              {fc.inboundNote}
            </p>
          </section>
        )}

        {/* Related organizations — Schedule R Part II. A declared
            relationship, carrying its own EIN and exempt code. Neutral ink:
            a c4 affiliate is a filed fact, not a characterization. */}
        {funding.related.length > 0 && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.relatedOrgs}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[60ch] mb-4">
              {fc.relatedIntro}
            </p>
            <ul className="space-y-2.5">
              {funding.related.map((edge) => (
                <li
                  key={edge.targetEin}
                  className="flex flex-col gap-y-1 md:grid md:grid-cols-[1fr_auto] md:gap-x-6 md:items-baseline border-b border-(--border-subtle) pb-2.5"
                >
                  <span className="font-body text-[15px] text-(--text-secondary)">
                    {edge.targetNameAsFiled}
                    {edge.purpose && (
                      <span className="block font-body text-meta text-(--text-tertiary) mt-0.5">
                        {edge.purpose}
                      </span>
                    )}
                  </span>
                  <span className="font-body text-outlet uppercase tracking-wider text-(--text-tertiary) shrink-0">
                    {edge.exemptCode}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* The verdict gate, said out loud. Rendering the count is the
            point: a page that silently dropped mismatched rows would be
            the failure the check exists to prevent. */}
        {(funding.heldForReview > 0 || funding.heldEinAbsent > 0) &&
          (funding.grants.length > 0 || funding.related.length > 0) && (
            <div className="max-w-[60ch] mb-12 -mt-6 space-y-1.5">
              {funding.heldForReview > 0 && (
                <p className="font-body text-meta text-(--text-tertiary) leading-relaxed">
                  {fc.heldReviewNote(funding.heldForReview)}
                </p>
              )}
              {funding.heldEinAbsent > 0 && (
                <p className="font-body text-meta text-(--text-tertiary) leading-relaxed">
                  {fc.heldUnmatchedNote(funding.heldEinAbsent)}
                </p>
              )}
            </div>
          )}

        {/* External links — public-record citations */}
        {externalLinkEntries.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
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
                  <span className="font-body text-outlet uppercase tracking-wider text-(--text-tertiary)">
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
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
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
            className="font-body text-meta text-(--text-tertiary) italic no-underline hover:text-(--accent) hover:not-italic transition-colors"
          >
            {c.methodologyHint}
          </Link>
        </div>
        <CorrectionPath />

      </main>
    </div>
  );
}
