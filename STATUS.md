# sift — status

> **Pre-session ritual:** `cat STATUS.md && gh pr list && gh issue list && cat BACKLOG.md`. See [CLAUDE.md](CLAUDE.md).

## Active focus

**Civic-literacy pivot — final-mile.** Recently repositioned Sift's framing around the aggregator + civic-literacy layer (#96, #97). Primer instrumentation Phase 1 just landed (#95). Topic-search funnel instrumented (#92). Org type expanded for federal agencies (#91). Primer terms now link to dossiers via entity_links (#90). In flight: the broader final-mile checklist in [#98](https://github.com/kristenmartino/sift/issues/98), the mobile/perf push, and PR [#100](https://github.com/kristenmartino/sift/pull/100) (github-projects MCP server — applicable to project state mgmt across repos).

## Open strategic questions

Three live unknowns. None block current work; all shape decisions in the next 1–3 months.

### 1. When is the civic-literacy pivot "shipped" — and what's the v2 trigger?

The pivot has been in flight across many PRs (primer, glossary, dossiers, framing). [#98 final-mile checklist](https://github.com/kristenmartino/sift/issues/98) is the current closure plan. Open question: what's the explicit "done" criterion? Candidates:
- All four entity types (politician / org / bill / outlet) have full dossier coverage for any article in the index
- Per-paragraph primer triggers ship (currently above-the-fold only)
- Cross-spectrum framing surface reflects "observation, not judgment" (still in flight per case study reflections)

`tier-v2` is reserved for native client family (mobile + desktop). v1.5 → v2 trigger probably = "civic-literacy pivot is durable enough that mobile is worth the investment."

### 2. Per-paragraph primer triggers — when and how?

Primers currently attach above the fold by topic match. The reflection on the [case study](https://kristenmartino.ai/work/sift) flagged a *reader-pacing model that surfaces primers in the reading flow* as the next move. Instrumentation just landed (#95) so we'll soon have data on whether readers expand the above-fold primer at all — that signal informs whether per-paragraph is the right next step or whether the above-fold version needs more work first.

### 3. Cross-spectrum framing — observation vs labeling?

Current `CompareView` shows side-by-side framing across outlets. The version worth shipping next *describes what each outlet chose to emphasize, without claiming any of them are wrong* (per case study reflection). The trust-scoring / propaganda-tagging / extremism-flag features that were built but pulled produce nothing meaningful on a mainstream corpus.

What would resolve: prototype the "observation" version of CompareView and ship behind a flag; A/B against the current label-style framing.

## Next 3

Issues live in GitHub; this is the human-readable summary.

1. **[#98 Civic-literacy pivot — final-mile checklist](https://github.com/kristenmartino/sift/issues/98)** *(tier-v1.5, effort-weeks)*. The canonical "what's left to close the pivot" tracker. Active.
2. **[#56 Perf: convert /news first-paint to Server Components + streaming](https://github.com/kristenmartino/sift/issues/56)** *(tier-v1.5, effort-week)*. Mobile LCP floor of 5.5s is the blocker. Server-component conversion + streaming is the path to breaking through it.
3. **[PR #100 github-projects MCP server for Projects v2 tools](https://github.com/kristenmartino/sift/pull/100)** *(open PR, inferred priority)*. Building an MCP for managing the GitHub Project boards. Tangentially relevant to the state-mgmt work in [sift-mcp#5](https://github.com/kristenmartino/sift-mcp/pull/5) — that MCP, once shipped, makes the per-repo Project board manipulation scriptable.

## Blocked-on

Nothing engineering-blocked. v2 (native clients) is gated on civic-literacy pivot completion + demand signal.

## Recent decisions

- **Repositioned Sift framing around aggregator + civic-literacy layer** (#96, #97). The two-layer narrative is now the public framing — the aggregator surface is foundation, the civic-literacy surface is the differentiator.
- **Primer terms link to dossiers via entity_links** (#90). Closes the loop between the "what you should know first" panel above an article and the structured dossier graph underneath. Phase 3.G.4.
- **Federal agencies as a distinct OrgType** (#91, paired with sift-api#49). Agencies needed their own representation — not corporations, not advocacy groups. 15 agency dossiers shipped on the backend.
- **Mobile polish: external-link rows stack + chip tap target bumped** (#94). Mobile is a heavy and growing share; polish here pays back across the whole experience.

## Where things live

### Code

- `app/api/` — Next.js API routes (`news/`, `compare/`, `bookmarks/`, `cron/`)
- `components/` — UI primitives + the main `NewsAggregator.tsx` monolith (extraction tracked in [#59](https://github.com/kristenmartino/sift/issues/59))
- `lib/db.ts` — feed queries — **the slow path users wait on**; see [sift-api/CLAUDE.md](https://github.com/kristenmartino/sift-api/blob/main/CLAUDE.md#where-the-slow-path-actually-is) for the index map
- `lib/constants.ts` — `API_TIMEOUT_MS = 10_000` plus categories / gradients
- `lib/hooks.ts` — useNewsLoader, useBookmarks, useTheme, useTopicSearch, useCompare
- `docs/FEATURE_SPECS.md` — 2400+ lines of product intent. Useful for what / why; not for where-does-X-live (read code instead)

### Planning + state

- **STATUS.md** (this file) — top-of-mind: active focus, open questions, Next 3, blockers, recent decisions
- **BACKLOG.md** — everything deferred, in prose
- **GitHub issues** — formally tracked work. See [`gh issue list`](https://github.com/kristenmartino/sift/issues).
- **GitHub Project** ([Sift](https://github.com/users/kristenmartino/projects/3)) — board spanning sift, sift-api, sift-mcp.

Discovery order: `gh issue list` → `cat BACKLOG.md` → `git log --oneline` → ask.
