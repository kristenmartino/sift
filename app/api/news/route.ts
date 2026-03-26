import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORY_QUERIES, CACHE_TTL_MS, STALE_TTL_MS, RATE_LIMIT_MAX } from "@/lib/constants";
import { extractJsonArray, normalizeArticle } from "@/lib/utils";
import { cache, saveCacheToDisk } from "@/lib/cache";
import type { CategoryId, Article, NewsApiResponse, NewsApiError } from "@/lib/types";

// ─── Anthropic Client ──────────────────────────────────
// Uses ANTHROPIC_API_KEY env var automatically

const anthropic = new Anthropic();

// ─── Rate Limiter ───────────────────────────────────────
// Simple sliding window per IP. In production, use Redis.

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 minute
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < window);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  return false;
}

// ─── Prompt Builder ─────────────────────────────────────

function buildPrompt(category: CategoryId): string {
  const query = CATEGORY_QUERIES[category];
  const subtopicList = query.subtopics.map((s) => `- ${s}`).join("\n");

  return `Search for the latest news about ${query.topic}. Search across these subtopics for broad coverage:
${subtopicList}

Summarize the top 5-7 stories you find. Include at least one story from each subtopic if possible. It's fine to summarize in your own words and make reasonable guesses for any missing fields.

IMPORTANT requirements:
- source_url: Always provide the full URL to the specific article page — never a homepage like "https://www.cnn.com/" or a section page.
- image_url: For EVERY article, find and include the article's hero/thumbnail image URL. Look for the main article image, og:image, or featured image on the page. This field is required — only use null as a last resort if absolutely no image exists.

Format your summaries as a JSON array:
[{"title": "Headline", "summary": "2-3 sentence summary", "image_url": "https://example.com/images/article-hero.jpg", "source_url": "https://example.com/2026/03/specific-article-slug", "source_name": "Publisher Name", "published_date": "ISO date or null"}]`;
}

// ─── In-Flight Request Coalescing ───────────────────────
// If a fetch is already in progress for a category (e.g. pre-warm),
// subsequent requests await the same promise instead of firing duplicates.

const inflight = new Map<string, Promise<Article[]>>();

async function fetchOrCoalesce(category: CategoryId): Promise<Article[]> {
  const existing = inflight.get(category);
  if (existing) return existing;

  const promise = fetchArticlesFromClaude(category).finally(() => {
    inflight.delete(category);
  });
  inflight.set(category, promise);
  return promise;
}

// ─── Background Refresh ─────────────────────────────────

async function refreshCategory(category: CategoryId, awaitImages = false): Promise<void> {
  try {
    const articles = await fetchOrCoalesce(category);
    if (articles.length > 0) {
      const fetchedAt = Date.now();
      cache.set(category, { articles, fetchedAt });

      // Enrich with OG images — either await or fire-and-forget
      const enrich = enrichWithOgImages(articles).then((enriched) => {
        const withImages = enriched.filter((a) => a.imageUrl).length;
        if (withImages > 0) {
          cache.set(category, { articles: enriched, fetchedAt });
        }
        saveCacheToDisk();
      }).catch(() => {});

      if (awaitImages) await enrich;
    }
  } catch (err) {
    console.error(`Background refresh failed for ${category}:`, err);
  }
}

// ─── OG Image Extraction ────────────────────────────────
// Fetch the og:image meta tag from an article's source URL.
// Runs in parallel for all articles. Fails silently (returns null).

/**
 * Guard against SSRF: require https and reject private/reserved IP ranges.
 */
function isSafeExternalUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    const h = hostname.toLowerCase();
    if (h === "localhost") return false;
    // Block IPv4 private/reserved ranges
    const ipv4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4) {
      const [o1, o2, o3, o4] = ipv4.slice(1).map(Number);
      // Reject invalid octets (> 255)
      if ([o1, o2, o3, o4].some((o) => o > 255)) return false;
      if (o1 === 10) return false;                              // RFC 1918 private
      if (o1 === 127) return false;                             // loopback
      if (o1 === 169 && o2 === 254) return false;              // link-local (AWS metadata)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return false;   // RFC 1918 private
      if (o1 === 192 && o2 === 168) return false;              // RFC 1918 private
      if (o1 === 0) return false;                               // this network
      if (o1 === 100 && o2 >= 64 && o2 <= 127) return false;  // shared address space
    }
    // Block IPv6 loopback, link-local, and private ranges
    // URL() normalizes IPv6 hostnames without brackets
    if (h === "::1") return false;                              // loopback
    if (h.startsWith("fe80:") || h.startsWith("fe90:") ||
        h.startsWith("fea0:") || h.startsWith("feb0:")) return false; // link-local fe80::/10
    if (h.startsWith("fc") || h.startsWith("fd")) return false; // ULA fc00::/7
    if (h.startsWith("fec0:") || h.startsWith("fed0:") ||
        h.startsWith("fee0:") || h.startsWith("fef0:")) return false; // site-local (deprecated)
    return true;
  } catch {
    return false;
  }
}

