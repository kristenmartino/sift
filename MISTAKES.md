# Mistakes

Two-part log: a cheap **Worklog** anyone deposits to mid-task, and an
**Analyzed** section that only a separate audit pass (or a backfill of an
already-understood incident) writes to. See
[`CLAUDE.md`](CLAUDE.md) → "Mistake logging & rule graduation" for the full
policy, and `.claude/skills/check-past-mistakes/` +
`.claude/skills/audit-mistakes-log/` for the two skills that use this file.

**The split exists on purpose.** A session mid-task deciding its own root
cause and proposing its own prevention is exactly the failure mode this
file is designed to avoid — it's biased by the same tunnel vision that
caused the mistake, and it's expensive enough per-entry that people stop
doing it. So depositing is a one-liner, no judgment call required. Deciding
whether something is a real pattern, what actually caused it, and what would
fix it happens later, separately, by something with none of the original
session's context.

**This file is an evidence store, not a runtime lookup — it is meant to sit
on disk mostly unread.** Rules get derived from it once a pattern emerges,
and it's what a rule gets audited against later if anyone questions why the
rule exists — that's why entries never get deleted on graduation. It is
**not** something a normal working session reads to check its own work; that
would both balloon this file's cost every single time and duplicate what the
always-loaded, deliberately small [`CLAUDE.md`](CLAUDE.md) invariants are
for. If you're reading this file mid-task for anything other than appending
one Worklog line, you're probably `audit-mistakes-log` — if you're not, stop
and go check `CLAUDE.md` instead.

**Ported from the sibling GridPulse repo on 2026-08-18**, machinery and
policy alike. What is *not* borrowed is the evidence: the entry below is
sift's own, and the close-keyword guard is explicitly marked as a rule this
repo currently borrows rather than earned.

---

## Worklog (undecided candidates)

**Pending candidates live in [`.mistakes/worklog/`](.mistakes/worklog/), one
file per deposit** — not in this file. Read them with:

```bash
cat .mistakes/worklog/2026-*.md     # every pending candidate
ls .mistakes/worklog/*.md | wc -l   # how many are waiting
```

One file per deposit, named `<UTC timestamp>-<category>.md`, holding one
line. Never edit an existing file to add a new entry — see
[`.mistakes/worklog/README.md`](.mistakes/worklog/README.md).

---

## Analyzed

Pattern tally first (derived from the entries below — recount when Audit
promotes something new), then the full entries: what happened, root cause,
prevention, and whether it graduated into a CLAUDE.md rule.

### Pattern tally

