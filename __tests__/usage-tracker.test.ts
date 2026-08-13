import { logUsage, countWebSearches } from "@/lib/usage-tracker";

// lib/usage-tracker.ts logs via console.log on every call. Silence it so test
// output stays readable, and restore afterwards.
let logSpy: jest.SpyInstance;
beforeAll(() => {
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});
afterAll(() => {
  logSpy.mockRestore();
});

const ONE_M = 1_000_000;

function response(usage: Record<string, number>, content: unknown[] = []) {
  return { usage, content } as never;
}

// ─── price table parity ─────────────────────────────────

/**
 * The cross-language contract.
 *
 * lib/usage-tracker.ts and sift-api/services/usage_tracker.py each hardcode the
 * same five Anthropic prices, in two languages, in two independent git repos,
 * with no shared source. The identical assertion lives in
 * sift-api/tests/test_usage_tracker.py::TestPriceTableParity — if either table
 * drifts, exactly one of the two suites goes red.
 *
 * One synthetic payload exercises all five constants at once:
 *   1M input       x $1.00/M = 1.00
 *   1M output      x $5.00/M = 5.00
 *   1M cache write x $1.25/M = 1.25
 *   1M cache read  x $0.10/M = 0.10
 *   3 web searches x $0.010  = 0.03
 *                             ------
 *                               7.38
 */
describe("price table parity with sift-api", () => {
  const GOLDEN_COST_USD = 7.38;

  it("matches the golden cost shared with sift-api", () => {
    const payload = logUsage(
      "test",
      response({
        input_tokens: ONE_M,
        output_tokens: ONE_M,
        cache_creation_input_tokens: ONE_M,
        cache_read_input_tokens: ONE_M,
      }),
      "claude-haiku-4-5",
      3,
    );
    expect(payload?.cost_usd).toBe(GOLDEN_COST_USD);
  });

  it.each([
    ["input", { input_tokens: ONE_M }, 1.0],
    ["output", { output_tokens: ONE_M }, 5.0],
    ["cache_write", { cache_creation_input_tokens: ONE_M }, 1.25],
    ["cache_read", { cache_read_input_tokens: ONE_M }, 0.1],
  ])("prices %s identically to sift-api", (_name, usage, expected) => {
    const payload = logUsage("test", response(usage as Record<string, number>), "m", 0);
    expect(payload?.cost_usd).toBe(expected);
  });

  it("prices a web search identically to sift-api", () => {
    const payload = logUsage("test", response({}), "m", 1);
    expect(payload?.cost_usd).toBe(0.01);
  });
});

// ─── logUsage ───────────────────────────────────────────

describe("logUsage", () => {
  it("returns a payload rather than a swallowed null", () => {
    // logUsage catches every exception and returns null. Without this, a bug
    // anywhere in its body would silently disable cost telemetry.
    const payload = logUsage("topic.search", response({ input_tokens: 100, output_tokens: 50 }));
    expect(payload).not.toBeNull();
    expect(payload?.event).toBe("api_usage");
    expect(payload?.operation).toBe("topic.search");
  });

  it("reports every token field", () => {
    const payload = logUsage(
      "op",
      response({
        input_tokens: 1,
        output_tokens: 2,
        cache_creation_input_tokens: 3,
        cache_read_input_tokens: 4,
      }),
      "m",
      0,
    );
    expect(payload?.input_tokens).toBe(1);
    expect(payload?.output_tokens).toBe(2);
    expect(payload?.cache_creation_input_tokens).toBe(3);
    expect(payload?.cache_read_input_tokens).toBe(4);
  });

  it("treats a missing usage object as zero rather than an error", () => {
    const payload = logUsage("op", { content: [] } as never);
    expect(payload?.cost_usd).toBe(0);
    expect(payload?.input_tokens).toBe(0);
  });

  it("infers web searches from content when the count is not passed", () => {
    const payload = logUsage(
      "op",
      response({}, [
        { type: "server_tool_use", name: "web_search" },
        { type: "server_tool_use", name: "web_search" },
      ]),
    );
    expect(payload?.web_searches).toBe(2);
    expect(payload?.cost_usd).toBe(0.02);
  });

  it("records the model for cost breakdown", () => {
    const payload = logUsage("op", response({}), "claude-sonnet-4-6", 0);
    expect(payload?.model).toBe("claude-sonnet-4-6");
  });
});

// ─── countWebSearches ───────────────────────────────────

describe("countWebSearches", () => {
  it("counts web_search blocks", () => {
    const r = response({}, [
      { type: "server_tool_use", name: "web_search" },
      { type: "text" },
      { type: "server_tool_use", name: "web_search" },
    ]);
    expect(countWebSearches(r)).toBe(2);
  });

  it("ignores other server tools", () => {
    expect(countWebSearches(response({}, [{ type: "server_tool_use", name: "code_execution" }]))).toBe(0);
  });

  it("returns 0 on garbage rather than throwing", () => {
    expect(countWebSearches(null as never)).toBe(0);
    expect(countWebSearches(undefined as never)).toBe(0);
    expect(countWebSearches({} as never)).toBe(0);
  });
});

// ─── telemetry never breaks the request path ─────────────

/**
 * Both entry points swallow their own failures on purpose — a cost line is not
 * worth a 500 — but the failure is reported, because the daily AI budget guard
 * reads these lines and silence there reads as "nothing was spent".
 */
describe("failure posture", () => {
  const hostile = () =>
    ({
      get usage(): never {
        throw new Error("proxy trap");
      },
      get content(): never {
        throw new Error("proxy trap");
      },
    }) as never;

  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("logUsage returns null and reports instead of throwing", () => {
    expect(logUsage("op", hostile())).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "[usageTracker.logUsage]",
      expect.any(Error),
      { operation: "op", model: "claude-haiku-4-5" },
    );
  });

  it("countWebSearches returns 0 and reports instead of throwing", () => {
    expect(countWebSearches(hostile())).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(
      "[usageTracker.countWebSearches]",
      expect.any(Error),
    );
  });
});
