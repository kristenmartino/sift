/**
 * Re-categorize articles using vector similarity.
 *
 * Embeds a description for each category, then assigns each article
 * in 'top' to whichever category its embedding is closest to.
 * Only moves articles that are clearly a better fit elsewhere.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";

const DB_URL = process.env.DATABASE_URL || "postgresql://sift:sift@localhost:5432/siftdb";
const VOYAGE_KEY = process.env.VOYAGE_API_KEY;

if (!VOYAGE_KEY) {
  console.error("VOYAGE_API_KEY not set");
  process.exit(1);
}

// Category descriptions — these get embedded and compared against articles
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  technology:
    "Technology, software, hardware, AI, programming, cybersecurity, startups, gadgets, apps, internet, social media, computing, robotics, digital innovation",
  business:
    "Business, finance, economics, markets, stocks, investing, corporate news, entrepreneurship, trade, banking, real estate, retail, supply chain, jobs",
  science:
    "Science, research, physics, chemistry, biology, space, astronomy, scientific discoveries, experiments, academic research, mathematics, geology",
  energy:
    "Energy, renewable energy, solar, wind, nuclear, oil, gas, electricity, power grid, batteries, EVs, electric vehicles, climate change, sustainability, environment",
  world:
    "World news, international affairs, geopolitics, diplomacy, foreign policy, wars, conflicts, elections, government, politics, immigration, human rights",
  health:
    "Health, medicine, healthcare, disease, treatment, mental health, nutrition, fitness, hospitals, pharmaceuticals, vaccines, public health, wellness",
  top:
    "Breaking news, general interest, trending stories, major events, top headlines, popular culture, entertainment, celebrity news, lifestyle",
};

async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VOYAGE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: "voyage-3-lite",
      input_type: "document",
    }),
  });
  if (!res.ok) throw new Error(`Voyage error: ${res.status}`);
  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function main() {
  const pool = new Pool({ connectionString: DB_URL, max: 5 });

  // 1. Embed category descriptions
  const categories = Object.keys(CATEGORY_DESCRIPTIONS);
  const descriptions = categories.map((c) => CATEGORY_DESCRIPTIONS[c]);
  console.log("Embedding category descriptions...");
  const categoryEmbeddings = await embedTexts(descriptions);

  // 2. Fetch all articles currently in 'top' that have embeddings
  const { rows } = await pool.query<{ id: string; embedding: string }>(
    "SELECT id, embedding::text FROM articles WHERE category = 'top' AND embedding IS NOT NULL"
  );
  console.log(`Found ${rows.length} articles in 'top' to re-categorize`);

  // 3. For each article, find the best-matching category
  const moves: Record<string, string[]> = {};
  categories.forEach((c) => (moves[c] = []));

  for (const row of rows) {
    // Parse the embedding vector from Postgres text format "[0.1,0.2,...]"
    const embedding = row.embedding
      .replace(/[\[\]]/g, "")
      .split(",")
      .map(Number);

    let bestCategory = "top";
    let bestSimilarity = -1;

    for (let i = 0; i < categories.length; i++) {
      const sim = cosineSimilarity(embedding, categoryEmbeddings[i]);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestCategory = categories[i];
      }
    }

    moves[bestCategory].push(row.id);
  }

  // 4. Batch update articles
  for (const [category, ids] of Object.entries(moves)) {
    if (ids.length === 0) continue;
    if (category === "top") {
      console.log(`  top: ${ids.length} articles staying`);
      continue;
    }
    await pool.query(
      "UPDATE articles SET category = $1 WHERE id = ANY($2)",
      [category, ids]
    );
    console.log(`  ${category}: ${ids.length} articles moved`);
  }

  // 5. Show final distribution
  const dist = await pool.query(
    "SELECT category, COUNT(*) as count FROM articles GROUP BY category ORDER BY count DESC"
  );
  console.log("\nFinal distribution:");
  for (const row of dist.rows) {
    console.log(`  ${row.category}: ${row.count}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
