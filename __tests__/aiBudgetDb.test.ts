/** @jest-environment node */
const mockPoolQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockRelease = jest.fn();
jest.mock("pg", () => ({ Pool: jest.fn(() => ({
  query: (...args: unknown[]) => mockPoolQuery(...args),
  connect: async () => ({ query: (...args: unknown[]) => mockClientQuery(...args), release: mockRelease }),
})) }));

let db: typeof import("@/lib/db");
beforeAll(async () => {
  process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
  db = await import("@/lib/db");
});
beforeEach(() => {
  jest.clearAllMocks();
  mockClientQuery.mockImplementation(async (sql: string) => ({ rows: sql.includes("SELECT settled_at") ? [{ settled_at: null }] : [] }));
});

it("uses the authoritative shared background admission function", async () => {
  mockPoolQuery.mockResolvedValue({ rows: [{ allowed: false }] });
  expect(await db.reserveAiBudget(0.85)).toBeNull();
  expect(mockPoolQuery).toHaveBeenCalledWith(expect.stringContaining("sift_reserve_ai_budget($1, $2, 'background')"), [expect.any(String), 0.85]);
});

it("settles usage and its hold in one locked transaction", async () => {
  await db.recordAiUsage({ provider: "anthropic", model: "test", operation: "test", costUsd: 0.02, holdId: "hold-test" });
  const sql = mockClientQuery.mock.calls.map(([query]) => query).join("\n");
  expect(sql).toContain("pg_advisory_xact_lock(73482691)");
  expect(sql).toContain("AT TIME ZONE 'UTC'");
  expect(sql).toContain("INSERT INTO ai_usage_daily");
  expect(sql).toContain("SET remaining_usd = 0, settled_at = NOW()");
  expect(mockClientQuery.mock.calls.at(-1)?.[0]).toBe("COMMIT");
  expect(mockRelease).toHaveBeenCalled();
});

it("does not double-charge a settled hold", async () => {
  mockClientQuery.mockResolvedValue({ rows: [{ settled_at: "2026-10-26" }] });
  await db.recordAiUsage({ provider: "test", model: "test", operation: "test", costUsd: 1, holdId: "settled" });
  expect(mockClientQuery.mock.calls.some(([sql]) => sql.includes("INSERT INTO ai_usage_daily"))).toBe(false);
});

it("rolls back failed accounting so the hold stays committed", async () => {
  mockClientQuery.mockImplementation(async (sql: string) => {
    if (sql.includes("INSERT INTO ai_usage_daily")) throw new Error("ledger unavailable");
    return { rows: [{ settled_at: null }] };
  });
  await expect(db.recordAiUsage({ provider: "test", model: "test", operation: "test", costUsd: 1, holdId: "held" })).rejects.toThrow("ledger unavailable");
  expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
  expect(mockClientQuery.mock.calls.some(([sql]) => sql.includes("UPDATE ai_budget_holds"))).toBe(false);
});
