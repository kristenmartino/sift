import { readFileSync } from "node:fs";
import { join } from "node:path";

import { extractEmail, render } from "../scripts/build-week-one-emails.mjs";

/**
 * `docs/week-one-emails.txt` is a generated, paste-ready copy of the two drafts
 * in `docs/WEEK_ONE_OUTREACH.md`. Two copies of the same email body is a drift
 * hazard, and this repo has lost that bet more than once — STATUS.md's velocity
 * line was wrong in the optimistic direction for eight weeks, DECISIONS.md
 * quoted a "~97% accuracy" figure with no eval behind it, and `political_lean`
 * survived in prose after migration 012 dropped the column.
 *
 * These emails go to ~60 named professionals under a real person's name, so a
 * stale copy is worse than an inconvenient one. If the wording changes in the
 * canonical doc and the generated file is not rebuilt, this fails.
 */
const ROOT = process.cwd();
const SRC = readFileSync(join(ROOT, "docs/WEEK_ONE_OUTREACH.md"), "utf8");
const GENERATED = readFileSync(join(ROOT, "docs/week-one-emails.txt"), "utf8");

describe("docs/week-one-emails.txt is in sync with WEEK_ONE_OUTREACH.md", () => {
  it("carries both subject lines verbatim", () => {
    for (const header of ["Librarian version", "Policy-staffer version"]) {
      const { subject } = extractEmail(SRC, header);
      expect(GENERATED).toContain(`Subject: ${subject}`);
    }
  });

  it("carries both email bodies verbatim", () => {
    for (const header of ["Librarian version", "Policy-staffer version"]) {
      const { body } = extractEmail(SRC, header);
      // Compare line by line so a failure names the line that drifted.
      for (const line of body.split("\n").filter((l) => l.trim().length > 0)) {
        expect(GENERATED).toContain(line);
      }
    }
  });

  it("is byte-identical to a fresh render, apart from the generated-on date", () => {
    const stamp = GENERATED.match(/^Generated (\d{4}-\d{2}-\d{2})\.$/m)?.[1];
    expect(stamp).toBeTruthy();
    expect(render(SRC, stamp)).toBe(GENERATED);
  });

  it("leaves no markdown that would paste into an email client", () => {
    expect(GENERATED).not.toMatch(/\*\*/);
    expect(GENERATED).not.toMatch(/^>\s/m);
  });

  it("still points at the live artifact", () => {
    expect(GENERATED).toContain("https://siftnews.io/agencies");
  });

  it("keeps every placeholder the sender has to fill in", () => {
    for (const p of [
      "[name]",
      "[research guide on government information]",
      "[the specific resource they link]",
      "[specific bill / issue area / committee]",
    ]) {
      expect(GENERATED).toContain(p);
    }
  });
});
