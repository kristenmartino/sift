// ─── Domain Types ───────────────────────────────────────

export type CategoryId =
  | "top"
  | "technology"
  | "business"
  | "science"
  | "energy"
  | "world"
  | "health"
  | "politics"
  | "sports"
  | "entertainment";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

/**
 * Article-level tone (migrations/020) — NOT the same concept as
 * StoryFraming["tone"], which describes an outlet's coverage style. This
 * describes the underlying event: "grim" = death/violent crime/fatal
 * disaster; "light" = feel-good/culture/achievement; "neutral" = everything
 * else including serious-but-not-deadly news. Absent = unclassified,
 * treated as neutral by every ranking site (D48).
 */
export type ArticleTone = "grim" | "neutral" | "light";

export interface Article {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  publishedDate: string | null;
  imageUrl: string | null;
  category: CategoryId;
  readTime: number;
  whyItMatters?: string;
  importanceScore?: number;
  tone?: ArticleTone;
  /** Outlet-declared opinion piece (migrations/023); absent = reported. */
  isOpinion?: boolean;
  /** Program-episode or daily-brief container (migrations/024). */
  isRoundup?: boolean;
  /**
   * Kind of writing (migrations/025): "feature" = magazine-style narrative,
   * "soft" = curiosity/lifestyle/service. Absent = news. Distinct from
   * importance — a feature can be consequential and still not be the front
   * page's job. Ranking uses it for standalone articles only.
   */
  genre?: "news" | "feature" | "soft";
  /**
   * AI-generated "What you should know first" panel — civic-literacy MVP.
   * Populated by sift-api's primer_generator. Null/undefined when the article
   * is short enough to need no context, or when the pipeline hasn't run for it
   * yet. UI tolerates absence (BackgroundPrimer renders nothing).
   */
  contextPrimer?: ContextPrimer | null;
  /**
   * Reading-level alternates — civic-literacy MVP Phase 1B (not yet
   * populated). Forward-declared here so the type contract is stable when
   * the pipeline starts writing this field.
   */
  readingLevels?: ReadingLevels | null;
  /**
   * Curated outlet provenance — civic-literacy MVP Phase 2.B. Resolved at
   * the API boundary by mapping `sourceName` through `source_name_aliases`
   * → `outlet_profiles`. Null/undefined when the source_name has no alias
   * yet (graceful degradation: OutletBadge renders the plain source name).
   */
  outlet?: OutletProfile | null;
  /**
   * Resolved entity references — civic-literacy MVP Phase 3.H. Populated
   * by the sift-api Phase 3.G entity_linker pipeline node from the
   * curated profile tables. Empty array when the article hasn't been
   * processed yet, when no entities were matched, or when the prod DB
   * predates the entity_links column (graceful: EntityLinksList renders
   * nothing). Distinct from `outlet` above — that's the article's own
   * source; `entityLinks` are mentions inside the article text.
   */
  entityLinks?: EntityLink[];
}

// ─── Outlet Provenance ─────────────────────────────────

/** AllSides political-lean buckets. Mirrors `outlet_profiles.allsides_rating`. */
export type OutletAllSidesRating =
  | "left"
  | "lean-left"
  | "center"
  | "lean-right"
  | "right"
  | "mixed";

/** MBFC factual-reporting tiers. Mirrors `outlet_profiles.mbfc_factual`. */
export type OutletMbfcRating =
  | "very-high"
  | "high"
  | "mostly-factual"
  | "mixed"
  | "low"
  | "very-low";

/** Funding-model categories used in outlet dossiers. */
export type OutletFundingModel =
  | "subscription"
  | "advertising"
  | "foundation"
  | "donations"
  | "mixed"
  | "public-service";

/**
 * Optional sub-shape: JSONB `external_links` from `outlet_profiles`. All keys
 * optional and free-form; the dossier renders only the ones it knows about.
 */
export interface OutletExternalLinks {
  wikipedia?: string;
  official?: string;
  ownership?: string;
  [key: string]: string | undefined;
}

// ─── Org Provenance (Phase 3.D) ────────────────────────

/**
 * Curated org-type taxonomy. Mirrors the values stored in
 * `org_profiles.type`; the seed scripts validate against this set.
 */
