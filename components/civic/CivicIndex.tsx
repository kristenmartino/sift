import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import { COPY } from "@/lib/copy";
import {
  groupByState,
  groupByType,
  filterByChamber,
  orgLeanLabel,
  orgTypeLabel,
  stateName,
} from "@/lib/civic";
import type {
  BillListItem,
  OrgListItem,
  PoliticianChamber,
  PoliticianListItem,
} from "@/lib/types";

interface CivicIndexProps {
  politicians: PoliticianListItem[];
  orgs: OrgListItem[];
  bills: BillListItem[];
  chamberFilter: PoliticianChamber | null;
}

/**
 * Server-rendered civic-dossier index — civic-literacy MVP Phase 3.I.
 *
 * Single editorial-style page that surfaces every curated dossier so users
 * can discover them without typing slugs. Mirrors the visual register of
 * the dossier pages themselves (eyebrows, hairline rules, mono labels,
 * Fraunces display, max-w-800).
 *
 * Three sections:
 *   1. Politicians — grouped by state, chamber-filterable via URL.
 *   2. Organizations — grouped by type, lean shown inline.
 *   3. Bills — flat list with congress + status.
 *
 * No search, no sortable tables, no pagination — the political surface is
 * naturally finite (536 sitting members, ~10 orgs, a handful of bills),
 * and a flat alphabetical list reads better than a search-only page.
 */
