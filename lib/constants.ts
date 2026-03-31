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
  { id: "politics", label: "Politics", icon: "⚖" },
  { id: "sports", label: "Sports", icon: "⬢" },
  { id: "entertainment", label: "Entertainment", icon: "♦" },
];

export const VALID_CATEGORIES = new Set<CategoryId>([
  "top", "technology", "business", "science", "energy", "world", "health",
  "politics", "sports", "entertainment",
]);

// ─── Colors ─────────────────────────────────────────────
// Each color is chosen for meaning, not decoration.
//
//   top           Vermilion   — breaking-news urgency, universal "pay attention"
//   technology    Electric Blue — screens, interfaces, the digital world
//   business      Forest Green — money, growth, markets
//   science       Deep Violet  — mystery, discovery, rare knowledge
//   energy        Teal         — power, sustainability, industry meets nature
//   world         Amber        — old maps, parchment, things that span centuries
//   health        Rose         — life, vitality, warm without being clinical
//   politics      Indigo       — authority, institutions, the weight of governance
//   sports        Cyan         — motion, open sky, the energy of competition
//   entertainment Crimson      — curtain-call red, drama, spectacle

export const CATEGORY_COLORS: Record<CategoryId, { hex: string; rgb: string }> = {
  top:            { hex: "#dc2626", rgb: "220,38,38" },
  technology:     { hex: "#2563eb", rgb: "37,99,235" },
  business:       { hex: "#059669", rgb: "5,150,105" },
  science:        { hex: "#7c3aed", rgb: "124,58,237" },
  energy:         { hex: "#0d9488", rgb: "13,148,136" },
  world:          { hex: "#d97706", rgb: "217,119,6" },
  health:         { hex: "#db2777", rgb: "219,39,119" },
  politics:       { hex: "#6366f1", rgb: "99,102,241" },
  sports:         { hex: "#0891b2", rgb: "8,145,178" },
  entertainment:  { hex: "#e11d48", rgb: "225,29,72" },
};

export const GRADIENTS: Record<CategoryId, string> = {
  top: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  technology: "linear-gradient(135deg, #0c1220 0%, #1a1a3e 50%, #1e3a5f 100%)",
  business: "linear-gradient(135deg, #0a1f1a 0%, #1a2f2a 50%, #0f3d2e 100%)",
  science: "linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 50%, #1a1040 100%)",
  energy: "linear-gradient(135deg, #0a1a1a 0%, #0f2a2a 50%, #0a3d3a 100%)",
  world: "linear-gradient(135deg, #1f1408 0%, #2a1f0a 50%, #3d2a0f 100%)",
  health: "linear-gradient(135deg, #200a1a 0%, #2e1525 50%, #3d0f2a 100%)",
  politics: "linear-gradient(135deg, #0f0f2e 0%, #1a1a4e 50%, #1e1e5f 100%)",
  sports: "linear-gradient(135deg, #0a1a20 0%, #0f2a35 50%, #0a3040 100%)",
  entertainment: "linear-gradient(135deg, #200a15 0%, #2e1020 50%, #3d0f25 100%)",
};

// ─── Compare Sources ────────────────────────────────────

export const COMPARE_SOURCES = [
  { key: "reuters", label: "Reuters" },
  { key: "bbc", label: "BBC" },
  { key: "associated press", label: "AP" },
  { key: "cnn", label: "CNN" },
  { key: "the guardian", label: "The Guardian" },
  { key: "the new york times", label: "NYT" },
  { key: "the washington post", label: "Wash. Post" },
  { key: "al jazeera", label: "Al Jazeera" },
  { key: "npr", label: "NPR" },
  { key: "axios", label: "Axios" },
  { key: "the economist", label: "Economist" },
  { key: "financial times", label: "FT" },
] as const;

export const DEFAULT_COMPARE_SOURCES = ["reuters", "bbc", "associated press"];

// ─── Timing ─────────────────────────────────────────────

export const API_TIMEOUT_MS = 10_000; // 10s — DB reads are fast, no need for 90s
export const SLOW_THRESHOLD_MS = 3_000;

// ─── Storage Keys ───────────────────────────────────────

export const STORAGE_KEYS = {
  bookmarks: "sift-bookmarks",
  theme: "sift-theme",
} as const;