export type OrgType =
  | "think-tank"
  | "advocacy"
  | "union"
  | "pac"
  | "super-pac"
  | "foundation"
  | "industry-group"
  | "agency"
  // Intergovernmental organizations — UN, NATO, IMF, WHO, WTO, the European
  // Commission, ILO. Q8 closed "global" (DECISIONS.md D47) and these were the
  // entry point rather than more foreign heads of state, because a founding
  // treaty is a fixed document at a stable URL: it does not decay the way a
  // page naming a sitting head of government does.
  | "igo"
  | "other";

/**
 * Org political-lean buckets. Same six AllSides-aligned buckets that
 * `OutletAllSidesRating` uses, plus `nonpartisan` for orgs that take no
 * position (some industry groups, some foundations). The bucketize helper
 * in lib/crossSpectrum.ts treats `nonpartisan` like `mixed` — neither
 * lands in a L/C/R column.
 */
export type OrgPoliticalLean =
  | "left"
  | "lean-left"
  | "center"
  | "lean-right"
  | "right"
  | "mixed"
  | "nonpartisan";

/**
 * External-source links rendered as the citation footer of the org
 * dossier. ProPublica Nonprofit Explorer for 990s; FARA filings for
 * registered foreign agents; Wikipedia + the official site for context.
 * Open-ended for forward compatibility.
 */
export interface OrgExternalLinks {
  propublica?: string;
  irs_990?: string;
  fara?: string;
  wikipedia?: string;
  official?: string;
  [key: string]: string | undefined;
}

// ─── Bill Provenance (Phase 3.E) ───────────────────────

/**
 * Lifecycle stages a bill can be in. Mirrors `bill_profiles.status`;
 * the seed scripts validate against this set.
 */
export type BillStatus =
  | "introduced"
  | "committee"
  | "passed-chamber"
  | "enacted"
  | "vetoed"
  | "failed";

/**
 * External-source links rendered as the citation footer of the bill
 * dossier. GovTrack + Congress.gov for the official text + status,
 * OpenSecrets for the lobbying-spend breakdown.
 */
export interface BillExternalLinks {
  govtrack?: string;
  congress?: string;
  opensecrets?: string;
  [key: string]: string | undefined;
}

/**
 * Curated org metadata, mirrored from `org_profiles` in Postgres. Phase
 * 3.A seeded a small sample (10 think tanks + advocacy orgs spanning
 * the political spectrum); a follow-up curation pass grows this to
 * ~200 entries for production coverage.
 *
 * `faraRegistered` is the headline disclosure: orgs registered as
 * foreign agents under FARA get a prominent callout with the country
 * list. The methodology page documents that this is symmetric — every
 * registered org gets the same treatment regardless of which country.
 */
/**
 * The kind of record a budget figure came from. Decides what the figure is
 * *called* on the page, because the two measure different things:
 *
 * - `form990`     — total functional expenses, from an IRS Form 990.
 * - `ombOutlays`  — net outlays, from OMB Historical Tables. Net of offsetting
 *                   receipts, so it is legitimately negative for an agency
 *                   with large revolving funds (GSA, FY2025: −$379M).
 *
 * `null` means the source is neither, and the UI must not assert which.
 */
export type BudgetSourceKind = "form990" | "ombOutlays";

export interface OrgProfile {
  slug: string;
  name: string;
  type: OrgType | null;
  /**
   * The organization's own characterization of itself, verbatim. NEVER Sift's
   * assessment. Renders only when `selfDescriptionSource` is present — an
   * uncited quote is the same failure `politicalLean` was.
   */
  selfDescription: string | null;
  selfDescriptionSource: string | null;
  selfDescriptionChecked: string | null;
  /** Agencies only: statutory governance facts. Renders only with a source. */
  governanceStructure: string | null;
  governanceSource: string | null;
  foundedYear: number | null;
  /**
   * The figure at `annualBudgetSource`. NOT a general "annual budget" — that
   * was the unsourced fixture value this replaced (migration 013). Renders
   * only with `annualBudgetFy` + source.
   *
   * **It does not mean the same thing for every row**, which is why
   * `annualBudgetKind` exists: for a nonprofit it is total functional expenses
   * from a Form 990; for a federal agency it is net outlays from OMB
   * Historical Tables. Labelling the second as the first is a miscitation, and
   * it also makes GSA's legitimately negative net outlays read as an error.
   */
  annualBudgetUsd: number | null;
  annualBudgetFy: string | null;
  /**
   * Which record `annualBudgetSource` points at, so the UI can name the figure
   * correctly. Derived from the source itself rather than from `type` — the
   * label describes the record, not the organization.
   */
  annualBudgetKind: BudgetSourceKind | null;
  annualBudgetSource: string | null;
  majorFunders: string[];
  faraRegistered: boolean;
  faraCountries: string[];
  externalLinks: OrgExternalLinks;
  notes: string | null;
}

