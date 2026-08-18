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
  TermProfile,
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
/**
 * How long a foreign-executive row may go unchecked and still be advertised.
 *
 * A judgement, not a derivation: long enough that a quarterly re-run keeps the
 * set published, short enough that a head of government who has left office is
 * withheld within one quarter rather than indefinitely. `listSitemapEntries`
 * mirrors this as a SQL interval — change both.
 */
export const ROLE_VERIFICATION_MAX_AGE_DAYS = 90;

/**
 * True when a foreign row's source was refetched recently enough to still
 * stand behind the claim.
 *
 * Only foreign rows decay. Their `roleTitleSource` is a live page that names
 * the person — gov.uk naming Keir Starmer — so it stops being true the moment
 * they leave office, and nothing else on the row records that they did.
 * gov.uk now says Starmer was Prime Minister "from 5 July 2024 to 20 July
 * 2026" while Sift's own prose still called him the sitting PM; that is the
 * failure this exists to bound.
 *
 * US executive and scotus rows do not decay and are deliberately exempt: their
 * title comes from a statute, their appointment from a Senate roll-call, and
 * their *departure* from the successor's roll-call, which sets roleEndDate.
 * All three are permanent records. Expiring them would drop 56 correct rows
 * out of the sitemap because nobody re-ran a script.
 */
function verificationIsCurrent(verifiedAt: string | null, now: Date): boolean {
  if (!present(verifiedAt)) return false;
  const checked = Date.parse(`${verifiedAt}T00:00:00Z`);
  if (Number.isNaN(checked)) return false;
  // Whole days from UTC midnight, because the SQL half of this rule compares
  // `role_verified_at >= CURRENT_DATE - INTERVAL '90 days'` — pure date
  // arithmetic. Comparing against the current *instant* instead would make the
  // two disagree for most of every day: a row checked exactly 90 days ago
  // reads as 90.5 days old here and 90 days old in Postgres, so the sitemap
  // would list a page whose own metadata says noindex.
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const ageDays = (today - checked) / 86_400_000;
  return ageDays >= 0 && ageDays <= ROLE_VERIFICATION_MAX_AGE_DAYS;
}

export function isPublishablePolitician(
  p: PoliticianProfile,
  now: Date = new Date(),
): boolean {
  if (p.chamber === "house" || p.chamber === "senate") {
    return p.committees.length > 0 || p.topIndustriesCurrentCycle.length > 0;
  }
  if (
    p.chamber === "executive" ||
    p.chamber === "foreign-executive" ||
    p.chamber === "scotus"
  ) {
    if (!present(p.role.roleTitle) || !present(p.role.roleTitleSource)) {
      return false;
    }
    return (
      p.chamber !== "foreign-executive" ||
      verificationIsCurrent(p.role.roleVerifiedAt, now)
    );
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
 * How many corpus articles a term needs before its page is worth indexing.
 *
 * A term page is two halves: a sourced definition, and how Sift's corpus
 * covers the term. The definition half alone is a worse Cornell LII — Cornell
 * wrote it, we're citing them, and Wikipedia outranks both of us on the
 * definitional query anyway (measured: 145,241 monthly lookups for Strait of
 * Hormuz, 4,001 for TPS — none of them winnable). The only thing this route
 * has that they don't is the coverage half. Below a real article count there
 * is no coverage half, and what's left is a template with one row of data
 * poured into it — the exact shape Google's scaled-content-abuse policy names.
 *
 * 8 rather than 1, because coverage has to be able to *show* something: the
 * page's argument is the spread across outlets and the span of dates, and
 * neither reads as anything at two articles. 992 terms clear 8 in the current
 * corpus, 485 clear 15, 184 clear 30 — so this is not the binding constraint
 * on how large the route can get.
 *
 * `prior-restraint` is the live example. Real term, sourced to Cornell, zero
 * corpus articles — it renders and resolves, and it stays out of the sitemap.
 */
export const TERM_MIN_ARTICLES = 8;

/**
 * A sourced definition **and** enough measured coverage to be about something.
 *
 * Both halves, deliberately. `lib/term.ts` already drops a definition that
 * lost its source, so a null definition here means the row cannot state what
 * the term means — and a term page that neither defines nor covers is not a
 * page. Unlike the other four types, this floor reads a computed value rather
 * than a column, because coverage is not stored anywhere.
 */
export function isPublishableTerm(t: TermProfile): boolean {
  return (
    present(t.definition) &&
    present(t.definitionSource) &&
    // Stored count, not a freshly computed one. Both the sitemap query and
    // this predicate now read the same column, which is the only way they can
    // agree — and they have to, or a page emits noindex while the sitemap
    // advertises it.
    //
    // null (never measured) is treated as zero, so a freshly seeded term is
    // withheld until scripts/refresh_term_coverage.py has looked at it. Fails
    // closed: the cost is a term publishing a refresh late, versus a term
    // publishing on a number nobody has checked.
    (t.coverageArticleCount ?? 0) >= TERM_MIN_ARTICLES
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