async function fetchOgImage(url: string): Promise<string | null> {
  if (!isSafeExternalUrl(url)) return null;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Sift/1.0; +https://sift.news)",
        "Accept": "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000), // 8s per URL
    });
    if (!res.ok) return null;

    // Read only the first 30KB — og:image is always in <head>
    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 30_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    // Try multiple meta image patterns in priority order
    const patterns = [
      // og:image (property="og:image" content="...")
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      // og:image:secure_url
      /<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i,
      // twitter:image
      /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i,
      // meta name="thumbnail"
      /<meta[^>]*name=["']thumbnail["'][^>]*content=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

async function validateImageUrl(url: string): Promise<string | null> {
  if (!isSafeExternalUrl(url)) return null;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    // Accept image/* or missing content-type (many CDNs omit it for HEAD)
    if (contentType && !contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
      return null;
    }

    // Filter tracking pixels and tiny icons — require >2KB if size is known
    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    if (contentLength > 0 && contentLength < 2000) return null;

    return url;
  } catch {
    // If HEAD fails, still accept the URL — the browser might load it fine
    // (some CDNs block HEAD but allow GET; the CardImage onError handles failures)
    return url;
  }
}

async function enrichWithOgImages(articles: Article[]): Promise<Article[]> {
  // Step 1: For articles without images, fetch OG images from source URLs
  const fetches = articles.map((a) =>
    a.imageUrl ? Promise.resolve(a.imageUrl) : fetchOgImage(a.sourceUrl)
  );

  const ogResults = await Promise.race([
    Promise.allSettled(fetches),
    new Promise<PromiseSettledResult<string | null>[]>((resolve) =>
      setTimeout(() => resolve(fetches.map(() => ({ status: "rejected" as const, reason: "timeout" }))), 10000)
    ),
  ]);

  // Step 2: Validate all image URLs (both from Claude and OG scraping)
  const candidateUrls = articles.map((article, i) => {
    const ogResult = ogResults[i];
    return article.imageUrl || (ogResult?.status === "fulfilled" ? ogResult.value : null);
  });

  const validations = candidateUrls.map((url) =>
    url ? validateImageUrl(url) : Promise.resolve(null)
  );

  const validated = await Promise.race([
    Promise.allSettled(validations),
    new Promise<PromiseSettledResult<string | null>[]>((resolve) =>
      setTimeout(() => resolve(validations.map(() => ({ status: "rejected" as const, reason: "timeout" }))), 8000)
    ),
  ]);

  return articles.map((article, i) => {
    const result = validated[i];
    const imageUrl = result?.status === "fulfilled" ? result.value : null;
    return imageUrl ? { ...article, imageUrl } : { ...article, imageUrl: null };
  });
}

// ─── Claude Fetch Logic ─────────────────────────────────

async function fetchArticlesFromClaude(category: CategoryId): Promise<Article[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      },
    ],
    messages: [
      {
        role: "user",
        content: buildPrompt(category),
      },
    ],
  });

  // Collect citation URLs from web_search results
  const citationUrls: string[] = [];

  for (const block of response.content) {
    if (block.type === "text" && block.citations) {
      for (const cite of block.citations) {
        if ("url" in cite && cite.url) {
          if (!citationUrls.includes(cite.url)) {
            citationUrls.push(cite.url);
          }
        }
      }
    }
    // Mine web_search_tool_result blocks for additional citation URLs
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const result of block.content) {
        if (result.type === "web_search_result" && result.url) {
          if (!citationUrls.includes(result.url)) {
            citationUrls.push(result.url);
          }
        }
      }
    }
  }

  // Extract text blocks from response (skip server_tool_use and web_search_tool_result blocks)
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  const fullText = textBlocks.map((b) => b.text).join("\n");

  if (!fullText.trim()) {
    return [];
  }

  // Parse articles from LLM output using the 3-strategy parser
  const rawArticles = extractJsonArray(fullText);

  if (!rawArticles || rawArticles.length === 0) {
    return [];
  }

  // Replace generic homepage URLs with specific citation URLs where possible
  const enrichedRaw = rawArticles.map((raw) => {
    const url = raw.source_url || "";
    let isGeneric = false;
    try {
      const parsed = new URL(url);
      // Normalize pathname by stripping trailing slashes
      const normalizedPath = parsed.pathname.replace(/\/+$/, "");
      // Treat only root or explicit index pages as "generic"
      isGeneric = normalizedPath === "" || normalizedPath === "/" || normalizedPath === "/index.html";
    } catch {
      isGeneric = false;
    }
    if (isGeneric && citationUrls.length > 0) {
      // Find a citation URL from the same domain
      try {
        const domain = new URL(url).hostname.replace("www.", "");
        const match = citationUrls.find((cu) => {
          try { return new URL(cu).hostname.replace("www.", "") === domain; } catch { return false; }
        });
        if (match) {
          return { ...raw, source_url: match };
        }
      } catch {}
    }
    return raw;
  });

  // Normalize and filter out articles missing required fields
  return enrichedRaw
    .filter((raw) => raw.title && raw.source_url)
    .map((raw) => normalizeArticle(raw, category));
}

