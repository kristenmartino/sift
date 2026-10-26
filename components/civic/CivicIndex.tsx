import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import CivicLookup from "@/components/civic/CivicLookup";
import { COPY } from "@/lib/copy";
import {
  groupByOffice,
  countryName,
  groupByType,
  filterByChamber,
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
 *   1. Political profiles — office-scoped, then by state or country.
 *   2. Organizations — grouped by type. No lean: D37 / migration 012.
 *   3. Bills — flat list with congress + status.
 *
 * Office filters are URL-addressable. International country codes share
 * the legacy state field, so office scope must be resolved before geography.
 */
export default function CivicIndex({
  politicians,
  orgs,
  bills,
  chamberFilter,
}: CivicIndexProps) {
  const c = COPY.civicIndex;

  const filteredPoliticians = filterByChamber(politicians, chamberFilter);
  const officeGroups = groupByOffice(filteredPoliticians);
  const orgTypeGroups = groupByType(orgs);

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
            {c.headline}
          </h1>
          <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
            {c.lede}
          </p>
        </header>

        <CivicLookup politicians={politicians} orgs={orgs} bills={bills} />

        <nav aria-label="Browse civic context" className="flex flex-wrap gap-x-5 gap-y-3 mb-10 font-body text-[14px]">
          {[["People", "#people"], ["Organizations", "#organizations"], ["Legislation", "#legislation"],
            ["Glossary", "/glossary"], ["Agency guide", "/agencies"]].map(([label, href]) => (
            <Link key={href} href={href} className="text-(--accent) underline underline-offset-4 hover:text-(--text-primary)">{label}</Link>
          ))}
        </nav>

        {/* ─── Politicians ────────────────────────────────────── */}
        <section id="people" className="mb-14 scroll-mt-8" aria-labelledby="politicians-heading">
          <header className="mb-6">
            <p
              id="politicians-heading"
              className="font-body text-kicker uppercase text-(--text-tertiary) mb-2"
            >
              {c.politiciansEyebrow(politicians.length)}
            </p>
            <h2 className="font-heading text-[26px] md:text-[28px] font-semibold leading-[1.15] tracking-tight text-(--text-primary)">
              {c.politiciansHeading}
            </h2>
          </header>

          {/* Office filters match the profile categories served by /civic. */}
          <nav
            aria-label="Filter politicians by chamber"
            className="mb-7 flex flex-wrap items-center gap-x-5 gap-y-3 font-body text-outlet uppercase tracking-wider"
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
            {(["executive", "foreign-executive", "scotus", "former"] as const).map((chamber) => (
              <ChamberFilterLink key={chamber} label={c.officeFilters[chamber]}
                href={`/civic?chamber=${chamber}`} active={chamberFilter === chamber} />
            ))}
            <span className="font-body text-[13px] tracking-normal text-(--text-tertiary) ml-auto normal-case">
              {filteredPoliticians.length === politicians.length
                ? c.showingAll(filteredPoliticians.length)
                : c.showingFiltered(filteredPoliticians.length, politicians.length)}
            </span>
          </nav>

          {/* State-grouped list */}
          {officeGroups.length === 0 ? (
            <p className="font-body text-[14px] text-(--text-tertiary) italic max-w-[60ch] leading-relaxed">
              {c.emptyPoliticians}
            </p>
          ) : (
            <div className="space-y-9">
              {officeGroups.map(({ office, groups }) => (
                <section key={office} aria-label={c.officeHeadings[office]}>
                  <details open={chamberFilter !== null} className="border-y border-(--border-subtle) py-4">
                  <summary className="font-heading text-[21px] font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-(--accent)">{c.officeHeadings[office]} <span className="font-body text-[13px] text-(--text-secondary)">· {groups.reduce((count, [, members]) => count + members.length, 0)} profiles</span></summary>
                  <div className="mt-4">
                  <ul className="space-y-6">
              {groups.map(([code, members]) => (
                <li key={code}>
                  {(office === "congress" || office === "international") && (
                  <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-tertiary) mb-1.5">
                    {office === "international" ? countryName(code === "—" ? null : code) : stateName(code)}
                  </p>
                  )}
                  <ul className="font-body text-[15px] text-(--text-secondary) leading-relaxed">
                    {members.map((p, idx) => (
                      <li key={p.bioguideId} className="inline">
                        <Link
                          href={`/politician/${p.bioguideId}`}
                          className="text-(--text-primary) no-underline hover:underline hover:text-(--accent)"
                        >
                          {p.name}
                        </Link>
                        {p.party && (
                          <span className="text-(--text-tertiary)">
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
                          <span className="text-(--text-tertiary) mx-1.5">
                            ·
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
                  </ul>
                  </div></details>
                </section>
              ))}
            </div>
          )}
        </section>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* ─── Organizations ──────────────────────────────────── */}
        <section id="organizations" className="mb-14 scroll-mt-8" aria-labelledby="orgs-heading">
          <header className="mb-6">
            <p
              id="orgs-heading"
              className="font-body text-kicker uppercase text-(--text-tertiary) mb-2"
            >
              {c.orgsEyebrow(orgs.length)}
            </p>
            <h2 className="font-heading text-[26px] md:text-[28px] font-semibold leading-[1.15] tracking-tight text-(--text-primary)">
              {c.orgsHeading}
            </h2>
            {/* Composition, from live counts — a reader should know the set is
                mostly agencies before clicking into it. */}
            {(() => {
              const sub = c.orgsSubhead(
                orgs.filter((o) => o.type === "think-tank").length,
                orgs.filter((o) => o.type === "advocacy").length,
                orgs.filter((o) => o.type === "agency").length
              );
              return sub ? (
                <p className="font-body text-[14px] text-(--text-tertiary) mt-2 leading-relaxed">
                  {sub}
                </p>
              ) : null;
            })()}
            {/* Cross-link to /agencies. Placed here rather than in the nav
                because it is a cut of this section, not a separate area of the
                site — and the agencies are the majority of these rows, so a
                reader scanning the org list is exactly who wants it. */}
            <p className="font-body text-[14px] mt-3 leading-relaxed">
              <Link
                href="/agencies"
                className="text-(--accent) no-underline hover:underline"
              >
                {c.agenciesCrossLink}
              </Link>
            </p>
            <p className="font-body text-[14px] mt-2 leading-relaxed">
              <Link
                href="/think-tanks"
                className="text-(--accent) no-underline hover:underline"
              >
                {c.thinkTanksCrossLink}
              </Link>
            </p>
            {/* Third cut of the same corpus. A term page is the one dossier
                type that is not an entity, so it belongs beside these rather
                than in the politician/org lists above. */}
            <p className="font-body text-[14px] mt-2 leading-relaxed">
              <Link
                href="/glossary"
                className="text-(--accent) no-underline hover:underline"
              >
                {c.termIndexCrossLink}
              </Link>
            </p>
          </header>

          {orgTypeGroups.length === 0 ? (
            <p className="font-body text-[14px] text-(--text-tertiary) italic max-w-[60ch] leading-relaxed">
              {c.emptyOrgs}
            </p>
          ) : (
            <ul className="space-y-6">
              {orgTypeGroups.map(([type, items]) => (
                <li key={type}>
                  <details className="border-y border-(--border-subtle) py-4">
                  <summary className="font-mono text-[12px] uppercase tracking-[0.1em] text-(--text-secondary) cursor-pointer focus-visible:outline-2 focus-visible:outline-(--accent)">{orgTypeLabel(type === "other" ? null : type)} · {items.length} profiles</summary>
                  <ul className="space-y-1.5 mt-4">
                    {items.map((o) => (
                      <li
                        key={o.slug}
                        className="font-body text-[15px] text-(--text-secondary)"
                      >
                        <Link
                          href={`/org/${o.slug}`}
                          className="text-(--text-primary) no-underline hover:underline hover:text-(--accent)"
                        >
                          {o.name}
                        </Link>
                        {/* The Sift-assigned political_lean used to render
                            here as "(Left)" / "(Right)" / "(Nonpartisan)".
                            Removed: it is Sift computing its own political
                            rating, which D37 forbids, and it was uncited.
                            Migration 012 replaced it on the dossier pages with
                            cited self-descriptions; this index was missed in
                            that pass and kept publishing the label for every
                            one of the 103 orgs. See /think-tanks for what the
                            organizations say about themselves instead. */}
                      </li>
                    ))}
                  </ul></details>
                </li>
              ))}
            </ul>
          )}
        </section>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* ─── Bills ──────────────────────────────────────────── */}
        <section id="legislation" className="mb-14 scroll-mt-8" aria-labelledby="bills-heading">
          <header className="mb-6">
            <p
              id="bills-heading"
              className="font-body text-kicker uppercase text-(--text-tertiary) mb-2"
            >
              {c.billsEyebrow(bills.length)}
            </p>
            <h2 className="font-heading text-[26px] md:text-[28px] font-semibold leading-[1.15] tracking-tight text-(--text-primary)">
              {c.billsHeading}
            </h2>
          </header>

          {bills.length === 0 ? (
            <p className="font-body text-[14px] text-(--text-tertiary) italic max-w-[60ch] leading-relaxed">
              {c.emptyBills}
            </p>
          ) : (
            <details className="border-y border-(--border-subtle) py-4">
            <summary className="font-body text-[15px] text-(--text-secondary) cursor-pointer focus-visible:outline-2 focus-visible:outline-(--accent)">Browse {bills.length} pieces of legislation</summary>
            <ul className="space-y-1.5 mt-4">
              {bills.map((b) => (
                <li
                  key={b.billId}
                  className="font-body text-[15px] text-(--text-secondary) leading-relaxed"
                >
                  <Link
                    href={`/bill/${b.billId}`}
                    className="text-(--text-primary) no-underline hover:underline hover:text-(--accent) font-semibold"
                  >
                    {b.shortTitle ?? b.billId}
                  </Link>
                  <span className="text-(--text-tertiary)">
                    {" "}
                    · {b.congress}th Congress
                  </span>
                  {b.status && (
                    <span className="text-(--text-tertiary)">
                      {" "}
                      · {b.status}
                    </span>
                  )}
                </li>
              ))}
            </ul></details>
          )}

          {bills.length > 0 && bills.length < 5 && (
            <p className="font-body text-[14px] text-(--text-tertiary) italic max-w-[60ch] leading-relaxed mt-6">
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
          : "text-(--text-tertiary) no-underline hover:text-(--text-primary)"
      }
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
