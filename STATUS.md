# Sift — STATUS

**Updated:** 2026-06-01
**Tier:** v1.5 (civic-literacy pivot + agentic surfaces in Android v1)
**Velocity:** High (10+ PRs / week)

## Active focus

Civic-literacy pivot rollout (web). Android v1 build entering Phase 0 (per [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md) — decisions locked, scaffold pending). Sift-mcp merge into sift-api in flight (tracked at [`sift-api#62`](https://github.com/kristenmartino/sift-api/issues/62)). Ask Sift + Refined Compare agentic surfaces approved for Android v1 scope (tracked at [`sift-api#63`](https://github.com/kristenmartino/sift-api/issues/63)). Recently shipped: 170 new dossier entries seeded (via `sift-api`); entity linker fix gated A/B-able in production; `docs/PRODUCT_STORY.md` refreshed; portfolio-v2 case study deployed. App-wide editorial theme migration in flight: Phase 2A/2B (global semantic tokens + `/news` reader + neutral §3 rating primitives) shipped via [#144](https://github.com/kristenmartino/sift/pull/144); 2c (civic + dossiers) underway on `theme/civic-dossiers-editorial-tokens`.

## Open strategic question

**Geographic scope of civic content + monetization timeline.**

Native platform direction resolved 2026-05-20 as **Android-first** (Path A from [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md)). What remains open: v1 content scope (U.S.-only vs global from launch) and monetization timeline (free indefinitely vs subscription exploration in 2027). Both shape whether Android-first holds longer-term or eventually pairs with iOS-as-second-platform. See [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md) §Decision queue.

## Next 3

1. **[committed]** [#56 — SSR / streaming for `/news` first-paint](https://github.com/kristenmartino/sift/issues/56) — architectural fix to break the 5.5s mobile LCP floor. LCP element after PR #55 is hydrated text inside `NewsAggregator`, not image. Tier `v1.5` · `effort-week`.
2. **[committed]** [#98 — Civic-literacy pivot final-mile checklist](https://github.com/kristenmartino/sift/issues/98) — entity-linker promotion to default-on, dossier coverage parity per category, primer-expand instrumentation rollout. Depends on `sift-api` #53 + #54. Tier `v1.5` · `effort-weeks`.
3. **[committed]** Android v1 build (per [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md)) — Phase 0 (decisions locked, scaffold pending). **Scope now includes Ask Sift chat + Compare button (deterministic + Refined).** Pre-week-1 design sprint → ~12 weeks to production. New repo `kristenmartino/sift-android` to be created. Tier `v1.5` · `effort-weeks`.

Web-side in flight alongside the Android build:
- **Web `/ask` chat UI** for Ask Sift (Phase 4 of `sift-api` [#63](https://github.com/kristenmartino/sift-api/issues/63)). Ships parallel to Android weeks 6-8. Tier `v1.5` · `effort-week`.
- **Web Compare button gains "Focus on…" input** for Refined Compare (Phase 5 of `sift-api` [#63](https://github.com/kristenmartino/sift-api/issues/63)).

## Blocked-on

- Apple Developer Program enrollment (deferred — iOS work waits behind Android v1)
- Triage of `sift-api` #62 (merge) and #63 (Ask Sift + Refined Compare) into the sequenced roadmap

## Recent decisions

- **2026-06-01** — **App-wide editorial theme migration — Phase 2A/2B shipped ([#144](https://github.com/kristenmartino/sift/pull/144)).** Promoted the `.sift-landing` editorial tokens to a GLOBAL semantic layer (surfaces / text / borders / accent + states / status / ring, both themes); the `/news` reader migrated off the stone/indigo palette. Introduced neutral, sourced **rating primitives** — `OutletChip`, `LeanGlyph`, `FactualChip`, `PartyTag` — per [`SIFT_THEME_MIGRATION.md`](./SIFT_THEME_MIGRATION.md) §3: lean is encoded by POSITION (not hue), party by a neutral letter chip, and — per sign-off — the **factual tier is a neutral fill-level meter, not green-good / red-bad**. No partisan red/blue/green on any lean/party/factual treatment. Legacy stone/indigo tokens are retained for not-yet-migrated surfaces and deleted in 2d. **In flight:** 2c migrates the civic index + politician/org/bill/outlet dossiers (branch `theme/civic-dossiers-editorial-tokens`); 2d removes legacy tokens + finishes methodology/colophon/legal; 2e is the AA-contrast + neutrality + responsive QA pass.
- **2026-06-01** — **Tailwind v4 cascade-layer compatibility fix (in #144).** The v3→v4 migration (#142) left the app's universal reset `* { margin:0; padding:0 }` UNLAYERED; under v4 native cascade layers an unlayered rule beats every layered utility regardless of specificity, silently killing all `p-*` / `m-*` / `mt-auto` / `space-y-*` / `mx-auto` utilities (collapsed `/news` + dossier spacing/centering; the homepage was spared because it's hand-written `.sl-*` CSS). Fix: move the reset into `@layer base` (so it loses to `@layer utilities`) + add the documented v4 button-cursor compat rule.
- **2026-05-31** — **Homepage (`/`) reskinned to the editorial "news, with footnotes" identity.** Site-wide font swap → Fraunces (display) / Hanken Grotesk (body) / DM Mono. Homepage-scoped recolor (warm-paper light + dark, vermillion accent) scoped under `.sift-landing` so `/news` and other surfaces keep the stone/indigo palette and inherit fonts only. Preserved: live Postgres lead story + data path, the existing dark-mode toggle, and the shared `LandingMasthead` (untouched). Hero chips resolve real AllSides/MBFC via the canonical `getOutletProfilesMap`/`resolveOutletForSourceName` path; omitted when unresolved (never fabricated). The manifesto / CTA / footer accent bands are pinned dark in both themes (they don't invert — fixes a dark-mode CTA-button contrast bug). Open: "How outlets framed it" is static — `TODO(live-compare)`.
- **2026-05-20** — **Android v1 scope expanded to include Ask Sift + Compare button.** Previously: reader + share extension only. Now: reader + share extension + Ask Sift agentic chat + Compare button (deterministic + Refined). Reasoning: without Ask Sift, native mobile is a polished reader competing with Apple News / Artifact. WITH Ask Sift, it's a civic-literacy agent on the phone. That's the wedge that justifies native. Timeline impact: ~10 weeks → ~12 weeks.
- **2026-05-20** — **Refined Compare added to v1 scope.** Lens-driven agentic comparison via `lens` parameter on `/api/compare`. Same endpoint as the deterministic compare; backend routes based on lens presence. Plan in `sift-api/docs/REFINED_COMPARE_PLAN.md`.
- **2026-05-20** — **Mobile is REST-only.** Even the agentic surfaces (Ask Sift, Refined Compare) call REST/SSE — the agent loop runs server-side; MCP is internal plumbing. `sift-mcp` #4 (hosted HTTP/SSE) deferred indefinitely. Rationale in `sift-api/docs/MOBILE_PROTOCOL_DECISION.md`.
- **2026-05-20** — **`sift-mcp` merges into `sift-api`.** Architecture spec at `sift-api/docs/MERGE_MCP_INTO_API.md`. Tracked at `sift-api` [#62](https://github.com/kristenmartino/sift-api/issues/62) with 4 phases. Driver: duplication between web's compare path (`app/api/compare/route.ts:55` → `sift-api` `/analyze/compare`) and `sift-mcp` `compare_outlets` is already real. Merge consolidates handlers and unblocks the agentic surfaces.
- **2026-05-20** — iOS plan v1 marked **under review**. Cross-functional assessment surfaced parity-shaped scope, premature canonical-API, and missing KPIs. See [`docs/IOS_APP_ASSESSMENT.md`](./docs/IOS_APP_ASSESSMENT.md). Plan retained as reference; **Android-first** active direction.
- **2026-05-20** — Canonical `/v1/*` API for mobile **deferred**. Android uses Next.js routes + 4 net-new endpoints in sift-api (`/v1/share/sift-this`, `/v1/devices/register`, `/api/ask`, `/api/compare` with `lens`).
- **2026-05-20** — **Android-first leaning** (Path A) for native. Civic-literacy mission aligns with reach, not premium audience. Active.
- **2026-05-20** — DMCA audit: Sift's Railway footprint is **low-risk** under Railway's fair-use clause; real exposure is publisher-direct cease-and-desists, not host-mediated. Methodology page update queued in sift-api side.
- *(sift-mcp side, separately committed in that repo: hybrid index+web architecture; 26-outlet pool with smart DB-exclusion selection; `load_dotenv(override=True)`; `compare_outlets` unified-claims-array return shape.)*

---

*See also: [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md), [`docs/DECISIONS.md`](./docs/DECISIONS.md), [`docs/PRODUCT_STORY.md`](./docs/PRODUCT_STORY.md), [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md), [`CLAUDE.md`](./CLAUDE.md). Sibling repos: `sift-api` (backend), `sift-mcp` (MCP server — merging into sift-api per #62).*
