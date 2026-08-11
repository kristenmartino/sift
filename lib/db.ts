import { Pool } from "pg";

import { parseDbOrgProfile, type DbOrgProfileRow } from "./org";
import { hasPartisanBalanceCap } from "./agencies";
import { claimsNonPartisanship } from "./thinkTanks";
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
  AgencyGovernance,
  SelfDescribedOrg,
  BillListItem,
  BillProfile,
  CompareResponse,
  DailyCompareExample,
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

// Ceiling on how many articles one outlet can hold in a category's standalone
// pool (LIMIT 50). Without it a single high-volume feed dominates the pool —
// NY Post held 23/50 of 'top' when this was added (2026-08-10).
const MAX_ARTICLES_PER_SOURCE = 6;

// D48 grim dampener: articles tagged tone='grim' with importance <= 3 rank
// as if ~12 hours older (e^-0.51 ≈ 0.6). Importance 4-5 somber news and
// NULL-tone (unclassified) rows are untouched — the rule de-stacks
// low-importance tabloid crime, it never hides major news. Set to 1.0 to
// fully revert. Mirrored client-side in NewsAggregator.tsx rankScore().
const GRIM_DAMPENER = 0.6;

// SQL fragment appended to the importance × recency rank product.
const GRIM_DAMPENER_SQL = `CASE WHEN tone = 'grim' AND COALESCE(importance_score, 3) <= 3 THEN ${GRIM_DAMPENER} ELSE 1.0 END`;

// Ranking v2 stage 2 (docs/RANKING_SIGNALS.md): civic-entity-density boost —
// the D45 decision-relevance signal. Weighted DISTINCT dossier links (bill
// and politician 1.0, org 0.5, outlet 0), capped at 3, ×0.1 per point:
// civic density re-orders within a tier but tops out at +30%, so it can
// never promote a routine item over a disaster. Weights, cap, and constant
// mirror lib/civicWeight.ts (the client re-rank) — keep them in lockstep.
// Applied to the three article pool queries; the hero query keeps its own
// tone-preference mechanic, and stories derive their boost client-side from
// member articles (same layering as the stage-1 spectrum bonus). Verified
// against prod before shipping: worst pool shape 163 ms, unchanged.
const CIVIC_BOOST = 0.1;
const CIVIC_WEIGHT_SQL = `COALESCE((
  SELECT SUM(CASE t WHEN 'bill' THEN 1.0 WHEN 'politician' THEN 1.0 WHEN 'org' THEN 0.5 ELSE 0 END)
  FROM (SELECT DISTINCT el->>'type' AS t, el->>'canonical_id' AS cid
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(entity_links) = 'array' THEN entity_links ELSE '[]'::jsonb END) el) links
), 0)`;
const CIVIC_BOOST_SQL = `(1 + ${CIVIC_BOOST} * LEAST(${CIVIC_WEIGHT_SQL}, 3))`;

// Ranking v2 stage 1 (docs/RANKING_SIGNALS.md): stories rank on a SATURATING
// corroboration curve, 3 + STORY_BOOST × ln(1 + sources), in both the SQL
// pool and the client re-rank — previously the pool used raw count × decay
// while the client showed readers a different formula, so the LIMIT 20
// truncation happened under an order nobody saw. ln keeps an 18-member wire
// pile-up from lapping a 6-outlet story 3×. The cross-spectrum bonus is
// applied at the API/client layer only (it needs framings' outlet ratings);
// its ≤1.2× range cannot meaningfully change a 20-deep pool truncation.
// STORY_BOOST = 0.5/ln(2) ≈ 0.72 would reproduce the old client score for a
// 2-source story; 0.8 sits close to that while giving big stories a little
// more headroom (10 sources → 4.9, vs the old hard cap at 5).
const STORY_BOOST = 0.8;

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
  tone: string | null; // grim | neutral | light | NULL (migrations/020); NULL = neutral
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

