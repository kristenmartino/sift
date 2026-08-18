/**
 * @jest-environment node
 *
 * Meta-tests: deterministic checks that this test suite is itself sound.
 *
 * The suite certifies everything else in `sift`; nothing certified the suite.
 * `sift-api` has had `tests/test_meta_suite.py` doing this job since the
 * `stable_hash("hello") == stable_hash("hello")` defect; this is the frontend
 * half, and it adds the check that file was missing — a test can assert
 * something and still be incapable of failing.
 *
 * The motivating cases here were real, all found 2026-08-17:
 *   - `compare.test.ts` mocked the rate limiter and then never asserted on it.
 *     Deleting the limiter from the route left all six tests green.
 *   - `utils.test.ts` asserted `stableHash(url) === stableHash(url)` — true for
 *     every possible implementation of a pure function.
 *   - `copy.test.ts` asserted ~20 copy keys were `toBeTruthy()`, so swapping
 *     "Add topic" and "Cancel" passed.
 *
 * ESLint catches none of this: no rule asks whether a test can fail.
 *
 * WHAT IS NOT CHECKED HERE, and why — see `describe("known gaps")` at the
 * bottom, which pins the measurement rather than leaving it to memory.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const TESTS_DIR = path.join(__dirname);

/**
 * Escape hatch. Put `meta-ok: <reason>` in a comment inside the test body when
 * a check below is a false positive — e.g. `expect(a()).toBe(a())` is a
 * tautology for a pure function but a real assertion for a memoized one, since
 * `toBe` compares identity. Requiring the reason in prose keeps it deliberate.
 */
const PRAGMA = "meta-ok:";

interface TestFn {
  file: string;
  name: string;
  describePath: string[];
  body: ts.Node | undefined;
  text: string;
  isEach: boolean;
}

function sourceFiles(): { file: string; src: ts.SourceFile }[] {
  return readdirSync(TESTS_DIR)
    .filter((f) => /\.tsx?$/.test(f))
    .sort()
    .map((file) => ({
      file,
      src: ts.createSourceFile(
        file,
        readFileSync(path.join(TESTS_DIR, file), "utf8"),
        ts.ScriptTarget.Latest,
        /* setParentNodes */ true,
        file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      ),
    }));
}

/** `it`, `it.only`, `it.each(...)` and `test` variants all resolve to the root. */
function rootCallee(expr: ts.Expression): string {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return rootCallee(expr.expression);
  if (ts.isCallExpression(expr)) return rootCallee(expr.expression);
  return "";
}

function isEachForm(expr: ts.Expression): boolean {
  // it.each(table)("name %s", fn) — the name is a template, not a fixed string.
  if (ts.isCallExpression(expr)) return isEachForm(expr.expression);
  if (ts.isPropertyAccessExpression(expr)) {
    return expr.name.text === "each" || isEachForm(expr.expression);
  }
  return false;
}

function collectTests(): TestFn[] {
  const out: TestFn[] = [];
  for (const { file, src } of sourceFiles()) {
    if (file === "meta.test.ts") continue; // don't audit the auditor's own shape
    const walk = (node: ts.Node, describePath: string[]) => {
      if (ts.isCallExpression(node)) {
        const callee = rootCallee(node.expression);
        const [nameArg, fnArg] = node.arguments;
        const name =
          nameArg && ts.isStringLiteralLike(nameArg) ? nameArg.text : "<dynamic>";
        if (callee === "describe") {
          ts.forEachChild(node, (c) => walk(c, [...describePath, name]));
          return;
        }
        if (callee === "it" || callee === "test") {
          out.push({
            file,
            name,
            describePath,
            body: fnArg,
            text: fnArg ? fnArg.getText(src) : "",
            isEach: isEachForm(node.expression),
          });
          return;
        }
      }
      ts.forEachChild(node, (c) => walk(c, describePath));
    };
    walk(src, []);
  }
  return out;
}

/** Anything in a test body that can turn it red. */
function assertionCount(fn: TestFn): number {
  if (!fn.body) return 0;
  let n = 0;
  const walk = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      // expect(...)  /  expect.assertions(n)  /  expect.hasAssertions()
      if (ts.isIdentifier(callee) && callee.text === "expect") n++;
      if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === "expect"
      ) {
        n++;
      }
      // A bare `fail()` or an explicit throw-assertion helper.
      if (ts.isIdentifier(callee) && callee.text === "fail") n++;
    }
    ts.forEachChild(node, walk);
  };
  ts.forEachChild(fn.body, walk);
  return n;
}

const ALL_TESTS = collectTests();

describe("the meta guard actually sees the suite", () => {
  // Guard the guard: if the directory read, the glob, or the AST walk ever
  // stops matching, every check below passes vacuously — the exact failure
  // mode this file exists to prevent. Ratcheted to just under the measured
  // values (849 tests / 57 files on 2026-08-17) rather than a token floor:
  // sift-api's equivalent asserted `> 100` against 770 real functions, which
  // tolerated losing 87% of the suite before firing.
  it("finds the whole suite, not a fraction of it", () => {
    expect(ALL_TESTS.length).toBeGreaterThan(800);
    expect(new Set(ALL_TESTS.map((t) => t.file)).size).toBeGreaterThan(50);
  });

  it("can actually parse every test file it claims to read", () => {
    // A file that fails to parse yields zero tests and would otherwise be
    // silently skipped by every check below.
    for (const { file, src } of sourceFiles()) {
      expect(`${file}:${src.statements.length}`).not.toBe(`${file}:0`);
    }
  });
});