/**
 * An agency whose governance is documented and cited. Powers /agencies.
 *
 * Only rows with BOTH `governance_structure` and `governance_source` are ever
 * built into this shape — an uncited claim about how a federal agency is
 * controlled is the same defect the Sift-assigned `political_lean` was
 * (migration 012). The query enforces it; the type has no nullable variant on
 * purpose, so a caller cannot render one without a source.
 */
export interface AgencyGovernance {
  slug: string;
  name: string;
  governanceStructure: string;
  governanceSource: string;
  /**
   * True when the citing statute caps how many members may share a political
   * party. Derived from the statutory text, not asserted by Sift — see
   * lib/agencies.ts for why this is read off the prose rather than stored.
   */
  hasPartisanBalanceCap: boolean;
}

/**
 * An organization rendered through its own words. Powers /think-tanks.
 *
 * Like AgencyGovernance, there is no nullable-source variant: a quote without
 * the page it came from is the defect migration 012 removed, and the query
 * refuses to build one.
 */
export interface SelfDescribedOrg {
  slug: string;
  name: string;
  type: OrgType | null;
  selfDescription: string;
  selfDescriptionSource: string;
  selfDescriptionChecked: string | null;
  /** FARA-registered. A public-record fact, shown because it sits oddly beside a non-partisanship claim. */
  faraRegistered: boolean;
  faraCountries: string[];
  /** True when the org's own wording claims non-partisanship — see lib/thinkTanks.ts. */
  claimsNonPartisanship: boolean;
}

// ─── Entity Links (Phase 3.H) ──────────────────────────

/**
 * The four entity types Sift can resolve from article text. Mirrors the
 * `type` field in `articles.entity_links` JSONB rows produced by the
 * sift-api Phase 3.G entity_linker pipeline node.
 */
export type EntityLinkType = "outlet" | "politician" | "org" | "bill";

/**
 * One resolved entity reference attached to an article. Each link points
 * at exactly one curated row in `outlet_profiles` / `politician_profiles` /
 * `org_profiles` / `bill_profiles`.
 *
 * `surfaceForm` preserves the original casing from the article text so
 * the InlineGlossaryTooltip can render the matched span verbatim
 * ("CHUCK SCHUMER said today" → tooltip shows "CHUCK SCHUMER").
 *
 * `civicContext` is server-attached (not stored in `entity_links` JSONB):
 * the API route enriches each politician chip with the politician's top
 * PAC industries so the EntityLinksList chip-tooltip can show inline
 * civic context without a per-hover round trip. Optional — articles whose
 * chips don't resolve (or whose politicians have no industry data) render
 * the chip without a tooltip preview, just navigating to the full dossier
 * on click.
 */
export interface EntityLink {
  type: EntityLinkType;
  canonicalId: string;
  surfaceForm: string;
  civicContext?: CivicContext;
}

/**
 * Inline civic context shown in the tooltip preview on an EntityLinksList
 * chip. Server-enriched at API-route time from `politician_profiles` (and,
 * later, `org_profiles` / `bill_profiles` / `outlet_profiles`). Lives on
 * the wire; never persisted in DB.
 *
 * Schema is intentionally a flat union by `type` so the renderer can do a
 * single discriminated switch rather than juggling four nullable shapes.
 */