export default function CivicIndex({
  politicians,
  orgs,
  bills,
  chamberFilter,
}: CivicIndexProps) {
  const c = COPY.civicIndex;

  const filteredPoliticians = filterByChamber(politicians, chamberFilter);
  const stateGroups = groupByState(filteredPoliticians);
  const orgTypeGroups = groupByType(orgs);

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
            {c.headline}
          </h1>
          <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
            {c.lede}
          </p>
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* ─── Politicians ────────────────────────────────────── */}
        <section className="mb-14" aria-labelledby="politicians-heading">
          <header className="mb-6">
            <p
              id="politicians-heading"
              className="font-body text-kicker uppercase text-(--text-muted) mb-2"
            >
              {c.politiciansEyebrow(politicians.length)}
            </p>
            <h2 className="font-heading text-[26px] md:text-[28px] font-semibold leading-[1.15] tracking-tight text-(--text)">
              {c.politiciansHeading}
            </h2>
          </header>

          {/* Chamber filter — a 3-link nav. Active state in --accent ink. */}
          <nav
            aria-label="Filter politicians by chamber"
            className="mb-7 flex items-center gap-x-5 font-body text-outlet uppercase tracking-wider"
          >
            <ChamberFilterLink
              label={c.filterAll}
              href="/civic"
              active={chamberFilter === null}
            />
            <ChamberFilterLink
              label={c.filterSenate}
              href="/civic?chamber=senate"
              active={chamberFilter === "senate"}
            />
            <ChamberFilterLink
              label={c.filterHouse}
              href="/civic?chamber=house"
              active={chamberFilter === "house"}
            />
            <span className="font-body text-[13px] tracking-normal text-(--text-muted) ml-auto normal-case">
              {filteredPoliticians.length === politicians.length
                ? c.showingAll(filteredPoliticians.length)
                : c.showingFiltered(filteredPoliticians.length, politicians.length)}
            </span>
          </nav>

          {/* State-grouped list */}
          {stateGroups.length === 0 ? (
            <p className="font-body text-[14px] text-(--text-muted) italic max-w-[60ch] leading-relaxed">
              {c.emptyPoliticians}
            </p>
          ) : (
            <ul className="space-y-6">
              {stateGroups.map(([code, members]) => (
                <li key={code}>
                  <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted) mb-1.5">
                    {stateName(code)}
                  </p>
                  <ul className="font-body text-[15px] text-(--text-secondary) leading-relaxed">
                    {members.map((p, idx) => (
                      <li key={p.bioguideId} className="inline">
                        <Link
                          href={`/politician/${p.bioguideId}`}
                          className="text-(--text) no-underline hover:underline hover:text-(--accent)"
                        >
                          {p.name}
                        </Link>
                        {p.party && (
                          <span className="text-(--text-muted)">
                            {" "}
                            ({p.party}
                            {p.chamber === "senate"
                              ? "-Sen."
                              : p.chamber === "house"
                                ? "-Rep."
                                : ""}
                            )
                          </span>
                        )}
                        {idx < members.length - 1 && (
                          <span className="text-(--text-muted) mx-1.5">
                            ·
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* ─── Organizations ──────────────────────────────────── */}
        <section className="mb-14" aria-labelledby="orgs-heading">
          <header className="mb-6">
            <p
              id="orgs-heading"
              className="font-body text-kicker uppercase text-(--text-muted) mb-2"
            >
              {c.orgsEyebrow(orgs.length)}
            </p>
            <h2 className="font-heading text-[26px] md:text-[28px] font-semibold leading-[1.15] tracking-tight text-(--text)">
              {c.orgsHeading}
            </h2>
          </header>

          {orgTypeGroups.length === 0 ? (
            <p className="font-body text-[14px] text-(--text-muted) italic max-w-[60ch] leading-relaxed">
              {c.emptyOrgs}
            </p>
          ) : (
            <ul className="space-y-6">
              {orgTypeGroups.map(([type, items]) => (
                <li key={type}>
                  <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted) mb-1.5">
                    {orgTypeLabel(type === "other" ? null : type)}
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((o) => (
                      <li
                        key={o.slug}
                        className="font-body text-[15px] text-(--text-secondary)"
                      >
                        <Link
                          href={`/org/${o.slug}`}
                          className="text-(--text) no-underline hover:underline hover:text-(--accent)"
                        >
                          {o.name}
                        </Link>
                        {o.politicalLean && (
                          <span className="text-(--text-muted)">
                            {" "}
                            ({orgLeanLabel(o.politicalLean)})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* ─── Bills ──────────────────────────────────────────── */}
        <section className="mb-14" aria-labelledby="bills-heading">
          <header className="mb-6">
            <p
              id="bills-heading"
              className="font-body text-kicker uppercase text-(--text-muted) mb-2"
            >
              {c.billsEyebrow(bills.length)}
            </p>
            <h2 className="font-heading text-[26px] md:text-[28px] font-semibold leading-[1.15] tracking-tight text-(--text)">
              {c.billsHeading}
            </h2>
          </header>

          {bills.length === 0 ? (
            <p className="font-body text-[14px] text-(--text-muted) italic max-w-[60ch] leading-relaxed">
              {c.emptyBills}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {bills.map((b) => (
                <li
                  key={b.billId}
                  className="font-body text-[15px] text-(--text-secondary) leading-relaxed"
                >
                  <Link
                    href={`/bill/${b.billId}`}
                    className="text-(--text) no-underline hover:underline hover:text-(--accent) font-semibold"
                  >
                    {b.shortTitle ?? b.billId}
                  </Link>
                  <span className="text-(--text-muted)">
                    {" "}
                    · {b.congress}th Congress
                  </span>
                  {b.status && (
                    <span className="text-(--text-muted)">
                      {" "}
                      · {b.status}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {bills.length > 0 && bills.length < 5 && (
            <p className="font-body text-[14px] text-(--text-muted) italic max-w-[60ch] leading-relaxed mt-6">
              {c.billsMoreSoon}
            </p>
          )}
        </section>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Footer: back to home + methodology hint */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="font-body text-outlet uppercase tracking-wider text-(--text-secondary) hover:text-(--accent) transition-colors no-underline inline-flex items-center gap-1.5"
          >
            ← {c.backLink}
          </Link>
          <p className="font-body text-[12px] text-(--text-muted) italic">
            {c.methodologyHint}
          </p>
        </div>
      </main>
    </div>
  );
}

interface ChamberFilterLinkProps {
  label: string;
  href: string;
  active: boolean;
}

function ChamberFilterLink({ label, href, active }: ChamberFilterLinkProps) {
  return (
    <Link
      href={href}
      className={
        active
          ? "text-(--accent) no-underline border-b border-(--accent) pb-0.5"
          : "text-(--text-muted) no-underline hover:text-(--text)"
      }
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
