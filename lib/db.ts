import { Pool } from "pg";

import { parseDbOrgProfile, type DbOrgProfileRow } from "./org";
import { parseDbBillProfile, type DbBillProfileRow } from "./bill";
import { parseDbOutletProfile, type DbOutletProfileRow } from "./outlet";
import {
  parseDbPoliticianProfile,
  type DbPoliticianProfileRow,
} from "./politician";
import {
  computeOutletStats,
  EMPTY_OUTLET_STATS,
  type OutletStats,
} from "./outletStats";
import type {
  BillListItem,
  BillProfile,
  OrgListItem,
  OrgProfile,
  OutletProfile,
  PoliticianListItem,
  PoliticianProfile,
} from "./types";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const isLocalhost = process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  ...(!isLocalhost && {
    ssl: { rejectUnauthorized: true },
  }),
});

export interface DbArticle {
  id: string;
  title: string;
  summary: string | null;
  source_url: string;
  source_name: string;
  image_url: string | null;
  category: string;
  published_date: Date | null;
  read_time: number;
  why_it_matters: string | null;
  importance_score: number | null;
  created_at: Date;
  // Civic-literacy MVP additions. Both columns added in
  // sift-api/migrations/005_context_primer_and_reading_levels.sql.
  // context_primer is populated by Phase 1A primer_generator;
  // reading_levels is reserved for Phase 1B (always NULL today).
  // pg returns JSONB as already-parsed objects, so type as `unknown`
  // here and validate at the API boundary via lib/primer.ts.
  context_primer: unknown;
  reading_levels: unknown;
}

export async function getArticlesByCategory(
  category: string,
  limit = 30
): Promise<DbArticle[]> {
  const result = await pool.query<DbArticle>(
    `SELECT id, title, summary, source_url, source_name, image_url,
            category, published_date, read_time, why_it_matters, importance_score, context_primer, reading_levels, created_at
     FROM articles
     WHERE category = $1 AND from_search = false
       AND summary IS NOT NULL AND summary != ''
       AND LOWER(summary) NOT LIKE 'unable to provide%'
     ORDER BY
       COALESCE(importance_score, 3)::float *
       EXP(-LEAST(EXTRACT(EPOCH FROM (NOW() - COALESCE(published_date, created_at))) / 86400.0, 700))
     DESC NULLS LAST
     LIMIT $2`,
    [category, limit]
  );
  return result.rows;
}

// ─── Stories ──────────────────────────────────────────

export interface DbStory {
  id: string;
  headline: string;
  summary: string;
  category: string;
  framings: unknown; // JSONB — parsed at API layer
  entities: unknown; // JSONB
  article_count: number;
  representative_image_url: string | null;
  published_date: Date | null;
  synthesis_status: string;
}

export interface DbStoryArticle extends DbArticle {
  story_id: string | null;
}

