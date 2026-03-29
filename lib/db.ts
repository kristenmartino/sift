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
  limit = 7
): Promise<DbArticle[]> {
  const result = await pool.query<DbArticle>(
    `SELECT id, title, summary, source_url, source_name, image_url,
            category, published_date, read_time, created_at
     FROM articles
     WHERE category = $1
     ORDER BY published_date DESC NULLS LAST
     LIMIT $2`,
    [category, limit]
  );
  return result.rows;
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

export default pool;
