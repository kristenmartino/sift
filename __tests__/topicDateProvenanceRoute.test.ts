/** @jest-environment node */
import { NextRequest } from "next/server";

const mockCreate = jest.fn();
const mockSearch = jest.fn();
const mockInsert = jest.fn();
const mockEmbed = jest.fn();

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ messages: { create: mockCreate } })),
}));
jest.mock("@/lib/db", () => ({
  searchArticlesByEmbedding: (...args: unknown[]) => mockSearch(...args),
  insertArticle: (...args: unknown[]) => mockInsert(...args),
  getOutletProfilesMap: async () => new Map(),
  resolveOutletForSourceName: () => null,
  getArticleEntityLinks: async () => new Map(),
  reserveAiBudget: async () => "test-hold",
  recordAiUsage: async () => undefined,
}));
jest.mock("@/lib/voyage", () => ({ embedTexts: (...args: unknown[]) => mockEmbed(...args) }));
jest.mock("@/lib/civicContext", () => ({ enrichArticleEntityLinks: async () => undefined }));
jest.mock("@/lib/searchAnalyticsLog", () => ({ logSearchQuery: async () => null }));
jest.mock("@/lib/observability", () => ({ reportError: jest.fn() }));
jest.mock("@/lib/usage-tracker", () => ({ logUsage: () => ({ cost_usd: 0.01, input_tokens: 1, output_tokens: 1, web_searches: 1 }) }));

import { GET } from "@/app/api/news/topic/route";

beforeEach(() => {
  jest.clearAllMocks();
  mockSearch.mockResolvedValue([]);
  mockInsert.mockResolvedValue(undefined);
  mockEmbed.mockImplementation(async (texts: string[]) => texts.map(() => [1, 0]));
  mockCreate.mockResolvedValue({ usage: { input_tokens: 10, output_tokens: 10 }, content: [{ type: "text", text: JSON.stringify([{
    title: "Fictional search fixture", summary: "A synthetic test result.",
    source_url: "https://example.com/fixture", source_name: "QA source",
    published_date: "2001-01-01T00:00:00Z",
  }]) }] });
});

async function result(query: string) {
  const response = await GET(new NextRequest(`https://sift.test/api/news/topic?q=${query}`));
  expect(response.status).toBe(200);
  return (await response.text()).trim().split("\n\n").map((frame) => {
    const [event, data] = frame.split("\n");
    return { event: event.slice(7), data: JSON.parse(data.slice(6)) };
  });
}

it("streams fallback articles without inventing a publication date and stores null", async () => {
  const events = await result("fallback-date-fixture");
  const web = events.find((event) => event.data.source === "web-search");
  expect(web?.data.articles).toHaveLength(1);
  expect(web?.data.articles[0].publishedDate).toBeNull();
  expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ published_date: null }));
  expect(events.at(-1)?.data.fallbackUsed).toBe(true);
});

it.each([true, false])("cached search flag %s controls whether a stored timestamp is publishable", async (fromSearch) => {
  mockSearch.mockResolvedValue([1, 2, 3].map((id) => ({
    id: String(id), title: "Stored fixture", summary: "Test only.",
    source_url: `https://example.com/${id}`, source_name: "QA source", category: "science",
    published_date: new Date("2020-01-02T03:04:05Z"), from_search: fromSearch,
    created_at: new Date(), image_url: null, read_time: 1,
  })));
  const events = await result(`cached-date-${fromSearch}`);
  const articles = events.find((event) => event.data.source === "vector")?.data.articles;
  expect(articles).toHaveLength(3);
  expect(articles.map((article: { publishedDate: string | null }) => article.publishedDate))
    .toEqual(Array(3).fill(fromSearch ? null : "2020-01-02T03:04:05.000Z"));
  expect(mockCreate).not.toHaveBeenCalled();
});
