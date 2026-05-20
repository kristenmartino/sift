# Sift — STATUS

**Updated:** 2026-05-20
**Tier:** v1.5 (civic-literacy pivot, in flight) → v1.6 (Ask Sift web differentiator, planned)
**Velocity:** High (10+ PRs / week)

## Active focus

Civic-literacy pivot rollout (web). Android v1 build entering Phase 0 (per [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md) — decisions locked, scaffold pending). Sift-mcp merge into sift-api in flight (tracked at [`sift-api#62`](https://github.com/kristenmartino/sift-api/issues/62)). Recently shipped: 170 new dossier entries seeded (via `sift-api`); entity linker fix gated A/B-able in production; `docs/PRODUCT_STORY.md` refreshed; portfolio-v2 case study deployed. Sift-mcp v0.1 shipped (separate repo) with Loom + DM to Harish.

## Open strategic question

**Geographic scope of civic content + monetization timeline.**

Native platform direction was the previous open question; landed 2026-05-20 as **Android-first** (Path A from [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md)). What remains open is the v1 content scope (U.S.-only vs global from launch) and the monetization timeline (free indefinitely vs subscription exploration in 2027) — both shape whether Android-first holds longer-term or eventually pairs with iOS-as-second-platform. See [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md) §Decision queue.

## Next 3

1. **[committed]** [#56 — SSR / streaming for `/news` first-paint](https://github.com/kristenmartino/sift/issues/56) — architectural fix to break the 5.5s mobile LCP floor. LCP element after PR #55 is hydrated text inside `NewsAggregator`, not image — `priority`/`preload` is exhausted. Tier `v1.5` · `effort-week`.
2. **[committed]** [#98 — Civic-literacy pivot final-mile checklist](https://github.com/kristenmartino/sift/issues/98) — entity-linker promotion to default-on, dossier coverage parity per category, primer-expand instrumentation rollout. Depends on `sift-api` #53 + #54. Tier `v1.5` · `effort-weeks`.
3. **[committed]** Android v1 build (per [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md)) — Phase 0 (decisions locked, scaffold pending). Pre-week-1 design sprint → 10 weeks to production. New repo `kristenmartino/sift-android` to be created. Tier `v1.5` · `effort-weeks`.

Queued behind Next-3 (web, post-Android-build kickoff):
- **Web chat UI for Ask Sift** (`/ask` route) — Phase 2 of `sift-api` [#63](https://github.com/kristenmartino/sift-api/issues/63). Tier `v1.6` · `effort-week`. Slots in around Android build weeks 6–8.

## Blocked-on

- Apple Developer Program enrollment (deferred — iOS work waits behind Android v1)
- Triage of `sift-api` #62 (merge) and #63 (Ask Sift) into the sequenced roadmap

## Recent decisions

- **2026-05-20** — **Mobile is REST-only.** Active Android v1 plan ([`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md)) calls every backend route via REST/SSE; no MCP. `sift-mcp` #4 (hosted HTTP/SSE) deferred indefinitely. Rationale in `sift-api/docs/MOBILE_PROTOCOL_DECISION.md`.
- **2026-05-20** — **`sift-mcp` merges into `sift-api`.** Architecture spec at `sift-api/docs/MERGE_MCP_INTO_API.md`. Tracked at `sift-api` [#62](https://github.com/kristenmartino/sift-api/issues/62) with 4 phases. Driver: duplication between web's compare path (`app/api/compare/route.ts:55` → `sift-api` `/analyze/compare`) and `sift-mcp` `compare_outlets` is already real, not theoretical. Merge consolidates handlers and unblocks the Ask Sift agent loop.
- **2026-05-20** — **Ask Sift v0 planned as `tier-v1.6`** (web-only; mobile inherits in Android v1.1). Open-ended chat surface with the 5 sift-mcp tools wired into an internal agent loop on sift-api. Plan in `sift-api/docs/ASK_SIFT_PLAN.md`. Tracked in `sift-api` [#63](https://github.com/kristenmartino/sift-api/issues/63). Recommended slot: parallel to Android v1 weeks 6–8.
- **2026-05-20** — iOS plan v1 marked **under review**. Cross-functional assessment surfaced parity-shaped scope, premature canonical-API, and missing KPIs. See [`docs/IOS_APP_ASSESSMENT.md`](./docs/IOS_APP_ASSESSMENT.md). Plan retained as reference; **Android-first** active direction.
- **2026-05-20** — Canonical `/v1/*` API in sift-api **deferred** for mobile (Android uses Next.js routes); pattern now changes: MCP route mount lands on sift-api as part of the merge. See `sift-api/docs/MERGE_MCP_INTO_API.md`.
- **2026-05-20** — **Android-first leaning** (Path A) for native. Civic-literacy mission aligns with reach, not premium audience. Active.
- **2026-05-20** — DMCA audit: Sift's Railway footprint is **low-risk** under Railway's fair-use clause; real exposure is publisher-direct cease-and-desists, not host-mediated. Methodology page update queued in sift-api side.
- *(sift-mcp side, separately committed in that repo: hybrid index+web architecture; 26-outlet pool with smart DB-exclusion selection; `load_dotenv(override=True)`; `compare_outlets` unified-claims-array return shape.)*

---

*See also: [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md), [`docs/DECISIONS.md`](./docs/DECISIONS.md), [`docs/PRODUCT_STORY.md`](./docs/PRODUCT_STORY.md), [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md), [`CLAUDE.md`](./CLAUDE.md). Sibling repos: `sift-api` (backend), `sift-mcp` (MCP server — merging into sift-api per #62).*