export async function getStoriesWithArticles(
  category: string
): Promise<{ stories: DbStory[]; storyArticles: Record<string, DbStoryArticle[]>; standaloneArticles: DbArticle[] }> {
  // 1. Try to get stories with LIVE article counts (gracefully handle missing table).
  //
  // Story IDs are content-addressable (sha256 of member article IDs), so when
  // clustering shifts between refreshes the old story_id becomes orphaned:
  // the `stories` row persists with a stale `article_count`, but zero articles
  // reference it. Using the stored `article_count` ranks orphans highly and
  // shows "View 0 articles" in the UI. Instead, compute the live count via
  // LEFT JOIN, drop orphans with `HAVING >= 2`, and rank by the live count.
  let stories: DbStory[] = [];
  try {
    const storiesResult = await pool.query<DbStory>(
      `SELECT s.id, s.headline, s.summary, s.category, s.framings, s.entities,
              COUNT(a.id)::int AS article_count,
              s.representative_image_url, s.published_date, s.synthesis_status
       FROM stories s
       LEFT JOIN articles a
         ON a.story_id = s.id
         AND a.from_search = false
         AND a.summary IS NOT NULL AND a.summary != ''
         AND LOWER(a.summary) NOT LIKE 'unable to provide%'
       WHERE s.category = $1 AND s.synthesis_status = 'complete'
       GROUP BY s.id
       HAVING COUNT(a.id) >= 2
       ORDER BY
         COUNT(a.id)::float *
         EXP(-LEAST(EXTRACT(EPOCH FROM (NOW() - COALESCE(s.published_date, s.created_at))) / 86400.0, 700))
       DESC NULLS LAST
       LIMIT 20`,
      [category]
    );
    stories = storiesResult.rows;
  } catch (err) {
    // stories table may not exist yet — fall back to articles-only
    const msg = String(err);
    if (!msg.includes("does not exist")) throw err;
  }

  const storyIds = stories.map((s) => s.id);

  // 2a. Fetch ALL articles that belong to the selected stories. Using a top-N
  // article limit would drop story members that don't rank in the top-N by
  // importance × recency, producing empty story.articles and "View 0 articles"
  // on the frontend.
  const storyArticles: Record<string, DbStoryArticle[]> = {};
  if (storyIds.length > 0) {
    try {
      const storyArticlesResult = await pool.query<DbStoryArticle>(
        `SELECT id, title, summary, source_url, source_name, image_url,
                category, published_date, read_time, why_it_matters, importance_score, context_primer, reading_levels, created_at, story_id
         FROM articles
         WHERE story_id = ANY($1::text[])
           AND from_search = false
           AND summary IS NOT NULL AND summary != ''
           AND LOWER(summary) NOT LIKE 'unable to provide%'
         ORDER BY published_date DESC NULLS LAST`,
        [storyIds]
      );
      for (const row of storyArticlesResult.rows) {
        if (!row.story_id) continue;
        if (!storyArticles[row.story_id]) storyArticles[row.story_id] = [];
        storyArticles[row.story_id].push(row);
      }
    } catch (err) {
      // story_id column may not exist — tolerate and fall through to articles-only path.
      const msg = String(err);
      if (!msg.includes("story_id") && !msg.includes("does not exist")) throw err;
    }
  }

  // 2b. Fetch standalone articles for the feed. An article is "standalone"
  // when its story_id is NULL *or* when its story_id points to a story that
  // was dropped in step 1 (orphan: fewer than 2 live member articles). This
  // prevents orphan articles from disappearing entirely from the feed.
  let standaloneArticles: DbArticle[] = [];
  try {
    const standaloneResult = await pool.query<DbArticle>(
      `SELECT id, title, summary, source_url, source_name, image_url,
              category, published_date, read_time, why_it_matters, importance_score, context_primer, reading_levels, created_at
       FROM articles
       WHERE category = $1 AND from_search = false
         AND (story_id IS NULL OR story_id <> ALL($2::text[]))
         AND summary IS NOT NULL AND summary != ''
         AND LOWER(summary) NOT LIKE 'unable to provide%'
       ORDER BY
         COALESCE(importance_score, 3)::float *
         EXP(-LEAST(EXTRACT(EPOCH FROM (NOW() - COALESCE(published_date, created_at))) / 86400.0, 700))
       DESC NULLS LAST
       LIMIT 50`,
      [category, storyIds]
    );
    standaloneArticles = standaloneResult.rows;
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("story_id")) throw err;
    const fallback = await pool.query<DbArticle>(
      `SELECT id, title, summary, source_url, source_name, image_url,
              category, published_date, read_time, why_it_matters, importance_score, context_primer, reading_levels, created_at
       FROM articles
       WHERE category = $1 AND from_search = false
         AND summary IS NOT NULL AND summary != ''
         AND LOWER(summary) NOT LIKE 'unable to provide%'
       ORDER BY
         COALESCE(importance_score, 3)::float *
         EXP(-LEAST(EXTRACT(EPOCH FROM (NOW() - COALESCE(published_date, created_at))) / 86400.0, 700))
       DESC NULLS LAST
       LIMIT 50`,
      [category]
    );
    return { stories: [], storyArticles: {}, standaloneArticles: fallback.rows };
  }

  return { stories, storyArticles, standaloneArticles };
}

// ─── Landing ───────────────────────────────────────────

