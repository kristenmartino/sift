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

// Phase 2.B: outlet provenance map. Phase 3.H: entity_links lookup.
// Tests pre-date both, so default to empty results (= API returns articles
// without outlet/entityLinks, which is the graceful-degradation path the UI
// tolerates).
// Controllable so the spectrumBuckets tests can hand specific outlets back;
// defaults to null in beforeEach, which is the pre-existing behaviour every
// other test in this file was written against.
const mockResolveOutlet = jest.fn();

jest.mock("@/lib/db", () => ({
  getStoriesWithArticles: (...args: [string]) => mockGetStoriesWithArticles(...args),
  getLastRefreshed: (...args: [string]) => mockGetLastRefreshed(...args),
  getOutletProfilesMap: jest.fn().mockResolvedValue(new Map()),
  resolveOutletForSourceName: (...args: unknown[]) => mockResolveOutlet(...args),
  getArticleEntityLinks: jest.fn().mockResolvedValue(new Map()),
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
    tone: null,
    is_opinion: false,
    is_roundup: false,
    genre: null,
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
    tone: null,
    is_opinion: false,
    is_roundup: false,
    genre: null,
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
  mockResolveOutlet.mockReset();
  mockResolveOutlet.mockReturnValue(null);
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
          outlet_count: 2,
          grim_share: null,
          opinion_share: null,
          avg_importance: 3,
          max_importance: 5,
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
      // grim_share null → no story tone (D48: absent = neutral, no penalty).
      expect(body.stories[0].tone).toBeUndefined();
    });

    it("exposes outletCount separately from articleCount", async () => {
      // The corroboration curve ranks on distinct outlets, so the client
      // re-rank needs that number at the API boundary — it cannot derive it
      // from articleCount. A story where one outlet filed most of the pieces
      // is exactly the case the two numbers must not collapse into one.
      mockGetStoriesWithArticles.mockResolvedValue({
        stories: [{
          id: "story1",
          headline: "Wire pile-up",
          summary: "A synthesized summary.",
          category: "technology",
          framings: [],
          entities: [],
          article_count: 7,
          outlet_count: 2,
          grim_share: null,
          opinion_share: null,
          avg_importance: 3,
          max_importance: 5,
          representative_image_url: null,
          published_date: new Date("2026-03-28T10:00:00Z"),
          synthesis_status: "complete",
        }],
        storyArticles: { story1: [] },
        standaloneArticles: [],
      });

      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.stories[0].articleCount).toBe(7);
      expect(body.stories[0].outletCount).toBe(2);
    });

    it("exposes maxImportance alongside avgImportance for the stage-7 floor", async () => {
      // The floor needs the MAX, and the mean is what dilutes it — so the two
      // must arrive separately. A story whose best member is a 5 but whose
      // mean is 2.8 is exactly the case the floor exists for: measured over
      // 523 prod stories, 5 looked like this.
      mockGetStoriesWithArticles.mockResolvedValue({
        stories: [{
          id: "story1",
          headline: "One important article, minor company",
          summary: "A synthesized summary.",
          category: "technology",
          framings: [],
          entities: [],
          article_count: 3,
          outlet_count: 3,
          grim_share: null,
          opinion_share: null,
          avg_importance: "2.8",
          max_importance: 5,
          representative_image_url: null,
          published_date: new Date("2026-03-28T10:00:00Z"),
          synthesis_status: "complete",
        }],
        storyArticles: { story1: [] },
        standaloneArticles: [],
      });

      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.stories[0].avgImportance).toBeCloseTo(2.8);
      expect(body.stories[0].maxImportance).toBe(5);
    });

    it("omits both importance fields when no member carries a score", async () => {
      // MAX over all-NULL members is NULL, and `Number(null)` is 0 — which as
      // a ranking multiplier reads "score this zero" rather than "unknown".
      // Omitting instead leaves the single definition of "no signal" in the
      // client re-rank (neutral mean, floor off) rather than a second one
      // here: this boundary defaulted to 3 while the client defaulted to 2.5,
      // so the same missing value scored 1.2x on one side and 1.0x on the
      // other.
      mockGetStoriesWithArticles.mockResolvedValue({
        stories: [{
          id: "story1",
          headline: "Two members, neither scored yet",
          summary: "A synthesized summary.",
          category: "technology",
          framings: [],
          entities: [],
          article_count: 2,
          outlet_count: 2,
          grim_share: null,
          opinion_share: null,
          avg_importance: null,
          max_importance: null,
          representative_image_url: null,
          published_date: new Date("2026-03-28T10:00:00Z"),
          synthesis_status: "complete",
        }],
        storyArticles: { story1: [] },
        standaloneArticles: [],
      });

      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.stories[0]).not.toHaveProperty("avgImportance");
      expect(body.stories[0]).not.toHaveProperty("maxImportance");
    });

    it("passes article tone through and derives story tone from grim_share", async () => {
      mockGetStoriesWithArticles.mockResolvedValue({
        stories: [{
          id: "story1",
          headline: "Grim Story",
          summary: "A synthesized summary.",
          category: "technology",
          framings: [],
          entities: [],
          article_count: 2,
          outlet_count: 2,
          // pg returns AVG() as a numeric string.
          grim_share: "0.5",
          opinion_share: "0.5",
          avg_importance: "1.9",
          max_importance: 2,
          representative_image_url: null,
          published_date: new Date("2026-03-28T10:00:00Z"),
          synthesis_status: "complete",
        }],
        storyArticles: {},
        standaloneArticles: [
          { ...MOCK_DB_ROWS[0], tone: "grim" },
          { ...MOCK_DB_ROWS[1], tone: "invalid-value", is_opinion: true, is_roundup: true, genre: "soft" },
        ],
      });

      const res = await GET(makeRequest("technology"));
      const body = await res.json();

      expect(body.articles[0].tone).toBe("grim");
      // Unknown DB values never reach the API contract.
      expect(body.articles[1].tone).toBeUndefined();
      // grim_share >= 0.5 → the story itself is grim.
      expect(body.stories[0].tone).toBe("grim");
      // opinion_share >= 0.5 → the story is opinion (stage 4).
      expect(body.stories[0].isOpinion).toBe(true);
      // Stage 7: mean member importance reaches the client as a number, so
      // corroboration multiplies significance instead of replacing it.
      expect(body.stories[0].avgImportance).toBeCloseTo(1.9);
      // reported articles carry no isOpinion key at all.
      expect(body.articles[0].isOpinion).toBeUndefined();
      expect(body.articles[1].isOpinion).toBe(true);
      expect(body.articles[1].isRoundup).toBe(true);
      expect(body.articles[0].isRoundup).toBeUndefined();
      expect(body.articles[1].genre).toBe("soft");
      // "news" is the default and never travels on the wire.
      expect(body.articles[0].genre).toBeUndefined();
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

// ─── Sanitization at the API boundary ───────────────────
//
// `stripHtml` itself is covered thoroughly in __tests__/sanitize.test.ts. What
// was missing until 2026-08-17 was any coverage of its CALL SITES: no fixture
// in this file contained a single HTML tag, so all six `stripHtml(...)` calls
// in app/api/news/route.ts could be deleted with the whole suite green
// (verified). Story headlines, summaries, framings and entities are all
// LLM-synthesized from external article text and land in the client render
// path, so this is the boundary where the escaping has to hold.

describe("GET /api/news — sanitizes external text", () => {
  const MARKUP = '<img src=x onerror=alert(1)>Fed holds';
  const ENCODED = '&lt;script&gt;alert(1)&lt;/script&gt;Cuts likely';

  function storyWithMarkup() {
    return {
      stories: [{
        id: "story1",
        headline: MARKUP,
        summary: `<b>Bold</b> claim`,
        category: "technology",
        framings: [{
          source_name: `<i>Reuters</i>`,
          framing: ENCODED,
          tone: "neutral",
        }],
        entities: [{
          people: [`<b>Alice</b>`],
          organizations: [`<span>Acme</span>`],
          locations: [`<em>NYC</em>`],
          event_description: `<script>x</script>A rate decision`,
        }],
        article_count: 1,
        outlet_count: 1,
        grim_share: null,
        opinion_share: null,
        avg_importance: 3,
        max_importance: 3,
        representative_image_url: null,
        published_date: new Date("2026-03-28T10:00:00Z"),
        synthesis_status: "complete",
      }],
      storyArticles: { story1: [{ ...MOCK_DB_ROWS[0], story_id: "story1" }] },
      standaloneArticles: [],
    };
  }

  it("strips markup from the story headline and summary", async () => {
    mockGetStoriesWithArticles.mockResolvedValue(storyWithMarkup());
    const body = await (await GET(makeRequest("technology"))).json();

    expect(body.stories[0].headline).toBe("Fed holds");
    expect(body.stories[0].summary).toBe("Bold claim");
  });

  it("strips markup from framing source names and framing text", async () => {
    mockGetStoriesWithArticles.mockResolvedValue(storyWithMarkup());
    const body = await (await GET(makeRequest("technology"))).json();
    const framing = body.stories[0].framings[0];

    expect(framing.sourceName).toBe("Reuters");
    // `stripHtml` decodes entities FIRST and then removes tags, so an encoded
    // <script> cannot survive as text a client later un-escapes into markup.
    // It removes tags, not the text between them — hence the bare "alert(1)".
    // That is the intended contract (lib/sanitize.ts:23-28): the security
    // property is that no bracket survives, which the backstop below pins.
    expect(framing.framing).toBe("alert(1)Cuts likely");
  });

  it("strips markup from every entity list and the event description", async () => {
    mockGetStoriesWithArticles.mockResolvedValue(storyWithMarkup());
    const body = await (await GET(makeRequest("technology"))).json();
    const entities = body.stories[0].entities[0];

    expect(entities.people).toEqual(["Alice"]);
    expect(entities.organizations).toEqual(["Acme"]);
    expect(entities.locations).toEqual(["NYC"]);
    // Tags removed, inner text kept — see the note above.
    expect(entities.eventDescription).toBe("xA rate decision");
  });

  it("leaves no angle bracket anywhere in the serialized story", async () => {
    mockGetStoriesWithArticles.mockResolvedValue(storyWithMarkup());
    const body = await (await GET(makeRequest("technology"))).json();

    // A backstop for call sites added later: any new unsanitized story field
    // fails here even if no one adds a test for it by name.
    expect(JSON.stringify(body.stories[0])).not.toMatch(/[<>]/);
  });
});

// ─── Ranking v2 stage 1: spectrumBuckets ────────────────
//
// `countOccupiedBuckets` is unit-tested in __tests__/crossSpectrum.test.ts,
// but until 2026-08-17 the string "spectrumBuckets" did not appear anywhere in
// this suite — the route's WIRING of it was untested, including the stage-4
// `reportedSources` filter that stops op-ed-only framings counting as
// cross-spectrum corroboration (sift-api#200).

describe("GET /api/news — spectrumBuckets", () => {
  const OUTLETS: Record<string, { allSidesRating: string }> = {
    Reuters: { allSidesRating: "center" },
    "The Nation": { allSidesRating: "left" },
    "NY Post": { allSidesRating: "right" },
  };

  function storyAcrossSpectrum(childOverrides: Array<Record<string, unknown>>) {
    return {
      stories: [{
        id: "story1",
        headline: "Rate decision",
        summary: "A synthesized summary.",
        category: "technology",
        framings: [
          { source_name: "Reuters", framing: "Timeline", tone: "neutral" },
          { source_name: "The Nation", framing: "Labor angle", tone: "neutral" },
          { source_name: "NY Post", framing: "Markets angle", tone: "neutral" },
        ],
        entities: [],
        article_count: 3,
        outlet_count: 3,
        grim_share: null,
        opinion_share: null,
        avg_importance: 3,
        max_importance: 3,
        representative_image_url: null,
        published_date: new Date("2026-03-28T10:00:00Z"),
        synthesis_status: "complete",
      }],
      storyArticles: {
        story1: childOverrides.map((o, i) => ({
          ...MOCK_DB_ROWS[0],
          id: `child${i}`,
          story_id: "story1",
          ...o,
        })),
      },
      standaloneArticles: [],
    };
  }

  beforeEach(() => {
    mockResolveOutlet.mockImplementation(
      (_map: unknown, sourceName: string) => OUTLETS[sourceName] ?? null,
    );
  });

  it("counts the distinct L/C/R buckets the reported framings occupy", async () => {
    mockGetStoriesWithArticles.mockResolvedValue(
      storyAcrossSpectrum([
        { source_name: "Reuters", is_opinion: false },
        { source_name: "The Nation", is_opinion: false },
        { source_name: "NY Post", is_opinion: false },
      ]),
    );
    const body = await (await GET(makeRequest("technology"))).json();
    expect(body.stories[0].spectrumBuckets).toBe(3);
  });

  it("does not count framings whose outlet only filed opinion pieces", async () => {
    // Stage 4: op-eds across lanes are disagreement, not corroboration. Only
    // Reuters filed a REPORTED piece, so one bucket is occupied, not three.
    mockGetStoriesWithArticles.mockResolvedValue(
      storyAcrossSpectrum([
        { source_name: "Reuters", is_opinion: false },
        { source_name: "The Nation", is_opinion: true },
        { source_name: "NY Post", is_opinion: true },
      ]),
    );
    const body = await (await GET(makeRequest("technology"))).json();
    expect(body.stories[0].spectrumBuckets).toBe(1);
  });

  it("omits spectrumBuckets entirely when no framing resolves to a bucket", async () => {
    // Omitted rather than 0 — the client re-rank defines "no signal" itself,
    // and a second definition here is how the two ends drifted apart before.
    mockResolveOutlet.mockReturnValue(null);
    mockGetStoriesWithArticles.mockResolvedValue(
      storyAcrossSpectrum([{ source_name: "Reuters", is_opinion: false }]),
    );
    const body = await (await GET(makeRequest("technology"))).json();
    expect(body.stories[0]).not.toHaveProperty("spectrumBuckets");
  });
});