| category | occurrences | status | rule / fix |
|---|---:|---|---|
| completion-not-propagated | 4 | graduated (partial) | CLAUDE.md → "Republished a hosted artifact? Commit the source too" (artifact case only) + End-of-PR item on satisfied-elsewhere claims |
| reference-verification | 0 here (borrowed) | guard installed | `.claude/hooks/guard-close-keywords.sh` — evidence is GridPulse's, not sift's |
| unverified-pr-reference | 2 | graduated | CLAUDE.md → End-of-PR doc-impact check (PR/issue-number reconfirmation bullet) |
| ci-build-flake | 2 (via #276, #286) | resolved | `next` floor `^16.3.1` (PR #287) — mechanical, no CLAUDE.md line |

### Entries

**2026-08-18 — Four completions that never propagated back to what promised them [completion-not-propagated]**

- **What happened:** Four instances of one shape surfaced in a single day,
  while updating the system walkthrough:
  1. The walkthrough artifact was republished to claude.ai on 2026-08-10
     **without committing the source file**. The repo copy sat 13 days stale,
     missing six features that were live on the published page; the next
     session edited that stale copy and would have silently reverted all six
     had the publish not been rejected on a version check. (PR #276)
  2. `docs/DECISIONS.md` D27 ended with *"This entry will be updated with the
     measured values."* The measurement ran on 2026-08-13 — ARI 0.538 — and
     the entry never heard about it. (PR #277)
  3. D45 shipped as ranking v2, stages 1–7, and was registered as table rows
     **D48–D52 in the same file**. The parent entry still read
     "DECIDED, in design (June 2026)", four rows below its own
     implementation. (PR #278)
  4. `STATUS.md` recorded `ts-jest` as *"found and fixed en route… removed."*
     The removal was made on the #194 branch, which never merged; `git log -S`
     shows the initial scaffold adding it and nothing ever taking it away.
     (PR #279)
- **Root cause:** **Deferrals survive; completions don't.** Every
  forward-looking commitment that pointed at an open issue came through the
  same period intact — D35's slices, D41's Phase 0, D40's seeder, D43's
  agentic surfaces are all still accurate, because an open issue is a
  standing, visible object that keeps asserting itself. A *completion* has no
  such object. The work finishes somewhere else — another repo, another
  branch, a hosted page, a later table row — and nothing walks back up the
  chain to the document that promised it. The register is not sloppy; it is
  structurally blind in exactly one direction.
- **Prevention:** Partial, deliberately. The artifact case is now a CLAUDE.md
  invariant, because it is the one instance where nothing in the toolchain
  can ever notice (no test, lint or deploy reads those files). The general
  case is an end-of-PR question — *did this satisfy something another
  document says is pending?* — added in the same section. Neither is
  mechanical; if a cheap mechanical check for the general case turns up
  later, it should replace the prose rule rather than sit beside it.
- **Status:** graduated → CLAUDE.md § End-of-PR doc-impact check
  (2026-08-18); the artifact half landed in PR #276, the general half with
  this entry. Kept open in the tally rather than closed: four occurrences in
  one day is a rate, not a resolved problem, and whether the prose rule
  actually catches the fifth is unmeasured.

**2026-08-20 — Two PR-number references went stale in the same session [unverified-pr-reference]**

- **What happened:** Two incidents in the same audit window, both involving
  dependabot's PR #281 specifically, but via different mechanisms:
  1. While working PR #286, CI status was polled using PR #281's number
     instead of #286's — #281 happened to be open at the same time — and
     #281's passing checks were reported as belonging to #286. (PR #286)
  2. Two days later, PR #287 (`next` 16.3.0→16.3.1) was opened without
     cross-referencing #281, which carried the identical bump inside a
     broader grouped-dependency update and had appeared in the session's own
     `gh pr list` output minutes earlier. Dependabot itself auto-closed #281
     once #287 merged: "these dependencies are updatable in another way, so
     this is no longer needed." (PR #287 / #281)
- **Root cause:** Not "carelessness with #281" specifically — the shared
  mechanism is that a PR/issue number the session had just seen (or should
  have re-confirmed) got superseded by a stale one at the moment of acting.
  Neither incident trips `.claude/hooks/guard-close-keywords.sh`: that hook
  only fires on `Closes #NNN`-style syntax at commit/PR-authoring time, not
  on a CI poll or a missed-overlap check against already-listed open PRs.
- **Prevention:** Positive invariant — before citing a PR/issue number in a
  command (CI poll, `gh` call) or opening new work, re-confirm it against
  output this session has already produced, rather than carrying a number
  over from earlier context.
- **Status:** graduated → CLAUDE.md § End-of-PR doc-impact check
  (2026-08-20). Severity was low in both cases — nothing shipped wrong, and
  incident 2's overlap was self-resolved by dependabot — so this graduated
  on the Repeat bar (2 occurrences of the same root cause), not Severity.

**2026-08-20 — Turbopack/postcss Vercel build flake, root-caused and fixed [ci-build-flake]**

- **What happened:** The Vercel build failed on two separate branches that
  touched no build inputs — PR #276 and PR #286 — both times with
  `TypeError: __turbopack_context__.a is not a function` in
  `postcss.config.js`, and both times passed cleanly on the very next build
  attempt; local production builds were clean throughout. (PR #286)
- **Root cause:** A version skew introduced by PR #233's
  `development-dependencies` group bump, which moved
  `@next/bundle-analyzer` and `eslint-config-next` to 16.3.1 while leaving
  the `next` framework itself at 16.3.0. `next.config.js:152` composes
  `withBundleAnalyzer` unconditionally (not gated behind `ANALYZE=true`), so
  every build ran the newer wrapper's Turbopack async-module runtime against
  the older framework's shared runtime chunk — a mechanistic match to a
  documented Turbopack changelog fix between 16.3.0 and 16.3.1, and it
  explains the intermittency (a cold build on a fresh branch hits it; a warm
  rebuild doesn't).
- **Prevention:** Mechanical. PR #287 floored `next` to `^16.3.1` so a
  future dependency resolution can't slide back under the fix.
- **Status:** resolved — enforced by PR #287 (merged 2026-08-20), `next`
  floor `^16.3.1`. No CLAUDE.md rule proposed — the fix is a version floor,
  not a judgment call.
