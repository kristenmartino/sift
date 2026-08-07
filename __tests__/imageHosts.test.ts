/**
 * Guards the next/image remote-host allowlist.
 *
 * `/_next/image` is a public endpoint that takes an arbitrary `url` parameter.
 * With `hostname: "**"` — which this config carried until 2026-08-07 — anyone
 * could point it at any HTTPS resource on the internet and bill this account's
 * Vercel image-optimization quota. The original justification was that "images
 * are only loaded from URLs stored in the database", which is true of the app
 * and irrelevant to the endpoint: remotePatterns is the only thing that
 * constrains it.
 *
 * The wildcard is an easy thing to reintroduce when an outlet's image 404s and
 * the quickest fix looks like widening the pattern. These tests make that a
 * failing build rather than a quiet regression.
 */

import nextConfig from "../next.config.js";

type Pattern = { protocol?: string; hostname: string };

const patterns: Pattern[] = (
  nextConfig as { images: { remotePatterns: Pattern[] } }
).images.remotePatterns;

/** Mirrors next/image's matching closely enough for these assertions. */
function allows(host: string): boolean {
  return patterns.some(({ hostname }) => {
    if (hostname === host) return true;
    if (hostname.startsWith("**.")) {
      const base = hostname.slice(3);
      return host === base || host.endsWith(`.${base}`);
    }
    return false;
  });
}

describe("next/image remote host allowlist", () => {
  it("is not a wildcard", () => {
    // The whole point. "**" or "*" here re-opens the billing vector.
    for (const { hostname } of patterns) {
      expect(hostname).not.toBe("**");
      expect(hostname).not.toBe("*");
    }
  });

  it("requires https for every pattern", () => {
    for (const { protocol } of patterns) {
      expect(protocol).toBe("https");
    }
  });

  it("allows the hosts the pipeline actually stores images from", () => {
    // Sampled from the top of `SELECT image_url FROM articles` by volume.
    const observed = [
      "images.minutemediacdn.com",
      "nypost.com",
      "static.foxnews.com",
      "thehill.com",
      "static01.nyt.com",
      "i.guim.co.uk",
      "assets.bwbx.io",
      "cdn.cbsistatic.com",
    ];
    for (const host of observed) {
      expect({ host, allowed: allows(host) }).toEqual({ host, allowed: true });
    }
  });

  it("rejects arbitrary third-party hosts", () => {
    // These are the requests the wildcard used to serve, each one a paid
    // transformation billed to this account.
    const attacker = [
      "evil.example.com",
      "attacker-cdn.io",
      "localhost",
      "169.254.169.254", // cloud metadata endpoint
    ];
    for (const host of attacker) {
      expect({ host, allowed: allows(host) }).toEqual({ host, allowed: false });
    }
  });

  it("does not allow a lookalike domain that merely ends with an allowed one", () => {
    // "**.nyt.com" must not match "nyt.com.evil.example" — the wildcard binds
    // to the left, and a suffix check written the other way round would let
    // any attacker-controlled domain through by appending an allowed one.
    expect(allows("nyt.com.evil.example")).toBe(false);
    expect(allows("notnyt.com")).toBe(false);
  });

  it("caches transformations long enough to survive the 30-minute feed churn", () => {
    const ttl = (nextConfig as { images: { minimumCacheTTL?: number } }).images
      .minimumCacheTTL;
    expect(ttl).toBeGreaterThanOrEqual(60 * 60 * 24);
  });
});
