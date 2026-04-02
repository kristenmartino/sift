/**
 * Re-categorize articles using vector similarity.
 *
 * Embeds a description for each category, then assigns each article
 * to whichever category its embedding is closest to — but only if
 * the winner beats the "top" (general) category by a meaningful margin.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL is required"); process.exit(1); }
const VOYAGE_KEY = process.env.VOYAGE_API_KEY;

// The winning category must beat "top" by at least this margin
const MIN_MARGIN = 0.03;

if (!VOYAGE_KEY) {
  console.error("VOYAGE_API_KEY not set");
  process.exit(1);
}

// Category descriptions — these get embedded and compared against articles
// More specific descriptions help avoid false positives
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  technology:
    "Technology news: software engineering, hardware devices, artificial intelligence, machine learning, programming languages, cybersecurity breaches, tech startups, smartphone apps, cloud computing, robotics, semiconductors, data centers",
  business:
    "Business and finance news: stock market, Wall Street, corporate earnings, mergers and acquisitions, entrepreneurship, venture capital, banking, real estate market, retail sales, supply chain logistics, employment reports, GDP, inflation, Federal Reserve",
  science:
    "Scientific research and discovery: physics experiments, chemistry breakthroughs, biology studies, space exploration, NASA missions, astronomy observations, peer-reviewed papers, laboratory research, mathematics proofs, geology, paleontology, scientific journals",
  energy:
    "Energy industry news: renewable energy projects, solar panels, wind farms, nuclear power plants, oil prices, natural gas, electricity grid, battery technology, electric vehicles, carbon emissions, climate policy, sustainability initiatives, environmental regulation",
  world:
    "International news and geopolitics: foreign affairs, diplomatic relations, wars and military conflicts, international elections, government policy, immigration policy, United Nations, human rights, international trade agreements, sanctions, protests abroad",
  health:
    "Health and medicine news: medical research, clinical trials, disease outbreaks, pharmaceutical drugs, hospital systems, mental health treatment, nutrition science, surgical procedures, vaccines, public health policy, FDA approvals, healthcare costs",
  top:
    "General interest and trending: breaking news, popular culture, entertainment, celebrity news, lifestyle, music, movies, television, sports, food, travel, arts, fashion, social trends, viral stories, human interest",
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

  // 2. Fetch ALL articles with embeddings
  const { rows } = await pool.query<{ id: string; category: string; embedding: string }>(
    "SELECT id, category, embedding::text FROM articles WHERE embedding IS NOT NULL"
  );
  console.log(`Found ${rows.length} articles to evaluate`);

  // 3. For each article, find the best-matching category
  //    Only move if the winner beats "top" by MIN_MARGIN
  const topIdx = categories.indexOf("top");
  const moves: Record<string, string[]> = {};
  const unchanged: Record<string, number> = {};
  categories.forEach((c) => { moves[c] = []; unchanged[c] = 0; });

  for (const row of rows) {
    // Parse the embedding vector from Postgres text format "[0.1,0.2,...]"
    const embedding = row.embedding
      .replace(/[\[\]]/g, "")
      .split(",")
      .map(Number);

    let bestCategory = "top";
    let bestSimilarity = -1;
    const similarities: Record<string, number> = {};

    for (let i = 0; i < categories.length; i++) {
      const sim = cosineSimilarity(embedding, categoryEmbeddings[i]);
      similarities[categories[i]] = sim;
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestCategory = categories[i];
      }
    }

    // If best is a specialized category, it must beat "top" by margin
    if (bestCategory !== "top") {
      const topSim = similarities["top"];
      if (bestSimilarity - topSim < MIN_MARGIN) {
        bestCategory = "top"; // Not confident enough, keep in general
      }
    }

    if (bestCategory !== row.category) {
      moves[bestCategory].push(row.id);
    } else {
      unchanged[row.category] = (unchanged[row.category] || 0) + 1;
    }
  }

  // 4. Batch update articles
  let totalMoved = 0;
  for (const [category, ids] of Object.entries(moves)) {
    if (ids.length === 0) continue;
    await pool.query(
      "UPDATE articles SET category = $1 WHERE id = ANY($2)",
      [category, ids]
    );
    totalMoved += ids.length;
    console.log(`  → ${category}: ${ids.length} moved in, ${unchanged[category] || 0} unchanged`);
  }
  // Show categories with no moves
  for (const [cat, count] of Object.entries(unchanged)) {
    if (!moves[cat] || moves[cat].length === 0) {
      console.log(`  → ${cat}: 0 moved in, ${count} unchanged`);
    }
  }
  console.log(`\nTotal: ${totalMoved} articles re-assigned`);

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
