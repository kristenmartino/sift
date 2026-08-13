/**
 * @jest-environment node
 *
 * Route tests for /api/topics — the custom-topic CRUD surface.
 *
 * The contract worth pinning: an unauthenticated caller never reaches the DB,
 * a cross-site mutation is refused before auth, the per-user cap is enforced
 * server-side (the client also enforces it, but the client is not the gate),
 * a legacy row whose `query` isn't JSON still renders as a topic, and a DB
 * failure surfaces as a 500 that is *reported* rather than swallowed.
 *
 * `lib/db` and Clerk's `auth()` are mocked — no pg Pool, no session.
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn<Promise<{ userId: string | null }>, []>();
const mockGetCustomTopics = jest.fn();
const mockSaveCustomTopic = jest.fn();
const mockDeleteCustomTopic = jest.fn();
const mockReportError = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  getCustomTopics: (...args: unknown[]) => mockGetCustomTopics(...args),
  saveCustomTopic: (...args: unknown[]) => mockSaveCustomTopic(...args),
  deleteCustomTopic: (...args: unknown[]) => mockDeleteCustomTopic(...args),
}));

jest.mock("@/lib/observability", () => ({
  reportError: (...args: unknown[]) => mockReportError(...args),
}));

import { GET, POST, DELETE } from "@/app/api/topics/route";
import { MAX_CUSTOM_TOPICS } from "@/lib/constants";

const TOPIC = {
  id: "climate-spending",
  shortLabel: "Climate",
  icon: "\u2b50",
  searchQueries: ["climate spending"],
  description: "Federal climate outlays",
};

function mutate(
  method: "POST" | "DELETE",
  body: unknown,
  headers: Record<string, string> = { "sec-fetch-site": "same-origin" },
): NextRequest {
  return new NextRequest("https://siftnews.io/api/topics", {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  mockAuth.mockReset().mockResolvedValue({ userId: "user_1" });
  mockGetCustomTopics.mockReset().mockResolvedValue([]);
  mockSaveCustomTopic.mockReset().mockResolvedValue(undefined);
  mockDeleteCustomTopic.mockReset().mockResolvedValue(undefined);
  mockReportError.mockReset();
});

describe("GET /api/topics", () => {
  it("401s without touching the DB when there's no session", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockGetCustomTopics).not.toHaveBeenCalled();
  });

  it("returns the stored topics for the signed-in user", async () => {
    mockGetCustomTopics.mockResolvedValue([
      { id: TOPIC.id, name: TOPIC.shortLabel, query: JSON.stringify(TOPIC), created_at: new Date(0) },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ topics: [TOPIC] });
    expect(mockGetCustomTopics).toHaveBeenCalledWith("user_1");
  });

  it("rebuilds a topic from the row when `query` predates the JSON payload", async () => {
    mockGetCustomTopics.mockResolvedValue([
      {
        id: "legacy",
        name: "Municipal broadband",
        query: "not json",
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    const { topics } = (await (await GET()).json()) as {
      topics: Array<{ id: string; shortLabel: string; searchQueries: string[]; createdAt: string }>;
    };
    expect(topics[0]).toMatchObject({
      id: "legacy",
      shortLabel: "Municipal br",
      searchQueries: ["Municipal broadband"],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("500s and reports when the query fails", async () => {
    mockGetCustomTopics.mockRejectedValue(new Error("connection terminated"));
    const res = await GET();
    expect(res.status).toBe(500);
    expect(mockReportError).toHaveBeenCalledWith("api.topics.GET", expect.any(Error));
  });
});

describe("POST /api/topics", () => {
  it("403s a cross-site request before checking the session", async () => {
    const res = await POST(mutate("POST", { topic: TOPIC }, { "sec-fetch-site": "cross-site" }));
    expect(res.status).toBe(403);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("401s without a session", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await POST(mutate("POST", { topic: TOPIC }))).status).toBe(401);
    expect(mockSaveCustomTopic).not.toHaveBeenCalled();
  });

  it("saves the topic as a JSON payload keyed to the user", async () => {
    const res = await POST(mutate("POST", { topic: TOPIC }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(mockSaveCustomTopic).toHaveBeenCalledWith(
      TOPIC.id,
      "user_1",
      TOPIC.shortLabel,
      JSON.stringify(TOPIC),
    );
  });

  it("400s a body that misses the schema, without leaking zod's issues", async () => {
    const res = await POST(mutate("POST", { topic: { id: "", shortLabel: "" } }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid topic" });
    expect(mockSaveCustomTopic).not.toHaveBeenCalled();
  });

  it("400s an unparseable body", async () => {
    const res = await POST(mutate("POST", "}{ not json"));
    expect(res.status).toBe(400);
    expect(mockSaveCustomTopic).not.toHaveBeenCalled();
  });

  it("enforces the per-user cap server-side", async () => {
    mockGetCustomTopics.mockResolvedValue(
      Array.from({ length: MAX_CUSTOM_TOPICS }, (_, i) => ({
        id: `t${i}`,
        name: "t",
        query: "{}",
        created_at: new Date(0),
      })),
    );
    const res = await POST(mutate("POST", { topic: TOPIC }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Maximum custom topics reached" });
    expect(mockSaveCustomTopic).not.toHaveBeenCalled();
  });

  it("500s and reports when the write fails", async () => {
    mockSaveCustomTopic.mockRejectedValue(new Error("deadlock detected"));
    const res = await POST(mutate("POST", { topic: TOPIC }));
    expect(res.status).toBe(500);
    expect(mockReportError).toHaveBeenCalledWith("api.topics.POST", expect.any(Error));
  });
});

describe("DELETE /api/topics", () => {
  it("403s a cross-site request", async () => {
    const res = await DELETE(mutate("DELETE", { id: TOPIC.id }, { "sec-fetch-site": "cross-site" }));
    expect(res.status).toBe(403);
  });

  it("401s without a session", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await DELETE(mutate("DELETE", { id: TOPIC.id }))).status).toBe(401);
    expect(mockDeleteCustomTopic).not.toHaveBeenCalled();
  });

  it("deletes only within the caller's own rows", async () => {
    const res = await DELETE(mutate("DELETE", { id: TOPIC.id }));
    expect(res.status).toBe(200);
    expect(mockDeleteCustomTopic).toHaveBeenCalledWith(TOPIC.id, "user_1");
  });

  it("400s a body with no id", async () => {
    const res = await DELETE(mutate("DELETE", {}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "id required" });
  });

  it("500s and reports when the delete fails", async () => {
    mockDeleteCustomTopic.mockRejectedValue(new Error("connection terminated"));
    const res = await DELETE(mutate("DELETE", { id: TOPIC.id }));
    expect(res.status).toBe(500);
    expect(mockReportError).toHaveBeenCalledWith("api.topics.DELETE", expect.any(Error));
  });
});
