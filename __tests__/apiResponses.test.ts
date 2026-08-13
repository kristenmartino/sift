/**
 * @jest-environment node
 *
 * Shared API route responses (lib/apiResponses.ts). The status codes and the
 * `{ error }` body shape are the client contract; Retry-After is what the
 * search UI reads to back off.
 */

import { z } from "zod";

import {
  badRequest,
  internalError,
  parseJsonBody,
  tooManyRequests,
  unauthorized,
} from "@/lib/apiResponses";

function jsonRequest(body: unknown): Request {
  return new Request("https://sift.test/api/x", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("error responses", () => {
  it("returns the documented status and body for each helper", async () => {
    const cases = [
      [unauthorized(), 401, "Unauthorized"],
      [badRequest("articleId required"), 400, "articleId required"],
      [internalError(), 500, "Internal server error"],
      [internalError("Server misconfigured"), 500, "Server misconfigured"],
    ] as const;
    for (const [res, status, error] of cases) {
      expect(res.status).toBe(status);
      await expect(res.json()).resolves.toEqual({ error });
    }
  });

  it("rounds Retry-After up to whole seconds", () => {
    expect(tooManyRequests(1200).headers.get("Retry-After")).toBe("2");
    expect(tooManyRequests(0).headers.get("Retry-After")).toBe("0");
    expect(tooManyRequests(60_000).status).toBe(429);
  });
});

describe("parseJsonBody", () => {
  const schema = z.object({ articleId: z.string().min(1) });

  it("returns the parsed body when it validates", async () => {
    const { data, response } = await parseJsonBody(
      jsonRequest({ articleId: "abc" }),
      schema,
      "articleId required",
    );
    expect(response).toBeUndefined();
    expect(data).toEqual({ articleId: "abc" });
  });

  it("returns a 400 with the caller's message on a schema miss", async () => {
    const { data, response } = await parseJsonBody(
      jsonRequest({ articleId: "" }),
      schema,
      "articleId required",
    );
    expect(data).toBeUndefined();
    expect(response!.status).toBe(400);
    await expect(response!.json()).resolves.toEqual({
      error: "articleId required",
    });
  });

  it("treats malformed JSON as a bad request, not a crash", async () => {
    const { response } = await parseJsonBody(
      jsonRequest("{not json"),
      schema,
      "articleId required",
    );
    expect(response!.status).toBe(400);
  });
});
