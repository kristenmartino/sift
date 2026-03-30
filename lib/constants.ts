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
// Using rgb tuples so we can compose with rgba() — no hex+alpha hack

export const CATEGORY_COLORS: Record<CategoryId, { hex: string; rgb: string }> = {
  top:        { hex: "#dc2626", rgb: "220,38,38" },
  technology: { hex: "#2563eb", rgb: "37,99,235" },
  business:   { hex: "#059669", rgb: "5,150,105" },
  science:    { hex: "#7c3aed", rgb: "124,58,237" },
  energy:     { hex: "#ea580c", rgb: "234,88,12" },
  world:      { hex: "#d97706", rgb: "217,119,6" },
  health:     { hex: "#db2777", rgb: "219,39,119" },
  politics:   { hex: "#6366f1", rgb: "99,102,241" },
  sports:     { hex: "#0891b2", rgb: "8,145,178" },
  entertainment: { hex: "#e11d48", rgb: "225,29,72" },
};

export const GRADIENTS: Record<CategoryId, string> = {
  top: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  technology: "linear-gradient(135deg, #0c1220 0%, #1a1a3e 50%, #1e3a5f 100%)",
  business: "linear-gradient(135deg, #0a1f1a 0%, #1a2f2a 50%, #0f3d2e 100%)",
  science: "linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 50%, #1a1040 100%)",
  energy: "linear-gradient(135deg, #1f1008 0%, #2a1a0a 50%, #3d1f0f 100%)",
  world: "linear-gradient(135deg, #1f1408 0%, #2a1f0a 50%, #3d2a0f 100%)",
  health: "linear-gradient(135deg, #200a1a 0%, #2e1525 50%, #3d0f2a 100%)",
  politics: "linear-gradient(135deg, #0f0f2e 0%, #1a1a4e 50%, #1e1e5f 100%)",
  sports: "linear-gradient(135deg, #0a1a20 0%, #0f2a35 50%, #0a3040 100%)",
  entertainment: "linear-gradient(135deg, #200a15 0%, #2e1020 50%, #3d0f25 100%)",
};

// ─── Timing ─────────────────────────────────────────────

export const API_TIMEOUT_MS = 10_000; // 10s — DB reads are fast, no need for 90s
export const SLOW_THRESHOLD_MS = 3_000;

// ─── Storage Keys ───────────────────────────────────────

export const STORAGE_KEYS = {
  bookmarks: "sift-bookmarks",
  theme: "sift-theme",
} as const;
