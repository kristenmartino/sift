# CLAUDE.md — sift (Next.js frontend)

Orientation for Claude Code sessions. Keep this short and current — if it grows past one screen, split the long bits into real docs in `docs/`.

## Pre-session ritual

Before doing real work in a session:

1. Read [`STATUS.md`](./STATUS.md) — Active focus, Open question, Next 3, Blocked-on, Recent decisions.
2. List open PRs (`mcp__github__list_pull_requests` or `gh pr list` locally) — anything mid-review.
3. List open issues (`mcp__github__list_issues` or `gh issue list`) — especially ones on the Next 3.
4. Skim [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md) if the work touches roadmap (tier label decisions).

If `STATUS.md` is older than ~3 days during a high-velocity period (10+ PRs / week), flag the staleness to the user before starting.

## End-of-PR doc-impact check

Before opening the PR:

- Did this change anything in `STATUS.md`'s Next 3, Blocked-on, or Open question? Update it.
- Did this make or close a strategic decision? Add a `## Recent decisions` entry in `STATUS.md` and (if substantial) a row in [`docs/DECISIONS.md`](./docs/DECISIONS.md).
- Did this change a public contract (API shape, page route, env var)? Update the relevant doc in `docs/` ([`TECHNICAL_SPEC.md`](./docs/TECHNICAL_SPEC.md), [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md), `README.md`).
- Did this change how the app boots / runs locally? Update the Quick Start in `README.md`.
- Touched `docs/IOS_*.md` (plan / assessment / platform analysis)? Update the status banner at the top to reflect current state (Active / Under review / Archived).
- **Did this satisfy something another document says is pending?** If it closes a "will be updated", "in progress", "not yet measured" or "blocked on" claim in `STATUS.md`, [`docs/DECISIONS.md`](./docs/DECISIONS.md), or a sibling repo's `STATUS.md`, go back and say so. Deferrals survive on their own because an open issue keeps asserting itself; completions do not, and nothing else will notice. Four instances of this in one day are recorded in [`MISTAKES.md`](./MISTAKES.md).
- **Republished a hosted artifact this session? Commit the source file too.** `sift-system-walkthrough.html` is published to claude.ai and is built by nothing, so no test, lint or deploy fails when the repo copy falls behind the live page. It has already happened once: the 2026-08-10 revision went live uncommitted and the repo copy sat 13 days stale, missing six features that were live on the page. **Before editing it, `WebFetch` its artifact URL and diff against the file** — publishing over a stale base silently reverts whatever the last session shipped. Same rule for any other standalone HTML here that gets published (`sift-product-os.html` is the other candidate).

## Where to file new work (decision tree)

When you discover something during a session that's worth tracking, use this to decide where it goes. The goal: **never lose anything, but don't over-file** either.

| What you found | Where it goes |
|---|---|
| **Bug blocking current work** | Fix in active branch. Don't file. |
| **Concrete feature committing to in next ~2 weeks** | GitHub issue with `tier-v1.5` / `tier-v2` + `effort-*` labels. Add to STATUS.md "Next 3" if it bumps something. |
| **Concrete feature wanted eventually, no commitment** | Note in `STATUS.md` "Recent decisions" if it's a decision; otherwise wait until you're ready to commit, then file an issue. |
| **Quirk or minor bug, not urgent** | GitHub issue with `bug` label. No need to surface in STATUS.md unless it blocks Next 3. |
| **Critical bug found but not fixed** | GitHub issue with `bug` label, then mention in STATUS.md "Blocked-on" if it blocks Next 3. |
| **Strategic question / open architectural decision** | STATUS.md "Open strategic question" — never a GitHub issue. Questions get answered through usage/conversation, not engineering work. |
| **Architectural decision now made** | STATUS.md "Recent decisions" with a date. If substantial, also add a row in [`docs/DECISIONS.md`](./docs/DECISIONS.md). |
| **Out-of-scope idea surfaced during work** | If it's tied to a specific file, use the spawned-task chip in your editor. Otherwise note in STATUS.md "Recent decisions" or open an issue if scoped. |

**The rule:** dated + scoped → file an issue. Half-formed → leave in STATUS.md context or a casual note. Issues you'll never close are noise.

## Sibling repos

