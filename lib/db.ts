import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://sift:sift@localhost:5432/siftdb",
  max: 5,
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
  created_at: Date;
}

export async function getArticlesByCategory(
  category: string,
  limit = 30
): Promise<DbArticle[]> {
  const result = await pool.query<DbArticle>(
    `SELECT id, title, summary, source_url, source_name, image_url,
            category, published_date, read_time, created_at
     FROM articles
     WHERE category = $1 AND from_search = false
     ORDER BY published_date DESC NULLS LAST
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
  // 1. Get stories for this category
  const storiesResult = await pool.query<DbStory>(
    `SELECT id, headline, summary, category, framings, entities,
            article_count, representative_image_url, published_date, synthesis_status
     FROM stories
     WHERE category = $1 AND synthesis_status = 'complete'
     ORDER BY published_date DESC NULLS LAST
     LIMIT 20`,
    [category]
  );
  const stories = storiesResult.rows;
  const storyIds = stories.map((s) => s.id);

  // 2. Get all articles for this category (with story_id)
  const articlesResult = await pool.query<DbStoryArticle>(
    `SELECT id, title, summary, source_url, source_name, image_url,
            category, published_date, read_time, created_at, story_id
     FROM articles
     WHERE category = $1 AND from_search = false
     ORDER BY published_date DESC NULLS LAST
     LIMIT 50`,
    [category]
  );

  // 3. Partition into story-grouped and standalone
  const storyArticles: Record<string, DbStoryArticle[]> = {};
  const standaloneArticles: DbArticle[] = [];
  const storyIdSet = new Set(storyIds);

  for (const row of articlesResult.rows) {
    if (row.story_id && storyIdSet.has(row.story_id)) {
      if (!storyArticles[row.story_id]) storyArticles[row.story_id] = [];
      storyArticles[row.story_id].push(row);
    } else {
      standaloneArticles.push(row);
    }
  }

  return { stories, storyArticles, standaloneArticles };
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
            a.category, a.published_date, a.read_time, a.created_at
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

export async function searchArticlesByEmbedding(
  embedding: number[],
  similarityThreshold = 0.35,
  limit = 10
): Promise<DbArticleWithSimilarity[]> {
  const vectorStr = `[${embedding.join(",")}]`;
  const result = await pool.query<DbArticle & { similarity: number }>(
    `SELECT id, title, summary, source_url, source_name, image_url,
            category, published_date, read_time, created_at,
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
  const vectorStr = `[${article.embedding.join(",")}]`;
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

export default pool;
