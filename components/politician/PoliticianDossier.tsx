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
 * One fact from a public record, printed next to a link to that record.
 *
 * Renders nothing without `sourceUrl`. `OutletDossier.tsx:120` is the pattern
 * ("Source: AllSides · last verified <date>") and the reason it exists is
 * `LAUNCH_DECISION_MEMO.md` §5(e): the two dossier surfaces that rendered
 * claims with a citation *promised in a code comment* and no citation element
 * present. A component that cannot render the value without the link cannot
 * regress into that.
 */
function OfficeRow({
  label,
  value,
  sourceLabel,
  sourceUrl,
}: {
  label: string;
  value: string | null;
  sourceLabel: string;
  sourceUrl: string | null;
}) {
  if (!value || !sourceUrl) return null;
  return (
    <div className="flex flex-col gap-y-1 md:grid md:grid-cols-[190px_1fr] md:gap-y-0 md:gap-x-6 md:items-baseline border-b border-(--border-subtle) pb-2.5">
      <dt className="font-body text-outlet uppercase tracking-wider text-(--text-tertiary)">
        {label}
      </dt>
      <dd className="font-body text-[15px] text-(--text-secondary) leading-relaxed">
        {value}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-body text-meta text-(--text-tertiary) no-underline hover:underline hover:text-(--accent) mt-0.5"
        >
          {sourceLabel} <span aria-hidden>↗</span>
        </a>
      </dd>
    </div>
  );
}

/**
 * "2021-01-22 — 2025-01-24" / "2025-01-27 — present".
 *
 * When the end date came from a successor's roll-call (`viaConfirmation`) it
 * is the date the Senate confirmed the next officeholder, which is not
 * necessarily the incumbent's last day — so the range is annotated rather
 * than printed as a bare term. Overstating it by one hop is exactly the kind
 * of small unsourced embellishment migration 015 exists to remove.
 */