// The category feed queries (here and the standalone query in
// getStoriesWithArticles) carry a 30-day recency floor. The EXP() decay in
// ORDER BY already zeroes out older rows (score × ~1e-13 at 30 days), so
// they can never rank — but without the floor Postgres still fetches and
// sorts every feed-quality row in the category (29k for business, 73k for
// sports as of 2026-07; sift-api#16). Written as an OR rather than
// COALESCE(published_date, created_at) so both branches stay servable by
// idx_articles_feed (category, published_date DESC).
export async function getArticlesByCategory(
  category: string,
  limit = 30
): Promise<DbArticle[]> {
  const result = await pool.query<DbArticle>(
    `SELECT id, title, summary, source_url, source_name, image_url,
            category, published_date, read_time, why_it_matters, importance_score, tone, context_primer, reading_levels, created_at
     FROM articles
     WHERE category = $1 AND from_search = false
       AND summary IS NOT NULL AND summary != ''
       AND LOWER(summary) NOT LIKE 'unable to provide%'
       AND (published_date > NOW() - INTERVAL '30 days'
            OR (published_date IS NULL AND created_at > NOW() - INTERVAL '30 days'))
     ORDER BY
       COALESCE(importance_score, 3)::float *
       EXP(-LEAST(GREATEST(EXTRACT(EPOCH FROM (NOW() - COALESCE(published_date, created_at))), 0) / 86400.0, 700)) *
       ${GRIM_DAMPENER_SQL} *
       ${CIVIC_BOOST_SQL}
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
  // Fraction of live member articles tagged tone='grim' (0..1); the API
  // boundary derives Story.tone = 'grim' when >= 0.5. NULL tones count as 0.
  grim_share: string | number | null;
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
              AVG(CASE WHEN a.tone = 'grim' THEN 1.0 ELSE 0 END) AS grim_share,
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
         (3 + ${STORY_BOOST} * LN(1 + COUNT(a.id)))::float *
         EXP(-LEAST(GREATEST(EXTRACT(EPOCH FROM (NOW() - COALESCE(s.published_date, s.created_at))), 0) / 86400.0, 700))
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
                category, published_date, read_time, why_it_matters, importance_score, tone, context_primer, reading_levels, created_at, story_id
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
  //
  // The scored/capped CTEs cap each outlet at MAX_ARTICLES_PER_SOURCE rows
  // so one firehose feed can't fill the pool. Story-member articles (2a) are
  // deliberately uncapped — capping them would drop story members and
  // recreate the "View 0 articles" bug class described above.
  let standaloneArticles: DbArticle[] = [];
  try {
    const standaloneResult = await pool.query<DbArticle>(
      `WITH scored AS (
         SELECT id, title, summary, source_url, source_name, image_url,
                category, published_date, read_time, why_it_matters, importance_score, tone, context_primer, reading_levels, created_at,
                COALESCE(importance_score, 3)::float *
                EXP(-LEAST(GREATEST(EXTRACT(EPOCH FROM (NOW() - COALESCE(published_date, created_at))), 0) / 86400.0, 700)) *
                ${GRIM_DAMPENER_SQL} *
                ${CIVIC_BOOST_SQL}
                AS rank_score
         FROM articles
         WHERE category = $1 AND from_search = false
           AND (story_id IS NULL OR story_id <> ALL($2::text[]))
           AND summary IS NOT NULL AND summary != ''
           AND LOWER(summary) NOT LIKE 'unable to provide%'
           AND (published_date > NOW() - INTERVAL '30 days'
                OR (published_date IS NULL AND created_at > NOW() - INTERVAL '30 days'))
       ),
       capped AS (
         SELECT *, ROW_NUMBER() OVER (
                  PARTITION BY source_name
                  ORDER BY rank_score DESC, published_date DESC NULLS LAST
                ) AS source_rank
         FROM scored
       )
       SELECT id, title, summary, source_url, source_name, image_url,
              category, published_date, read_time, why_it_matters, importance_score, tone, context_primer, reading_levels, created_at
       FROM capped
       WHERE source_rank <= ${MAX_ARTICLES_PER_SOURCE}
       ORDER BY rank_score DESC
       LIMIT 50`,
      [category, storyIds]
    );
    standaloneArticles = standaloneResult.rows;
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("story_id")) throw err;
    const fallback = await pool.query<DbArticle>(
      `WITH scored AS (
         SELECT id, title, summary, source_url, source_name, image_url,
                category, published_date, read_time, why_it_matters, importance_score, tone, context_primer, reading_levels, created_at,
                COALESCE(importance_score, 3)::float *
                EXP(-LEAST(GREATEST(EXTRACT(EPOCH FROM (NOW() - COALESCE(published_date, created_at))), 0) / 86400.0, 700)) *
                ${GRIM_DAMPENER_SQL} *
                ${CIVIC_BOOST_SQL}
                AS rank_score
         FROM articles
         WHERE category = $1 AND from_search = false
           AND summary IS NOT NULL AND summary != ''
           AND LOWER(summary) NOT LIKE 'unable to provide%'
           AND (published_date > NOW() - INTERVAL '30 days'
                OR (published_date IS NULL AND created_at > NOW() - INTERVAL '30 days'))
       ),
       capped AS (
         SELECT *, ROW_NUMBER() OVER (
                  PARTITION BY source_name
                  ORDER BY rank_score DESC, published_date DESC NULLS LAST
                ) AS source_rank
         FROM scored
       )
       SELECT id, title, summary, source_url, source_name, image_url,
              category, published_date, read_time, why_it_matters, importance_score, tone, context_primer, reading_levels, created_at
       FROM capped
       WHERE source_rank <= ${MAX_ARTICLES_PER_SOURCE}
       ORDER BY rank_score DESC
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
 *
 * D48 tone preference: among the top 12 by rank, the best non-grim article
 * wins if it scores at least half the overall best (≈ within one importance
 * point or ~17 hours) — so the landing page doesn't lead with a death story
 * every day, but a dominant story (a fresh importance-5 disaster) still
 * takes the hero. NULL tone counts as non-grim.
 */
export async function getTopStoryForLanding(): Promise<DbArticle | null> {
  try {
    const result = await pool.query<DbArticle>(
      `WITH ranked AS (
         SELECT id, title, summary, source_url, source_name, image_url,
                category, published_date, read_time, why_it_matters, importance_score, tone, context_primer, reading_levels, created_at,
                COALESCE(importance_score, 3)::float *
                EXP(-LEAST(GREATEST(EXTRACT(EPOCH FROM (NOW() - COALESCE(published_date, created_at))), 0) / 86400.0, 700))
                AS rank_score
         FROM articles
         WHERE category = 'top'
           AND from_search = false
           AND image_url IS NOT NULL
           AND summary IS NOT NULL AND summary != ''
           AND LOWER(summary) NOT LIKE 'unable to provide%'
           AND (published_date > NOW() - INTERVAL '30 days'
                OR (published_date IS NULL AND created_at > NOW() - INTERVAL '30 days'))
         ORDER BY rank_score DESC
         LIMIT 12
       )
       SELECT id, title, summary, source_url, source_name, image_url,
              category, published_date, read_time, why_it_matters, importance_score, tone, context_primer, reading_levels, created_at
       FROM ranked
       ORDER BY
         CASE WHEN tone IS DISTINCT FROM 'grim'
               AND rank_score >= 0.5 * (SELECT MAX(rank_score) FROM ranked)
              THEN 0 ELSE 1 END,
         rank_score DESC
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

// ─── AI cost ledger (interim cost-guard for topic search, sift-api#79) ──
// The topic-search route runs paid Claude/Voyage calls on the user path but,
// unlike sift-api, those calls were never recorded in ai_usage_daily or checked
// against the daily ceiling (init.sql flags this as a temporary D35 gap). Until
// the fallback moves into sift-api (#79), the route meters its spend into the
// SAME shared ledger the backend guard reads, so the daily ceiling stays global.

/** Today's combined estimated AI spend (USD) across backend + frontend. */
export async function getTodayAiSpendUsd(): Promise<number> {
  const result = await pool.query<{ total: number | null }>(
    `SELECT COALESCE(SUM(estimated_cost_usd), 0) AS total
       FROM ai_usage_daily
      WHERE usage_date = CURRENT_DATE`
  );
  return Number(result.rows[0]?.total ?? 0);
}

/** Add one paid call's estimated cost to today's ledger (idempotent upsert). */
export async function recordAiUsage(entry: {
  provider: string;
  model: string;
  operation: string;
  costUsd: number;
}): Promise<void> {
  await pool.query(
    `INSERT INTO ai_usage_daily
        (usage_date, provider, model, operation, estimated_cost_usd, call_count)
     VALUES (CURRENT_DATE, $1, $2, $3, $4, 1)
     ON CONFLICT (usage_date, provider, model, operation) DO UPDATE SET
        estimated_cost_usd = ai_usage_daily.estimated_cost_usd + EXCLUDED.estimated_cost_usd,
        call_count = ai_usage_daily.call_count + 1,
        updated_at = NOW()`,
    [entry.provider, entry.model, entry.operation, entry.costUsd]
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
              external_links, notes,
              id_source, role_title, role_title_source,
              role_start_date, role_end_date, role_dates_source,
              nomination_date, nomination_url,
              confirmation_date, confirmation_vote_url,
              confirmation_vote_result, predecessor_name, predecessor_source,
              role_verified_at
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
      `SELECT slug, name, type, founded_year,
              annual_budget_usd, annual_budget_fy, annual_budget_source,
              major_funders, fara_registered,
              fara_countries, external_links, notes,
              self_description, self_description_source,
              self_description_checked, governance_structure,
              governance_source
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
/**
 * Agencies whose governance is documented AND cited. Powers /agencies.
 *
 * The WHERE clause is the load-bearing part: both the text and its source URL
 * must be present, so a row can never reach the page as an uncited assertion
 * about how a federal agency is controlled. As of migration 012 that is 15 of
 * 93 agency rows — the rest render nothing rather than something unsourced.
 */
export async function listCitedAgencies(): Promise<AgencyGovernance[]> {
  try {
    const result = await pool.query<{
      slug: string;
      name: string;
      governance_structure: string;
      governance_source: string;
    }>(
      `SELECT slug, name, governance_structure, governance_source
       FROM org_profiles
       WHERE type = 'agency'
         AND governance_structure IS NOT NULL
         AND governance_source IS NOT NULL
       ORDER BY name ASC`,
    );
    return result.rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      governanceStructure: r.governance_structure,
      governanceSource: r.governance_source,
      hasPartisanBalanceCap: hasPartisanBalanceCap(r.governance_structure),
    }));
  } catch (err) {
    // Pre-012 databases lack the columns; degrade to an empty page rather
    // than a 500. The page renders its own empty state.
    const msg = String(err);
    if (msg.includes("does not exist")) return [];
    throw err;
  }
}

/**
 * Organizations that describe themselves, quoted and cited. Powers /think-tanks.
 *
 * Both the quote and its source must be present — same rule as
 * listCitedAgencies. Excludes agencies: a federal agency does not "describe
 * itself" in the sense this page means, and lumping them together would blur
 * the distinction the page is built on.
 */
export async function listSelfDescribedOrgs(): Promise<SelfDescribedOrg[]> {
  try {
    const result = await pool.query<{
      slug: string;
      name: string;
      type: string | null;
      self_description: string;
      self_description_source: string;
      self_description_checked: Date | string | null;
      fara_registered: boolean | null;
      fara_countries: unknown;
    }>(
      `SELECT slug, name, type, self_description, self_description_source,
              self_description_checked, fara_registered, fara_countries
       FROM org_profiles
       WHERE type <> 'agency'
         AND self_description IS NOT NULL
         AND self_description_source IS NOT NULL
       ORDER BY name ASC`,
    );
    return result.rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      type: (r.type as SelfDescribedOrg["type"]) ?? null,
      selfDescription: r.self_description,
      selfDescriptionSource: r.self_description_source,
      selfDescriptionChecked:
        r.self_description_checked instanceof Date
          ? r.self_description_checked.toISOString().slice(0, 10)
          : (r.self_description_checked?.trim() || null),
      faraRegistered: r.fara_registered === true,
      faraCountries: Array.isArray(r.fara_countries)
        ? (r.fara_countries as unknown[]).filter(
            (v): v is string => typeof v === "string",
          )
        : [],
      claimsNonPartisanship: claimsNonPartisanship(r.self_description),
    }));
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return [];
    throw err;
  }
}

