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

## See also

- [`docs/PRD.md`](./docs/PRD.md) — original product vision
- [`docs/PRODUCT_STORY.md`](./docs/PRODUCT_STORY.md) — current narrative (interview-prep relevant)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system design
- [`docs/TECHNICAL_SPEC.md`](./docs/TECHNICAL_SPEC.md) — API + data contracts
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — historical decision log (ADR-shaped)
- [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md) — roadmap snapshot
- [`docs/FEATURE_SPECS.md`](./docs/FEATURE_SPECS.md) — feature-level specs (large; reference, not read-through)
- [`docs/IOS_APP_PLAN.md`](./docs/IOS_APP_PLAN.md) + [`docs/IOS_APP_ASSESSMENT.md`](./docs/IOS_APP_ASSESSMENT.md) + [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md) — native client plans (under review)