/**
 * Fetch a single hero-quality article for the marketing landing page.
 * Prefers articles that (a) have an image, (b) sit in the "top" category,
 * and (c) rank high on importance × recency. Returns null if the DB has
 * nothing usable — caller renders a fallback layout.
 */
export async function getTopStoryForLanding(): Promise<DbArticle | null> {
  try {
    const result = await pool.query<DbArticle>(
      `SELECT id, title, summary, source_url, source_name, image_url,
              category, published_date, read_time, why_it_matters, importance_score, context_primer, reading_levels, created_at
       FROM articles
       WHERE category = 'top'
         AND from_search = false
         AND image_url IS NOT NULL
         AND summary IS NOT NULL AND summary != ''
         AND LOWER(summary) NOT LIKE 'unable to provide%'
       ORDER BY
         COALESCE(importance_score, 3)::float *
         EXP(-LEAST(EXTRACT(EPOCH FROM (NOW() - COALESCE(published_date, created_at))) / 86400.0, 700))
       DESC NULLS LAST
       LIMIT 1`
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getLastRefreshed(category: string): Promise<Date | null> {
  const result = await pool.query(
    "SELECT last_refreshed_at FROM pipeline_state WHERE category = $1",
    [category]
  );
  return result.rows[0]?.last_refreshed_at ?? null;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// ─── Bookmarks ─────────────────────────────────────────

export async function getBookmarks(userId: string): Promise<string[]> {
  const result = await pool.query<{ article_id: string }>(
    "SELECT article_id FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows.map((r) => r.article_id);
}

export async function addBookmark(userId: string, articleId: string): Promise<void> {
  await pool.query(
    "INSERT INTO bookmarks (user_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [userId, articleId]
  );
}

export async function removeBookmark(userId: string, articleId: string): Promise<void> {
  await pool.query(
    "DELETE FROM bookmarks WHERE user_id = $1 AND article_id = $2",
    [userId, articleId]
  );
}

export async function getBookmarkedArticles(userId: string): Promise<DbArticle[]> {
  const result = await pool.query<DbArticle>(
    `SELECT a.id, a.title, a.summary, a.source_url, a.source_name, a.image_url,
            a.category, a.published_date, a.read_time, a.why_it_matters, a.importance_score,
            a.context_primer, a.reading_levels, a.created_at
     FROM articles a
     JOIN bookmarks b ON b.article_id = a.id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// ─── Vector Search ─────────────────────────────────────

export interface DbArticleWithSimilarity extends DbArticle {
  similarity: number;
}

function toVectorString(embedding: number[]): string {
  for (let i = 0; i < embedding.length; i++) {
    if (typeof embedding[i] !== "number" || !Number.isFinite(embedding[i])) {
      throw new Error(`Invalid embedding value at index ${i}: ${embedding[i]}`);
    }
  }
  return `[${embedding.join(",")}]`;
}

export async function searchArticlesByEmbedding(
  embedding: number[],
  similarityThreshold = 0.35,
  limit = 10
): Promise<DbArticleWithSimilarity[]> {
  const vectorStr = toVectorString(embedding);
  const result = await pool.query<DbArticle & { similarity: number }>(
    `SELECT id, title, summary, source_url, source_name, image_url,
            category, published_date, read_time, why_it_matters, importance_score, context_primer, reading_levels, created_at,
            1 - (embedding <=> $1::vector) AS similarity
     FROM articles
     WHERE embedding IS NOT NULL
       AND 1 - (embedding <=> $1::vector) > $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [vectorStr, similarityThreshold, limit]
  );
  return result.rows;
}

export async function insertArticle(article: {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  category: string;
  embedding: number[];
  published_date?: Date | null;
  image_url?: string | null;
  read_time?: number;
}): Promise<void> {
  const vectorStr = toVectorString(article.embedding);
  await pool.query(
    `INSERT INTO articles (id, title, summary, source_url, source_name, image_url,
                           category, published_date, embedding, read_time, from_search)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector, $10, true)
     ON CONFLICT (source_url) DO NOTHING`,
    [
      article.id,
      article.title,
      article.summary,
      article.source_url,
      article.source_name,
      article.image_url || null,
      article.category,
      article.published_date || null,
      vectorStr,
      article.read_time || 1,
    ]
  );
}

// ─── Custom Topics ────────────────────────────────────

export interface DbCustomTopic {
  id: string;
  user_id: string;
  name: string;
  query: string; // JSON-encoded CustomTopic data
  created_at: Date;
}

export async function getCustomTopics(userId: string): Promise<DbCustomTopic[]> {
  const result = await pool.query<DbCustomTopic>(
    "SELECT id, user_id, name, query, created_at FROM custom_topics WHERE user_id = $1 ORDER BY created_at ASC",
    [userId]
  );
  return result.rows;
}

export async function saveCustomTopic(
  id: string,
  userId: string,
  name: string,
  topicJson: string
): Promise<void> {
  await pool.query(
    `INSERT INTO custom_topics (id, user_id, name, query)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, name) DO UPDATE SET query = $4`,
    [id, userId, name, topicJson]
  );
}

export async function deleteCustomTopic(id: string, userId: string): Promise<void> {
  await pool.query(
    "DELETE FROM custom_topics WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}

// ─── Outlet Provenance (Phase 2.B) ─────────────────────

/**
 * Lookup map: lowercase `articles.source_name` → curated `OutletProfile`.
 *
 * Built from two relations:
 *   1. `source_name_aliases` — explicit, hand-curated raw_source_name → outlet_slug
 *   2. `outlet_profiles.LOWER(name)` — implicit fallback for outlets whose
 *      RSS source_name happens to match the canonical name verbatim
 *
 * Aliases beat name-fallback when both are present for the same key.
 *
 * Cached at the module level for `OUTLET_CACHE_TTL_MS`. The underlying tables
 * change quarterly (manual hand-curation), so a stale cache is harmless. If
 * either table is missing (typical until sift-api Phase 2.A.1 lands in prod),
 * `getOutletProfilesMap` returns an empty Map and the API mapping degrades to
 * outlet=null, which OutletBadge renders as plain source-name text.
 */
const OUTLET_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let outletCache: { data: Map<string, OutletProfile>; expiresAt: number } | null = null;
let outletCacheInflight: Promise<Map<string, OutletProfile>> | null = null;

async function loadOutletProfilesMap(): Promise<Map<string, OutletProfile>> {
  const out = new Map<string, OutletProfile>();
  let profilesBySlug: Map<string, OutletProfile>;

  // 1. Load all outlet_profiles. Tolerate missing table.
  try {
    const result = await pool.query<DbOutletProfileRow>(
      `SELECT slug, name, parent_company, parent_company_url, founded_year,
              funding_model, allsides_rating, allsides_url, allsides_last_checked,
              mbfc_factual, mbfc_url, mbfc_last_checked,
              major_funders, external_links, notes
       FROM outlet_profiles`
    );
    profilesBySlug = new Map();
    for (const row of result.rows) {
      const profile = parseDbOutletProfile(row);
      if (!profile) continue;
      profilesBySlug.set(profile.slug, profile);
      // Implicit name-match fallback (case-insensitive, trimmed).
      out.set(profile.name.trim().toLowerCase(), profile);
    }
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("does not exist")) throw err;
    // outlet_profiles missing — return empty map; aliases lookup also pointless.
    return out;
  }

  // 2. Layer source_name_aliases on top. Tolerate missing table.
  try {
    const result = await pool.query<{ raw_source_name: string; outlet_slug: string }>(
      `SELECT raw_source_name, outlet_slug FROM source_name_aliases`
    );
    for (const { raw_source_name, outlet_slug } of result.rows) {
      const profile = profilesBySlug.get(outlet_slug);
      if (!profile) continue; // orphan alias; FK should prevent this but defend anyway
      out.set(raw_source_name.trim().toLowerCase(), profile);
    }
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("does not exist")) throw err;
    // source_name_aliases missing — fall through with name-only matches.
  }

  return out;
}

/**
 * Returns the cached source_name → OutletProfile map, refreshing if expired.
 * Concurrent callers share a single in-flight fetch promise to avoid
 * duplicate DB round-trips on cold starts.
 */
export async function getOutletProfilesMap(): Promise<Map<string, OutletProfile>> {
  const now = Date.now();
  if (outletCache && outletCache.expiresAt > now) return outletCache.data;
  if (outletCacheInflight) return outletCacheInflight;

  outletCacheInflight = loadOutletProfilesMap()
    .then((data) => {
      outletCache = { data, expiresAt: Date.now() + OUTLET_CACHE_TTL_MS };
      return data;
    })
    .catch((err) => {
      console.error("getOutletProfilesMap: failed to load", err);
      // Don't cache failure; next caller will retry. Return empty map so the
      // API still serves articles, just without outlet provenance.
      return new Map<string, OutletProfile>();
    })
    .finally(() => {
      outletCacheInflight = null;
    });

  return outletCacheInflight;
}

/**
 * Resolve a single source_name to an OutletProfile via the cached map.
 * Returns null when no alias/name match exists. Does not hit the DB itself.
 */
export function resolveOutletForSourceName(
  outletMap: Map<string, OutletProfile>,
  sourceName: string | null | undefined,
): OutletProfile | null {
  if (!sourceName) return null;
  return outletMap.get(sourceName.trim().toLowerCase()) ?? null;
}

/** Test-only: reset the cache between unit-test runs. */
export function _resetOutletCacheForTesting(): void {
  outletCache = null;
  outletCacheInflight = null;
}

// ─── Methodology page (Phase 2.D) ──────────────────────

/**
 * Fetch every curated outlet, sorted alphabetically by name. Used by the
 * methodology page to render the live list of outlets Sift reads from.
 *
 * Returns [] when outlet_profiles doesn't exist (graceful degradation —
 * the methodology page falls back to its prose explanation without the
 * outlet list).
 */
export async function getAllOutletProfiles(): Promise<OutletProfile[]> {
  try {
    const result = await pool.query<DbOutletProfileRow>(
      `SELECT slug, name, parent_company, parent_company_url, founded_year,
              funding_model, allsides_rating, allsides_url, allsides_last_checked,
              mbfc_factual, mbfc_url, mbfc_last_checked,
              major_funders, external_links, notes
       FROM outlet_profiles
       ORDER BY LOWER(name)`
    );
    const out: OutletProfile[] = [];
    for (const row of result.rows) {
      const profile = parseDbOutletProfile(row);
      if (profile) out.push(profile);
    }
    return out;
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return [];
    throw err;
  }
}

/**
 * Spectrum stats for the curated outlet set — the single server-side source
 * for outlet-count copy (issue #153), read from the same `outlet_profiles`
 * table as the public outlet list. Fully graceful: any DB/table miss degrades
 * to all-zero stats so callers fall back to count-free, still-truthful copy
 * rather than rendering "0".
 */
export async function getOutletStats(): Promise<OutletStats> {
  try {
    return computeOutletStats(await getAllOutletProfiles());
  } catch {
    return { ...EMPTY_OUTLET_STATS };
  }
}

// ─── Entity Links (Phase 3.H) ──────────────────────────

/**
 * Batch-fetch entity_links JSONB for a set of article IDs. Returns a
 * Map keyed on article id for O(1) lookup at API mapping time.
 *
 * Defensive: catches "column entity_links does not exist" so this code
 * is safe to deploy before sift-api Phase 3.G's migration lands in
 * prod. Articles whose ids aren't in the result map render with empty
 * entityLinks (graceful degradation — EntityLinksList renders nothing).
 */
export async function getArticleEntityLinks(
  articleIds: string[],
): Promise<Map<string, unknown>> {
  if (articleIds.length === 0) return new Map();

  try {
    const result = await pool.query<{ id: string; entity_links: unknown }>(
      `SELECT id, entity_links FROM articles WHERE id = ANY($1::text[])`,
      [articleIds]
    );
    return new Map(result.rows.map((r) => [r.id, r.entity_links]));
  } catch (err) {
    const msg = String(err);
    if (msg.includes("entity_links") && msg.includes("does not exist")) {
      // Pre-Phase-3.G prod — column not yet added. Fall through with
      // empty map; the UI renders no glossary section.
      return new Map();
    }
    throw err;
  }
}

// ─── Politician Dossier (Phase 3.C) ────────────────────

/**
 * Fetch a single politician profile by bioguide_id (Congress.gov canonical
 * identifier, e.g. 'S000148' for Schumer). Returns null when the bioguide
 * isn't curated (caller should call notFound() for the dossier route) or
 * when the politician_profiles table doesn't exist yet (graceful for
 * pre-Phase-3.A-merge prod).
 */
export async function getPoliticianByBioguide(
  bioguideId: string,
): Promise<PoliticianProfile | null> {
  const trimmed = bioguideId.trim().toUpperCase();
  if (!trimmed) return null;

  try {
    const result = await pool.query<DbPoliticianProfileRow>(
      `SELECT bioguide_id, name, party, state, chamber,
              committees, top_industries_current_cycle, interest_group_ratings,
              external_links, notes
       FROM politician_profiles
       WHERE bioguide_id = $1
       LIMIT 1`,
      [trimmed]
    );
    if (result.rows.length === 0) return null;
    return parseDbPoliticianProfile(result.rows[0]);
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return null;
    throw err;
  }
}

// ─── Org Dossier (Phase 3.D) ───────────────────────────

/**
 * Fetch a single org profile by slug (e.g. 'brookings-institution').
 * Returns null when the slug isn't curated (caller should call
 * notFound() for the dossier route) or when the org_profiles table
 * doesn't exist yet.
 */
export async function getOrgBySlug(slug: string): Promise<OrgProfile | null> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const result = await pool.query<DbOrgProfileRow>(
      `SELECT slug, name, type, political_lean, founded_year,
              annual_budget_usd, major_funders, fara_registered,
              fara_countries, external_links, notes
       FROM org_profiles
       WHERE slug = $1
       LIMIT 1`,
      [trimmed]
    );
    if (result.rows.length === 0) return null;
    return parseDbOrgProfile(result.rows[0]);
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return null;
    throw err;
  }
}

// ─── Bill Dossier (Phase 3.E) ──────────────────────────

/**
 * Fetch a single bill profile by canonical id (e.g. 'hr-5376-117').
 * Returns null when the bill_id isn't curated or when the bill_profiles
 * table doesn't exist yet. The route's notFound() renders the global
 * 404 page on null.
 */
export async function getBillById(billId: string): Promise<BillProfile | null> {
  const trimmed = billId.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const result = await pool.query<DbBillProfileRow>(
      `SELECT bill_id, congress, title, short_title, sponsor_bioguide,
              cosponsors, status, introduced_date,
              lobbying_for_usd, lobbying_against_usd,
              external_links, notes
       FROM bill_profiles
       WHERE bill_id = $1
       LIMIT 1`,
      [trimmed]
    );
    if (result.rows.length === 0) return null;
    return parseDbBillProfile(result.rows[0]);
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return null;
    throw err;
  }
}

// ─── Civic dossier index (`/civic`) ────────────────────

/**
 * Lite list of every curated politician for the civic index page. Pulls
 * only the five fields the index actually renders (no committees / industries
 * / etc.) so 536 rows fit in a small payload.
 *
 * Sorted by state then name so the index can group by state without a
 * second sort pass on the client.
 *
 * Tolerates missing tables (returns []).
 */
export async function listAllPoliticiansLite(): Promise<PoliticianListItem[]> {
  try {
    const result = await pool.query<{
      bioguide_id: string;
      name: string;
      party: string | null;
      state: string | null;
      chamber: string | null;
    }>(
      `SELECT bioguide_id, name, party, state, chamber
       FROM politician_profiles
       ORDER BY state ASC NULLS LAST, name ASC`,
    );
    return result.rows.map((r) => ({
      bioguideId: r.bioguide_id,
      name: r.name,
      party: r.party?.trim() || null,
      state: r.state?.trim() || null,
      chamber: (r.chamber as PoliticianListItem["chamber"]) ?? null,
    }));
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return [];
    throw err;
  }
}

/**
 * Lite list of every curated org for the civic index page. Sorted by type
 * then name so the index can group by type without re-sorting client-side.
 */
export async function listAllOrgsLite(): Promise<OrgListItem[]> {
  try {
    const result = await pool.query<{
      slug: string;
      name: string;
      type: string | null;
      political_lean: string | null;
    }>(
      `SELECT slug, name, type, political_lean
       FROM org_profiles
       ORDER BY type ASC NULLS LAST, name ASC`,
    );
    return result.rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      type: (r.type as OrgListItem["type"]) ?? null,
      politicalLean: (r.political_lean as OrgListItem["politicalLean"]) ?? null,
    }));
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return [];
    throw err;
  }
}