export async function listAllOrgsLite(): Promise<OrgListItem[]> {
  try {
    const result = await pool.query<{
      slug: string;
      name: string;
      type: string | null;
    }>(
      `SELECT slug, name, type
       FROM org_profiles
       ORDER BY type ASC NULLS LAST, name ASC`,
    );
    return result.rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      type: (r.type as OrgListItem["type"]) ?? null,
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

// ─── Sitemap ───────────────────────────────────────────

export type SitemapEntry = { path: string; lastModified: Date };

/**
 * Dossier URLs that are substantial enough to advertise to crawlers.
 *
 * ⚠️ INVARIANT: the WHERE clauses below and the predicates in
 * `lib/publishFloor.ts` express the same rule and must agree. Two
 * implementations exist because the sitemap needs a set-level query while the
 * dossier routes need a check on a profile object already in hand — the
 * routes use the predicates to emit `robots: { index: false }` for anything
 * this query omits. Change one, change the other;
 * `__tests__/publishFloor.test.ts` pins the rule in prose and examples.
 *
 * This is the publish floor, generalised from `listCitedAgencies` above: the
 * catalog the linker knows about and the set we ask Google to index are two
 * different things. A thin row still renders and still resolves a chip; it
 * just isn't advertised. Google's scaled-content-abuse policy targets exactly
 * "one row of data poured into a template", and 838 dossiers of wildly uneven
 * depth is that shape if published wholesale.
 *
 * Only `/outlet/*` renders an article list; politician, org and bill pages are
 * profile-only, so for those three the floor is entirely about how populated
 * the row is.
 *
 * Per type, and why:
 *
 * - **politician** — sitting Congress with committees or PAC industries, OR
 *   an executive/foreign-executive row carrying a sourced statutory role.
 *   The `chamber IN ('house','senate')` restriction that previously excluded
 *   all 102 executive rows was correct for the data as it stood: their only
 *   substantive content was uncited `notes` prose about living people plus a
 *   Wikipedia link, and `founded_year` was dropped from orgs rather than
 *   sourced to Wikipedia (STATUS.md:109-113). Migration 015 removed that
 *   prose and replaced it with primary-record fields, so the gate is now the
 *   thing it always meant — sourcing, not chamber. `role_title_source` is a
 *   statute on uscode.house.gov, a constitutional provision at the National
 *   Archives, or the Senate roll-call that confirmed the appointment; every
 *   one was refetched and asserted to name the office by
 *   `sift-api/scripts/verify_role_sources.py`. Rows still lacking it — the
 *   foreign heads of state, and U.S. staff posts with no statutory record —
 *   keep rendering and keep resolving entity chips, they just aren't
 *   advertised.
 * - **org** — at least one fully-sourced substantive field. Same rule
 *   `listCitedAgencies` applies to /agencies, widened past governance.
 * - **bill** — a status and at least one external link.
 * - **outlet** — at least one rating carrying its source URL.
 */
export async function listSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const result = await pool.query<{ path: string; updated_at: Date | null }>(
      `SELECT '/politician/' || bioguide_id AS path, updated_at
         FROM politician_profiles
        WHERE (chamber IN ('house', 'senate')
               AND (jsonb_array_length(COALESCE(committees, '[]'::jsonb)) > 0
                 OR jsonb_array_length(COALESCE(top_industries_current_cycle, '[]'::jsonb)) > 0))
           OR (chamber IN ('executive', 'scotus')
               AND role_title IS NOT NULL
               AND role_title_source IS NOT NULL)
           -- Foreign rows additionally expire. Mirrors
           -- ROLE_VERIFICATION_MAX_AGE_DAYS in lib/publishFloor.ts — change both.
           OR (chamber = 'foreign-executive'
               AND role_title IS NOT NULL
               AND role_title_source IS NOT NULL
               AND role_verified_at IS NOT NULL
               AND role_verified_at >= CURRENT_DATE - INTERVAL '90 days')
       UNION ALL
       SELECT '/org/' || slug, updated_at
         FROM org_profiles
        WHERE (governance_structure IS NOT NULL AND governance_source IS NOT NULL)
           OR (self_description IS NOT NULL AND self_description_source IS NOT NULL)
           OR (annual_budget_usd IS NOT NULL AND annual_budget_source IS NOT NULL)
       UNION ALL
       SELECT '/bill/' || bill_id, updated_at
         FROM bill_profiles
        WHERE status IS NOT NULL
          AND external_links::text NOT IN ('{}', 'null')
       UNION ALL
       SELECT '/outlet/' || slug, updated_at
         FROM outlet_profiles
        WHERE (allsides_rating IS NOT NULL AND allsides_url IS NOT NULL)
           OR (mbfc_factual IS NOT NULL AND mbfc_url IS NOT NULL)`,
    );
    return result.rows.map((r) => ({
      path: r.path,
      lastModified: r.updated_at ?? new Date(),
    }));
  } catch (err) {
    // Same graceful degradation as the other profile queries: a pre-Phase-3
    // database yields a static-routes-only sitemap rather than a 500.
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

// ─── Daily compare example ─────────────────────────────

/**
 * The anonymous daily compare example — one real comparison per UTC day,
 * written by sift-api after a pipeline run (daily_compare_example, migration
 * 021). Read here (not proxied through Railway) because reads are the
 * frontend's path; sift-api owns only the write. Returns null before the
 * first generation or if the table doesn't exist yet.
 */
export async function getDailyCompareExample(): Promise<DailyCompareExample | null> {
  try {
    const result = await pool.query<{
      payload: CompareResponse;
      generated_at: string;
    }>(
      `SELECT payload, generated_at
       FROM daily_compare_example
       WHERE id = 1
       LIMIT 1`
    );
    if (result.rows.length === 0) return null;
    const { payload, generated_at } = result.rows[0];
    if (!payload || typeof payload !== "object" || !payload.topic) return null;
    return {
      topic: String(payload.topic),
      comparison: String(payload.comparison ?? ""),
      sources_checked: Array.isArray(payload.sources_checked)
        ? payload.sources_checked
        : [],
      claims: Array.isArray(payload.claims) ? payload.claims : [],
      duration_ms: Number(payload.duration_ms ?? 0),
      generatedAt: new Date(generated_at).toISOString(),
    };
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not exist")) return null;
    throw err;
  }
}

export default pool;