describe("every test can fail", () => {
  it("has at least one assertion in every test body", () => {
    const offenders = ALL_TESTS.filter(
      (t) => assertionCount(t) === 0 && !t.text.includes(PRAGMA),
    ).map((t) => `${t.file} :: ${[...t.describePath, t.name].join(" › ")}`);

    expect(offenders).toEqual([]);
  });

  it("never compares a value to itself", () => {
    // `expect(f(x)).toBe(f(x))` passes for every possible implementation of a
    // pure `f`. This is the original form of the defect that motivated
    // sift-api's meta-suite, and neither that suite nor any lint rule catches
    // it — they check for the ABSENCE of an assertion, not a vacuous one.
    const IDENTITY_MATCHERS = new Set(["toBe", "toEqual", "toStrictEqual"]);
    const offenders: string[] = [];

    for (const { file, src } of sourceFiles()) {
      if (file === "meta.test.ts") continue;
      const walk = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          IDENTITY_MATCHERS.has(node.expression.name.text) &&
          node.arguments.length === 1
        ) {
          const receiver = node.expression.expression;
          if (
            ts.isCallExpression(receiver) &&
            ts.isIdentifier(receiver.expression) &&
            receiver.expression.text === "expect" &&
            receiver.arguments.length === 1
          ) {
            const norm = (n: ts.Node) => n.getText(src).replace(/\s+/g, " ").trim();
            const left = norm(receiver.arguments[0]);
            const right = norm(node.arguments[0]);
            if (left === right) {
              // Walk up for a pragma on the enclosing test.
              let scope: ts.Node | undefined = node;
              let exempt = false;
              while (scope) {
                if (scope.getText(src).includes(PRAGMA)) { exempt = true; break; }
                scope = scope.parent;
              }
              if (!exempt) offenders.push(`${file} :: expect(${left}).${node.expression.name.text}(${right})`);
            }
          }
        }
        ts.forEachChild(node, walk);
      };
      walk(src);
    }

    expect(offenders).toEqual([]);
  });
});

describe("no test silently shadows another", () => {
  it("has no duplicate test name inside a single describe block", () => {
    // A duplicated `it("x")` in the same block does not shadow in Jest the way
    // a duplicated Python `def` does — both run — but it makes a failure
    // report ambiguous, and it is nearly always a copy-paste that meant to
    // change something. Scoped to the enclosing describe, because two
    // different blocks may each legitimately test "returns null".
    const seen = new Map<string, number>();
    for (const t of ALL_TESTS) {
      if (t.isEach || t.name === "<dynamic>") continue;
      const key = `${t.file} :: ${[...t.describePath, t.name].join(" › ")}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const dupes = [...seen.entries()]
      .filter(([, n]) => n > 1)
      .map(([k, n]) => `${k} (x${n})`);

    expect(dupes).toEqual([]);
  });
});

describe("known gaps", () => {
  it("records the vacuous-loop class this guard does not yet enforce", () => {
    // A test whose assertions ALL sit inside a `for`/`forEach`/`if` runs zero
    // assertions if the collection is empty, and still reports green. On
    // 2026-08-17 that shape covered 22 tests here — nearly all legitimate
    // table-driven tests over module constants, which is why this is measured
    // rather than enforced: a rule with 22 false positives is a rule people
    // route around.
    //
    // The mitigation that DOES scale is a self-guard — one
    // `expect(table.length).toBeGreaterThan(0)` at the top of the loop body's
    // enclosing test. utils.test.ts's golden-hash test carries one as the
    // worked example; see the note there.
    //
    // This test pins the count so the class cannot quietly grow unnoticed.
    const loopy = ALL_TESTS.filter((t) => {
      if (!t.body) return false;
      let total = 0;
      let nested = 0;
      const walk = (node: ts.Node, depth: number) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "expect") {
          total++;
          if (depth > 0) nested++;
        }
        const opensScope =
          ts.isForStatement(node) ||
          ts.isForOfStatement(node) ||
          ts.isForInStatement(node) ||
          ts.isWhileStatement(node) ||
          ts.isIfStatement(node) ||
          (ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            ["forEach", "map", "filter"].includes(node.expression.name.text));
        ts.forEachChild(node, (c) => walk(c, depth + (opensScope ? 1 : 0)));
      };
      ts.forEachChild(t.body, (c) => walk(c, 0));
      return total > 0 && total === nested;
    });

    // Ratchet DOWNWARD only. Raising this number to make a build green is the
    // one edit this line exists to make someone think twice about.
    expect(loopy.length).toBeLessThanOrEqual(22);
  });
});
