/**
 * Connection details for the sift-api backend (the write path — see
 * docs/DECISIONS.md D35). Validated at import time so a typo'd URL fails the
 * route on boot rather than at the first upstream fetch.
 */
export const SIFT_API_URL = process.env.SIFT_API_URL || "http://localhost:8000";

try {
  const url = new URL(SIFT_API_URL);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("bad protocol");
} catch {
  throw new Error(`Invalid SIFT_API_URL: ${SIFT_API_URL}`);
}

/** Empty when unset — routes that require it check and 500 themselves. */
export const SIFT_API_KEY = process.env.SIFT_API_KEY || "";