/**
 * Lite list of every curated bill for the civic index page. Currently only
 * one bill (HR 5376-117 / IRA) — sorted newest-introduced-first to age well
 * as more land.
 */
export async function listAllBillsLite(): Promise<BillListItem[]> {
  try {
    const result = await pool.query<{
      bill_id: string;
      congress: number;
      short_title: string | null;
      status: string | null;
    }>(
      `SELECT bill_id, congress, short_title, status
       FROM bill_profiles
       ORDER BY introduced_date DESC NULLS LAST, bill_id ASC`,
    );
    return result.rows.map((r) => ({
      billId: r.bill_id,
      congress: r.congress,
      shortTitle: r.short_title?.trim() || null,
      status: (r.status as BillListItem["status"]) ?? null,
    }));
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return [];
    throw err;
  }
}

// ─── Outlet Dossier (Phase 2.C.1) ──────────────────────

/**
 * Fetch a single outlet profile by slug. Returns null when the slug isn't
 * curated (caller should call notFound() for the dossier route) or when the
 * outlet_profiles table doesn't exist yet (pre-Phase-2.A-merge prod).
 */
export async function getOutletBySlug(slug: string): Promise<OutletProfile | null> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const result = await pool.query<DbOutletProfileRow>(
      `SELECT slug, name, parent_company, parent_company_url, founded_year,
              funding_model, allsides_rating, allsides_url, allsides_last_checked,
              mbfc_factual, mbfc_url, mbfc_last_checked,
              major_funders, external_links, notes
       FROM outlet_profiles
       WHERE slug = $1
       LIMIT 1`,
      [trimmed]
    );
    if (result.rows.length === 0) return null;
    return parseDbOutletProfile(result.rows[0]);
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return null;
    throw err;
  }
}

