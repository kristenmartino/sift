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
export interface OrgProfile {
  slug: string;
  name: string;
  type: OrgType | null;
  politicalLean: OrgPoliticalLean | null;
  foundedYear: number | null;
  annualBudgetUsd: number | null;
  majorFunders: string[];
  faraRegistered: boolean;
  faraCountries: string[];
  externalLinks: OrgExternalLinks;
  notes: string | null;
}

// ─── Politician Provenance (Phase 3.C) ─────────────────

/**
 * Chambers a curated politician can sit in. Mirrors the values stored in
 * `politician_profiles.chamber`; the seed scripts validate against this set.
 */
export type PoliticianChamber = "senate" | "house" | "former" | "executive";

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
export interface PoliticianProfile {
  bioguideId: string;
  name: string;
  party: string | null;             // 'D' | 'R' | 'I' | other (kept as raw string)
  state: string | null;             // USPS code, e.g. 'NY'
  chamber: PoliticianChamber | null;
  committees: string[];
  topIndustriesCurrentCycle: IndustryDonation[];
  interestGroupRatings: Record<string, number | string>;
  externalLinks: PoliticianExternalLinks;
  notes: string | null;
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

export interface ContextPrimerTerm {
  term: string;
  definition: string;
  source?: string;
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
  articleCount: number;
  imageUrl: string | null;
  publishedDate: string | null;
  articles: Article[];
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
