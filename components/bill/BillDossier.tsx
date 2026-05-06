import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <LandingMasthead />

      <main
        id="main-content"
        className="max-w-[800px] mx-auto px-6 pt-12 pb-24"
      >
        {/* Eyebrow + headline */}
        <header className="mb-9">
          <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-3 flex items-center">
            <span
              aria-hidden
              className="inline-block w-7 h-px bg-[var(--border)] mr-3"
            />
            {c.eyebrow}
          </p>
          <h1 className="font-heading text-[36px] md:text-[44px] font-bold leading-[1.05] tracking-tight text-[var(--text)]">
            {bill.shortTitle ?? displayId}
          </h1>
          <p className="font-body text-[16px] text-[var(--text-secondary)] mt-3 max-w-[60ch] leading-relaxed">
            {bill.shortTitle ? `${displayId} · ` : ""}
            {bill.title}
          </p>
        </header>

        <hr className="border-0 border-t border-[var(--border)] my-10" />

        {/* Status — Fraunces 26 display */}
        {statusLabel && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-3">
              {c.sections.status}
            </p>
            <p className="font-heading text-[26px] font-semibold text-[var(--text)] leading-tight">
              {statusLabel}
            </p>
            {bill.introducedDate && (
              <p className="font-body text-meta text-[var(--text-muted)] mt-1.5">
                {c.sections.introducedDate}: {bill.introducedDate}
              </p>
            )}
          </section>
        )}

        {/* Sponsor — linked to politician dossier when bioguide is curated */}
        {(sponsor || bill.sponsorBioguide) && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-3">
              {c.sections.sponsor}
            </p>
            <p className="font-body text-[15px] text-[var(--text-secondary)] leading-relaxed">
              {sponsor ? (
                <Link
                  href={`/politician/${sponsor.bioguideId}`}
                  className="text-[var(--text)] no-underline hover:underline hover:text-[var(--accent)] font-semibold"
                >
                  {sponsor.name}
                  {sponsor.party && sponsor.state
                    ? ` (${sponsor.party}-${sponsor.state})`
                    : ""}
                </Link>
              ) : (
                <span className="text-[var(--text)] font-mono text-[14px]">
                  {bill.sponsorBioguide}
                </span>
              )}
            </p>
          </section>
        )}

        {/* Cosponsors — count only; full list lives at GovTrack */}
        {bill.cosponsors.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-3">
              {c.sections.cosponsors}
            </p>
            <p className="font-body text-[15px] text-[var(--text-secondary)] leading-relaxed">
              {c.cosponsorCount(bill.cosponsors.length)}
              {bill.externalLinks.govtrack && (
                <>
                  {" — "}
                  <a
                    href={bill.externalLinks.govtrack}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] no-underline hover:underline hover:text-[var(--accent)]"
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
            <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-3">
              {c.sections.lobbying}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {lobbyingForLabel && (
                <div>
                  <p className="font-body text-outlet uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    {c.lobbyingFor}
                  </p>
                  <p className="font-heading text-[26px] font-semibold text-[var(--text)] tabular-nums leading-tight">
                    {lobbyingForLabel}
                  </p>
                </div>
              )}
              {lobbyingAgainstLabel && (
                <div>
                  <p className="font-body text-outlet uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    {c.lobbyingAgainst}
                  </p>
                  <p className="font-heading text-[26px] font-semibold text-[var(--text)] tabular-nums leading-tight">
                    {lobbyingAgainstLabel}
                  </p>
                </div>
              )}
            </div>
            {bill.externalLinks.opensecrets && (
              <p className="font-body text-meta text-[var(--text-muted)] mt-3">
                <a
                  href={bill.externalLinks.opensecrets}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] no-underline hover:underline hover:text-[var(--accent)]"
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
            <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-3">
              {c.sections.links}
            </p>
            <ul className="space-y-2.5">
              {externalLinkEntries.map(({ key, url, label }) => (
                <li
                  key={key}
                  className="grid grid-cols-[200px_1fr] gap-x-6 items-baseline border-b border-[var(--border-subtle)] pb-2.5"
                >
                  <span className="font-body text-outlet uppercase tracking-wider text-[var(--text-muted)]">
                    {label}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-[14px] text-[var(--text-secondary)] no-underline hover:underline hover:text-[var(--accent)] truncate"
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
            <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-3">
              {c.sections.notes}
            </p>
            <p className="font-body text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-[60ch] italic">
              {bill.notes}
            </p>
          </section>
        )}

        <hr className="border-0 border-t border-[var(--border)] my-10" />

        {/* Footer: methodology link + back to Sift */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="font-body text-outlet uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline inline-flex items-center gap-1.5"
          >
            <span aria-hidden>←</span> Back to Sift
          </Link>
          <Link
            href="/methodology"
            className="font-body text-meta text-[var(--text-muted)] italic no-underline hover:text-[var(--accent)] hover:not-italic transition-colors"
          >
            {c.methodologyHint}
          </Link>
        </div>
      </main>
    </div>
  );
}
