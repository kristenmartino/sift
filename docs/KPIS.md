# Sift — KPIs

**Updated:** 2026-05-20
**Status:** Instrumentation in flight; many targets are aspirational for v1.5 / v2

Single page of "what success looks like." Used as the rubric when triaging Next 3 + when pitching the product. Keep tight — if it grows past one screen, prune to the few KPIs the team is actually moving.

---

## North-star metrics

| Metric | Definition | Target | Where measured | Status |
|---|---|---|---|---|
| **DAU** | Distinct authenticated + anonymous browser sessions per day | 1K by end of v1.5 | PostHog | Not yet measured |
| **D30 retention** | % of new users active on day 30 | ≥ 20% | PostHog | Not yet measured |
| **% sessions with civic engagement** | % of sessions with ≥ 1 primer expand or entity chip tap | ≥ 40% | PostHog events `primer_term_expand`, `entity_chip_tap` | Instrumentation rolling out — see [sift#98](https://github.com/kristenmartino/sift/issues/98) |

## Engagement (per-session)

| Metric | Target | Status |
|---|---|---|
| Median session length | ≥ 3 min | Not measured |
| Articles read per session | ≥ 5 | Not measured |
| Bookmark rate (% of read articles bookmarked) | ≥ 8% | Measurable now (Clerk + `bookmarks` table) — not dashboarded |
| "Read at source" tap rate | 10–25% *(target band)* | Not measured |
| Topic search uses per WAU | ≥ 0.5 | Not measured |

The "Read at source" band has a top end on purpose — too many click-throughs means the Sift summary isn't doing its job.

## Civic-literacy specific

| Metric | Target | Status |
|---|---|---|
| Dossier coverage per category | ≥ 80% of articles have ≥ 1 resolved `EntityLink` | Measurable now via `scripts/coverage_audit.py` (sift-api). In flight — [sift-api#53](https://github.com/kristenmartino/sift-api/issues/53) |
| Primer-expand rate per article view | ≥ 15% | Instrumentation in flight — sift#98 |
| Cross-spectrum compare uses per WAU | ≥ 0.2 | Not measured |
| % of articles with ≥ 3 cross-spectrum framings | ≥ 25% | Measurable now (story threading writes framings array) |

## Operational

| Metric | Current | Target | Status |
|---|---|---|---|
| `/api/news` p95 latency (server) | ~150ms per `feed-perf` CI | ≤ 200ms | Healthy |
| `/news` mobile LCP (end-to-end) | 5.5s after PR #55 wins | ≤ 2.5s | Blocked on [sift#56](https://github.com/kristenmartino/sift/issues/56) (SSR + streaming) |
| Pipeline run duration (10-min cron) | ~90s avg | ≤ 5 min | Healthy; ample margin |
| Pipeline failure rate (Sentry) | < 1% | < 1% | Healthy |
| Monthly cost | ~$9 (current) | < $100 through v1.5 | On track. Projected $30–50/mo at growth. |

## Native client (v2 — not yet measurable)

Targets staked in [`docs/IOS_APP_ASSESSMENT.md`](./IOS_APP_ASSESSMENT.md) — restated here so this page is the single source. Without targets, "iOS shipped" is a feature delivery, not a result.

| Metric | Target |
|---|---|
| D30 retention (native) | ≥ 25% |
| Push opt-in rate | ≥ 50% |
| Push CTR | ≥ 4% |
| Share-extension uses per WAU | ≥ 2 |
| Web → native install rate (universal link banner) | ≥ 8% |
| Native share of total WAU within 6 mo of launch | ≥ 30% |
| % sessions with civic engagement (native) | ≥ 40% (parity with web) |

## Where to look (live data)

Once instrumentation lands, the canonical dashboards live at:

- **PostHog** — engagement, retention, civic events
- **Sentry** — error rate, failure types (`siftnews` project)
- **Vercel Analytics** — page-level perf, geographic distribution
- **Railway dashboards** — pipeline duration, scheduler runs, FastAPI request rates
- **CI `feed-perf` job** — query-level p95s on every relevant PR (`sift-api/.github/workflows/ci.yml`)

---

*KPIs without targets and instrumentation are just opinions. Each row on this page should be set in PostHog with an alert by end of v1.5.*
