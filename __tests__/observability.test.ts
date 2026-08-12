import * as Sentry from "@sentry/nextjs";

import { reportError } from "@/lib/observability";

jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));

const captureException = Sentry.captureException as jest.Mock;

let errorSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  captureException.mockReset();
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  warnSpy.mockRestore();
});

describe("reportError", () => {
  it("logs to console.error and reports to Sentry with the scope tag", () => {
    const err = new Error("boom");
    reportError("db.getTopStoryForLanding", err);

    expect(errorSpy).toHaveBeenCalledWith("[db.getTopStoryForLanding]", err);
    expect(captureException).toHaveBeenCalledWith(err, {
      level: "error",
      tags: { scope: "db.getTopStoryForLanding" },
    });
  });

  it("routes warnings to console.warn and carries extra context", () => {
    const err = new Error("missing table");
    reportError("db.listOrgs", err, { level: "warning", extra: { slug: "x" } });

    expect(warnSpy).toHaveBeenCalledWith("[db.listOrgs]", err, { slug: "x" });
    expect(errorSpy).not.toHaveBeenCalled();
    expect(captureException).toHaveBeenCalledWith(err, {
      level: "warning",
      tags: { scope: "db.listOrgs" },
      extra: { slug: "x" },
    });
  });

  it("never throws when the Sentry transport fails", () => {
    captureException.mockImplementation(() => {
      throw new Error("transport down");
    });

    expect(() => reportError("sse.parseFrame", new Error("bad json"))).not.toThrow();
    // The console line is the durable record when Sentry is unavailable.
    expect(errorSpy).toHaveBeenCalled();
  });
});
