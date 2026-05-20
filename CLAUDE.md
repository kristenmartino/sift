# CLAUDE.md — orientation for Claude Code (and future-me)

Context to load before editing anything in `sift`. Keep this file **short**; if a section grows past one screen, split into a real doc.

## Pre-session ritual

Run these first, in order. Skip none.

```bash
cat STATUS.md            # active focus, open questions, next 3, recent decisions
gh pr list               # what's open, what's mid-flight
gh issue list            # what's committed but not started
cat BACKLOG.md           # deferred work + bugs/quirks to revisit
```

The 30 seconds this takes saves hours of "wait, I thought we already decided…" later.

## The two-repo split

This is the frontend half of a two-repo product:

| Repo | Role |
|---|---|
| `sift/` (this repo — Next.js 16, TypeScript, Vercel) | User-facing frontend **and read path** |
| `sift-api/` (FastAPI, Python 3.12, Railway) | Background pipeline, compare workflow, **write path** |

Both talk to the **same Neon Postgres**. They are independent git repos — don't `git add` across them. A "push the branch" request is usually `sift/` only; confirm before touching `sift-api/`.

## Where the slow path actually is

**Client → Next.js API route → `lib/db.ts` → Postgres.** The queries users wait on for the `/api/news` feed live in `lib/db.ts`. The indexes that serve them are defined in `sift-api/migrations/004_feed_indexes.sql` (applied at sift-api startup).

- Client abort budget: `API_TIMEOUT_MS = 10_000` in `lib/constants.ts`. Exceeding it surfaces "We hit a snag pulling today's stories" via `lib/hooks.ts`. No retry; one timeout = one error UI.
- Pool: `lib/db.ts` has `max: 5`. Don't raise casually — Neon free/hobby tiers cap connections.

When optimizing feed reads, read `lib/db.ts` first, then `sift-api/migrations/` + `sift-api/app/db.py:_apply_migrations` for the index layer. See [sift-api/CLAUDE.md](https://github.com/kristenmartino/sift-api/blob/main/CLAUDE.md) for the dual-file schema pattern and the `feed-perf` CI job that guards regressions.

## Where to file new work (decision tree)

| What you found | Where it goes |
|---|---|
| **Bug blocking current work** | Fix in active branch. Don't file. |
| **Concrete feature committing to in next ~2 weeks** | GitHub issue with `tier-v1.5` / `tier-v2` + `effort-*` labels. Add to STATUS.md "Next 3" if it bumps something. |
| **Concrete feature wanted eventually, no commitment** | BACKLOG.md "Stretch / nice-to-have." |
| **Quirk or minor bug, not urgent** | BACKLOG.md "Bugs / quirks to revisit." |
| **Critical bug found but not fixed** | GitHub issue with `bug` label *and* note in BACKLOG.md. STATUS.md "Blocked-on" if it blocks Next 3. |
| **Strategic question / open architectural decision** | STATUS.md "Open strategic questions" — never a GitHub issue. |
| **Architectural decision now made** | STATUS.md "Recent decisions." |
| **Out-of-scope idea surfaced during work** | BACKLOG.md "Stretch / nice-to-have." |

**Rule:** dated + scoped → file an issue. Half-formed → BACKLOG.md. Issues you'll never close are noise.

## Things I've tripped on

- **`sift/docs/FEATURE_SPECS.md` is 2400+ lines.** Useful for product intent (what / why); not for code-location questions. Reading the actual code is faster.
- **Mobile LCP floor of 5.5s** isn't going to budge without server-component conversion ([#56](https://github.com/kristenmartino/sift/issues/56)). Don't chase it with bundle optimization first.
- **The `NewsAggregator.tsx` monolith** is the main app surface — splitting it into primitives is tracked in [#59](https://github.com/kristenmartino/sift/issues/59). Be careful adding to it; the refactor is queued.

## Before closing a PR

- **If the change shifted active focus / Next 3 / open questions** → update `STATUS.md` in the PR.
- **If it added a deferred item, surfaced a quirk worth tracking, or recorded an architectural decision** → update `BACKLOG.md` (or STATUS.md "Recent decisions") in the PR.
- **If it changed setup / env / how-to-run** → update `README.md` if present.
- **If it changed a feed query** → coordinate with sift-api; rerun `sift-api/scripts/explain_feed_queries.py` against prod.

Don't open PRs that change behavior without touching the doc that explains the behavior.
