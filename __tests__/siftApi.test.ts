/**
 * @jest-environment node
 *
 * `lib/siftApi.ts` validates SIFT_API_URL at import time on purpose: a typo'd
 * backend URL should fail the route on boot, not on the first upstream fetch
 * in front of a user. That only works if the throw actually happens, which is
 * invisible until someone deploys the typo — hence this test.
 */
const ORIGINAL_URL = process.env.SIFT_API_URL;
const ORIGINAL_KEY = process.env.SIFT_API_KEY;

/** Re-imports the module against the current env (it validates on load). */
async function load(): Promise<typeof import("@/lib/siftApi")> {
  let mod: typeof import("@/lib/siftApi") | undefined;
  await jest.isolateModulesAsync(async () => {
    mod = await import("@/lib/siftApi");
  });
  return mod!;
}

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.SIFT_API_URL;
  else process.env.SIFT_API_URL = ORIGINAL_URL;
  if (ORIGINAL_KEY === undefined) delete process.env.SIFT_API_KEY;
  else process.env.SIFT_API_KEY = ORIGINAL_KEY;
});

describe("SIFT_API_URL", () => {
  it("defaults to the local backend and reads an https override", async () => {
    delete process.env.SIFT_API_URL;
    expect((await load()).SIFT_API_URL).toBe("http://localhost:8000");

    process.env.SIFT_API_URL = "https://api.siftnews.io";
    expect((await load()).SIFT_API_URL).toBe("https://api.siftnews.io");
  });

  it("throws on a non-HTTP scheme and on an unparseable URL", async () => {
    process.env.SIFT_API_URL = "ftp://api.siftnews.io";
    await expect(load()).rejects.toThrow(
      "Invalid SIFT_API_URL: ftp://api.siftnews.io",
    );

    process.env.SIFT_API_URL = "not a url";
    await expect(load()).rejects.toThrow("Invalid SIFT_API_URL: not a url");
  });
});

describe("SIFT_API_KEY", () => {
  it("is empty rather than undefined when unset", async () => {
    delete process.env.SIFT_API_KEY;
    expect((await load()).SIFT_API_KEY).toBe("");
  });
});
