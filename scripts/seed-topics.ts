/**
 * Seed the database with articles discovered via Claude web_search.
 *
 * Usage:
 *   npx tsx scripts/seed-topics.ts            # run all topics
 *   npx tsx scripts/seed-topics.ts --limit 50  # run first 50 topics
 *   npx tsx scripts/seed-topics.ts --shuffle   # randomize order
 *
 * Can be run repeatedly — articles are deduplicated by source_url.
 * Suitable for cron-based ingestion to continuously grow the database.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import { Pool } from "pg";
import crypto from "crypto";

// ─── Config ──────────────────────────────────────────────

const CONCURRENCY = 10; // Concurrent Claude calls
const VOYAGE_BATCH_SIZE = 50; // Embed in batches
const DB_URL = process.env.DATABASE_URL || "postgresql://sift:sift@localhost:5432/siftdb";
const VOYAGE_KEY = process.env.VOYAGE_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!VOYAGE_KEY) {
  console.error("VOYAGE_API_KEY not set");
  process.exit(1);
}

// ─── 500 Diverse Topics ──────────────────────────────────

const TOPICS = [
  // Technology & Computing
  "quantum computing breakthroughs", "cybersecurity threats 2026", "open source AI models",
  "edge computing applications", "WebAssembly adoption", "Rust programming language",
  "blockchain beyond crypto", "digital twins in manufacturing", "5G network rollout",
  "autonomous vehicles regulation", "brain-computer interfaces", "robotic surgery advances",
  "spatial computing and AR glasses", "semiconductor chip shortage", "privacy-preserving AI",
  "large language model safety", "AI art and copyright", "deepfake detection technology",
  "smart home automation", "cloud gaming platforms", "DNA data storage",
  "zero-knowledge proofs", "federated learning healthcare", "neuromorphic computing chips",
  "post-quantum cryptography", "tech layoffs and hiring trends", "AI coding assistants",
  "computer vision agriculture", "natural language processing advances", "humanoid robots",

  // Science & Research
  "CRISPR gene editing trials", "dark matter detection experiments", "fusion energy progress",
  "Mars exploration missions", "ocean floor mapping discoveries", "antibiotic resistance solutions",
  "stem cell therapy breakthroughs", "gravitational wave observations", "synthetic biology applications",
  "ancient DNA discoveries", "exoplanet habitability research", "microplastics in human blood",
  "neuroscience of consciousness", "asteroid mining feasibility", "lab-grown meat scaling",
  "carbon capture technology", "mRNA vaccine development", "quantum biology research",
  "deep sea creature discoveries", "superconductor breakthroughs", "epigenetics and aging",
  "nuclear waste recycling", "biodiversity loss monitoring", "psychedelic therapy research",
  "alzheimer's treatment progress", "cryonics and brain preservation", "JWST telescope discoveries",
  "earthquake prediction technology", "gene drive mosquito control", "human longevity research",

  // Health & Medicine
  "mental health apps effectiveness", "long covid treatment research", "gut microbiome and diet",
  "telemedicine post-pandemic", "cancer immunotherapy advances", "wearable health monitors",
  "childhood obesity interventions", "rare disease gene therapy", "antibiotic alternatives research",
  "sleep science and technology", "personalized medicine genomics", "maternal mortality reduction",
  "opioid crisis solutions", "diabetes technology innovations", "brain health and neuroplasticity",
  "aging population healthcare", "vaccine hesitancy research", "hospital AI diagnostics",
  "regenerative medicine tissue engineering", "mental health in the workplace",
  "health effects of ultra-processed food", "loneliness epidemic health impacts",
  "exercise science latest findings", "meditation neuroscience research",
  "hearing loss prevention technology", "vision restoration technology",
  "chronic pain management advances", "nutritional psychiatry research",
  "global health equity challenges", "pandemic preparedness planning",

  // Environment & Climate
  "renewable energy grid storage", "deforestation satellite monitoring", "urban heat island solutions",
  "ocean acidification effects", "sustainable fashion industry", "electric vehicle battery recycling",
  "rewilding projects worldwide", "climate migration patterns", "green hydrogen production",
  "soil carbon sequestration", "coral reef restoration projects", "permafrost thawing methane",
  "sustainable aviation fuel", "water scarcity solutions", "circular economy business models",
  "wildlife corridor construction", "agrivoltaics solar farming", "climate change and wine regions",
  "methane emission reduction", "offshore wind farm technology", "urban farming vertical agriculture",
  "mangrove restoration climate", "environmental justice communities", "glacier retreat monitoring",
  "plastic pollution ocean cleanup", "regenerative agriculture practices", "wildfire prevention technology",
  "endangered species recovery", "climate adaptation infrastructure", "green building standards",

  // Business & Economics
  "remote work productivity studies", "creator economy trends", "central bank digital currencies",
  "supply chain AI optimization", "commercial space industry", "gig economy worker rights",
  "ESG investing controversy", "startup funding winter", "four day work week trials",
  "retail apocalypse or renaissance", "subscription economy fatigue", "fintech banking disruption",
  "commercial real estate crisis", "AI replacing white collar jobs", "global trade fragmentation",
  "sovereign wealth fund strategies", "small business AI adoption", "housing affordability crisis",
  "inflation impact on consumers", "union organizing tech workers", "private equity healthcare",
  "cryptocurrency regulation worldwide", "venture capital emerging markets", "wealth inequality trends",
  "automation warehouse workers", "freelance economy growth", "corporate sustainability reporting",
  "antitrust big tech enforcement", "reshoring manufacturing trends", "digital nomad visa programs",

  // Geopolitics & World Affairs
  "US China technology competition", "Arctic geopolitics resources", "Africa free trade agreement",
  "NATO expansion implications", "global south diplomacy", "nuclear proliferation risks",
  "middle east peace negotiations", "Southeast Asia economic growth", "European energy independence",
  "Latin America leftward shift", "Central Asia infrastructure projects", "Pacific islands climate diplomacy",
  "India technology sector growth", "Brazil Amazon policy", "Ukraine reconstruction planning",
  "Taiwan semiconductor geopolitics", "global food security threats", "refugee crisis solutions",
  "sanctions effectiveness debate", "space militarization concerns", "cyber warfare nation states",
  "international criminal court cases", "African Union peacekeeping", "BRICS expansion impact",
  "Middle East water conflicts", "transnational organized crime", "global vaccine distribution",
  "maritime territorial disputes", "election integrity worldwide", "international AI governance",

  // Sports & Fitness
  "Olympic 2028 Los Angeles preparation", "esports professional leagues growth", "women's sports investment boom",
  "sports analytics revolution", "athlete mental health awareness", "extreme sports technology",
  "youth sports specialization debate", "sports betting legalization", "marathon running science",
  "swimming technology and records", "basketball analytics evolution", "soccer VAR technology debate",
  "cricket global expansion", "MMA UFC fighter safety", "rock climbing competitive scene",
  "surfing science wave prediction", "cycling doping technology", "tennis racket technology evolution",
  "adaptive sports paralympics growth", "sports stadium sustainability", "pickleball popularity explosion",
  "ultra marathon endurance research", "sports concussion protocols", "golf technology disruption",
  "sports NIL college athlete deals", "formula one engineering innovations", "boxing resurgence popularity",
  "yoga science health benefits", "CrossFit competition evolution", "skateboarding culture mainstream",

  // Food & Cuisine
  "fermentation food trends", "food waste reduction technology", "plant-based seafood alternatives",
  "molecular gastronomy restaurants", "heritage grain farming revival", "food delivery robot automation",
  "wine industry climate adaptation", "street food global culture", "mushroom functional foods",
  "Japanese wagyu beef industry", "chocolate supply chain ethics", "coffee climate change impact",
  "microalgae superfood nutrition", "restaurant industry labor shortage", "precision fermentation dairy",
  "insect protein farming", "sourdough bread science", "farm to table movement",
  "spice trade modern routes", "food safety blockchain tracking", "aquaponics urban farming",
  "Korean cuisine global popularity", "olive oil fraud detection", "school lunch nutrition reform",
  "food desert urban solutions", "craft beer industry consolidation", "ancient food preservation methods",
  "meal kit subscription evolution", "food allergy research progress", "regenerative ranching practices",

  // Arts & Culture
  "AI generated art museums", "independent film distribution streaming", "Broadway ticket price economics",
  "street art urban gentrification", "classical music youth audience", "podcast industry consolidation",
  "virtual reality art galleries", "hip hop 50th anniversary legacy", "book banning library challenges",
  "indigenous art preservation digital", "photography smartphone vs professional", "tattoo culture mainstreaming",
  "theater accessibility innovations", "graffiti legal wall projects", "animation industry unionization",
  "jazz music modern evolution", "literary fiction market trends", "dance TikTok choreography credits",
  "museum decolonization movement", "comic book superhero fatigue", "folk music revival movement",
  "ceramics pottery popularity boom", "true crime genre ethics", "fashion industry size inclusivity",
  "architecture sustainable design", "vinyl record sales resurgence", "stand-up comedy streaming specials",
  "opera modern adaptations", "video game narrative storytelling", "calligraphy digital age",

  // Education & Learning
  "AI tutoring personalized learning", "student loan debt crisis", "homeschooling growth trends",
  "coding bootcamp outcomes research", "education technology startups", "university enrollment decline",
  "early childhood education funding", "STEM education gender gap", "education gamification research",
  "community college workforce training", "international student mobility", "teacher shortage solutions",
  "microlearning corporate training", "education accessibility disabilities", "language learning technology",
  "vocational training comeback", "project-based learning outcomes", "education digital divide rural",
  "gap year trend analysis", "lifelong learning adult education", "education AI cheating detection",
  "montessori education research", "financial literacy education youth", "library evolution digital age",
  "special education inclusion models", "higher education accreditation reform", "outdoor education programs",
  "education mental health support", "bilingual education cognitive benefits", "apprenticeship program growth",

  // Society & Social Issues
  "affordable housing innovative solutions", "digital literacy elderly population", "universal basic income trials",
  "social media teen mental health", "criminal justice reform progress", "disability rights technology",
  "immigration policy reform debate", "gender pay gap closing strategies", "food bank demand increase",
  "homelessness innovative solutions", "racial wealth gap research", "aging in place technology",
  "foster care system reform", "veterans mental health support", "community land trust housing",
  "digital privacy rights legislation", "domestic violence prevention technology", "tribal sovereignty legal developments",
  "child care affordability crisis", "rural hospital closures healthcare", "civic engagement youth voting",
  "media literacy education programs", "elder abuse prevention awareness", "accessible transportation innovation",
  "volunteer burnout nonprofit sector", "grassroots community organizing", "youth mentorship program outcomes",
  "interfaith dialogue initiatives", "environmental racism research", "digital divide broadband access",

  // History & Archaeology
  "ancient Roman city excavations", "Viking settlement discoveries", "Egyptian tomb new findings",
  "Mayan civilization technology research", "shipwreck underwater archaeology", "ice age megafauna discoveries",
  "medieval manuscript digitization", "ancient trade route mapping", "Pompeii ongoing excavations",
  "Native American archaeological sites", "ancient astronomy observatory discoveries", "fossil discoveries evolution",
  "colonial era artifact repatriation", "ancient DNA migration patterns", "bronze age collapse new theories",
  "sunken city underwater discoveries", "ancient Chinese invention discoveries", "Neanderthal culture evidence",
  "civil war battlefield archaeology", "ancient grain agriculture origins", "easter island moai research",
  "petra archaeological discoveries", "ancient medicine practice evidence", "ottoman empire archaeological finds",
  "prehistoric cave art discoveries", "anglo saxon treasure finds", "inca engineering marvels research",
  "dead sea scrolls ongoing analysis", "ancient greek theater archaeology", "industrial revolution artifacts",

  // Hobbies & Lifestyle
  "amateur astronomy equipment advances", "board game renaissance tabletop", "home gardening food growing",
  "3D printing hobby projects", "amateur radio emergency communications", "birdwatching citizen science",
  "woodworking maker movement", "knitting crochet mental health", "drone photography hobby regulation",
  "aquarium fishkeeping trends", "beekeeping urban movement", "vintage car restoration electric conversion",
  "geocaching outdoor activity", "miniature painting wargaming community", "ham radio digital modes",
  "homebrewing craft beverages", "model railroad hobby evolution", "scuba diving conservation",
  "foraging wild food movement", "journaling bullet planning trend", "letterpress printing revival",
  "candle making small business", "leather crafting artisan movement", "telescope astrophotography",
  "mechanical keyboard enthusiast community", "urban sketching art movement", "sourdough starter culture sharing",
  "trail running adventure racing", "pottery wheel throwing classes", "film photography analog revival",
];

// ─── Helpers ─────────────────────────────────────────────

function stableHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 6);
}

function estimateReadTime(text: string): number {
  return Math.max(1, Math.ceil((text || "").split(/\s+/).length / 200));
}

interface FoundArticle {
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
}

// ─── Claude Web Search ───────────────────────────────────

async function searchTopic(
  anthropic: Anthropic,
  topic: string
): Promise<FoundArticle[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-20250414",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20250305" as never,
        name: "web_search",
        max_uses: 2,
      },
    ],
    messages: [
      {
        role: "user",
        content: `Search the web for recent news about: "${topic}"

Find 3-5 relevant, recent news articles. For each article, provide:
1. title - the actual article headline
2. summary - a 2-3 sentence summary of the article
3. source_url - the URL of the article
4. source_name - the publication name (e.g., "Reuters", "TechCrunch")

Return your findings as a JSON array with this exact structure:
[{"title": "...", "summary": "...", "source_url": "...", "source_name": "..."}]

Return ONLY the JSON array, no other text.`,
      },
    ],
  });

  const textBlocks = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text);

  for (const text of textBlocks) {
    try {
      const arrayMatch = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
        .match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const candidate = JSON.parse(arrayMatch[0]);
        if (Array.isArray(candidate) && candidate.length > 0 && candidate[0].title) {
          return candidate;
        }
      }
    } catch {
      continue;
    }
  }

  return [];
}

// ─── Voyage AI Embedding ─────────────────────────────────

async function embedTexts(texts: string[]): Promise<number[][]> {
  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += VOYAGE_BATCH_SIZE) {
    const batch = texts.slice(i, i + VOYAGE_BATCH_SIZE);
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VOYAGE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: batch,
        model: "voyage-3-lite",
        input_type: "document",
      }),
    });
    if (!res.ok) {
      console.error(`Voyage error ${res.status}: ${await res.text()}`);
      // Return zero vectors as fallback
      all.push(...batch.map(() => new Array(512).fill(0)));
      continue;
    }
    const data = await res.json();
    all.push(...data.data.map((d: { embedding: number[] }) => d.embedding));
  }
  return all;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : TOPICS.length;
  const shuffle = args.includes("--shuffle");

  let topics = [...TOPICS];
  if (shuffle) {
    for (let i = topics.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topics[i], topics[j]] = [topics[j], topics[i]];
    }
  }
  topics = topics.slice(0, limit);

  console.log(`Seeding ${topics.length} topics (concurrency: ${CONCURRENCY})`);

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
  const pool = new Pool({ connectionString: DB_URL, max: 5 });

  let completed = 0;
  let totalArticles = 0;
  let errors = 0;

  // Process with concurrency limit
  const queue = [...topics];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const topic = queue.shift()!;
      try {
        // 1. Search for articles
        const articles = await searchTopic(anthropic, topic);
        if (articles.length === 0) {
          completed++;
          console.log(`[${completed}/${topics.length}] "${topic}" — no articles found`);
          continue;
        }

        // 2. Embed
        const texts = articles.map((a) => `${a.title}. ${a.summary}`);
        const embeddings = await embedTexts(texts);

        // 3. Insert into Postgres
        let inserted = 0;
        for (let i = 0; i < articles.length; i++) {
          const a = articles[i];
          if (!a.title || !a.source_url) continue;
          const emb = embeddings[i];
          if (!emb || emb.every((v) => v === 0)) continue;

          const id = stableHash(a.source_url + a.title);
          const vectorStr = `[${emb.join(",")}]`;
          try {
            await pool.query(
              `INSERT INTO articles (id, title, summary, source_url, source_name, image_url,
                                     category, published_date, embedding, read_time)
               VALUES ($1, $2, $3, $4, $5, NULL, 'top', NOW(), $6::vector, $7)
               ON CONFLICT (source_url) DO NOTHING`,
              [id, a.title, a.summary || "", a.source_url, a.source_name || "Web",
               vectorStr, estimateReadTime(a.summary)]
            );
            inserted++;
          } catch (err) {
            // Duplicate or other DB error — skip
          }
        }

        totalArticles += inserted;
        completed++;
        console.log(
          `[${completed}/${topics.length}] "${topic}" — ${inserted} new articles (${totalArticles} total)`
        );
      } catch (err) {
        errors++;
        completed++;
        console.error(`[${completed}/${topics.length}] "${topic}" — ERROR: ${err}`);
      }
    }
  });

  await Promise.all(workers);

  // Reindex
  try {
    console.log("Rebuilding IVFFlat index...");
    await pool.query("REINDEX INDEX idx_articles_embedding;");
  } catch {
    console.log("IVFFlat index not found, skipping reindex");
  }

  const countResult = await pool.query("SELECT COUNT(*) FROM articles");
  console.log(`\nDone. Added ${totalArticles} articles (${errors} errors).`);
  console.log(`Total articles in database: ${countResult.rows[0].count}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