export type CivicContext =
  | {
      type: "politician";
      // Up to 3 top PAC industries by 2022-cycle amount, descending.
      // Empty when the politician is in the roster but has no PAC data
      // (off-cycle senators, post-2022 specials).
      topIndustries: IndustryDonation[];
    };

/**
 * Curated bill metadata, mirrored from `bill_profiles` in Postgres.
 * Phase 3.A seeded a small sample (HR 5376 — Inflation Reduction Act);
 * Phase 3.F populates bills on-demand when articles reference one not
 * yet curated.
 *
 * `billId` follows the canonical form `<chamber>-<number>-<congress>`,
 * e.g. `hr-5376-117` or `s-1234-119`. The display formatter in
 * `lib/bill.ts` rewrites this to `H.R. 5376 (117th Congress)`.
 */
export interface BillProfile {
  billId: string;
  congress: number;
  title: string;
  shortTitle: string | null;
  sponsorBioguide: string | null;
  cosponsors: string[];
  status: BillStatus | null;
  introducedDate: string | null;       // ISO YYYY-MM-DD
  lobbyingForUsd: number | null;
  lobbyingAgainstUsd: number | null;
  externalLinks: BillExternalLinks;
  notes: string | null;
}

// ─── Politician Provenance (Phase 3.C) ─────────────────

/**
 * Chambers a curated politician can sit in. Mirrors the values stored in
 * `politician_profiles.chamber`; the seed scripts validate against this set.
 */
export type PoliticianChamber =
  | "senate"
  | "house"
  | "former"
  | "executive"
  | "foreign-executive"
  // Supreme Court Justices. sift-api migration 016 moved them out of the
  // orphaned `judge_profiles` table into `politician_profiles` rather than
  // adding a fifth entity type, which 015 had already reserved
  // `id_source = 'scotus'` for.
  | "scotus";

/**
 * Structured role provenance for executive-branch and foreign officials
 * (migration 015). Every claim-bearing field is paired with the source that
 * backs it, so the UI can refuse to render one without the other — the rule
 * migration 013 established for org budgets, applied to living people, whom
 * `docs/OPERATING_CONTEXT.md` §5 singles out.
 *
 * These rows carried freeform `notes` prose until 015 ("First African-American
 * Secretary of Defense", "Former hedge-fund executive") with only a Wikipedia
 * link behind it. Since politician pages render no article list, that prose
 * WAS the page, which is why the rows were withheld from the sitemap.
 */
export interface PoliticianRoleProvenance {
  /** Provenance of bioguideId: 'bioguide' means a real Congress.gov ID. */
  idSource: string | null;
  /** Office title exactly as the establishing record states it. */
  roleTitle: string | null;
  /** Statute, constitutional provision, or official record naming the office. */
  roleTitleSource: string | null;
  roleStartDate: string | null;
  /** When a Senate-confirmed successor took the office, or a term ended. */
  roleEndDate: string | null;
  roleDatesSource: string | null;
  nominationDate: string | null;
  /** congress.gov PN record — sources nominationDate AND predecessorName. */
  nominationUrl: string | null;
  confirmationDate: string | null;
  /** senate.gov roll-call — sources confirmationDate AND the result. */
  confirmationVoteUrl: string | null;
  /** Verbatim Senate outcome, e.g. "Confirmed 50-50". Never recomputed. */
  confirmationVoteResult: string | null;
  predecessorName: string | null;
  /**
   * Which record backs `predecessorName`, and therefore what it means. A
   * congress.gov PN URL means the nomination's verbatim "vice <name>" clause
   * named them. A senate.gov roll-call means it is the Senate's previous
   * confirmation to the office — narrower, and silent about acting officials,
   * who are never confirmed. The UI must say the narrower thing.
   */
  predecessorSource: string | null;
  /**
   * Date `roleTitleSource` was last refetched and confirmed (migration 017).
   * Load-bearing for foreign-executive rows only, whose source is a live page
   * naming the person and therefore decays; see `lib/publishFloor.ts`.
   */
  roleVerifiedAt: string | null;
}

/**
 * Single donor-industry entry under
 * `politician_profiles.top_industries_current_cycle`. amount_usd is the
 * cycle-to-date cash from individuals + PACs in this industry per
 * OpenSecrets. Null when the industry surfaced but the dollar amount didn't.
 */
