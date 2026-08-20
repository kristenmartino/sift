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
 *
 * Parses with `@typescript-eslint/typescript-estree`, not the `typescript`
 * package's own `ts.createSourceFile`/`ts.forEachChild` (see #271). TypeScript
 * 7's compiler/AST API moved off the package's stable entry point into
 * subpaths the TS team itself labels unstable — a guard that certifies the
 * suite should not depend on an API that could shift under a future point
 * release. typescript-estree wraps whichever `typescript` is installed and
 * exposes a stable ESTree-shaped AST regardless.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse, simpleTraverse, type TSESTree } from "@typescript-eslint/typescript-estree";
import { getKeys } from "@typescript-eslint/visitor-keys";

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
  body: TSESTree.Node | undefined;
  text: string;
  isEach: boolean;
}

interface SourceFile {
  file: string;
  code: string;
  ast: TSESTree.Program;
}

function sourceFiles(): SourceFile[] {
  return readdirSync(TESTS_DIR)
    .filter((f) => /\.tsx?$/.test(f))
    .sort()
    .map((file) => {
      const code = readFileSync(path.join(TESTS_DIR, file), "utf8");
      const ast = parse(code, { filePath: file, range: true, loc: true });
      // Parent pointers, so a pragma check can walk up from any node.
      simpleTraverse(ast, { enter: () => {} }, /* setParentPointers */ true);
      return { file, code, ast };
    });
}

function getText(code: string, node: TSESTree.Node): string {
  return code.slice(node.range[0], node.range[1]);
}

/** Any AST child a node actually carries — arrays flattened, gaps skipped. */
function forEachChild(node: TSESTree.Node | undefined, cb: (child: TSESTree.Node) => void): void {
  if (!node) return;
  for (const key of getKeys(node)) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof (child as TSESTree.Node).type === "string") cb(child as TSESTree.Node);
      }
    } else if (value && typeof (value as TSESTree.Node).type === "string") {
      cb(value as TSESTree.Node);
    }
  }
}

function literalText(node: TSESTree.Node | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked).join("");
  }
  return undefined;
}

/** `it`, `it.only`, `it.each(...)` and `test` variants all resolve to the root. */
function rootCallee(expr: TSESTree.Node): string {
  if (expr.type === "Identifier") return expr.name;
  if (expr.type === "MemberExpression" && !expr.computed) return rootCallee(expr.object);
  if (expr.type === "CallExpression") return rootCallee(expr.callee);
  return "";
}

function isEachForm(expr: TSESTree.Node): boolean {
  // it.each(table)("name %s", fn) — the name is a template, not a fixed string.
  if (expr.type === "CallExpression") return isEachForm(expr.callee);
  if (expr.type === "MemberExpression" && !expr.computed) {
    return (expr.property.type === "Identifier" && expr.property.name === "each") || isEachForm(expr.object);
  }
  return false;
}

function collectTests(): TestFn[] {
  const out: TestFn[] = [];
  for (const { file, code, ast } of sourceFiles()) {
    if (file === "meta.test.ts") continue; // don't audit the auditor's own shape
    const walk = (node: TSESTree.Node, describePath: string[]) => {
      if (node.type === "CallExpression") {
        const callee = rootCallee(node.callee);
        const [nameArg, fnArg] = node.arguments;
        const name = literalText(nameArg) ?? "<dynamic>";
        if (callee === "describe") {
          forEachChild(node, (c) => walk(c, [...describePath, name]));
          return;
        }
        if (callee === "it" || callee === "test") {
          out.push({
            file,
            name,
            describePath,
            body: fnArg,
            text: fnArg ? getText(code, fnArg) : "",
            isEach: isEachForm(node.callee),
          });
          return;
        }
      }
      forEachChild(node, (c) => walk(c, describePath));
    };
    walk(ast, []);
  }
  return out;
}

/** Anything in a test body that can turn it red. */
function assertionCount(fn: TestFn): number {
  if (!fn.body) return 0;
  let n = 0;
  const walk = (node: TSESTree.Node) => {
    if (node.type === "CallExpression") {
      const callee = node.callee;
      // expect(...)  /  expect.assertions(n)  /  expect.hasAssertions()
      if (callee.type === "Identifier" && callee.name === "expect") n++;
      if (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.object.type === "Identifier" &&
        callee.object.name === "expect"
      ) {
        n++;
      }
      // A bare `fail()` or an explicit throw-assertion helper.
      if (callee.type === "Identifier" && callee.name === "fail") n++;
    }
    forEachChild(node, walk);
  };
  forEachChild(fn.body, walk);
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
    for (const { file, ast } of sourceFiles()) {
      expect(`${file}:${ast.body.length}`).not.toBe(`${file}:0`);
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

    for (const { file, code, ast } of sourceFiles()) {
      if (file === "meta.test.ts") continue;
      const walk = (node: TSESTree.Node) => {
        if (
          node.type === "CallExpression" &&
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property.type === "Identifier" &&
          IDENTITY_MATCHERS.has(node.callee.property.name) &&
          node.arguments.length === 1
        ) {
          const receiver = node.callee.object;
          if (
            receiver.type === "CallExpression" &&
            receiver.callee.type === "Identifier" &&
            receiver.callee.name === "expect" &&
            receiver.arguments.length === 1
          ) {
            const norm = (n: TSESTree.Node) => getText(code, n).replace(/\s+/g, " ").trim();
            const left = norm(receiver.arguments[0]);
            const right = norm(node.arguments[0]);
            if (left === right) {
              // Walk up for a pragma on the enclosing test.
              let scope: TSESTree.Node | undefined = node;
              let exempt = false;
              while (scope) {
                if (getText(code, scope).includes(PRAGMA)) { exempt = true; break; }
                scope = scope.parent;
              }
              if (!exempt) {
                offenders.push(`${file} :: expect(${left}).${node.callee.property.name}(${right})`);
              }
            }
          }
        }
        forEachChild(node, walk);
      };
      walk(ast);
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
      const walk = (node: TSESTree.Node, depth: number) => {
        if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "expect") {
          total++;
          if (depth > 0) nested++;
        }
        const opensScope =
          node.type === "ForStatement" ||
          node.type === "ForOfStatement" ||
          node.type === "ForInStatement" ||
          node.type === "WhileStatement" ||
          node.type === "IfStatement" ||
          (node.type === "CallExpression" &&
            node.callee.type === "MemberExpression" &&
            !node.callee.computed &&
            node.callee.property.type === "Identifier" &&
            ["forEach", "map", "filter"].includes(node.callee.property.name));
        forEachChild(node, (c) => walk(c, depth + (opensScope ? 1 : 0)));
      };
      forEachChild(t.body, (c) => walk(c, 0));
      return total > 0 && total === nested;
    });

    // Ratchet DOWNWARD only. Raising this number to make a build green is the
    // one edit this line exists to make someone think twice about.
    expect(loopy.length).toBeLessThanOrEqual(22);
  });
});
