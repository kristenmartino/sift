---
name: check-past-mistakes
description: Cross-check a just-approved plan or just-finished implementation against this repo's known mistake patterns before it ships. Fires automatically via hook after plan approval (ExitPlanMode); otherwise invoke it manually — before committing or opening a PR, and any time something feels like it might repeat a past mistake. Reads only CLAUDE.md (already loaded, no extra cost) — never MISTAKES.md's full archive. If it catches something new, it deposits exactly one new file under .mistakes/worklog/ and stops; it does not diagnose or propose fixes.
---

# Check past mistakes

A cheap, repeatable pass that runs right after a plan is approved, and again
before work is committed or PR'd, asking one question: **does this repeat
something CLAUDE.md already tells us not to?** It exists because knowing a
rule and remembering to apply it under task pressure are different things —
this skill is the forcing function for the second one.

The one invariant that is fully mechanical — CLAUDE.md's close-keyword rules
— is enforced by `.claude/hooks/guard-close-keywords.sh` at the moment a
commit or PR command runs, so you do not need to re-check it by hand. This
skill covers the judgment-shaped rules a regex cannot decide.

## What to check against

Read `CLAUDE.md` in the repo root — specifically the **"End-of-PR doc-impact
check"** section and any prose rules elsewhere in the file that trace back to
a graduated `MISTAKES.md` entry (they're written as concrete invariants, not
vague advice — "verify X before Y," "commit the source when you republish").
That's the complete checklist. **Do not open `MISTAKES.md`** to look for more
— it is an evidence archive that a separate audit pass mines periodically;
loading it here would both cost real context on every plan and duplicate a
job that already has an owner. If a rule in CLAUDE.md feels stale or doesn't
match what you're seeing in the code, say so and flag it — don't just skip it.

The mechanical half of the close-keyword rule is enforced by
`.claude/hooks/guard-close-keywords.sh` at the moment a commit or PR command
runs, so you don't need to re-check it by hand. This skill covers the
judgment-shaped rules a regex cannot decide.

## When you're checking a plan (after ExitPlanMode)

Walk the plan against CLAUDE.md's rules that a plan can violate before any
code is written:

- **Republishing an artifact** (`sift-system-walkthrough.html`,
  `sift-product-os.html`) without a step that commits the source file — and
  without a step that diffs the live page against the file *first*. Nothing
  builds these, so nothing fails when they drift.
- **Satisfying something another document says is pending.** If the work
  closes a "will be updated," "in progress," or "not yet measured" claim
  anywhere in `STATUS.md`, `docs/DECISIONS.md`, or a sibling repo's STATUS,
  the plan needs a step that goes back and says so. This is the failure this
  repo hit four times on 2026-08-18 — see `MISTAKES.md`.
- **Doc-impact:** does it change STATUS.md's Next 3 / Blocked-on / Open
  question, make or close a strategic decision, change a public contract
  (API shape, page route, env var), or change how the app boots?
- **Quoting a count or a figure** from `data/*.csv` or from doc prose rather
  than from the table or the script that derives it — both have been wrong
  here by an order of magnitude.
- **Cross-repo:** does it assume a commit spans repos? Commits do not cross
  `sift` / `sift-api` / `sift-mcp`; confirm before touching a sibling.
- Any other CLAUDE.md rule whose trigger condition ("when doing X…") the
  plan's own description matches.

## When you're checking finished work (before committing or opening a PR)

Same list, but against the actual diff/commits instead of the plan text —
a plan can say the right thing and the implementation can still miss it.
This is also the point to run the "End-of-PR doc-impact check" items
themselves if the calling session hasn't already.

## If you find a real match

Flag it plainly, before reporting the work as done — name the CLAUDE.md
rule, the specific line in the plan/diff that triggers it, and what's
missing. This is a stop-and-fix signal, not a footnote.

## If you notice something new

Something can go wrong, or nearly go wrong, in a way that doesn't match any
existing CLAUDE.md rule — that's exactly the kind of thing this whole system
exists to eventually catch. When that happens:

1. Write **one new file** under `.mistakes/worklog/`, named
   `<UTC timestamp>-<category>.md` — get the stamp from
   `date -u +%Y-%m-%dT%H%M%SZ`:

   ```
   .mistakes/worklog/2026-08-18T114530Z-guard-decision-without-force.md
   ```

   holding exactly one line:
   `YYYY-MM-DD [category] one-line description — <ref: issue/PR/session>`

   **Always a new file; never edit an existing one.** That is what makes
   concurrent deposits impossible to conflict — this repo runs several
   sessions at once, and when the Worklog was a single list every parallel
   deposit collided, which put friction on the one step that has to stay
   frictionless. The timestamp is also what tells the audit which
   candidates arrived since it last ran, so don't flatten it to a date.
2. Pick a best-guess `[category]` tag. Getting it slightly wrong is fine —
   the audit pass groups by root cause later, not by trusting the tag.
3. **Stop there.** Do not write a root cause. Do not propose a prevention.
   Do not decide whether it's a repeat of something else — don't even read
   the other deposits or `MISTAKES.md` to check. That restraint is deliberate: a
   session mid-task diagnosing its own mistake carries the same tunnel
   vision that produced it, and analysis is `audit-mistakes-log`'s job,
   done later with none of this session's context. If depositing ever feels
   like it takes real thought, that's a sign the deposit has drifted into
   analysis — pull back to one plain sentence.
4. Never edit `CLAUDE.md` from this skill. Adding an invariant is a
   deliberate, human-approved promotion, not something a same-session
   observation earns on its own.

## What "done" looks like

Either: nothing matched, say so briefly and move on — or: something
matched and got flagged before shipping — or: something new got deposited
as one Worklog deposit. All three are a complete, successful run of this
skill; none of them require touching `CLAUDE.md`.
