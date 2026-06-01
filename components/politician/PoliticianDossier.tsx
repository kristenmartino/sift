import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import { PartyTag } from "@/components/primitives";
import { COPY } from "@/lib/copy";
import { formatPoliticianLede } from "@/lib/politician";
import type { PoliticianProfile } from "@/lib/types";
import { formatUsdCompact } from "@/lib/utils";

interface PoliticianDossierProps {
  politician: PoliticianProfile;
}

/**
 * Server-rendered politician dossier — civic-literacy MVP Phase 3.C.
 *
 * Mirrors the editorial visual register of `OutletDossier` and
 * `/colophon`: kicker eyebrows, hairline rules, mono labels, Fraunces
 * display type, max-width 800. Outlet data was the proof; this is the
 * ambitious extension into politicians.
 *
 * Sections render conditionally based on populated data — Phase 3.A's
 * sample seed has committees + external_links + notes for the curated
 * 8 members, but `top_industries_current_cycle` and
 * `interest_group_ratings` are empty until sift-api Phase 3.E enrichment
 * runs (OpenSecrets daily refresh + Vote Smart batch). When both are
 * empty, a single "not yet enriched" caption explains the absence.
 */
export default function PoliticianDossier({
  politician,
}: PoliticianDossierProps) {
  const c = COPY.politicianDossier;
  const lede = formatPoliticianLede(
    politician.chamber,
    politician.party,
    politician.state,
  );

  // Stable display order for external links. Govt records first
  // (GovTrack, OpenSecrets, Vote Smart), then encyclopedia refs.
  const linkOrder: Array<keyof typeof c.externalLinkLabels> = [
    "govtrack",
    "opensecrets",
    "votesmart",
    "ballotpedia",
    "wikipedia",
  ];
  const externalLinkEntries = linkOrder
    .map((key) => {
      const url = politician.externalLinks[key];
      return url ? { key, url, label: c.externalLinkLabels[key] } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  // Forward-compat: include any keys not in our pre-labeled list.
  for (const [key, url] of Object.entries(politician.externalLinks)) {
    if (!linkOrder.includes(key as typeof linkOrder[number]) && url) {
      externalLinkEntries.push({
        key,
        url,
        label: c.externalLinkLabels[key] ?? key,
      });
    }
  }

  const ratingsEntries = Object.entries(politician.interestGroupRatings);
  const industriesEmpty = politician.topIndustriesCurrentCycle.length === 0;
  const ratingsEmpty = ratingsEntries.length === 0;
  const showNotYetEnriched = industriesEmpty && ratingsEmpty;

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
            {politician.name}
          </h1>
          {(lede || politician.party) && (
            <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
              {politician.party && (
                <PartyTag party={politician.party} className="mr-2 align-middle" />
              )}
              {lede}
            </p>
          )}
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Committees */}
        {politician.committees.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.committees}
            </p>
            <ul className="space-y-1.5">
              {politician.committees.map((committee) => (
                <li
                  key={committee}
                  className="font-body text-[15px] text-(--text-secondary) leading-relaxed"
                >
                  {committee}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Top industries by PAC contributions (2022 cycle, from OpenSecrets bulk) */}
        {!industriesEmpty && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.topIndustries}
            </p>
            <ul className="space-y-2">
              {politician.topIndustriesCurrentCycle.map((entry) => (
                <li
                  key={entry.industry}
                  className="grid grid-cols-[1fr_auto] gap-x-6 items-baseline border-b border-(--border-subtle) pb-2"
                >
                  <span className="font-body text-[15px] text-(--text-secondary)">
                    {entry.industry}
                  </span>
                  {entry.amount_usd != null && (
                    <span className="font-mono text-[13px] tabular-nums text-(--text-tertiary)">
                      {formatUsdCompact(entry.amount_usd)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Interest-group ratings */}
        {!ratingsEmpty && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.interestGroupRatings}
            </p>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
              {ratingsEntries.map(([group, rating]) => (
                <li
                  key={group}
                  className="grid grid-cols-[1fr_auto] gap-x-3 items-baseline border-b border-(--border-subtle) pb-1.5"
                >
                  <span className="font-body text-outlet uppercase tracking-wider text-(--text-tertiary)">
                    {group}
                  </span>
                  <span className="font-mono text-[13px] tabular-nums text-(--text-secondary)">
                    {typeof rating === "number" ? `${rating}%` : rating}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* "Not yet enriched" caption when both donor + rating sections
            absent — common case before sift-api Phase 3.E refresh runs. */}
        {showNotYetEnriched && (
          <section className="mb-10">
            <p className="font-body text-[14px] text-(--text-tertiary) italic max-w-[60ch] leading-relaxed">
              {c.notYetEnriched}
            </p>
          </section>
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
                // stack on mobile so long URLs aren't crammed into the
                // narrow value column at 375px.
                <li
                  key={key}
                  className="flex flex-col gap-y-1 md:grid md:grid-cols-[160px_1fr] md:gap-y-0 md:gap-x-6 md:items-baseline border-b border-(--border-subtle) pb-2.5"
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
        {politician.notes && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.notes}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[60ch] italic">
              {politician.notes}
            </p>
          </section>
        )}

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Footer: methodology hint placeholder + back link */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="font-body text-outlet uppercase tracking-wider text-(--text-secondary) hover:text-(--accent) transition-colors no-underline inline-flex items-center gap-1.5"
          >
            <span aria-hidden>←</span> Back to Sift
          </Link>
          {/* Methodology link goes live with Phase 2.D (PR #79). Until that
              merges, render the hint as plain text rather than a 404 link. */}
          <span className="font-body text-meta text-(--text-tertiary) italic">
            {c.methodologyHint}
          </span>
        </div>
      </main>
    </div>
  );
}