/**
 * Fetch the N most recent articles published by an outlet, identified by
 * slug. Resolves the slug → set of source_names via `source_name_aliases`
 * (explicit) ∪ `outlet_profiles.name` (implicit fallback), then queries
 * articles whose lower-cased source_name lands in that set.
 *
 * Tolerates missing tables (returns []) so the dossier can render the
 * outlet's static metadata even before sift-api Phase 2.A.1 lands in prod.
 */
export async function getRecentArticlesByOutletSlug(
  slug: string,
  limit = 20
): Promise<DbArticle[]> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return [];

  try {
    const result = await pool.query<DbArticle>(
      `WITH outlet_source_names AS (
         SELECT LOWER(name) AS sn
         FROM outlet_profiles
         WHERE slug = $1
         UNION
         SELECT LOWER(raw_source_name) AS sn
         FROM source_name_aliases
         WHERE outlet_slug = $1
       )
       SELECT id, title, summary, source_url, source_name, image_url,
              category, published_date, read_time, why_it_matters, importance_score,
              context_primer, reading_levels, created_at
       FROM articles
       WHERE LOWER(source_name) IN (SELECT sn FROM outlet_source_names)
         AND from_search = false
         AND summary IS NOT NULL AND summary != ''
         AND LOWER(summary) NOT LIKE 'unable to provide%'
       ORDER BY COALESCE(published_date, created_at) DESC NULLS LAST
       LIMIT $2`,
      [trimmed, limit]
    );
    return result.rows;
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return [];
    throw err;
  }
}

export default pool;
