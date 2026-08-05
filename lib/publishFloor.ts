/**
 * The publish floor — which dossiers Sift asks search engines to index.
 *
 * The catalog and the published set are two different things:
 *
 * - **Catalog set** — every row the entity linker knows about. Large by
 *   design. A thin row still renders and still resolves a chip, so a link
 *   from an article never dead-ends.
 * - **Published set** — rows substantial enough to advertise. These enter
 *   `app/sitemap.ts`; everything else emits `robots: { index: false }`.
 *
 * Why the split exists: Google's scaled-content-abuse policy targets exactly
 * "one row of data poured into a template", and 838 dossiers of very uneven
 * depth is that shape if published wholesale. `OPERATING_CONTEXT.md` §2 calls
 * the dossier dataset the sellable asset — publishing the thin tail devalues
 * the part that is genuinely good.
 *
 * The precedent is `listCitedAgencies` in lib/db.ts, which has always refused
 * to publish an agency whose governance text lacks its source URL (15 of 93).
 * These predicates generalise that rule to all four types.
 *
 * Note that only `/outlet/*` renders an article list; politician, org and
 * bill pages are profile-only, so for those three "is this page worth
 * indexing" is entirely a question of how populated the row is.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * INVARIANT: these predicates and the SQL in `listSitemapEntries` (lib/db.ts)
 * express the same rule and must agree. They are separate implementations
 * because the sitemap needs a set-level query and the pages need a check on
 * an object already in hand. `__tests__/publishFloor.test.ts` pins the rule;
 * if you change one, change the other and update that test.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type {
  BillProfile,
  OrgProfile,
  OutletProfile,
  PoliticianProfile,
} from "./types";

function present(s: string | null | undefined): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

/**
 * Sitting Congress with committee assignments or PAC industry data, OR an
 * executive official whose office title carries its primary record.
 *
 * The chamber restriction used to exclude all 102 executive /
 * foreign-executive rows, and was right to: their only substantive content
 * was uncited `notes` prose about a living person plus a Wikipedia link, and
 * `founded_year` was dropped from orgs rather than sourced to Wikipedia
 * (STATUS.md:109-113). Migration 015 replaced that prose with primary-record
 * fields, so what gates these rows is now sourcing rather than chamber.
 *
 * `roleTitle` is only ever non-null when `roleTitleSource` came with it —
 * `lib/politician.ts:asRoleProvenance` drops the pair otherwise — so the
 * second clause is a sourcing test even though it reads like a presence test.
 * The 46 foreign heads of state have no such record and stay below the floor.
 */
export function isPublishablePolitician(p: PoliticianProfile): boolean {
  if (p.chamber === "house" || p.chamber === "senate") {
    return p.committees.length > 0 || p.topIndustriesCurrentCycle.length > 0;
  }
  if (
    p.chamber === "executive" ||
    p.chamber === "foreign-executive" ||
    p.chamber === "scotus"
  ) {
    return present(p.role.roleTitle) && present(p.role.roleTitleSource);
  }
  return false;
}

/**
 * At least one substantive field that carries its own source.
 *
 * Budget counts because lib/org.ts nulls the whole triple unless the figure,
 * fiscal year and source URL are all present — so a non-null figure here is
 * already a cited one.
 */
export function isPublishableOrg(o: OrgProfile): boolean {
  return (
    (present(o.governanceStructure) && present(o.governanceSource)) ||
    (present(o.selfDescription) && present(o.selfDescriptionSource)) ||
    (o.annualBudgetUsd !== null && present(o.annualBudgetSource))
  );
}

/** A legislative status plus at least one link to the public record. */
export function isPublishableBill(b: BillProfile): boolean {
  return present(b.status) && Object.values(b.externalLinks).some(present);
}

/**
 * At least one rating that carries its source URL.
 *
 * A rating without its link is an uncited third-party judgement about a named
 * organization — the thing D37 is most careful about.
 */
export function isPublishableOutlet(o: OutletProfile): boolean {
  return (
    (present(o.allSidesRating) && present(o.allSidesUrl)) ||
    (present(o.mbfcFactual) && present(o.mbfcUrl))
  );
}

/**
 * Partial `Metadata` to **spread** into a dossier route's return value.
 *
 * Spread, not assign — and that distinction is load-bearing. Next merges
 * metadata shallowly by key, and a key *present* in the child overrides the
 * parent even when its value is `undefined`. So `robots: dossierRobots(true)`
 * does not inherit the root config; it erases it, and every publishable
 * dossier silently loses the `max-image-preview:large` googlebot directive
 * that app/layout.tsx sets. Returning `{}` omits the key entirely, which is
 * what actual inheritance requires.
 *
 * `follow: true` on below-floor pages is deliberate: the page still carries
 * real outbound links to public records, and those are worth crawling even
 * when the page itself shouldn't rank. This is "don't index yet", not
 * "ignore this page".
 */
export function dossierRobotsMeta(
  publishable: boolean,
): { robots?: { index: boolean; follow: boolean } } {
  return publishable ? {} : { robots: { index: false, follow: true } };
}