export interface IndustryDonation {
  industry: string;
  amount_usd: number | null;
}

/**
 * External-source links rendered as the citation footer of every dossier
 * section. All keys optional; the dossier renders only the ones it knows
 * about, plus any extras under their raw key. Same forward-compat shape as
 * `OutletExternalLinks`.
 */
export interface PoliticianExternalLinks {
  govtrack?: string;
  opensecrets?: string;
  votesmart?: string;
  ballotpedia?: string;
  wikipedia?: string;
  [key: string]: string | undefined;
}

/**
 * Curated politician metadata, mirrored from `politician_profiles` in
 * Postgres. Phase 3.A seeded a small sample; Phase 3.B fills out all 535
 * sitting Congress members via a GovTrack scrape; Phase 3.E enriches with
 * OpenSecrets donor data + Vote Smart interest-group ratings.
 *
 * `interestGroupRatings` is an open dictionary because rating-org acronyms
 * change over time (LCV, NRA, ADA, ACU, NEA, AFL-CIO, etc.). The UI renders
 * them as a key/value list without assuming any particular keys exist.
 */
/**
 * One advocacy group's published score for a member of Congress.
 *
 * **Not Sift's assessment.** Each entry is a named third party's own number,
 * shown with the year and a link to their page for that member — the same
 * treatment `outlet_profiles` gives AllSides and MBFC.
 *
 * `score`, `year` and `sourceUrl` are non-nullable by construction:
 * `lib/politician.ts:asInterestGroupRatings` drops any entry missing one,
 * the way `lib/org.ts` nulls the budget triple. An uncited rating about a
 * living person must never reach the page.
 */
export interface InterestGroupRating {
  /** Short form used as the on-page label, e.g. "LCV". */
  rater: string;
  /** Full organization name, e.g. "League of Conservation Voters". */
  raterName: string;
  score: number;
  /** Only "percent" today; present so a letter-grade rater can be added. */
  unit: string;
  year: number;
  /** Career-long score where the rater publishes one. */
  lifetimeScore: number | null;
  sourceUrl: string;
}

export interface PoliticianProfile {
  bioguideId: string;
  name: string;
  party: string | null;             // 'D' | 'R' | 'I' | other (kept as raw string)
  state: string | null;             // USPS code, e.g. 'NY'
  chamber: PoliticianChamber | null;
  committees: string[];
  topIndustriesCurrentCycle: IndustryDonation[];
  interestGroupRatings: InterestGroupRating[];
  externalLinks: PoliticianExternalLinks;
  notes: string | null;
  /**
   * Populated for executive / foreign-executive rows (migration 015); all
   * fields null for sitting Congress, whose provenance is committees + PAC
   * industries instead.
   */
  role: PoliticianRoleProvenance;
}

/**
 * Lite shape used by the civic index page (`/civic`). Just enough to render
 * the grouped-by-state list — full PoliticianProfile isn't worth pulling for
 * 536 rows when only five fields render. The query is `lib/db.ts`'s
 * `listAllPoliticiansLite`.
 */
export interface PoliticianListItem {
  bioguideId: string;
  name: string;
  party: string | null;
  state: string | null;
  chamber: PoliticianChamber | null;
}

/**
 * Lite shape for orgs on the civic index. Subset of OrgProfile.
 */
export interface OrgListItem {
  slug: string;
  name: string;
  type: OrgType | null;
}

/**
 * Lite shape for bills on the civic index. Subset of BillProfile.
 */
export interface BillListItem {
  billId: string;
  congress: number;
  shortTitle: string | null;
  status: BillStatus | null;
}

/**
 * Curated outlet metadata, mirrored from `outlet_profiles` in Postgres.
 * Hand-maintained quarterly. The dossier page (Phase 2.C) renders the full
 * shape; OutletBadge in feed cards renders only `name` + `allSidesRating`.
 *
 * Date fields are ISO YYYY-MM-DD strings (not Date) so Server Components can
 * serialize them straight to Client Components without rehydration loss.
 */
