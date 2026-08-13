/**
 * Tests for lib/rate-limit.ts — the in-memory sliding window guarding the
 * analytics + AI routes.
 *
 * Module state is process-global by design (one Map per serverless
 * instance), so each test gets a fresh copy of the module and a fresh
 * clock, and every test uses a unique key.
 */
describe("rateLimit", () => {
  let rateLimit: typeof import("@/lib/rate-limit").rateLimit;

  // The module's cleanup clock starts at import time, so the clock is
  // faked *before* each fresh copy is loaded — otherwise "advancing" to a
  // fixed date could move time backwards and the sweep would never be due.
  const BASE = new Date("2026-08-01T00:00:00Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(BASE);
    jest.isolateModules(() => {
      rateLimit = jest.requireActual<typeof import("@/lib/rate-limit")>(
        "@/lib/rate-limit",
      ).rateLimit;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const WINDOW = { maxRequests: 3, windowMs: 1_000 };

  /** Milliseconds since BASE. */
  function at(ms: number) {
    jest.setSystemTime(new Date(BASE.getTime() + ms));
  }

  it("allows requests up to the cap and counts down remaining", () => {
    expect(rateLimit("a", WINDOW)).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterMs: 0,
    });
    expect(rateLimit("a", WINDOW)).toEqual({
      allowed: true,
      remaining: 1,
      retryAfterMs: 0,
    });
    expect(rateLimit("a", WINDOW)).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterMs: 0,
    });
  });

  it("blocks the request past the cap and reports when to retry", () => {
    for (let i = 0; i < 3; i++) rateLimit("b", WINDOW);
    const blocked = rateLimit("b", WINDOW);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(WINDOW.windowMs);
  });

  it("keys are independent — one caller's cap doesn't affect another", () => {
    for (let i = 0; i < 3; i++) rateLimit("c1", WINDOW);
    expect(rateLimit("c1", WINDOW).allowed).toBe(false);
    expect(rateLimit("c2", WINDOW).allowed).toBe(true);
  });

  it("lets a blocked caller through once its window slides past", () => {
    for (let i = 0; i < 3; i++) rateLimit("d", WINDOW);
    expect(rateLimit("d", WINDOW).allowed).toBe(false);

    // Halfway through the window the oldest timestamp is still live.
    at(500);
    expect(rateLimit("d", WINDOW).allowed).toBe(false);

    // Past the window, all three timestamps expire and the budget resets.
    at(1_001);
    const after = rateLimit("d", WINDOW);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(2);
  });

  it("retryAfterMs shrinks as the oldest timestamp ages out", () => {
    for (let i = 0; i < 3; i++) rateLimit("e", WINDOW);
    const first = rateLimit("e", WINDOW).retryAfterMs;

    at(400);
    const later = rateLimit("e", WINDOW).retryAfterMs;
    expect(later).toBeLessThan(first);
  });

  it("a cap of zero blocks everything, without an oldest timestamp to key off", () => {
    const res = rateLimit("f", { maxRequests: 0, windowMs: 1_000 });
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
  });

  it("keeps serving a key that the periodic cleanup pass swept", () => {
    for (let i = 0; i < 3; i++) rateLimit("g", WINDOW);

    // Cleanup only runs once per minute; jump past both it and the window
    // so "g"'s entry is expired *and* the sweep is due. A different key
    // drives the call, so "g" is touched by the sweep alone.
    at(120_000);
    rateLimit("h", WINDOW);

    expect(rateLimit("g", WINDOW)).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterMs: 0,
    });
  });

  it("keeps a still-live timestamp when the sweep runs mid-window", () => {
    // Same sweep, but with a window long enough that the entry survives it:
    // the caller's budget must carry across the cleanup pass, not reset.
    const LONG = { maxRequests: 2, windowMs: 10 * 60_000 };
    rateLimit("i", LONG);
    at(120_000);
    rateLimit("j", LONG); // drives the sweep
    expect(rateLimit("i", LONG)).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterMs: 0,
    });
  });

  it("sweeps at most once a minute", () => {
    rateLimit("k", WINDOW);
    at(30_000); // inside the cleanup interval — sweep is skipped
    expect(rateLimit("k", WINDOW).remaining).toBe(2);
  });
});
