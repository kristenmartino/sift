import type { Category, CategoryId } from "./types";

// ─── Categories ─────────────────────────────────────────

export const CATEGORIES: Category[] = [
  { id: "top", label: "Top Stories", icon: "◆" },
  { id: "technology", label: "Technology", icon: "⬡" },
  { id: "business", label: "Business", icon: "△" },
  { id: "science", label: "Science", icon: "◎" },
  { id: "energy", label: "Energy", icon: "⚡" },
  { id: "world", label: "World", icon: "◐" },
  { id: "health", label: "Health", icon: "✦" },
];

export const CATEGORY_QUERIES: Record<CategoryId, { topic: string; subtopics: string[] }> = {
  top: {
    topic: "top breaking news",
    subtopics: ["major headlines today", "breaking news worldwide"],
  },
  technology: {
    topic: "technology",
    subtopics: ["AI and machine learning", "tech startups and companies", "software and cybersecurity"],
  },
  business: {
    topic: "business and finance",
    subtopics: ["stock market and investing", "corporate earnings and deals", "economic policy"],
  },
  science: {
    topic: "science",
    subtopics: ["scientific discoveries and research", "space and astronomy", "climate and environment"],
  },
  energy: {
    topic: "energy",
    subtopics: [
      "electricity grid and power utilities",
      "renewable energy solar and wind",
      "energy prices and electricity demand",
      "NextEra FPL energy companies",
    ],
  },
  world: {
    topic: "world news",
    subtopics: ["international politics and diplomacy", "global conflicts and security", "regional developments"],
  },
  health: {
    topic: "health",
    subtopics: ["medical breakthroughs and research", "public health and policy", "wellness and nutrition"],
  },
};

// ─── Colors ─────────────────────────────────────────────
// Using rgb tuples so we can compose with rgba() — no hex+alpha hack

export const CATEGORY_COLORS: Record<CategoryId, { hex: string; rgb: string }> = {
  top:        { hex: "#dc2626", rgb: "220,38,38" },
  technology: { hex: "#2563eb", rgb: "37,99,235" },
  business:   { hex: "#059669", rgb: "5,150,105" },
  science:    { hex: "#7c3aed", rgb: "124,58,237" },
  energy:     { hex: "#ea580c", rgb: "234,88,12" },
  world:      { hex: "#d97706", rgb: "217,119,6" },
  health:     { hex: "#db2777", rgb: "219,39,119" },
};

export const GRADIENTS: Record<CategoryId, string> = {
  top: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  technology: "linear-gradient(135deg, #0c1220 0%, #1a1a3e 50%, #1e3a5f 100%)",
  business: "linear-gradient(135deg, #0a1f1a 0%, #1a2f2a 50%, #0f3d2e 100%)",
  science: "linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 50%, #1a1040 100%)",
  energy: "linear-gradient(135deg, #1f1008 0%, #2a1a0a 50%, #3d1f0f 100%)",
  world: "linear-gradient(135deg, #1f1408 0%, #2a1f0a 50%, #3d2a0f 100%)",
  health: "linear-gradient(135deg, #200a1a 0%, #2e1525 50%, #3d0f2a 100%)",
};

// ─── Timing ─────────────────────────────────────────────

export const API_TIMEOUT_MS = 90_000; // 90s — Claude web_search needs time for multiple searches
export const SLOW_THRESHOLD_MS = 8_000;
export const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes server-side (aggressive for AI-curated content)
export const RATE_LIMIT_MAX = 30; // requests per minute per IP

// ─── Storage Keys ───────────────────────────────────────

export const STORAGE_KEYS = {
  bookmarks: "sift-bookmarks",
  theme: "sift-theme",
} as const;