// ─── Cache Pre-Warming ──────────────────────────────────
// Warm all categories on module load so first visitors get instant results.
// Gate behind SIFT_PREWARM=true to avoid unnecessary cold-start cost on
// serverless platforms where every cold start would trigger a full warm.

const ALL_CATEGORIES: CategoryId[] = ["top", "technology", "business", "science", "energy", "world", "health"];

if (process.env.ANTHROPIC_API_KEY && process.env.SIFT_PREWARM === "true") {
  // Pre-warm categories on server start.
  // Skip categories already fresh from disk cache.
  const now = Date.now();
  const staleCategories = ALL_CATEGORIES.filter((cat) => {
    const entry = cache.get(cat);
    return !entry || now - entry.fetchedAt >= CACHE_TTL_MS;
  });
  const freshFromDisk = ALL_CATEGORIES.length - staleCategories.length;

  if (freshFromDisk > 0) {
    console.log(`[sift] ${freshFromDisk} categories loaded from disk cache`);
  }

  if (staleCategories.length > 0) {
    console.log(`[sift] Pre-warming ${staleCategories.length} categories...`);
    Promise.allSettled(
      staleCategories.map((cat) =>
        refreshCategory(cat, true).then(() => {
          const entry = cache.get(cat);
          const imgCount = entry?.articles.filter((a) => a.imageUrl).length ?? 0;
          console.log(`[sift] ✓ "${cat}" ready (${entry?.articles.length ?? 0} articles, ${imgCount} images)`);
        })
      )
    ).then(() => {
      console.log("[sift] All categories ready");
    });
  } else {
    console.log("[sift] All categories fresh from disk cache — skipping pre-warm");
  }
}

// ─── Route Handler ──────────────────────────────────────

export async function GET(request: NextRequest) {
  // Validate category param
  const category = request.nextUrl.searchParams.get("category") as CategoryId;
  if (!category || !Object.hasOwn(CATEGORY_QUERIES, category)) {
    return NextResponse.json<NewsApiError>(
      {
        error: "Invalid category",
        details: `Must be one of: ${Object.keys(CATEGORY_QUERIES).join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Rate limiting — normalize to the first (client-most) IP in x-forwarded-for,
  // fall back to x-real-ip to avoid bucketing on composite header values.
  const ip =
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json<NewsApiError>(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  // Check cache — two-tier: fresh (< TTL) and stale (< STALE_TTL)
  const now = Date.now();
  const cached = cache.get(category);

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    // Fresh cache — return immediately
    return NextResponse.json<NewsApiResponse>({
      articles: cached.articles,
      cached: true,
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
    });
  }

  if (cached && now - cached.fetchedAt < STALE_TTL_MS) {
    // Stale cache — return immediately, refresh in background
    refreshCategory(category).catch(console.error);
    return NextResponse.json<NewsApiResponse>({
      articles: cached.articles,
      cached: true,
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
    });
  }

  // No cache or too stale — fetch fresh
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json<NewsApiError>(
        { error: "Server configuration error", details: "ANTHROPIC_API_KEY not set" },
        { status: 500 }
      );
    }

    const articles = await fetchOrCoalesce(category);

    if (articles.length === 0) {
      // If we have any stale cache, return it rather than an error
      if (cached) {
        return NextResponse.json<NewsApiResponse>({
          articles: cached.articles,
          cached: true,
          fetchedAt: new Date(cached.fetchedAt).toISOString(),
        });
      }
      return NextResponse.json<NewsApiError>(
        {
          error: "Could not parse articles from AI response",
          details: "The AI response did not contain usable article data. Try again.",
        },
        { status: 502 }
      );
    }

    // Cache the fresh results and return immediately
    const fetchedAt = Date.now();
    cache.set(category, { articles, fetchedAt });
    // Persist cache immediately so disk stays in sync even if enrichment fails
    saveCacheToDisk();
    // Persist cache immediately so disk stays in sync even if enrichment fails
    saveCacheToDisk();
    // Persist cache immediately so disk stays in sync even if enrichment fails
    saveCacheToDisk();
    // Persist cache immediately so disk stays in sync even if enrichment fails
    saveCacheToDisk();

    // Enrich with OG images in background — updates cache for next request
    enrichWithOgImages(articles).then((enriched) => {
      if (enriched.some((a) => a.imageUrl)) {
        cache.set(category, { articles: enriched, fetchedAt });
      }
      saveCacheToDisk();
    }).catch(() => {});

    return NextResponse.json<NewsApiResponse>({
      articles,
      cached: false,
      fetchedAt: new Date(fetchedAt).toISOString(),
    });
  } catch (err) {
    console.error("Claude API error:", err);

    // Fallback to stale cache on API failure
    if (cached) {
      return NextResponse.json<NewsApiResponse>({
        articles: cached.articles,
        cached: true,
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
      });
    }

    return NextResponse.json<NewsApiError>(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
