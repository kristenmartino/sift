/**
 * @jest-environment node
 *
 * API route tests for the v2 Postgres-backed /api/news endpoint.
 *
 * These test the GET route handler with mocked database calls.
 * The route reads from Postgres — no AI calls, no cache logic.
 */

import { NextRequest } from "next/server";
import type { DbArticle, DbStory, DbStoryArticle } from "@/lib/db";

// ─── Mock DB ────────────────────────────────────────────

const mockGetStoriesWithArticles = jest.fn<
  Promise<{ stories: DbStory[]; storyArticles: Record<string, DbStoryArticle[]>; standaloneArticles: DbArticle[] }>,
  [string]
>();
const mockGetLastRefreshed = jest.fn<Promise<Date | null>, [string]>();

jest.mock("@/lib/db", () => ({
  getStoriesWithArticles: (...args: [string]) => mockGetStoriesWithArticles(...args),
  getLastRefreshed: (...args: [string]) => mockGetLastRefreshed(...args),
}));

import { GET } from "../app/api/news/route";

// ─── Mock Data ──────────────────────────────────────────

const MOCK_DB_ROWS: DbArticle[] = [
  {
    id: "abc123",
    title: "Test Article 1",
    summary: "Summary of article 1.",
    source_url: "https://reuters.com/1",
    source_name: "Reuters",
    image_url: null,
    category: "technology",
    published_date: new Date("2026-03-28T10:00:00Z"),
    read_time: 2,
    why_it_matters: null,
    importance_score: null,
    context_primer: null,
    reading_levels: null,
    created_at: new Date("2026-03-28T10:00:00Z"),
  },
  {
    id: "def456",
    title: "Test Article 2",
    summary: "Summary of article 2.",
    source_url: "https://bbc.com/2",
    source_name: "BBC",
    image_url: "https://img.bbc.com/photo.jpg",
    category: "technology",
    published_date: new Date("2026-03-28T08:00:00Z"),
    read_time: 3,
    why_it_matters: null,
    importance_score: null,
    context_primer: null,
    reading_levels: null,
    created_at: new Date("2026-03-28T08:00:00Z"),
  },
];

const MOCK_LAST_REFRESHED = new Date("2026-03-28T12:00:00Z");

function makeDefaultReturn(standaloneArticles: DbArticle[] = MOCK_DB_ROWS) {
  return {
    stories: [] as DbStory[],
    storyArticles: {} as Record<string, DbStoryArticle[]>,
    standaloneArticles,
  };
}

function makeRequest(category?: string) {
  const url = category
    ? `http://localhost/api/news?category=${category}`
    : "http://localhost/api/news";
  return new NextRequest(url);
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  mockGetStoriesWithArticles.mockReset();
  mockGetLastRefreshed.mockReset();
  mockGetStoriesWithArticles.mockResolvedValue(makeDefaultReturn());
  mockGetLastRefreshed.mockResolvedValue(MOCK_LAST_REFRESHED);
});

// ─── Tests ──────────────────────────────────────────────

