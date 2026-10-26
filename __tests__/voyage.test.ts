/**
 * @jest-environment node
 *
 * Voyage embeddings client (lib/voyage.ts). Topic search embeds three
 * different things through this one call, so the request shape and the
 * error posture are worth pinning.
 */

jest.mock("@/lib/db", () => ({ reserveAiBudget: jest.fn(async () => "hold-test"), recordAiUsage: jest.fn(async () => undefined) }));

import { reserveAiBudget, recordAiUsage } from "@/lib/db";
import { embedTexts, VOYAGE_MODEL } from "@/lib/voyage";

const originalKey = process.env.VOYAGE_API_KEY;
const fetchMock = jest.fn();

beforeEach(() => {
  process.env.VOYAGE_API_KEY = "vk-test";
  fetchMock.mockReset();
  jest.mocked(reserveAiBudget).mockResolvedValue("hold-test");
  jest.mocked(recordAiUsage).mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  process.env.VOYAGE_API_KEY = originalKey;
});

describe("embedTexts", () => {
  it("sends the model, input type, and key, and returns vectors in order", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ usage: { total_tokens: 4 }, data: [{ embedding: [1, 2] }, { embedding: [3, 4] }] }),
    });

    const embeddings = await embedTexts(["a", "b"], "document");

    expect(embeddings).toEqual([
      [1, 2],
      [3, 4],
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.voyageai.com/v1/embeddings");
    expect(init.headers.Authorization).toBe("Bearer vk-test");
    expect(JSON.parse(init.body)).toEqual({
      input: ["a", "b"],
      model: VOYAGE_MODEL,
      input_type: "document",
    });
  });

  it("throws with the upstream status and body on a failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "slow down",
    });

    await expect(embedTexts(["a"], "query")).rejects.toThrow(
      "Voyage API error 429: slow down",
    );
  });

  it("throws before calling out when the key is missing", async () => {
    delete process.env.VOYAGE_API_KEY;
    await expect(embedTexts(["a"], "query")).rejects.toThrow(
      "VOYAGE_API_KEY environment variable is not set",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});


it("makes no paid call when background admission is refused", async () => {
  jest.mocked(reserveAiBudget).mockResolvedValue(null);
  await expect(embedTexts(["a"], "query")).rejects.toThrow("shared AI budget");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("settles reported usage against the hold before returning", async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: [{ embedding: [1] }], usage: { total_tokens: 100 } }) });
  await embedTexts(["a"], "query");
  expect(recordAiUsage).toHaveBeenCalledWith(expect.objectContaining({ holdId: "hold-test", costUsd: 0.000002, provider: "voyage" }));
});
