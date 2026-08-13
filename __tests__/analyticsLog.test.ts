/**
 * Tests for the two fire-and-forget analytics writers —
 * lib/searchAnalyticsLog.ts and lib/primerAnalyticsLog.ts.
 *
 * Both exist so a missing migration or a bad INSERT can never break the
 * user-visible path: search still streams, the primer still expands. That
 * contract is what's asserted here — kill switch honored, parameters bound
 * in the order the SQL declares, and every failure mode resolving to null
 * instead of throwing.
 *
 * `lib/db` is mocked so no pg Pool (or DATABASE_URL) is involved.
 */
const mockQuery = jest.fn();

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { query: (...args: unknown[]) => mockQuery(...args) },
}));

import { logPrimerExpand } from "@/lib/primerAnalyticsLog";
import { logSearchQuery } from "@/lib/searchAnalyticsLog";
import type { SearchAnalyticsRow } from "@/lib/searchAnalytics";

const ORIGINAL_FLAG = process.env.SEARCH_LOGGING_ENABLED;

let warnSpy: jest.SpyInstance;

beforeAll(() => {
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  warnSpy.mockRestore();
  if (ORIGINAL_FLAG === undefined) delete process.env.SEARCH_LOGGING_ENABLED;
  else process.env.SEARCH_LOGGING_ENABLED = ORIGINAL_FLAG;
});

beforeEach(() => {
  mockQuery.mockReset();
  warnSpy.mockClear();
  delete process.env.SEARCH_LOGGING_ENABLED;
});

// ─── logSearchQuery ─────────────────────────────────────

const FULL_ROW: SearchAnalyticsRow = {
  query: "Schumer housing",
  queryNorm: "schumer housing",
  queryTokenCount: 2,
  resultCountVector: 8,
  resultCountTotal: 12,
  fallbackUsed: true,
  latencyMsTotal: 1420,
  latencyMsEmbed: 90,
  latencyMsVector: 130,
  latencyMsFallback: 1180,
  sessionId: "sess-1",
  ipHash: "abc123",
  userAgentClass: "desktop",
  matchedEntityType: "politician",
  matchedEntityId: "S000148",
};

describe("logSearchQuery", () => {
  it("returns the inserted row id", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: "row-1" }] });
    await expect(logSearchQuery(FULL_ROW)).resolves.toBe("row-1");
  });

  it("binds all 15 parameters in the order the INSERT declares", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: "row-1" }] });
    await logSearchQuery(FULL_ROW);
    expect(mockQuery.mock.calls[0][1]).toEqual([
      "Schumer housing",
      "schumer housing",
      2,
      8,
      12,
      true,
      1420,
      90,
      130,
      1180,
      "sess-1",
      "abc123",
      "desktop",
      "politician",
      "S000148",
    ]);
  });

  it("coerces the optional fields to null so pg gets a value for every placeholder", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: "row-2" }] });
    await logSearchQuery({
      query: "fed",
      queryNorm: "fed",
      queryTokenCount: 1,
      resultCountVector: 0,
      resultCountTotal: 0,
      fallbackUsed: false,
      latencyMsTotal: 12,
    });
    expect(mockQuery.mock.calls[0][1].slice(7)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("does not insert when the kill switch is set", async () => {
    process.env.SEARCH_LOGGING_ENABLED = "false";
    await expect(logSearchQuery(FULL_ROW)).resolves.toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("still inserts when the flag is set to anything other than 'false'", async () => {
    process.env.SEARCH_LOGGING_ENABLED = "true";
    mockQuery.mockResolvedValue({ rows: [{ id: "row-3" }] });
    await expect(logSearchQuery(FULL_ROW)).resolves.toBe("row-3");
  });

  it("returns null when the INSERT returns no row", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await expect(logSearchQuery(FULL_ROW)).resolves.toBeNull();
  });

  it("warns and returns null when search_queries isn't provisioned yet", async () => {
    mockQuery.mockRejectedValue(
      new Error('relation "search_queries" does not exist'),
    );
    await expect(logSearchQuery(FULL_ROW)).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "search_queries table not yet provisioned; skipping analytics insert",
    );
  });

  it("swallows any other INSERT failure — search must still stream", async () => {
    mockQuery.mockRejectedValue(new Error("deadlock detected"));
    await expect(logSearchQuery(FULL_ROW)).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "logSearchQuery failed:",
      expect.any(Error),
    );
  });
});

// ─── logPrimerExpand ────────────────────────────────────

const EXPAND_ROW = {
  articleId: "abc123",
  surface: "feed",
  sessionId: "sess-1",
  ipHash: "hash-1",
  userAgentClass: "mobile",
};

describe("logPrimerExpand", () => {
  it("returns the inserted row id and binds the five columns in order", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: "expand-1" }] });
    await expect(logPrimerExpand(EXPAND_ROW)).resolves.toBe("expand-1");
    expect(mockQuery.mock.calls[0][1]).toEqual([
      "abc123",
      "feed",
      "sess-1",
      "hash-1",
      "mobile",
    ]);
  });

  it("inserts an all-null row rather than skipping an anonymous expand", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: "expand-2" }] });
    await logPrimerExpand({
      articleId: null,
      surface: null,
      sessionId: null,
      ipHash: null,
      userAgentClass: null,
    });
    expect(mockQuery.mock.calls[0][1]).toEqual([null, null, null, null, null]);
  });

  it("shares the search kill switch", async () => {
    process.env.SEARCH_LOGGING_ENABLED = "false";
    await expect(logPrimerExpand(EXPAND_ROW)).resolves.toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns null when the INSERT returns no row", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await expect(logPrimerExpand(EXPAND_ROW)).resolves.toBeNull();
  });

  it("warns and returns null when primer_expand_events isn't provisioned yet", async () => {
    mockQuery.mockRejectedValue(
      new Error('relation "primer_expand_events" does not exist'),
    );
    await expect(logPrimerExpand(EXPAND_ROW)).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "primer_expand_events table not yet provisioned; skipping insert",
    );
  });

  it("swallows any other INSERT failure — the expand must still complete", async () => {
    mockQuery.mockRejectedValue(new Error("connection terminated"));
    await expect(logPrimerExpand(EXPAND_ROW)).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "logPrimerExpand failed:",
      expect.any(Error),
    );
  });
});
