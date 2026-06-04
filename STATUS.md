# Sift — STATUS

**Updated:** 2026-06-02
**Tier:** v1.5 (civic-literacy pivot + agentic surfaces in Android v1)
**Velocity:** High (10+ PRs / week)

## Active focus

Civic-literacy pivot rollout (web). Android v1 build entering Phase 0 (per [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md) — decisions locked, scaffold pending). Sift-mcp merge into sift-api in flight (tracked at [`sift-api#62`](https://github.com/kristenmartino/sift-api/issues/62)). Ask Sift + Refined Compare agentic surfaces approved for Android v1 scope (tracked at [`sift-api#63`](https://github.com/kristenmartino/sift-api/issues/63)). Recently shipped: 170 new dossier entries seeded (via `sift-api`); entity linker fix gated A/B-able in production; `docs/PRODUCT_STORY.md` refreshed; portfolio-v2 case study deployed. App-wide editorial theme migration in flight: Phase 2A/2B (global semantic tokens + `/news` reader + neutral §3 rating primitives) shipped via [#144](https://github.com/kristenmartino/sift/pull/144) + [#145](https://github.com/kristenmartino/sift/pull/145) (2A–2C); 2D (legacy-token retirement + methodology/colophon/legal/masthead) in review; 2E QA remaining.

## Open strategic question

**Geographic scope of civic content + monetization timeline.**

Native platform direction resolved 2026-05-20 as **Android-first** (Path A from [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md)). What remains open: v1 content scope (U.S.-only vs global from launch) and monetization timeline (free indefinitely vs subscription exploration in 2027). Both shape whether Android-first holds longer-term or eventually pairs with iOS-as-second-platform. See [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md) §Decision queue.

**Rating system + entity coverage — how far past AllSides bias + MBFC factual?**

Surfaced 2026-06-01. The **neutrality rule**, the **"won't do" calls** (MBFC credibility, MBFC's bias scale, the "Questionable" flag — all re-introduce lean-as-value), and the plain-language `Bias rating:` / `Factual Reporting:` labels (#147) are settled in [`docs/DECISIONS.md` D37](./docs/DECISIONS.md). Still open: **MBFC country + press-freedom** (RSF / Freedom House) — the §3-clean expansion, "pursue when prioritized" (paid license + ToS) — and extending the dossier system to journalists / world leaders / a genre taxonomy. See OQ5 + D37 in [`docs/DECISIONS.md`](./docs/DECISIONS.md).

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

Cross-repo architecture decisions now live in [`docs/DECISIONS.md`](./docs/DECISIONS.md) (the canonical register); entries below keep their dates + links and point there instead of duplicating.

- **2026-06-03** — **Reader accessibility (paywall) as a ranking signal** → [`DECISIONS.md` D45](./docs/DECISIONS.md). Prefer surfacing freely-reachable sources for high-impact stories so readers don't hit a paywall at every turn; needs a per-outlet access field (free / metered / hard).
- **2026-06-02** — **"Every word is gold" audit ([#150](https://github.com/kristenmartino/sift/issues/150)) — empirical, not vibes** → [`DECISIONS.md` D38](./docs/DECISIONS.md). 500-article lexical-novelty test; the frontend overlap-suppressor was rejected on the evidence; quality fixed at generation ([`sift-api#90`](https://github.com/kristenmartino/sift-api/issues/90)); dead `landing.*` copy dropped ([#154](https://github.com/kristenmartino/sift/pull/154)). Stale "~50 outlets" → live count ([D39](./docs/DECISIONS.md); [#153](https://github.com/kristenmartino/sift/issues/153) / [#155](https://github.com/kristenmartino/sift/pull/155)); outlet-table drift ([D40](./docs/DECISIONS.md); [`sift-api#91`](https://github.com/kristenmartino/sift-api/issues/91)).
- **2026-06-01** — **Product direction from the AllSides teardown + provenance work.** (a) "Every word is gold" content bar → [D38](./docs/DECISIONS.md). (b) Expand sources toward ~200 "curated AND rated" → [D44](./docs/DECISIONS.md) ([#151](https://github.com/kristenmartino/sift/issues/151)). (c) In-feed keyword/tag filtering — client-side, deterministic, zero-LLM — spec'd in [#149](https://github.com/kristenmartino/sift/issues/149) (not yet a D-entry). (d) Rank by civic impact, not volume → [D45](./docs/DECISIONS.md).
- **2026-06-01** — **App-wide editorial theme migration + neutral rating primitives** → [`DECISIONS.md` D36](./docs/DECISIONS.md) (theme un-scope) + [D37](./docs/DECISIONS.md) (§3 neutrality). 2A–2D shipped ([#144](https://github.com/kristenmartino/sift/pull/144) / [#145](https://github.com/kristenmartino/sift/pull/145) / [#146](https://github.com/kristenmartino/sift/pull/146)); 2E QA remaining. Includes the Tailwind v4 unlayered-reset fix.
- **2026-05-31** — **Homepage (`/`) reskinned to the editorial "news, with footnotes" identity** (Phase 1; scoped under `.sift-landing`, then un-scoped app-wide in [D36](./docs/DECISIONS.md)). Fraunces / Hanken Grotesk / DM Mono site-wide; warm-paper + vermillion, accent bands pinned dark in both themes. Open: "How outlets framed it" is static — `TODO(live-compare)`.
- **2026-05-20** — **Native + agentic architecture calls** → `docs/DECISIONS.md`: `sift-mcp` merges into `sift-api` ([D41](./docs/DECISIONS.md)); mobile is REST-only ([D42](./docs/DECISIONS.md)); Refined Compare (`lens`) + Ask Sift in v1.5 scope, web + Android ([D43](./docs/DECISIONS.md)); iOS under review ([D32](./docs/DECISIONS.md)); canonical `/v1/*` deferred ([D33](./docs/DECISIONS.md)). Tracked at [`sift-api#62`](https://github.com/kristenmartino/sift-api/issues/62) (merge) + [`#63`](https://github.com/kristenmartino/sift-api/issues/63) (agentic).
- **2026-05-20** — **Android-first leaning** (Path A) for native; civic-literacy mission aligns with reach, not premium audience. (Open — see OQ1 + [D32](./docs/DECISIONS.md).)
- **2026-05-20** — DMCA audit: Railway footprint **low-risk** under the fair-use clause; real exposure is publisher-direct, not host-mediated. Methodology update queued (sift-api#54 / OQ2).
- *(sift-mcp side, in that repo's STATUS: hybrid index+web; 26-outlet smart-exclusion pool; `load_dotenv(override=True)`; `compare_outlets` unified-claims-array shape — folds into `sift-api` when [`#62`](https://github.com/kristenmartino/sift-api/issues/62) merges.)*

---

*See also: [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md), [`docs/DECISIONS.md`](./docs/DECISIONS.md), [`docs/PRODUCT_STORY.md`](./docs/PRODUCT_STORY.md), [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md), [`CLAUDE.md`](./CLAUDE.md). Sibling repos: `sift-api` (backend), `sift-mcp` (MCP server — merging into sift-api per #62).*