export interface OutletProfile {
  slug: string;
  name: string;
  parentCompany: string | null;
  parentCompanyUrl: string | null;
  foundedYear: number | null;
  fundingModel: OutletFundingModel | null;
  allSidesRating: OutletAllSidesRating | null;
  allSidesUrl: string | null;
  allSidesLastChecked: string | null;
  mbfcFactual: OutletMbfcRating | null;
  mbfcUrl: string | null;
  mbfcLastChecked: string | null;
  majorFunders: string[];
  externalLinks: OutletExternalLinks;
  notes: string | null;
}

// ─── Term dossier (`/term/[slug]`) ───────────────────────────────────

/**
 * A curated civic term: a sourced definition, plus the surface forms to match
 * in article text.
 *
 * Hand-written, though `articles.context_primer` already defines ~11,900
 * terms — because every one of those has `source: null`. An inline reading
 * aid attached to an article is one thing; a standalone page stating what a
 * legal term means is a claim on Sift's own authority, which is the defect
 * migrations 013 and 015 each had to remove. `lib/term.ts` drops the
 * definition if its source doesn't come with it.
 */
export interface TermProfile {
  slug: string;
  term: string;
  /**
   * Stored coverage count (migration 034), and when it was measured.
   *
   * The publish floor reads THESE, not a freshly computed figure, and does so
   * on the term page as well as in the sitemap — the two must agree or a page
   * emits noindex while the sitemap advertises it. `null` means never
   * measured, which the floor treats as zero rather than unknown.
   *
   * The page still renders live coverage. Only indexability is decided from
   * the stored number.
   */
  coverageArticleCount: number | null;
  coverageComputedAt: string | null;
  /** Never non-null without `definitionSource`. See lib/term.ts. */
  definition: string | null;
  definitionSource: string | null;
  /** ISO YYYY-MM-DD: when a human last read the source and confirmed this. */
  definitionChecked: string | null;
  /** Extra surface forms matched in article text, e.g. `["TPS"]`. */
  aliases: string[];
  category: string | null;
  notes: string | null;
}

/**
 * A term as it appears on `/glossary` — identity plus the two numbers the
 * list is sorted and argued by.
 *
 * `unnamedCount` is the interesting one: how many of a term's stories match
 * only through the primer, i.e. turn on the term without ever printing it.
 * Across the curated set that is 1,030 of 4,828 stories, and for some terms
 * every single one — which is the case for the route existing at all.
 */
export interface TermListItem {
  slug: string;
  term: string;
  category: string | null;
  articleCount: number;
  outletCount: number;
  unnamedCount: number;
  /** ISO YYYY-MM-DD the counts were measured. Rendered as "as of". */
  computedAt: string | null;
}

/** One outlet's share of a term's coverage, with its published lean. */
export interface TermOutletCoverage {
  sourceName: string;
  /** Null when the outlet has no curated dossier. */
  slug: string | null;
  articleCount: number;
  allSidesRating: OutletAllSidesRating | null;
  /** AllSides' own page for this outlet. Null means the rating is withheld. */
  allSidesUrl: string | null;
}

/**
 * How Sift's corpus covers a term. Computed at read time, stored nowhere.
 *
 * This half of the page needs no citation of its own: it is reportage about
 * Sift's own index — a count of articles we hold and who published them —
 * not a claim about the world. Every number here is a link away from the
 * articles it counts.
 */