| Repo | Role | Notes |
|---|---|---|
| [`kristenmartino/sift-api`](https://github.com/kristenmartino/sift-api) | Python FastAPI backend, owns the write path | Has its own `STATUS.md` + `CLAUDE.md`. Background pipeline + LangGraph compare. |
| `kristenmartino/sift-mcp` | MCP server (v0.1 shipped) | Separate ship cadence. Demo target. |
| `kristenmartino/portfolio-v2` | Case study deploy target | `src/content/work/sift.mdx`. Update on substantial product changes. |

Commits do **not** cross repos — a "push the branch" request usually means just this one. Confirm before touching siblings.

**Architecture note (D35):** new AI / search / write work belongs in **sift-api** (it owns the AI + write path). The one current exception — the topic-search AI fallback in `app/api/news/topic/route.ts` — is grandfathered and being migrated to sift-api (Slice 1 = sift-api#79). See [`docs/DECISIONS.md`](./docs/DECISIONS.md) D35.

## Verify before trusting

Two habits, evidenced separately in [`MISTAKES.md`](./MISTAKES.md) — grouped here by theme, not because they're the same root cause:

- **Re-confirm a PR/issue number against this session's own output before citing or acting on it** — a CI poll, a `gh` call, opening new work — rather than reusing a number carried over from earlier context. See `MISTAKES.md` → unverified-pr-reference.
- **Verify shell/git state before trusting it.** A `cd` into a worktree or sibling repo can silently fail if the shell's cwd already reset — confirm with `pwd` before assuming later commands ran where intended. Before any command that can discard uncommitted state (`git reset --hard`, `checkout --`, `clean`), check `git status`/`git diff --stat` first — an uncommitted change is invisible to that command and gone without a trace. See `MISTAKES.md` → unverified-git-shell-state.

## Mistake logging & rule graduation

Ported from the sibling GridPulse repo on 2026-08-18, machinery and policy
alike; the evidence in [`MISTAKES.md`](./MISTAKES.md) is sift's own.

Deposit whenever something costs real time, nearly ships wrong, or would
change how you'd approach the next similar task: one new file under
`.mistakes/worklog/` named `<UTC timestamp>-<category>.md`, holding one
sentence with a date, a best-guess category and a ref. A new file every
time, never an edit to an existing one — that is what lets parallel sessions
deposit without colliding. **Stop there.** Don't diagnose root cause, don't
propose a fix, don't decide whether it repeats anything — do that mid-task
and you're reasoning about your own mistake with the same tunnel vision that
produced it. Keep the deposit cheap enough that it always happens.

**A separate pass decides everything else.** The
[`audit-mistakes-log`](.claude/skills/audit-mistakes-log/SKILL.md) skill, run
periodically with none of the depositing session's context, reads the pending
deposits, groups them by *root cause* rather than by the tag each carries,
and only once a category crosses the graduation bar drafts the full Analyzed
entry and a candidate rule for this file. It proposes; it does not merge.
**Graduate on either bar:**
- **Repeat** — the same root cause recurs (≥2 occurrences).
- **Severity** — one incident costly or high-blast-radius enough
  (production-visible, silently wrong for days, corrupted state) that waiting
  for a repeat isn't worth the risk.

**A human approves every promotion.** A line in this file is a durable,
overriding instruction for every future session — it earns the same scrutiny
as any other standing-rule change, reviewed like any other doc PR. Self-edit
this file mid-task only to correct what's already here, never to add a new
invariant on your own authority.

**Keep the enforced set small — point at evidence instead of restating it.**
`MISTAKES.md` can grow; this file should not grow at the same rate. State
rules as **positive invariants** ("verify X before Y", "commit the source
when you republish") rather than prohibitions — a model reasoning from a list
of don'ts is likelier to invert one under pressure. Prefer strengthening an
existing rule over adding a near-duplicate.

**When a promotion is approved:** add the concise invariant here and mark the
source `MISTAKES.md` entry `graduated → CLAUDE.md § <heading> (<date>)` —
never delete it; it's the evidence trail for why the rule exists. If a fix
instead makes the mistake structurally impossible (a test, an assertion, a
lint rule, a hook), mark the entry `resolved — enforced by <X>` and add **no**
line here: a prose rule is for judgment calls nothing mechanical can catch,
and a guard a test already owns doesn't need a second, weaker copy for a
session to remember by hand.

**What enforces what.** `.claude/hooks/guard-close-keywords.sh` blocks a
backticked close keyword and asks on a live one, at the moment a commit or PR
command runs. Two nudges fire on their own: after a plan is approved
(`check-past-mistakes`), and at session start once three or more candidates
have piled up since the last audit. Every hook invocation appends to
`.claude/hook-activity.log` — gitignored, bounded, safe to delete — including
the silent ones, specifically so "the guard never had cause to fire" and "the
guard never ran" don't read identically.

## See also

- [`docs/PRD.md`](./docs/PRD.md) — original product vision
- [`docs/PRODUCT_STORY.md`](./docs/PRODUCT_STORY.md) — current narrative (interview-prep relevant)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system design
- [`docs/TECHNICAL_SPEC.md`](./docs/TECHNICAL_SPEC.md) — API + data contracts
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — historical decision log (ADR-shaped)
- [`MISTAKES.md`](./MISTAKES.md) — mistake evidence store; read it only when auditing, not mid-task
- [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md) — roadmap snapshot
- [`docs/FEATURE_SPECS.md`](./docs/FEATURE_SPECS.md) — feature-level specs (large; reference, not read-through)
- [`docs/IOS_APP_PLAN.md`](./docs/IOS_APP_PLAN.md) + [`docs/IOS_APP_ASSESSMENT.md`](./docs/IOS_APP_ASSESSMENT.md) + [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md) — native client plans (under review)
