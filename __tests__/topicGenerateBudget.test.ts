/** @jest-environment node */
import { NextRequest } from "next/server";
const mockReserve = jest.fn();
const mockCreate = jest.fn();
const mockRecord = jest.fn();
jest.mock("@/lib/db", () => ({ reserveAiBudget: (...args: unknown[]) => mockReserve(...args), recordAiUsage: (...args: unknown[]) => mockRecord(...args) }));
jest.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "budget-test" }) }));
jest.mock("@/lib/security", () => ({ checkCsrf: () => null }));
jest.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ allowed: true }) }));
jest.mock("@/lib/observability", () => ({ reportError: jest.fn() }));
jest.mock("@anthropic-ai/sdk", () => ({ __esModule: true, default: jest.fn(() => ({ messages: { create: mockCreate } })) }));
import { POST } from "@/app/api/topics/generate/route";

beforeEach(() => { jest.clearAllMocks(); });
function request() { return new NextRequest("https://sift.test/api/topics/generate", { method: "POST", body: JSON.stringify({ rawTopic: "space" }) }); }

it("refuses paid topic generation when the background allocation is exhausted", async () => {
  mockReserve.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(503);
  expect(mockCreate).not.toHaveBeenCalled();
});

it("records topic generation against its hold before returning", async () => {
  mockReserve.mockResolvedValue("topic-hold");
  mockRecord.mockResolvedValue(undefined);
  mockCreate.mockResolvedValue({ usage: { input_tokens: 10, output_tokens: 10 }, content: [{ type: "text", text: JSON.stringify({ shortLabel: "Space", icon: "☆", searchQueries: ["NASA"], description: "Space news" }) }] });
  expect((await POST(request())).status).toBe(200);
  expect(mockRecord).toHaveBeenCalledWith(expect.objectContaining({ holdId: "topic-hold", operation: "topics.generate" }));
});
