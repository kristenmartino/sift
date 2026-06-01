import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import { PartyTag } from "@/components/primitives";
import {
  formatBillIdDisplay,
  formatBillStatusLabel,
  formatLobbyingUsd,
} from "@/lib/bill";
import { COPY } from "@/lib/copy";
import type { BillProfile, PoliticianProfile } from "@/lib/types";

interface BillDossierProps {
  bill: BillProfile;
  /**
   * Resolved politician profile for the bill's sponsor. Null when the
   * sponsor's bioguide isn't curated yet — the dossier falls back to
   * rendering the bioguide_id as plain text in that case.
   */
  sponsor: PoliticianProfile | null;
}

/**
 * Server-rendered bill dossier — civic-literacy MVP Phase 3.E.
 *
 * Mirrors the editorial register of the outlet, politician, and org
 * dossiers. The headline civic-literacy reveal here is the lobbying-
 * spend split: when OpenSecrets has aggregate For-vs-Against dollar
 * amounts, the dossier renders them as a 2-column grid so readers see
 * which side of the bill the money was on.
 */
export default function BillDossier({ bill, sponsor }: BillDossierProps) {
  const c = COPY.billDossier;
  const displayId = formatBillIdDisplay(bill.billId);
  const statusLabel = formatBillStatusLabel(bill.status);
  const lobbyingForLabel = formatLobbyingUsd(bill.lobbyingForUsd);
  const lobbyingAgainstLabel = formatLobbyingUsd(bill.lobbyingAgainstUsd);
  const hasLobbying = lobbyingForLabel || lobbyingAgainstLabel;

  // External-link entries in stable display order.
  const linkOrder: Array<keyof typeof c.externalLinkLabels> = [
    "govtrack",
    "congress",
    "opensecrets",
  ];
  const externalLinkEntries = linkOrder
    .map((key) => {
      const url = bill.externalLinks[key];
      return url ? { key, url, label: c.externalLinkLabels[key] } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  for (const [key, url] of Object.entries(bill.externalLinks)) {
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
            {bill.shortTitle ?? displayId}
          </h1>
          <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
            {bill.shortTitle ? `${displayId} · ` : ""}
            {bill.title}
          </p>
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Status — Fraunces 26 display */}
        {statusLabel && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.status}
            </p>
            <p className="font-heading text-[26px] font-semibold text-(--text-primary) leading-tight">
              {statusLabel}
            </p>
            {bill.introducedDate && (
              <p className="font-body text-meta text-(--text-tertiary) mt-1.5">
                {c.sections.introducedDate}: {bill.introducedDate}
              </p>
            )}
          </section>
        )}

        {/* Sponsor — linked to politician dossier when bioguide is curated */}
        {(sponsor || bill.sponsorBioguide) && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.sponsor}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed">
              {sponsor ? (
                <span className="inline-flex items-center gap-x-2 flex-wrap">
                  <Link
                    href={`/politician/${sponsor.bioguideId}`}
                    className="text-(--text-primary) no-underline hover:underline hover:text-(--accent) font-semibold"
                  >
                    {sponsor.name}
                  </Link>
                  {sponsor.party && <PartyTag party={sponsor.party} />}
                  {sponsor.state && (
                    <span className="text-(--text-tertiary)">
                      {sponsor.state}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-(--text-primary) font-mono text-[14px]">
                  {bill.sponsorBioguide}
                </span>
              )}
            </p>
          </section>
        )}

        {/* Cosponsors — count only; full list lives at GovTrack */}
        {bill.cosponsors.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.cosponsors}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed">
              {c.cosponsorCount(bill.cosponsors.length)}
              {bill.externalLinks.govtrack && (
                <>
                  {" — "}
                  <a
                    href={bill.externalLinks.govtrack}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
                  >
                    full list on GovTrack <span aria-hidden>↗</span>
                  </a>
                </>
              )}
            </p>
          </section>
        )}

        {/* Lobbying spend — for vs against. The civic-literacy headline
            reveal: when populated, this shows readers who's putting money
            behind which side of the bill. */}
        {hasLobbying && (
          <section className="mb-12">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.lobbying}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {lobbyingForLabel && (
                <div>
                  <p className="font-body text-outlet uppercase tracking-wider text-(--text-tertiary) mb-1.5">
                    {c.lobbyingFor}
                  </p>
                  <p className="font-heading text-[26px] font-semibold text-(--text-primary) tabular-nums leading-tight">
                    {lobbyingForLabel}
                  </p>
                </div>
              )}
              {lobbyingAgainstLabel && (
                <div>
                  <p className="font-body text-outlet uppercase tracking-wider text-(--text-tertiary) mb-1.5">
                    {c.lobbyingAgainst}
                  </p>
                  <p className="font-heading text-[26px] font-semibold text-(--text-primary) tabular-nums leading-tight">
                    {lobbyingAgainstLabel}
                  </p>
                </div>
              )}
            </div>
            {bill.externalLinks.opensecrets && (
              <p className="font-body text-meta text-(--text-tertiary) mt-3">
                <a
                  href={bill.externalLinks.opensecrets}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
                >
                  Source: OpenSecrets <span aria-hidden>↗</span>
                </a>
              </p>
            )}
          </section>
        )}

        {/* External links */}
        {externalLinkEntries.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.links}
            </p>
            <ul className="space-y-2.5">
              {externalLinkEntries.map(({ key, url, label }) => (
                // Stacked label-above-link on mobile; side-by-side on md+.
                // The 200px fixed label column makes long URLs unreadable
                // at 375px (only ~100px left for the URL after padding +
                // gap), so on mobile we let the URL get the full width
                // and put the small-caps label on its own line above.
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

        {/* Free-form notes */}
        {bill.notes && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.notes}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[60ch] italic">
              {bill.notes}
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
      </main>
    </div>
  );
}
