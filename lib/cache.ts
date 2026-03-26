import { readFileSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { STALE_TTL_MS } from "./constants";
import type { Article } from "./types";

// ─── In-Memory Cache + File Persistence ──────────────────
// Writes to /tmp/sift-cache/news.json so data survives server restarts.
// Note: /tmp is writable on most platforms; use Redis/KV for multi-instance deployments.

export interface CacheEntry {
  articles: Article[];
  fetchedAt: number;
}

export const cache = new Map<string, CacheEntry>();

const CACHE_DIR = join("/tmp", "sift-cache");
const CACHE_FILE = join(CACHE_DIR, "news.json");

export function loadCacheFromDisk(): void {
  try {
    const data = JSON.parse(readFileSync(CACHE_FILE, "utf-8")) as Record<string, CacheEntry>;
    const now = Date.now();
    for (const [key, entry] of Object.entries(data)) {
      // Only load entries that aren't totally expired
      if (now - entry.fetchedAt < STALE_TTL_MS) {
        cache.set(key, entry);
      }
    }
    if (cache.size > 0) {
      console.log(`[sift] Loaded ${cache.size} categories from disk cache`);
    }
  } catch {
    // No cache file or corrupt — start fresh
  }
}

export async function saveCacheToDisk(): Promise<void> {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const data: Record<string, CacheEntry> = {};
    for (const [key, entry] of cache.entries()) {
      data[key] = entry;
    }
    await writeFile(CACHE_FILE, JSON.stringify(data), "utf-8");
  } catch (err) {
    // Non-critical — disk cache is best-effort, but log so it's observable
    console.warn("[sift] Failed to save disk cache:", err);
  }
}

// Load persisted cache on module init
loadCacheFromDisk();
