# Sift — Operating Context

**Purpose:** the shared substrate every role prompt in `.claude/agents/` reads before doing anything. Also usable on its own: paste it at the top of a Claude Project, or reference it from a session as *"read `docs/OPERATING_CONTEXT.md` first."*

**Owner:** Kristen Martino (solo). **Last reviewed:** 2026-07-27.
**Update cadence:** whenever §3 numbers change or a §6 decision closes. If it's more than 2 weeks stale, say so before relying on it.

> **This file is about the business, not the code.** Engineering orientation lives in `CLAUDE.md`; roadmap in `STATUS.md`; architecture decisions in `docs/DECISIONS.md`. Don't duplicate them here.

---

## 1. What Sift is

An AI-powered news aggregator with a civic-literacy layer. Ingests **58 RSS feeds** every 30 minutes (`len(services.rss.FEEDS)` = 58, verified 2026-07-27) across **72 rated outlets** in prod `outlet_profiles` (prod `outlet_profiles` after the #91 cleanup, 77→72; the seed CSV is *not* prod's source of truth — see D40) spanning the political spectrum, summarizes the day's stories across 10 categories, lets a reader search any topic or compare how outlets framed the same story — and adds the civic footnotes the news assumes you already have: an adaptive "what you should know first" primer, inline glossary, structured dossiers on politicians / organizations / bills / outlets built from public records, and cross-spectrum framing using AllSides + MBFC ratings surfaced verbatim.

**One line:** *the news, with footnotes.*

**Stack:** Next.js 15 + TypeScript on Vercel · Python FastAPI + LangGraph on Railway · Neon Postgres + pgvector · Claude Haiku 4.5 · Voyage AI embeddings · Clerk auth · Sentry. **No product analytics** — PostHog is proposed in `GROWTH_STRATEGY.md` §3, not started.

**Live at:** `siftnews.kristenmartino.ai` → migrating to `siftnews.io`.

---

## 2. The strategic thesis

**The sellable asset is the dossier dataset and the audience relationship — not the aggregator.**

The AI-summarization layer has the worst legal posture (*Cohere*, *Meltwater*), the worst SEO posture (Google's scaled-content-abuse and helpful-content policies describe it almost verbatim), the worst channel posture (r/politics bans aggregators; HN flags politics), and zero verified unit economics anywhere in the category.

The dossiers are original research over public records — OpenSecrets, GovTrack, ProPublica, FEC, FARA, Vote Smart. Owned, evergreen, long-tail-searchable, licensable, defensible.

**Every proposal should be tested against: does this shift weight from the summarizer to the dossiers?** Full reasoning and citations in `docs/GROWTH_STRATEGY.md`.

---

## 3. Where things actually stand

**Users:** effectively zero. Launched, not adopted.
**Revenue:** $0. No payment rails.
**Analytics:** Sentry (errors only, no PII, no session replay), plus `@vercel/analytics` and `@vercel/speed-insights` in `package.json`. **Nothing that can produce a funnel or a retention curve** — Vercel's visitor identity is a daily-rotating hash. No event instrumentation of any kind.
**Feedback:** none captured.
**Time budget:** 10–15 hrs/week, alongside an active job search. Bursty.
**Money budget:** low three figures. Assume $0 for paid acquisition.
**COGS:** ~$15/mo Anthropic spend from the pipeline (`sift-api/STATUS.md` OQ1), plus Neon/Railway/Vercel. Not yet assembled into a P&L.
**Team:** one person.

**North-star metric:** weekly returning users who ran a comparison **or** opened a dossier.
**Activation event:** `comparison_run` — not signup.
**Current value of the north star:** unknown, and **currently unmeasurable** — see below.

### Verified state of the launch prerequisites (checked in code 2026-07-27)

Every item on the `GROWTH_STRATEGY.md` §3 Week-1 list is **un-started**. Do not assume any of it exists:

| Prerequisite | Actual state |
|---|---|
| Product analytics | More than assumed, and it counts nobody. No `posthog`. `@vercel/analytics` + `@vercel/speed-insights` are live (`app/layout.tsx:99,103`) but **cannot produce a funnel or retention curve at any price**. A **first-party event pipeline already exists and is running**: `lib/searchAnalytics.ts` / `searchAnalyticsLog.ts` / `primerAnalyticsLog.ts` write to `search_queries` (migration 009) and `primer_expand_events` (migration 010). **One identity column works, one doesn't** (verified 2026-07-27): `x-sift-session-id` is read server-side in three places (`app/api/news/topic/route.ts:211`, `app/api/primer/expand/route.ts:77`) and **set by no client**, so `session_id` is null everywhere. But `SEARCH_IP_SECRET` **is set in Vercel** (Preview + Production, ~72 days), so `hashIp()` returns a real value and **`ip_hash` is populated in prod**. `COUNT(DISTINCT ip_hash)` is available today, retroactively, with no code change — coarse (NAT undercounts, mobile rotation overcounts) but a real denominator. **Query it before building any new instrumentation.** ⚠️ It is also set on Preview, and `isLoggingEnabled()` has no `NODE_ENV` guard — preview and local-dev traffic write rows indistinguishable from production. |
| Named human editor | **Actively contradicted in production.** `app/colophon/page.tsx:70` publishes a masthead reading *"Edited by Claude. Built by Kristen Martino."* The live site affirmatively states that no human holds editorial responsibility. |
| No signup wall on the core path | **Broken.** `app/api/compare/route.ts:32` returns 401 without a Clerk `userId`; `middleware.ts:11` lists `/api/compare` and `/api/topics` in `PROTECTED_PREFIXES`. The activation event is behind auth, and §5's "no signup wall" non-negotiable is currently violated. |
| `/about` with named editor + AI disclosure | No `app/about` route exists. `/methodology`, `/colophon`, `/privacy`, `/terms` do. EU AI Act Art. 50(4) applies **2026-08-02**. |
| Dossier SEO surface | No `app/sitemap.ts`, no `app/robots.ts`, no JSON-LD anywhere in `app/` / `components/` / `lib/`, no `max-image-preview`. Dossier routes do have `generateMetadata`. |
| Own domain | Not moved. `app/layout.tsx:47` `metadataBase` is `https://siftnews.kristenmartino.ai`; `next.config.js` CSP pins `clerk.siftnews.kristenmartino.ai`. |
| Human-review step (Q7) | Does not exist. |

**Consequence for any proposal:** there is no measurement, no public entry point that works without auth, and no compliance surface. A distribution plan that sends traffic today sends it into all three.

---

## 4. Who it might be for

Unresolved — this is decision Q1 and the highest-leverage open question. Candidates, in rough order of plausibility:

1. **Librarians / educators** teaching media literacy. Already curate lists that link AllSides and Ad Fontes. Reachable by name and email. Confer durable credibility and backlinks.
2. **Politically-exhausted generalists** who want to stay informed without a fight. Largest pool, hardest to reach at $0, lowest willingness to pay.
3. **Policy staffers / advocacy researchers.** Highest willingness to pay; the dossiers are closest to their job. Smallest pool.
4. **Journalists** doing background research. Credible, influential, notoriously unwilling to pay.

Do not let a proposal assume a wedge user without saying which one and why.

---

## 5. Constraints and non-negotiables

- **Neutrality rule (D37).** Sift surfaces AllSides + MBFC ratings verbatim and never computes its own. MBFC credibility, MBFC's bias scale, and the "Questionable" flag are all explicitly out — they re-introduce lean-as-value.
- **No dossier claim about a living person without a citation to the primary record**, and no characterization of a legal outcome beyond what that record literally says. (*Starbuck v. Google*, MTD denied 24 Jul 2026; *Bouck v. Meta* — §230 does not cover AI-generated content.)
- **Human review in the publishing path.** Required by Anthropic's Usage Policy for externally-published journalistic content, and it's the EU AI Act Art. 50(4) exemption. Must be real, not nominal.
- **AI use disclosed** on `/about` and `/methodology`, with named editorial responsibility.
- **No signup wall on the core experience.** One comparison and one dossier must work with zero auth — a hard requirement for Show HN, r/InternetIsBeautiful, and indexing.
- **AI cost ceiling stays on.** `AI_COST_GUARD_ENABLED` / `DAILY_AI_COST_LIMIT_USD`; gross margin below 65% is a diligence red flag. ⚠️ **VERIFIED OFF, 2026-07-27. This non-negotiable has never been enforced.** `sift-api/app/config.py:23` defaults `ai_cost_guard_enabled: bool = False`, `.env.example:25` ships `false`, and **neither `AI_COST_GUARD_ENABLED` nor `DAILY_AI_COST_LIMIT_USD` is among the 45 variables set on the `sift-api` Railway service** — so nothing overrides the default. Harmless at ~$15/mo and zero users; not harmless the moment any anonymous path to the 20–90s compare workflow opens. **Turn it on before that, not after.**
- **Time is the binding constraint, not ideas.** A proposal that costs more than 6 hours needs to displace something on the plan, explicitly.

---

## 6. Open decisions

> **Dispositions set 2026-07-27 by [`LAUNCH_DECISION_MEMO.md`](./LAUNCH_DECISION_MEMO.md) §6.** Three closed, one reopened-and-reclosed, the rest blocked on the week-one test. Read the memo before reopening any of these.

| # | Question | Decide by |
|---|---|---|
| Q1 | Who is the wedge user? | **Blocked on evidence.** Answered by replies to the week-one test, then ten conversations in two rounds. Pre-registered close conditions and kill criteria per wedge are set *before* call #1. "No wedge identified" is a permitted, honest outcome. |
| Q2 | Is the dossier or the comparison the product? | **Blocked on evidence; may close before Q1.** It is a within-person comparison, so ten people give ten paired observations. A third outcome is pre-registered: if the surface people spend longest on is the article with primer + entity chips, Q2 was malformed and gets re-posed, not answered. |
| Q3 | Where exactly is the free-to-paid line? | **Partly answered in week one** — the test email asks willingness-to-pay in writing. Target rewritten from 4 institutional subscribers at $375/mo to **one paid pilot at $2,000–5,000 once** (no procurement, no VPAT). Rails wait for ten written yeses. |
| Q4 | Licence AllSides/MBFC, or something else? | **Moved forward to week 1–2** (was Week 4). Letters drafted. Interim provenance paragraph on `/methodology`. Gates Show HN, press, and any institutional path. Not required for the week-one test — no ratings on that page. |
| Q5 | What happens to ingest when Cloudflare default-blocks crawlers on 15 Sept 2026? | **Days 31–45** (was Week 6 / days 61–90 — the block lands ~day 50; the plan was shipping the fix after the break). Does **not** block launch: `services/rss.py` fetches publisher feed XML only, never article pages, under an honest self-identifying UA. ⚠️ That UA's contact URL points at the old domain. |
| ~~Q6~~ | ~~Does the Android build survive contact with the 90-day plan?~~ | **Closed 2026-07-27 — no. Android v1 is paused for 90 days.** `GROWTH_STRATEGY.md` §9 supersedes `STATUS.md`'s committed Next-3. `sift-android` had reached Phase 2 (nav host, feed, article detail); that work is preserved, not deleted. Do not re-argue this. |
| ~~Q7~~ | ~~What is the human-review step, concretely?~~ | **Closed 2026-07-27 — Tier A only.** Deterministic automated gate (legal-process vocabulary + any named person not matchable to `politician_profiles.bioguide_id`), held before publish. **Zero recurring human hours.** Shadow-mode week first to size the queue. **Publish no review count on `/about`** until the process survives four unassisted weeks — a lapsed compliance metric on the exemption page is worse than the masthead bug it replaces. |
| Q8 | US-only or global civic content? | Week 12. Everything in the memo assumes US-only; that assumption is now explicit rather than tacit. |
| ~~Q9~~ | ~~What's the walk-away if day 180 shows <100 weekly actives and <$100 MRR?~~ | **Closed 2026-07-27, and pulled forward to day 90:** fewer than **5 named humans who returned unprompted** triggers it. Also triggered if the week-one test draws no replies, or if ten conversations produce "no wedge identified." Deciding it cold, in advance, was the point. |

When one closes: record it in `STATUS.md` "Recent decisions" (and `docs/DECISIONS.md` if substantial), then update this table.

---

## 7. Facts that should change your advice

Cite these rather than re-deriving them. All verified 2026-07-27.

**On selling:**
- Empire Flippers floor: **$1,500/mo net profit, 12-month history**; 91% of submissions rejected.
- Acquire.com median outcome: **3.9x net profit**. Flippa's formula is monthly net profit × 30–45.
- **No zero-revenue news aggregator has sold at a disclosed price, 2022–2026.** Artifact (Instagram founders, $0 revenue, 444K downloads) → Yahoo: tech only, no team, undisclosed, 2.5 months after announcing shutdown.
- Small content assets *with* revenue trade near **1x revenue in cash** (Really Good Emails: $250K revenue → $600K cash at close).

**On the law (reported, not legal advice):**
- *Advance/Condé Nast v. Cohere*, MTD denied 14 Nov 2025 — AI "substitutive summaries" may plausibly infringe.
- *AP v. Meltwater* (2013) — fair use rejected on all four factors for a news aggregator.
- Every favorable AI fair-use ruling to date is a **training** ruling and does not transfer to RAG.
- Anthropic's indemnity **excludes "Inputs provided by Customer"** — i.e. the whole RAG pipeline.
- **15 Sept 2026:** Cloudflare default-blocks mixed-use crawlers, including for all free-tier users.
- **2 Aug 2026:** EU AI Act Art. 50(4) applies to deployers publishing AI text on matters of public interest.

**On distribution:**
- PostHog free tier: 1M events/mo, funnels + retention cohorts included. Vercel Analytics, Plausible, and Umami **cannot produce a retention curve at any price**.
- Chartbeat global average engaged time per pageview: **26 seconds**. There is **no published news-vertical retention benchmark** — don't accept one.
- Median Show HN score: **2 points**. 50 points = top 6%. HN flags politics.
- X referral traffic to news: **down 70% since 2022**. Bluesky sends comparable referrals to major news sites despite ~33x less total traffic.
- Product Hunt at rank #11–30: **<700 visitors, <30 signups**.
- Ground News was the **#1 brand sponsor on all of YouTube in H1 2025** — that's the category's proven channel, and it costs money.

**On the market:**
- Reuters Institute DNR 2026: news site/app usage **down 12pp since 2020 to 51%**; 42% actively avoid news; trust at **37%**, lowest since 2015; only **17% pay** for online news.
- AllSides now takes **>90% of revenue from enterprise**, not consumers — a survival pivot by the company that invented the category.
- Tangle: **$4.15M 2025 revenue, 71,000 paid, 16–20% free-to-paid** (vs. 0.62% beehiiv median), 12 people, no outside capital. The most replicable model in the set.

---

## 8. How to work on this

- **Evidence over enthusiasm.** "I think users would like X" is not a reason. "Three of five people I talked to asked for X" is.
- **Name the tradeoff.** Every proposal displaces something. Say what.
- **Prefer the reversible.** At one person and 10 hrs/week, an experiment you can undo in an hour beats a plan you can't.
- **Distinguish what's verified from what's assumed.** Say "unverified" out loud. The research this file rests on flagged its own gaps; keep that habit.
- **Don't recommend building.** The default failure mode here is shipping more product instead of finding out whether anyone wants the product that exists.