describe("GET /api/news", () => {
  describe("Category validation", () => {
    it("returns 400 for missing category", async () => {
      const res = await GET(makeRequest());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid category");
    });

    it("returns 400 for invalid category", async () => {
      const res = await GET(makeRequest("invalid"));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid category");
      expect(body.details).toContain("technology");
    });

    it("accepts all 7 valid categories", async () => {
      const categories = ["top", "technology", "business", "science", "energy", "world", "health"];
      for (const cat of categories) {
        const res = await GET(makeRequest(cat));
        expect(res.status).toBe(200);
      }
      expect(mockGetStoriesWithArticles).toHaveBeenCalledTimes(7);
    });
  });

  describe("Successful response", () => {
    it("returns articles from database", async () => {
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.articles).toHaveLength(2);
      expect(body.articles[0].title).toBe("Test Article 1");
      expect(body.articles[1].title).toBe("Test Article 2");
    });

    it("returns stories array in response", async () => {
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.stories).toBeDefined();
      expect(Array.isArray(body.stories)).toBe(true);
    });

    it("maps DB columns to camelCase API fields", async () => {
      const res = await GET(makeRequest("technology"));
      const body = await res.json();
      const article = body.articles[0];

      expect(article.id).toBe("abc123");
      expect(article.sourceUrl).toBe("https://reuters.com/1");
      expect(article.sourceName).toBe("Reuters");
      expect(article.publishedDate).toBe("2026-03-28T10:00:00.000Z");
      expect(article.imageUrl).toBeNull();
      expect(article.category).toBe("technology");
      expect(article.readTime).toBe(2);
    });

    it("includes fetchedAt from pipeline_state", async () => {
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.fetchedAt).toBe("2026-03-28T12:00:00.000Z");
      expect(body.cached).toBe(false);
    });

    it("uses current time for fetchedAt when no pipeline_state exists", async () => {
      mockGetLastRefreshed.mockResolvedValue(null);
      const before = new Date().toISOString();
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(new Date(body.fetchedAt).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
    });

    it("handles empty result set", async () => {
      mockGetStoriesWithArticles.mockResolvedValue(makeDefaultReturn([]));
      const res = await GET(makeRequest("energy"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.articles).toHaveLength(0);
    });

    it("falls back to empty string for null summary", async () => {
      mockGetStoriesWithArticles.mockResolvedValue(
        makeDefaultReturn([{ ...MOCK_DB_ROWS[0], summary: null }])
      );
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.articles[0].summary).toBe("");
    });

    it("handles null published_date", async () => {
      mockGetStoriesWithArticles.mockResolvedValue(
        makeDefaultReturn([{ ...MOCK_DB_ROWS[0], published_date: null }])
      );
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.articles[0].publishedDate).toBeNull();
    });

    it("defaults readTime to 1 when read_time is 0", async () => {
      mockGetStoriesWithArticles.mockResolvedValue(
        makeDefaultReturn([{ ...MOCK_DB_ROWS[0], read_time: 0 }])
      );
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.articles[0].readTime).toBe(1);
    });

    it("upgrades low-quality Contentful image URLs", async () => {
      mockGetStoriesWithArticles.mockResolvedValue(
        makeDefaultReturn([{
          ...MOCK_DB_ROWS[0],
          image_url: "https://images.ctfassets.net/abc/photo.jpg?w=300&q=30",
        }])
      );
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.articles[0].imageUrl).toContain("w=800");
      expect(body.articles[0].imageUrl).toContain("q=80");
      expect(body.articles[0].imageUrl).not.toContain("w=300");
    });

    it("passes through non-Contentful image URLs unchanged", async () => {
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.articles[1].imageUrl).toBe("https://img.bbc.com/photo.jpg");
    });

    it("maps stories with framings and entities", async () => {
      mockGetStoriesWithArticles.mockResolvedValue({
        stories: [{
          id: "story1",
          headline: "Test Story",
          summary: "A synthesized summary.",
          category: "technology",
          framings: [{ source_name: "Reuters", framing: "Focuses on timeline", tone: "neutral" }],
          entities: [{ people: ["Alice"], organizations: ["Acme"], locations: ["NYC"], event_description: "test event" }],
          article_count: 2,
          representative_image_url: null,
          published_date: new Date("2026-03-28T10:00:00Z"),
          synthesis_status: "complete",
        }],
        storyArticles: {
          story1: [
            { ...MOCK_DB_ROWS[0], story_id: "story1" },
            { ...MOCK_DB_ROWS[1], story_id: "story1" },
          ],
        },
        standaloneArticles: [],
      });

      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.stories).toHaveLength(1);
      expect(body.stories[0].headline).toBe("Test Story");
      expect(body.stories[0].framings[0].sourceName).toBe("Reuters");
      expect(body.stories[0].entities[0].people).toEqual(["Alice"]);
      expect(body.stories[0].articles).toHaveLength(2);
    });
  });

  describe("Error handling", () => {
    it("returns 500 when database query fails", async () => {
      mockGetStoriesWithArticles.mockRejectedValue(new Error("connection refused"));
      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(body.details).toBeUndefined();
    });
  });

  describe("Query parameters", () => {
    it("passes category to getStoriesWithArticles", async () => {
      await GET(makeRequest("science"));
      expect(mockGetStoriesWithArticles).toHaveBeenCalledWith("science");
    });

    it("passes category to getLastRefreshed", async () => {
      await GET(makeRequest("world"));
      expect(mockGetLastRefreshed).toHaveBeenCalledWith("world");
    });
  });
});