function formatHeldRange(
  start: string | null,
  end: string | null,
  viaConfirmation: boolean,
): string | null {
  if (!start && !end) return null;
  if (start && end) {
    return viaConfirmation
      ? `${start} — ${end} (${COPY.politicianDossier.officeSuccessorNote})`
      : `${start} — ${end}`;
  }
  if (start) return `${start} — present`;
  return viaConfirmation
    ? `${COPY.politicianDossier.officeSuccessorNote} ${end}`
    : `until ${end}`;
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
  const role = politician.role;
  // `role.roleTitle` is only non-null when its source came with it
  // (`lib/politician.ts` drops the pair otherwise), so this whole section is
  // gated on being citable.
  const hasOffice = Boolean(role.roleTitle);
  // For an executive, "Executive branch official (R-US)" is noise next to the
  // statutory title, and for a foreign head of state `state` holds a country
  // code and `party` a national party abbreviation — "(UR-RU)" reads as
  // gibberish. Prefer the sourced title whenever there is one.
  const lede = hasOffice
    ? role.roleTitle
    : formatPoliticianLede(
        politician.chamber,
        politician.party,
        politician.state,
      );
  const showPartyTag =
    politician.party !== null && !hasOffice;

  // Stable display order for external links. Official record first, then
  // govt records (GovTrack, OpenSecrets, Vote Smart), then encyclopedia refs.
  const linkOrder: Array<keyof typeof c.externalLinkLabels> = [
    "official",
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

  const ratingsEntries = politician.interestGroupRatings;
  const industriesEmpty = politician.topIndustriesCurrentCycle.length === 0;
  const ratingsEmpty = ratingsEntries.length === 0;
  // The "not yet enriched" caption is about OpenSecrets/Vote Smart data for
  // members of Congress. An executive official has no PAC industries or
  // interest-group ratings to be missing, so showing it there would invent a
  // gap that doesn't exist.
  const showNotYetEnriched = industriesEmpty && ratingsEmpty && !hasOffice;

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
          {(lede || showPartyTag) && (
            <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
              {showPartyTag && politician.party && (
                <PartyTag party={politician.party} className="mr-2 align-middle" />
              )}
              {lede}
            </p>
          )}
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Office of record — executive / foreign-executive rows (015).
            Replaces the uncited `notes` prose these pages used to carry.
            Every row is a fact from a public record, printed beside a link
            to that record; nothing here is Sift's characterization. */}
        {hasOffice && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.office}
            </p>
            <dl className="space-y-2.5">
              <OfficeRow
                label={c.officeLabels.roleTitle}
                value={role.roleTitle}
                sourceLabel={c.officeSourceLabels.statute}
                sourceUrl={role.roleTitleSource}
              />
              {(role.roleStartDate || role.roleEndDate) && (
                <OfficeRow
                  label={c.officeLabels.held}
                  value={formatHeldRange(
                    role.roleStartDate,
                    role.roleEndDate,
                    Boolean(role.confirmationVoteUrl),
                  )}
                  sourceLabel={c.officeSourceLabels.dates}
                  sourceUrl={role.roleDatesSource}
                />
              )}
              {role.nominationDate && (
                <OfficeRow
                  label={c.officeLabels.nomination}
                  value={role.nominationDate}
                  sourceLabel={c.officeSourceLabels.nomination}
                  sourceUrl={role.nominationUrl}
                />
              )}
              {role.confirmationDate && (
                <OfficeRow
                  label={c.officeLabels.confirmation}
                  value={[role.confirmationDate, role.confirmationVoteResult]
                    .filter(Boolean)
                    .join(" · ")}
                  sourceLabel={c.officeSourceLabels.vote}
                  sourceUrl={role.confirmationVoteUrl}
                />
              )}
              {role.predecessorName && (
                // The label tracks which record backs the name. A congress.gov
                // PN states the predecessor outright; a prior roll-call only
                // shows the last person the Senate confirmed to the office,
                // which says nothing about acting officials in between.
                <OfficeRow
                  label={
                    role.predecessorSource?.includes("congress.gov")
                      ? c.officeLabels.predecessor
                      : c.officeLabels.predecessorConfirmed
                  }
                  value={role.predecessorName}
                  sourceLabel={
                    role.predecessorSource?.includes("congress.gov")
                      ? c.officeSourceLabels.nomination
                      : c.officeSourceLabels.vote
                  }
                  sourceUrl={role.predecessorSource}
                />
              )}
            </dl>
          </section>
        )}

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

        {/* Advocacy-group scorecards.
            Each row is one organization's own published score, attributed by
            name, dated, and linked to their page for this member. Sift does
            not average them, derive a composite, or characterize what a score
            means — the same posture D37 requires for AllSides and MBFC on
            outlet dossiers. `lib/politician.ts` guarantees every entry here
            carries a year and an https source. */}
        {!ratingsEmpty && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {c.sections.interestGroupRatings}
            </p>
            <ul className="flex flex-col gap-2">
              {ratingsEntries.map((r) => (
                <li
                  key={`${r.rater}-${r.year}`}
                  className="border-b border-(--border-subtle) pb-2"
                >
                  <div className="grid grid-cols-[1fr_auto] gap-x-3 items-baseline">
                    <span className="font-body text-[14px] text-(--text-secondary)">
                      {r.raterName}
                      <span className="text-(--text-tertiary)"> · {r.year}</span>
                    </span>
                    <span className="font-mono text-[13px] tabular-nums text-(--text-primary)">
                      {r.unit === "percent" ? `${r.score}%` : r.score}
                    </span>
                  </div>
                  <p className="font-body text-meta text-(--text-tertiary) mt-0.5">
                    {r.lifetimeScore !== null && (
                      <>{r.lifetimeScore}% lifetime · </>
                    )}
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--text-tertiary) no-underline hover:underline hover:text-(--accent)"
                    >
                      {r.rater} scorecard <span aria-hidden>↗</span>
                    </a>
                  </p>
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
