/**
 * @jest-environment node
 *
 * Tests for lib/security.ts — the same-site check every mutating route
 * runs before it touches state. The interesting part is precedence:
 * Sec-Fetch-Site wins outright when present (a browser sets it and page
 * JS cannot), Origin comes next, Referer is the fallback, and a request
 * carrying none of the three is a non-browser client and allowed.
 */
import { NextRequest } from "next/server";

import { checkCsrf } from "@/lib/security";

function request(
  method: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("https://siftnews.io/api/bookmarks", {
    method,
    headers,
  });
}

describe("checkCsrf — safe methods", () => {
  it.each(["GET", "HEAD", "OPTIONS", "get", "head", "options"])(
    "allows %s without any headers",
    (method) => {
      expect(checkCsrf(request(method))).toBeNull();
    },
  );
});

describe("checkCsrf — Sec-Fetch-Site takes precedence", () => {
  it.each(["same-origin", "same-site", "none"])(
    "allows sec-fetch-site: %s",
    (value) => {
      expect(checkCsrf(request("POST", { "sec-fetch-site": value }))).toBeNull();
    },
  );

  it("blocks sec-fetch-site: cross-site", async () => {
    const res = checkCsrf(request("POST", { "sec-fetch-site": "cross-site" }));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    await expect(res!.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("blocks an unrecognized sec-fetch-site value rather than falling through", () => {
    // A same-origin Origin must not rescue a request whose Sec-Fetch-Site
    // says something we don't recognize — the browser-set header decides.
    const res = checkCsrf(
      request("POST", {
        "sec-fetch-site": "unexpected",
        origin: "https://siftnews.io",
        host: "siftnews.io",
      }),
    );
    expect(res?.status).toBe(403);
  });
});

describe("checkCsrf — Origin fallback", () => {
  it("allows an Origin whose host matches Host", () => {
    expect(
      checkCsrf(
        request("POST", { origin: "https://siftnews.io", host: "siftnews.io" }),
      ),
    ).toBeNull();
  });

  it("compares host including port, not just hostname", () => {
    expect(
      checkCsrf(
        request("POST", {
          origin: "http://localhost:3000",
          host: "localhost:3000",
        }),
      ),
    ).toBeNull();
    expect(
      checkCsrf(
        request("POST", {
          origin: "http://localhost:3001",
          host: "localhost:3000",
        }),
      )?.status,
    ).toBe(403);
  });

  it("blocks a cross-origin Origin", () => {
    expect(
      checkCsrf(
        request("POST", { origin: "https://evil.example", host: "siftnews.io" }),
      )?.status,
    ).toBe(403);
  });

  it("blocks an unparseable Origin", () => {
    expect(
      checkCsrf(request("POST", { origin: "not a url", host: "siftnews.io" }))
        ?.status,
    ).toBe(403);
  });

  it("does not fall through to a matching Referer when Origin is cross-origin", () => {
    expect(
      checkCsrf(
        request("POST", {
          origin: "https://evil.example",
          referer: "https://siftnews.io/news",
          host: "siftnews.io",
        }),
      )?.status,
    ).toBe(403);
  });
});

describe("checkCsrf — Referer fallback", () => {
  it("allows a Referer whose host matches Host", () => {
    expect(
      checkCsrf(
        request("POST", {
          referer: "https://siftnews.io/news?compare=fed",
          host: "siftnews.io",
        }),
      ),
    ).toBeNull();
  });

  it("blocks a cross-origin Referer", () => {
    expect(
      checkCsrf(
        request("POST", {
          referer: "https://evil.example/attack",
          host: "siftnews.io",
        }),
      )?.status,
    ).toBe(403);
  });

  it("blocks an unparseable Referer", () => {
    expect(
      checkCsrf(request("POST", { referer: "///", host: "siftnews.io" }))
        ?.status,
    ).toBe(403);
  });
});

describe("checkCsrf — no site headers at all", () => {
  it("allows a header-less mutation (cURL, cron): browsers always send one", () => {
    expect(checkCsrf(request("POST", { host: "siftnews.io" }))).toBeNull();
  });

  it("blocks a mutation with no Host to compare against", () => {
    // Nothing to check Origin/Referer against, so the request can't be
    // shown to be same-site. Sec-Fetch-Site is checked before Host, so
    // this only bites requests carrying neither.
    expect(checkCsrf(request("POST"))?.status).toBe(403);
    expect(
      checkCsrf(request("POST", { origin: "https://siftnews.io" }))?.status,
    ).toBe(403);
  });

  it.each(["PUT", "PATCH", "DELETE"])(
    "applies the same rules to %s",
    (method) => {
      expect(
        checkCsrf(
          request(method, {
            origin: "https://evil.example",
            host: "siftnews.io",
          }),
        )?.status,
      ).toBe(403);
      expect(
        checkCsrf(
          request(method, {
            origin: "https://siftnews.io",
            host: "siftnews.io",
          }),
        ),
      ).toBeNull();
    },
  );
});