export interface TermCoverage {
  articleCount: number;
  outlets: TermOutletCoverage[];
  /** Publication dates of the oldest and newest match, ISO YYYY-MM-DD. */
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface ContextPrimerTerm {
  term: string;
  definition: string;
  source?: string;
  /**
   * Optional dossier link, server-attached at API time when the term text
   * contains a curated entity from the article's `entity_links`. Lets the
   * primer's "FCC petition" or "Schumer" surface link straight into the
   * civic graph (org / politician / bill / outlet dossier) rather than
   * stopping at a definition. Phase 3.G.4.
   */
  link?: PrimerTermLink;
}

/**
 * Minimal pointer to a curated entity dossier — same shape used by
 * `EntityLink` minus the `surfaceForm` (the primer term text already
 * doubles as the link's display label).
 */
export interface PrimerTermLink {
  type: EntityLinkType;
  canonicalId: string;
}

export interface ContextPrimer {
  background: string;
  terms: ContextPrimerTerm[];
  generated_at?: string;
}

export interface ReadingLevels {
  simpler?: { headline?: string; summary?: string };
  detailed?: { headline?: string; summary?: string };
  generated_at?: string;
}

// ─── Story Types ────────────────────────────────────────

export interface StoryFraming {
  sourceName: string;
  framing: string;
  tone: "neutral" | "urgent" | "analytical" | "critical" | "optimistic";
  /**
   * Outlet provenance — civic-literacy MVP Phase 2.C.2. Resolved at the API
   * boundary by mapping `sourceName` through `source_name_aliases` →
   * `outlet_profiles`. Drives the cross-spectrum bucketing + dossier link
   * inside CrossSpectrumCompare. Null/undefined when the source_name has no
   * curated outlet (graceful degradation: fallback to the flat list).
   */
  outlet?: OutletProfile | null;
}

export interface EntitySet {
  people: string[];
  organizations: string[];
  locations: string[];
  eventDescription: string;
}

export interface Story {
  id: string;
  headline: string;
  summary: string;
  category: CategoryId;
  framings: StoryFraming[];
  entities: EntitySet[];
  /** Member articles. What the card displays — "N articles" stays literal. */
  articleCount: number;
  /**
   * Distinct outlets among the members. What the corroboration curve ranks
   * on, in both the SQL pool and the client re-rank. Separate from
   * articleCount because one high-volume outlet filing four pieces is not
   * four-outlet corroboration (see STORY_BOOST in lib/db.ts).
   */
  outletCount: number;
  imageUrl: string | null;
  publishedDate: string | null;
  articles: Article[];
  /**
   * Derived at the API boundary: "grim" when ≥ half the member articles are
   * tagged grim (see ArticleTone — distinct from StoryFraming["tone"]).
   * Feeds the D48 dampener for thinly-corroborated grim stories.
   */
  tone?: ArticleTone;
  /** Derived at the API boundary: >= half the members are opinion pieces. */
  isOpinion?: boolean;
  /**
   * Mean importance of the live member articles (1-5) — the story's base
   * significance since stage 7. Corroboration multiplies this rather than
   * standing in for it, so wire pickup of a local tragedy no longer reads
   * as a major event. Unscored members are averaged in at the center, so
   * they abstain rather than handing the story to whoever was scored.
   *
   * Absent means no importance signal at all, which the re-rank scores as
   * neutral. The API omits it rather than substituting a default, so that
   * "neutral" is defined in exactly one place.
   */
  avgImportance?: number;
  /**
   * Highest member importance (1-5). Floors the stage-7 significance so one
   * genuinely important article is not averaged into invisibility by minor
   * co-members — gated at 4, because an unconditional floor would restore the
   * single-outlet leverage the mean was chosen to remove. See
   * STORY_FLOOR_MIN_IMPORTANCE in lib/db.ts.
   *
   * Absent when no member carries a score — only a member somebody actually
   * scored may trip the floor, so absence switches it off.
   */
  maxImportance?: number;
  /**
   * Distinct L/C/R AllSides buckets occupied by this story's framings (1-3;
   * absent when none are bucketable). Derived at the API boundary via
   * countOccupiedBuckets. Ranking v2 stage 1: the client re-rank applies a
   * small corroboration bonus per bucket beyond the first.
   */
  spectrumBuckets?: number;
}

export type FeedItem =
  | { type: "article"; data: Article }
  | { type: "story"; data: Story };

// ─── API Types ──────────────────────────────────────────

/** Shape of /api/news response */
export interface NewsApiResponse {
  articles: Article[];
  stories: Story[];
  cached: boolean;
  fetchedAt: string;
}

export interface NewsApiError {
  error: string;
  details?: string;
}

/** Shape of /api/news/topic response */
export interface TopicSearchResponse {
  articles: Article[];
  matchQuality: "strong" | "weak";
  fallbackUsed: boolean;
  query: string;
}

/** Shape of /api/compare response */
export interface CompareClaim {
  claim: string;
  agreement: "unanimous" | "majority" | "disputed" | "unique";
  sources?: string[];
  sources_for?: string[];
  sources_against?: string[];
}

export interface CompareResponse {
  topic: string;
  comparison: string;
  sources_checked: string[];
  claims: CompareClaim[];
  duration_ms: number;
}

/**
 * The anonymous daily compare example — one real comparison per UTC day,
 * generated by sift-api after a pipeline run (daily_compare_example table,
 * sift-api migration 021). Served to signed-out visitors and the landing
 * page's comparison section, always labeled with when it was generated.
 */
export interface DailyCompareExample extends CompareResponse {
  generatedAt: string; // ISO timestamp
}

/** Per-source completion signal from the compare SSE stream. */
export interface CompareSourceDone {
  source: string;
  found: boolean;
}

// ─── Funding edges (990 Schedule I / R) ────────────────

/**
 * One filed relationship between two organizations, from `funding_edges`
 * (sift-api migration 027). Always self-reported by the payer/declarer —
 * there are no inferred edges — and always carries the filing it came from.
 */
export interface FundingEdge {
  targetEin: string | null;
  /** Verbatim as filed. Never replaced with the IRS spelling. */
  targetNameAsFiled: string | null;
  /** The IRS's own name for that EIN, when the index knows it. */
  targetNameIrs: string | null;
  amountUsd: number | null;
  purpose: string | null;
  exemptCode: string | null;
  /** YYYYMM of the filing's tax period. */
  fiscalPeriod: string;
  form: string;
  filingUrl: string;
}

/**
 * An org's outbound edges, already filtered to the publishable set.
 *
 * The withheld counts are deliberately surfaced rather than hidden, and kept
 * apart rather than summed: a name that disagrees with the IRS record and an
 * EIN that isn't in the filer index are different facts, and a page that
 * explains one as the other is the confident-but-wrong failure the
 * `ein_name_agrees` check exists to prevent.
 */
export interface OrgFundingEdges {
  grants: FundingEdge[];
  related: FundingEdge[];
  /** Filed name disagrees with the IRS record for that EIN — needs a human. */
  heldForReview: number;
  /** EIN absent from the IRS e-filer index — nothing to check against. */
  heldEinAbsent: number;
  /**
   * Withheld under a verdict this repo has no wording for — sift-api owns the
   * vocabulary and can extend it independently. Counted so a new verdict
   * withholds rows loudly instead of silently.
   */
  heldOther: number;
  /** Distinct fiscal periods represented, newest first. */
  fiscalPeriods: string[];
}

// ─── SSE Event Types (topic search streaming) ──────────

export interface SSEResultsEvent {
  articles: Article[];
  source: "vector" | "web-search";
}

export interface SSEDoneEvent {
  matchQuality: "strong" | "weak";
  fallbackUsed: boolean;
  query: string;
}

export interface SSEErrorEvent {
  message: string;
}

// ─── Component Props ────────────────────────────────────

export interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  onBookmark: (id: string) => void;
  isBookmarked: boolean;
  index: number;
  onCompare?: (topic: string, sourceName?: string) => void;
}

export interface StoryCardProps {
  story: Story;
  featured?: boolean;
  onBookmark: (id: string) => void;
  bookmarks: Set<string>;
  index: number;
  onCompare?: (topic: string, sourceName?: string) => void;
}

export interface CardImageProps {
  src: string | null;
  alt: string;
  featured?: boolean;
  category: CategoryId;
}

export interface SkeletonCardProps {
  featured?: boolean;
}

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

// ─── Compare Source Types ───────────────────────────────

export interface CompareSource {
  key: string;
  label: string;
}

// ─── Custom Topic Types ────────────────────────────────

export interface CustomTopic {
  id: string;
  rawInput: string;
  shortLabel: string;
  icon: string;
  searchQueries: string[];
  description: string;
  createdAt: string;
  colorIndex: number;
}

export interface TopicGenerateResponse {
  shortLabel: string;
  icon: string;
  searchQueries: string[];
  description: string;
}

// ─── State Types ────────────────────────────────────────

export interface ArticleCache {
  [key: string]: Article[];
}

export interface StoryCache {
  [key: string]: Story[];
}
