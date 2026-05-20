# Sift — STATUS

**Updated:** 2026-05-20
**Tier:** v1.5 (civic-literacy pivot, in flight)
**Velocity:** High (10+ PRs / week)

## Active focus

Civic-literacy pivot rollout (web). Recently shipped: 170 new dossier entries seeded (via `sift-api`); entity linker fix gated A/B-able in production; `docs/PRODUCT_STORY.md` refreshed; portfolio-v2 case study deployed. Sift-mcp v0.1 shipped (separate repo) with Loom + DM to Harish.

## Open strategic question

**Native platform first: iOS vs Android?**

Apple Developer Program enrollment is requested but may take weeks (24–72h personal, 4–8 weeks for new entities). Android: $25 one-time, ~instant approval, lenient Play Store review.

**Working recommendation: start Android while iOS enrollment is pending.** Converts the enrollment-delay window from zero opportunity cost into a shipped Android v1; Android validates which native features actually matter before iOS gold-plates them; the backend infra (endpoints, push registration schema, share-extension handoff) is built once and reused. See [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md).

Final call open.

## Next 3

1. **[committed]** [#56 — SSR / streaming for `/news` first-paint](https://github.com/kristenmartino/sift/issues/56) — architectural fix to break the 5.5s mobile LCP floor. LCP element after PR #55 is hydrated text inside `NewsAggregator`, not image — `priority`/`preload` is exhausted. Tier `v1.5` · `effort-week`.
2. **[committed]** Civic-literacy pivot — final-mile checklist (umbrella issue, see Issues tab) — entity-linker promotion to default-on, dossier coverage parity per category, primer-expand instrumentation rollout. Tier `v1.5` · `effort-weeks`.
3. **[sketch]** Resolve native platform direction — Android-first vs iOS-first vs PWA-only. Blocks iOS-plan revision and any mobile build. Decision-only; no issue. Tier `v2` · `effort-day`.

## Blocked-on

- Apple Developer Program enrollment (iOS work waits)
- Harish demo response (sift-mcp v0.5 hardening waits, separate repo)
- Resolution of the Open strategic question above (mobile work waits)

## Recent decisions

- **2026-05-20** — iOS plan v1 marked **under review**. Cross-functional assessment surfaced parity-shaped scope, premature canonical-API, and missing KPIs. See [`docs/IOS_APP_ASSESSMENT.md`](./docs/IOS_APP_ASSESSMENT.md). Plan retained as reference, not active direction.
- **2026-05-20** — Canonical `/v1/*` API in sift-api **deferred**. For pre-PMF, reuse Next.js routes (+ Edge caching if needed); collapse later when web→mobile migration is scheduled.
- **2026-05-20** — **Android-first leaning** (Path A) for native. Civic-literacy mission aligns with reach, not premium audience. Final decision open.
- **2026-05-20** — DMCA audit: Sift's Railway footprint is **low-risk** under Railway's fair-use clause; real exposure is publisher-direct cease-and-desists, not host-mediated. Methodology page update queued in sift-api side.
- *(sift-mcp side, separately committed in that repo: hybrid index+web architecture; 26-outlet pool with smart DB-exclusion selection; `load_dotenv(override=True)`; `compare_outlets` unified-claims-array return shape.)*

---

*See also: [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md), [`docs/DECISIONS.md`](./docs/DECISIONS.md), [`docs/PRODUCT_STORY.md`](./docs/PRODUCT_STORY.md), [`CLAUDE.md`](./CLAUDE.md). Sibling repos: `sift-api` (backend), `sift-mcp` (MCP server, separate cadence).*
