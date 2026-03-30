/**
 * Backfill og:image for articles missing images.
 * Fetches each article's source_url and extracts the og:image meta tag.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";

const DB_URL = process.env.DATABASE_URL || "postgresql://sift:sift@localhost:5432/siftdb";
const CONCURRENCY = 20;
const FETCH_TIMEOUT = 5000; // 5s per URL

async function extractOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    // Only read the first ~50KB to find og:image in <head>
    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      // Stop once we've passed </head>
      if (html.includes("</head>")) break;
    }
    reader.cancel();

    // Extract og:image
    const match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );

    if (!match) return null;

    let imageUrl = match[1];
    // Skip tiny tracking pixels and data URIs
    if (imageUrl.startsWith("data:")) return null;
    if (imageUrl.length < 10) return null;

    return imageUrl;
  } catch {
    return null;
  }
}

async function main() {
  const pool = new Pool({ connectionString: DB_URL, max: 5 });

  const { rows } = await pool.query<{ id: string; source_url: string }>(
    "SELECT id, source_url FROM articles WHERE image_url IS NULL AND source_url IS NOT NULL"
  );
  console.log(`Found ${rows.length} articles without images`);

  let completed = 0;
  let found = 0;

  const queue = [...rows];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const row = queue.shift()!;
      const imageUrl = await extractOgImage(row.source_url);

      if (imageUrl) {
        await pool.query(
          "UPDATE articles SET image_url = $1 WHERE id = $2",
          [imageUrl, row.id]
        );
        found++;
      }

      completed++;
      if (completed % 50 === 0) {
        console.log(`[${completed}/${rows.length}] Found ${found} images so far`);
      }
    }
  });

  await Promise.all(workers);

  console.log(`\nDone. Found images for ${found}/${rows.length} articles.`);

  const countResult = await pool.query(
    "SELECT COUNT(*) as with_image FROM articles WHERE image_url IS NOT NULL"
  );
  console.log(`Total articles with images: ${countResult.rows[0].with_image}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
