/**
 * The story corroboration constants live in two places and must agree.
 *
 * `lib/db.ts` truncates the pool to 20 under one formula; `NewsAggregator.tsx`
 * re-ranks what survives under another. Ranking v2 stage 1 exists *because*
 * they once disagreed — the pool was cut under an order no reader ever saw.
 * Nothing in the type system stops that recurring, and it fails silently:
 * both files compile, both run, and the only symptom is a feed ordered
 * differently than it was selected.
 *
 * A third copy lives in `sift-api/scripts/explain_feed_queries.py`, which
 * mirrors the deployed SQL byte for byte so the perf diagnostic measures the
 * query that actually runs. It is in another repo and cannot be checked from
 * here; it is named in both files' comments instead.
 *
 * These read source text rather than importing, because both constants are
 * module-private — and exporting them purely to be testable would widen the
 * API to prove a point about copy-paste.
 */
import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "..");
const dbSrc = readFileSync(join(root, "lib/db.ts"), "utf8");
const clientSrc = readFileSync(join(root, "components/NewsAggregator.tsx"), "utf8");

function constant(src: string, name: string): number {
  const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*([0-9.]+)\\s*;`));
  if (!m) throw new Error(`${name} not found — was it renamed or inlined?`);
  return Number(m[1]);
}

describe("story corroboration constants", () => {
  it("STORY_BASE matches between the SQL pool and the client re-rank", () => {
    expect(constant(clientSrc, "STORY_BASE")).toBe(constant(dbSrc, "STORY_BASE"));
  });

  it("STORY_BOOST matches between the SQL pool and the client re-rank", () => {
    expect(constant(clientSrc, "STORY_BOOST")).toBe(constant(dbSrc, "STORY_BOOST"));
  });

  it("STORY_IMPORTANCE_CENTER matches between the SQL pool and the client re-rank", () => {
    // Stage 7 divides every story by this. The two ends disagreeing would not
    // change any story's rank against another story — it is a constant — but
    // it would move stories as a block against standalone articles, on one
    // side of the boundary only. The pool would then be cut with one mix and
    // displayed with another.
    expect(constant(clientSrc, "STORY_IMPORTANCE_CENTER")).toBe(
      constant(dbSrc, "STORY_IMPORTANCE_CENTER")
    );
  });

  it("STORY_FLOOR_MIN_IMPORTANCE matches between the SQL pool and the client re-rank", () => {
    // The gate IS the design of the floor (#237), and it is the constant most
    // likely to be moved by hand — lowering it to 3 to see what happens is the
    // obvious experiment, and doing it in one file only would floor the pool
    // and not the feed.
    expect(constant(clientSrc, "STORY_FLOOR_MIN_IMPORTANCE")).toBe(
      constant(dbSrc, "STORY_FLOOR_MIN_IMPORTANCE")
    );
  });

  it("treats an unscored member as an abstention on both sides", () => {
    // The mean coalesces missing scores to the center so they neither lift nor
    // lower the story; the floor's MAX does NOT coalesce, so an unscored
    // member can never trip it. Plain AVG (NULL-skipping) let one scored
    // member out of five set the whole story's multiplier — the single-outlet
    // leverage the mean exists to remove, re-entering through missing data.
    expect(dbSrc).toContain(
      "AVG(COALESCE(a.importance_score, ${STORY_IMPORTANCE_CENTER}))"
    );
    expect(dbSrc).toContain("`MAX(a.importance_score)`");
    // The client's fallbacks are the same two rules: neutral mean, floor off.
    expect(clientSrc).toContain("item.data.avgImportance ?? STORY_IMPORTANCE_CENTER");
    expect(clientSrc).toContain("item.data.maxImportance ?? 0");
  });

  it("both formulas use the constants rather than an inlined number", () => {
    // The base was a literal `3` inside both expressions until 2026-08-11,
    // which is how it stayed unexamined while being 77% of the score.
    expect(dbSrc).toContain("${STORY_BASE} + ${STORY_BOOST} * LN(1 + COUNT(DISTINCT a.source_name))");
    expect(clientSrc).toContain("STORY_BASE + STORY_BOOST * Math.log(1 + item.data.outletCount)");
  });

  it("ranks on distinct outlets, not article rows", () => {
    // One high-volume outlet filing four pieces is not four-outlet
    // corroboration. 29% of stories had more articles than outlets.
    expect(dbSrc).toContain("LN(1 + COUNT(DISTINCT a.source_name))");
    expect(clientSrc).toContain("item.data.outletCount");
  });

  it("keeps corroboration a meaningful share of the story score", () => {
    // The failure this guards is a base large enough to flatten the curve:
    // at (3, 0.8) the whole 2→18-outlet range was worth 7.7h of freshness
    // against EXP(-age_days), so recency was the only real signal.
    const base = constant(dbSrc, "STORY_BASE");
    const boost = constant(dbSrc, "STORY_BOOST");
    const hours = 24 * Math.log(
      (base + boost * Math.log(19)) / (base + boost * Math.log(3))
    );
    expect(hours).toBeGreaterThan(12);
  });
});
