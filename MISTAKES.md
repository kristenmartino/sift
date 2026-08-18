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
