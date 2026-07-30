# Research Report: Analytics, Feedback, Benchmarks, Distribution & Competitive Landscape for a Civic-Literacy News Aggregator
*Compiled July 27, 2026. Every claim carries a URL. Unverified items are flagged explicitly rather than estimated.*

---

## TL;DR — the five things that actually change decisions

1. **Analytics: install PostHog, nothing else.** It's the only tool in the comparison set with free-tier funnels + retention cohorts, an official Next.js App Router SDK (`@posthog/next`), a Vercel Marketplace listing, and session replay bundled. Free to ~1M events/mo, which covers you well past 10,000 MAU. Vercel Web Analytics, Plausible, and Umami **cannot produce a retention curve at any price** — the feature does not exist in those products.
2. **Feedback tooling: buy nothing.** At zero users the entire category is procrastination. A `mailto:` link plus a Tally embed costs $0 and captures 100% of actionable signal. PostHog Surveys (1,500 responses/mo free) is the first upgrade, at zero incremental cost since you're installing PostHog anyway.
3. **Google News/Discover is probably NOT your biggest lever — and the research points the opposite way from the hypothesis.** Google's own helpful-content documentation names two of your product's core mechanics as search-engine-first warning signs, verbatim: *"Are you using extensive automation to produce content on many topics?"* and *"Are you mainly summarizing what others have to say without adding much value?"* ([developers.google.com](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)). The **dossiers**, not the summaries, are the SEO-viable asset. See §5 — this reframes the whole plan.
4. **Distribution: the market leader in your exact category bought its way in.** Ground News was the **#1 brand sponsor on all of YouTube in H1 2025** — 1,863 sponsored integrations, 664M views ([Axios, Oct 22 2025](https://www.axios.com/2025/10/22/youtube-sponsorship-creator-videos)). That channel is closed to you at $0. Your realistic free channels are Bluesky (slow-build, structurally link-friendly), one-shot Reddit posts in r/SideProject / r/InternetIsBeautiful, and — the most underrated finding here — **university library "media bias" LibGuides**, which already link AllSides and Ad Fontes and are curated by librarians who accept submissions.
5. **The macro environment is genuinely hostile and you should price that in.** Reuters Institute DNR 2026: news website/app usage down 12pp since 2020 to 51%; interest in news down 13pp since 2021; 42% actively avoid news; trust at 37%, the lowest since measurement began in 2015 ([reutersinstitute.politics.ox.ac.uk](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary)). Meanwhile Artifact — built by the Instagram founders, unlimited talent and capital — shut down in Jan 2024 with Systrom stating *"the market opportunity isn't big enough to warrant continued investment in this way"* ([Wikipedia](https://en.wikipedia.org/wiki/Artifact_(app))).

---

## 1. Product analytics stack for Next.js 15 on Vercel

### Comparison table

| Tool | Free tier | First paid tier | Session replay (free) | Funnels | Retention cohorts | Self-host | Cookies/GDPR | App Router effort |
|---|---|---|---|---|---|---|---|---|
| **PostHog** | 1M events/mo, 1-yr event retention, 5K replays/mo, 1M flag requests, 1,500 survey responses, unlimited seats | PAYG $0.00005/event (1–2M band), sliding to $0.0000090/event at 250M+ | Yes, 5K/mo, **30-day replay retention** | **Yes, free** | **Yes, free** | Yes (MIT core + `ee/` license); PostHog discourages it | Cookies by default for anon users → banner advised; cookieless mode available; EU Cloud disables IP capture | **Low** — official `@posthog/next` |
| **Vercel Web Analytics** | 50,000 events/mo **account-wide** (Hobby), 1-month window, **no custom events on Hobby at all** | Pro: $0.03/1K events, zero included; 12-mo window (24 with $10/mo add-on) | No | **No — doesn't exist** | **No — doesn't exist** | No | Cookieless (daily-rotating hash) | Trivial |
| **Plausible** | **None** — 30-day trial only | Starter $9 / Growth $14 / Business $19 per mo at the ≤10K pageviews band | No | **Business tier only** ($19/mo+) | **Not available at any tier** | Yes, AGPLv3 | Cookieless, no banner | Low (`next-plausible`, community) |
| **Amplitude** | 2M events/mo "forever," 10K replays/mo, "basic product analytics" | Plus: "starts at $0," usage-based; adds custom events, formulas, **20 behavioral cohorts**, 2-yr retention | Yes, 10K/mo | Ambiguous — cohorts listed as a *Plus* feature | Ambiguous, same reason | No | Device-ID/cookie based | Medium — generic JS SDK, hand-rolled `'use client'` wrapper |
| **Mixpanel** | 1M events/mo, 10K replays/mo, 5 saved reports/seat, unlimited seats; **"Insights, Funnels, Retention, & Flows" explicitly included** | Growth: $0.28/1K events past 1M; 20K free replays | Yes, 10K/mo | **Yes, free** | **Yes, free** | No | Cookies by default; positions as processor, consent is your problem | Medium |
| **June** | **DEAD** | — | — | — | — | — | — | — |
| **Umami** | Cloud "Hobby" free plan exists; **exact caps UNVERIFIED** (JS-rendered pricing page, unfetchable) | ~$9/mo per third-party listing, **unverified** | No | **No — doesn't exist** | **No — doesn't exist** | Yes, **MIT, unlimited free**, light stack (Node + Postgres) | Cookie-free by design | Trivial |

Primary sources: [posthog.com/pricing](https://posthog.com/pricing) · [posthog.com/docs/session-replay/data-retention](https://posthog.com/docs/session-replay/data-retention) · [vercel.com/docs/analytics/limits-and-pricing](https://vercel.com/docs/analytics/limits-and-pricing) (doc `last_updated: 2026-06-26`) · [plausible.io](https://plausible.io/) · [amplitude.com/pricing](https://amplitude.com/pricing) · [mixpanel.com/pricing](https://mixpanel.com/pricing) · [umami.is/pricing](https://umami.is/pricing)

### June is dead — remove it from consideration
June.so wound down **August 8, 2025** (announced July 8, 2025); the team joined Amplitude, customers got 30 days to export or migrate with prorated refunds. [june.so/blog/a-new-chapter](https://www.june.so/blog/a-new-chapter), [HN discussion](https://news.ycombinator.com/item?id=44502506).

### The structural disqualifier
Three of the seven — **Vercel Web Analytics, Plausible, Umami** — have no retention-cohort feature in the product at all. For Vercel this is architectural, not a missing UI: visitor identity is a *daily-rotating hash*, so it literally cannot track a user across days ([vercel.com/docs/analytics](https://vercel.com/docs/analytics)). Their $0–70/mo price tags are irrelevant to your stated requirement.

That leaves PostHog, Amplitude, Mixpanel — and **at 100 / 1,000 / 10,000 MAU all three are free.**

### Cost projection
Assumption (mine, not sourced): ~40 tracked events per MAU/month for a content app (~8–10 sessions × 4–5 events). Adjust once instrumented.

| MAU | Est. events/mo | PostHog | Amplitude | Mixpanel | Vercel WA | Plausible Business |
|---|---|---|---|---|---|---|
| 100 | ~4K | $0 | $0 | $0 | $0 (no funnels/retention) | $19/mo (no retention) |
| 1,000 | ~40K | $0 | $0 | $0 | $0 (no funnels/retention) | ~$19–29/mo (no retention) |
| 10,000 | ~400K | **$0** | $0 | $0 | ~$32/mo (no funnels/retention) | ~$49–69/mo *(est., unverified)* |

### Recommendation: **PostHog Cloud, free tier**
Reasons specific to your stack, not generic:
1. **Only one with a first-party Next.js App Router SDK.** `@posthog/next` — `PostHogProvider` + `PostHogPageView` in `app/layout.tsx`, optional `postHogMiddleware` in `middleware.ts` that seeds an identity cookie so client and server share a user ID. Amplitude and Mixpanel both require hand-rolling a `'use client'` wrapper around a generic browser SDK. [posthog.com/docs/libraries/next-js/posthog-next.md](https://posthog.com/docs/libraries/next-js/posthog-next.md)
2. **Official Vercel Marketplace listing** — [vercel.com/changelog/posthog-joins-the-vercel-marketplace](https://vercel.com/changelog/posthog-joins-the-vercel-marketplace), [posthog.com/docs/integrations/vercel-marketplace](https://posthog.com/docs/integrations/vercel-marketplace).
3. **Funnels and retention are confirmed core, un-gated features** ("trends, funnels, retention curves, paths, and SQL queries") — [posthog.com/product-analytics](https://posthog.com/product-analytics). Amplitude's own pricing page lists "20 behavioral cohorts" as something *Plus* adds on top of Free's "basic product analytics," which is a real risk if retention curves are the thing you're counting on.
4. **One tool covers analytics + replay + feature flags + surveys + error tracking** on the same 1M-event allowance. At 10–15 hrs/week you will not wire up four vendors.
5. **Clerk integration**: call `posthog.identify()` with the Clerk `userId` immediately post-sign-in. This gives accurate per-user retention cohorts from day one and reduces (does not eliminate) the cookie-consent surface for anonymous visitors.

**Proxy caveat worth knowing:** PostHog documents a Next.js `rewrites()` reverse proxy to `/ingest` to dodge ad blockers, but **warns it routes all analytics traffic through your Next.js server, increasing Vercel data-transfer costs**. They recommend their free managed reverse proxy or a Cloudflare Worker instead. [posthog.com/docs/advanced/proxy/nextjs](https://posthog.com/docs/advanced/proxy/nextjs)

**Don't self-host PostHog.** Their own docs: *"PostHog Cloud is far and away the best experience for the vast majority of our users."* Self-host requires ClickHouse + Kafka + Zookeeper + Redis + Postgres + MinIO on ~4vCPU/16GB, and deployments are **"officially unsupported"** with no data-loss guarantees. [posthog.com/docs/self-host](https://posthog.com/docs/self-host)

**Optionally add Vercel Web Analytics too** — it's free on Hobby, takes 5 minutes (`@vercel/analytics` + `<Analytics />`), is cookieless, and gives you an ad-blocker-immune first-party pageview baseline to sanity-check PostHog against. It costs nothing but shouldn't be your primary.

---

## 2. Feedback capture tooling

| Tool | Free tier | Free tier limits | Cheapest paid | Setup |
|---|---|---|---|---|
| **Tally** | Yes | "Unlimited forms, unlimited submissions" subject to unspecified fair-use; conditional logic, webhooks | Pro $24/mo | iframe/link — trivial |
| **PostHog Surveys** | Yes | **1,500 responses/mo**, then $0.10/response (1.5–2K), $0.035 (2–10K), → $0.01 at 20K+ | PAYG, no tier step | React SDK, already installed |
| **Formbricks** | Yes (cloud Hobby) | 1 workspace, **250 responses/mo**; **open source, self-host free** | Pro $74/mo (2,000 responses) | Next.js SDK |
| **Typeform** | Yes | **100 responses/mo**, 1 user | Basic $25–29/mo (1,000 responses) | Embed |
| **Canny** | Yes | **25 tracked users** — a hard cap; formerly far more generous | Pro $79/mo annual ($95 monthly) for 100+ tracked users | Widget |
| **Featurebase** | Yes | 1 seat, unlimited conversations, live chat, unified inbox; **no AI features** | Growth $29/seat/mo annual | Widget |
| **Userback** | Yes ("Free Forever") | 2 seats, 2 projects, unlimited feedback — but **7-day retention only** | Team $29/mo annual | Script tag |
| **Hotjar** | Yes, **now split into 3 products** post-Contentsquare | Experience Analytics 200K sessions/mo + 100 survey responses; Voice of Customer 100 responses + 5 interviews; Product Analytics 10K sessions/mo | Experience Analytics Growth $49/mo (7,000 sessions) | Script tag |
| **Sprig** | Yes | "Core survey capabilities" + **"limited responses" — no number published anywhere** | Starter — **no price published**; Enterprise custom | React SDK |
| **Frill** | **No** — 14-day trial | — | Startup $25/mo | Widget |
| **Upvoty** | **No** — 14-day trial | — | Power $15/mo | Widget |
| **Usersnap** | **No** — first 20 items free, deactivates after 90 days idle | — | Starter, price undisclosed | Script |
| **Marker.io** | **No** — 15-day trial | — | Starter $39/mo annual | Script |

Sources: [tally.so/pricing](https://www.tally.so/pricing) · [posthog.com/pricing](https://posthog.com/pricing) · [formbricks.com/pricing](https://formbricks.com/pricing) · [typeform.com/pricing](https://www.typeform.com/pricing/) · [canny.io/pricing](https://canny.io/pricing) · [featurebase.app/pricing](https://featurebase.app/pricing) · [userback.io/pricing](https://userback.io/pricing/) · [quackback.io/blog/hotjar-pricing](https://quackback.io/blog/hotjar-pricing) · [sprig.com/pricing](https://sprig.com/pricing) · [frill.co/pricing](https://frill.co/pricing) · [upvoty.com/pricing](https://upvoty.com/pricing/) · [usersnap.com/pricing](https://usersnap.com/pricing)

### Two specific tier changes worth knowing
- **Canny tightened its free tier hard.** It's now capped at **25 tracked users** — explicitly an eval tier, not something you can run a real userbase on. This is a meaningful contraction from the more generous free plan Canny was known for.
- **Hotjar's pricing is in active flux.** `hotjar.com/pricing` now **302-redirects to `contentsquare.com/pricing`**, and what was one bundled Hotjar bill is now three separately-billed products. Per Quackback's 2026 analysis: *"If you previously paid one Hotjar bill for heatmaps and surveys, you now pay two separate bills to get the same coverage."* Free-tier stability going forward is uncertain.
- **Sprig publishes no prices at all** — confirmed independently against both sprig.com/pricing and [g2.com/products/sprig/pricing](https://www.g2.com/products/sprig/pricing). Free tier response limit is not disclosed publicly; you'd have to sign up to find out.

### What you should actually do
Blunt, and it's what practitioners say. FeedSense's solo-founder piece is directly on point: *"You have 12 users and you're evaluating $79/month feedback platforms with Jira integrations and sentiment dashboards. Stop."* and *"A Google Form, a spreadsheet, and 2 hours per week is enough to start making better product decisions than most funded startups."* Their upgrade trigger is **50–100 accumulated feedback items**, not a calendar date. [feedsense.co/blog/customer-feedback-solo-founder](https://feedsense.co/blog/customer-feedback-solo-founder)

Corroborated from Indie Hackers by a builder who ran a prior product to **100,000 monthly users on a single Google Form** before buying anything; a commenter's framing: *"The real need isn't collecting feedback, it's understanding it at scale"* — a problem you don't have. [indiehackers.com](https://www.indiehackers.com/post/i-built-the-feedback-tool-i-wanted-as-a-user-and-needed-as-a-founder-05cdf3f52e)

**Concrete stack: `mailto:` in the footer + a Tally embed for a 3-question exit survey ($0, ~20 min).** Add PostHog Surveys later when you want in-app targeting — it's free to 1,500 responses/mo and requires no new vendor. Canny/Featurebase-style public roadmaps only pay off once you have enough users generating *duplicate* requests worth deduplicating. You don't.

---

## 3. Metrics that matter for a news/content product — and where the benchmarks don't exist

### The honest headline: there is no published news-vertical DAU/MAU or D1/D7/D30 benchmark
This is a real data gap, not a research failure. **No major analytics vendor breaks out "news" as a vertical.** Mixpanel's 2026 State of Digital Analytics publishes stickiness by vertical — B2B SaaS 31–33%, AI products 21–23%, Ecommerce 20–23% — and **has no media/content/news bucket** ([mixpanel.com/blog/mau](https://mixpanel.com/blog/mau/)). UXCam's 2026 compilation of AppsFlyer/Adjust/data.ai benchmarks states explicitly: **"News applications are not mentioned as a distinct category throughout the benchmarks."** ([uxcam.com](https://uxcam.com/blog/mobile-app-retention-benchmarks/))

**Closest available proxy** (Streaming & Media category — mostly video/subscription apps, *not* news; treat as directional only):

| | D1 (median / strong) | D7 | D30 |
|---|---|---|---|
| All apps | 25% / 30–40% | 8% / 10–15% | 4% / 5–8% |
| **Streaming & Media** | 35% / 45–55% | 15% / 20–28% | 7% / 10–15% |
| Social (upper bound) | 40% / 50–60% | 18% / 25–30% | 12% / 15–20% |

Cross-category confirmed figures from Business of Apps: iOS 25.4% D1 → 5.3% D30; Android 20.2% D1 → 3.8% D30. They note qualitatively that *"News & magazine apps have some of the highest app retention rates"* but publish no digits for the category (paywalled). [businessofapps.com/data/app-retention-rate](https://www.businessofapps.com/data/app-retention-rate/)

### What IS solidly measured

**Engaged time — the single most useful number here.** Chartbeat Q4 2025 Global Audience Insights (published Jan 14, 2026): **global average engaged time per pageview = 26 seconds** (range 23.2s Southern Europe → 33.6s Central/Eastern Europe). Returning-visitor "loyalty" share up to **42%** in North America / Southern Europe. Mobile is **61%+** of pageviews in every region. Dataset: 41M+ content pieces, 187 billion cumulative engaged minutes. [chartbeat.com](https://www.chartbeat.com/resources/articles/global-audience-insights-from-the-fourth-quarter-of-2025/)

That 26-second number is your reality check. If your AI summaries save people time, your engaged-time-per-page may *legitimately* be below industry average — which means **engaged time is the wrong north star for you**. Return frequency is the right one.

**Newsletter benchmarks (beehiiv, most current available):**
- *The State of Newsletters 2026* (pub. Jan 5–6, 2026, covering 2025): overall newsletter open rates **41%+**. CTR figures and a news/politics category split exist in the report but could not be extracted — **flagged unverified**. [beehiiv.com/blog/the-state-of-newsletters-2026](https://www.beehiiv.com/blog/the-state-of-newsletters-2026)
- *The State of Paid Newsletters 2026* (pub. June 22, 2026): **median free-to-paid conversion 0.62%**; monthly churn 5.06%–16.67% by industry; typical price ~$10/mo or $100/yr; subscriber LTV $83–$230 by vertical. [beehiiv.com/blog/the-state-of-paid-newsletters-2026](https://www.beehiiv.com/blog/the-state-of-paid-newsletters-2026)
- **Do not use Mailchimp's benchmarks.** Their page states data was *"last updated in December 2023"* and it has **no Media/Publishing category at all**. [mailchimp.com/resources/email-marketing-benchmarks](https://mailchimp.com/resources/email-marketing-benchmarks/)

Contrast that 0.62% median with **Tangle's ~16–20% free-to-paid conversion** (§6) — Tangle is a ~25x outlier, which tells you the ceiling is very high in this niche but the median is brutal.

**Macro context (Reuters Institute DNR 2026, pub. June 16, 2026)** — [reutersinstitute.politics.ox.ac.uk](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary):
- Social/video networks used for news by **54%** globally (56% incl. AI chatbots); **30%** call it their *main* source, up from 22% five years ago
- **12%** use social/video *only* for news — doubled since 2020
- News websites/apps: **51%, down 12pp since 2020**. TV news down 13pp to 52%
- **10%** use AI chatbots for news weekly (**16% of under-35s**); trust in chatbot answers only **20%**
- Interest in news down 13pp since 2021 (59% → 46%); **42% avoid news** sometimes/often; passive/casual users up to 25% from 16% in 2021
- **Only 17% pay for any online news** (flat YoY, 20-country avg)
- Trust in news: **37%, lowest since 2015**

**Pew (fielded Aug 18–24 2025, pub. Sept 25 2025)** — 53% of US adults at least sometimes get news from social media. By platform: Facebook 38%, YouTube 35%, Instagram 20%, **TikTok 20%** (the share of TikTok users who get news there went 22% in 2020 → **55% in 2025** — the fastest-moving stat in the dataset), X 12%, Reddit 9%. [pewresearch.org](https://www.pewresearch.org/journalism/fact-sheet/social-media-and-news-fact-sheet/)

### What to actually measure at your stage
Almost none of the above is usable below several hundred *retained* users. D1/D7/D30 curves need cohorts big enough that week-to-week noise doesn't dominate; DAU/MAU is unstable with a small denominator (one active day swings it double digits); the power-user curve (Andrew Chen's L28 histogram — [andrewchen.com/power-user-curve](https://andrewchen.com/power-user-curve/)) needs enough users per activity-day bucket to show shape rather than sparse dots. Chen's own caveat applies: *"there isn't a single silver bullet to measure perfect engagement."*

**Instrument now, read later.** Concretely, define these events in PostHog on day one so the cohorts exist when you have volume:
- `story_compared` (opened the cross-spectrum view) — this is your **activation event**, not signup
- `dossier_viewed` (+ entity type) — your differentiated, SEO-viable surface
- `returned_within_7d` — derived; your only real early retention signal
- Weekly manual tally of **how many named individuals came back unprompted**. At 10–50 users you are doing the power-user curve by hand, and that's correct.

---

## 4. Distribution channels — ranked, with the dead ends named

### Ranked by expected value for *this* product at $0 and 10–15 hrs/week

1. **University library LibGuides + civic-literacy orgs** — slow, compounding, durably indexed
2. **Bluesky** — best free channel for audience-building; structurally link-friendly
3. **Reddit: r/SideProject + r/InternetIsBeautiful** — one-shot spikes only
4. **Direct cold outreach to civic newsletter editors** (Tangle, Numlock, The Flip Side)
5. **Hacker News Show HN** — one credible shot, frame it technically
6. **HARO/Qwoted + LION Publishers directory** — low volume, durable backlinks
7. *(Later, with revenue)* **YouTube creator sponsorships** — the proven channel in this category
8. **Dead ends: Product Hunt, X/Twitter, TikTok, Instagram Reels, LinkedIn, r/politics, Wikipedia self-linking**

---

### The underrated one: library LibGuides and civic-literacy orgs
**Directly verified:** multiple university "media bias" LibGuides *already* link out to comparable third-party tools — **AllSides and Ad Fontes Media appear repeatedly as the standard citations** at Washington State University ([libguides.libraries.wsu.edu](https://libguides.libraries.wsu.edu/c.php?g=616286&p=8196052)), UAB ([guides.library.uab.edu/medialiteracy/bias](https://guides.library.uab.edu/medialiteracy/bias)), and similarly structured guides at South Dakota State, Stony Brook, Nova Southeastern, LMU, Macalester, COM Library, Clark College, Santa Fe CC, and Skagit Valley College.

Librarians actively curate and update these lists and accept well-credentialed submissions. Two outreach tracks:
- **(a)** Email librarians maintaining media-bias LibGuides asking to be listed alongside AllSides/Ad Fontes
- **(b)** Pitch News Literacy Project / Poynter's MediaWise / Stanford's Civic Online Reasoning as a cited resource in educator materials (the LSU-style guides lean pedagogical rather than tool-focused)

Why this is genuinely good for you and not generic advice: LibGuides are **long-lived, low-churn, and Google-indexed** — so this doubles as durable backlink/authority building, which matters enormously given §5. It's cold-email-and-wait, moderate time cost, near-zero dollar cost, and it's a channel where your civic-literacy framing is an *advantage* rather than a liability. This is the one channel that is better for your product than for a generic consumer app.

### Bluesky — the strongest free channel
- **~40.2M registered users** (Nov 2025, up 4x from 10M in Sept 2024), but only **~3.5M DAU (~9%)** — large dormant base. Monthly visits peaked at 157M (Nov 2024), down to **~118.67M by Sept 2025**. US = 50% of traffic. [backlinko.com/bluesky-statistics](https://backlinko.com/bluesky-statistics)
- **The key finding:** despite X having **~33x more total web traffic**, Bluesky sends **comparable referral traffic to major news sites** — X drives only ~1.7x as much desktop traffic to nytimes.com as Bluesky. Bluesky beats Threads by **5x** to nytimes.com, **2.6x** to theguardian.com, **6.8x** to bostonglobe.com. Cause: Bluesky's algorithm doesn't demote links. NYT put Bluesky above X in its share widget. [similarweb.com](https://www.similarweb.com/blog/insights/social-media-news/referral-traffic-shows-why-the-press-loves-bluesky/)
- **Cold-account reach is weak.** Growth comes from (a) getting added to relevant **starter packs** — asking a curator directly is a normal, accepted practice on Bluesky ([blueskystarterpack.com/us-news](https://blueskystarterpack.com/us-news), [independent-journalism](https://blueskystarterpack.com/independent-journalism), [theblue.social politics packs](https://theblue.social/starter-packs/category/politics)), (b) posting into **custom feeds** that have their own subscriber base independent of your follower count, and (c) a repeatable daily format ("here's how 5 outlets covered X today, bias breakdown") that mid-size accounts repost.
- **Verdict: no launch spike. 30–60 min/day for months.** Best free channel available to you.

### Reddit — one spike, then mostly closed
**Verification caveat: reddit.com was blocked at the proxy level for this entire research pass** (HTTP 403 on every path, including old.reddit.com JSON endpoints and r.jina.ai reader fallbacks). Rules below come from secondary aggregators that quote sidebar text plus documented community norms — **not live primary text.** Verify each sub's rules yourself before posting.

- **r/SideProject** — the most self-promo-friendly community on Reddit; one 49-subreddit study calls it the *only* one that "openly welcomes" self-promotion, vs. 39% that ban it outright and 22% that enforce a 9:1 give-before-you-get ratio. [oneup.today study](https://oneup.today/blogs/reddit-selfpromo-rules-study-2026), [soar.sh database](https://www.soar.sh/blog/self-promotion-rules-by-subreddit-database). Realistic: **low hundreds to low thousands of clicks**, founder-peer audience (useful for feedback, not adoption).
- **r/InternetIsBeautiful** — 20M+ members, high variance. A front-page hit is plausibly **tens of thousands of visits in 24–48h**, but the sub is famous for removing anything reading as promotional. **Hard requirement: no signup wall.** Novelty-browsing audience → low single-digit % retention.
- **r/politics is a dead end.** Long-standing, heavily enforced rules against **content aggregators, blogspam, and syndicated/reposted content**; submissions must link the original journalistic source. A 50–200-outlet AI-summary aggregator is close to the platonic ideal of what that rule exists to exclude. Expect removal, not traffic.
- **r/NeutralPolitics, r/moderatepolitics, r/PoliticalDiscussion, r/AskALiberal, r/AskConservatives** — discussion formats, not link-sharing. Only viable via months of authentic participation, then mentioning the tool when genuinely responsive to a question. Never a promo post.
- **r/dataisbeautiful** — requires **original OC** visualizations with source + tool disclosed in a top comment. A specific chart from your bias data ("How outlet coverage of Bill X splits by lean") could qualify; a "check out my app" post gets removed. [randalolson.com on r/dataisbeautiful removals](https://www.randalolson.com/2016/03/18/why-posts-get-removed-from-rdataisbeautiful/)
- **r/webdev** — self-promo banned outside the weekly "Showoff Saturday"; karma/account-age gates (~100 karma / 30 days). Wrong audience regardless. [redditgrowthdb.com](https://www.redditgrowthdb.com/database/subreddits/webdev)
- **r/SaaS** — ~1 promo post per 60 days, funneled to a weekly thread; multiple accounts pushing the same product are treated as one actor and banned.
- **Domain-level shadowbans:** repeated identical-link posting across many subs in a short window, especially from a low-karma account, triggers Reddit's site-wide spam filter, which can **silently remove your domain across all of Reddit** without notification. Practical rule: **never post the same URL to more than 1–2 subs per week**, build comment history first. [reddireach.com](https://www.reddireach.com/blog/shadowbanned-on-reddit-2026-fixes-and-safe-posting-system), [flyn.to](https://www.flyn.to/blog/reddit-link-posting-without-shadowban)

### Hacker News — one shot, frame it as engineering
**Show HN rules, fetched from [news.ycombinator.com/showhn.html](https://news.ycombinator.com/showhn.html):** *"Show HN is for something you've made that other people can play with."* Off-topic: *"Blog posts, sign-up pages, newsletters, lists, and other reading material. Those can't be tried out."* Critically: *"Please make it easy for users to try your thing out, ideally without barriers such as signups or emails."*

→ **Before posting, make a meaningful chunk of the product work with zero signup** — a live bias comparison and a sample dossier. Clerk gating the whole experience is disqualifying.

**Realistic outcomes (188K posts analyzed):** median Show HN score is **2 points**; **50 points puts you in the top 6%**; 258+ is top 1%. Submission volume has **tripled since 2019** (~200/day vs ~30). HN score correlates only r=0.29 with GitHub stars (comments r=0.10), and **92% of conversion effect happens within 48 hours**, decaying to baseline within a week. [danfking.github.io Show HN by the Numbers](https://danfking.github.io/blog/2026/04/23/show-hn-by-the-numbers/)

A documented front-page postmortem: **~6,000 pageviews, ~500+ uniques from HN, zero direct sales**, but 4 inbound research inquiries and 8 LinkedIn connections. [indiehackers.com postmortem](https://www.indiehackers.com/post/front-page-of-hn-the-full-postmortem-traffic-lessons-surprises-cbe9e0a7f6)

**Failure mode is specific and real: HN flags politics.** Recurring threads over years — [*"Someone is flagging political posts"*](https://news.ycombinator.com/item?id=47558099), [*"Tell HN: HN is becoming too political"*](https://news.ycombinator.com/item?id=44514047), [*"What is the political bias on Hacker News?"*](https://news.ycombinator.com/item?id=26598126). **Title it around the engineering**, e.g. *"Show HN: A bias-comparison engine over 150 outlets using AllSides/MBFC ratings + LLM summarization"* — not the civic mission. Mission-forward framing is exactly what gets flagged. Expect a hard-nosed methodology interrogation in comments; have your rating-source licensing answer ready (see §6, the CJR criticism of Ground News).

### Product Hunt — skip it
Traffic by rank (2025–2026): **#1–3 → 5,000–15,000 visitors / 100–400 signups; #4–10 → 1,000–3,000 / 30–100; #11–30 → 300–700 / 10–30; #31+ → <300 / <10.** ~60% of traffic lands day one. [hub.causo.ai](https://hub.causo.ai/guides/product-hunt-traffic-data-2026)

Even #1 launches are modest in absolute terms: Dub.co's #1 got 1,085 upvotes → **663 signups**. Overall PH traffic is reported at **roughly half its 2018–2019 peak** while the upvote bar to win has risen. [shno.co](https://www.shno.co/marketing-statistics/product-hunt-launch-statistics)

Three reasons it's wrong for you specifically: the audience is founders/SaaS buyers, not civic-news consumers; winning now requires a launch-day network you don't have; the asset+outreach+launch-day-management effort is disproportionate to 10–15 hrs/week. **Skip until you have a founder network to mobilize.**

### X/Twitter — dead for referrals
- Chartbeat: global client traffic from X has **fallen 70% since 2022**. [Nieman Lab, April 2026](https://www.niemanlab.org/2026/04/social-traffic-kinda-stinks-for-news-publishers-now-in-3-charts/)
- Social referrals to the top 100 global news sites fell **~30%**, from ~1.75B (late 2022) to ~1.22B (Sept 2025). [Axios, Oct 2025](https://www.axios.com/2025/10/18/social-media-traffic-referrals-news-sites)
- Declining X referrals documented for BuzzFeed, Reuters, CNN. [Search Engine Land](https://searchengineland.com/x-referral-traffic-drop-431154)

X structurally suppresses posts with outbound links. **Brand-presence maintenance only — minutes per week, not hours.**

### TikTok — available but a dead end at your capacity
**Status confirmed: TikTok was not banned.** A US joint-venture divestiture (Oracle, Silver Lake, MGX as lead US investors) **closed around January 2026**; the app remains fully available in US app stores under new majority-US ownership. [TechCrunch, Jan 23 2026](https://techcrunch.com/2026/01/23/heres-whats-you-should-know-about-the-us-tiktok-deal/), [The Hill](https://thehill.com/policy/technology/5656611-tiktok-deal-divest-us-assets/)

But the fit is bad. TikTok political content performs as **commentary/reaction**, not reference-tool demonstration — the platform rewards personality-led takes ([ScienceDirect: Political Content Engagement Model on TikTok](https://www.sciencedirect.com/science/article/abs/pii/S0747563225002559), [Reuters Institute 2026 on news creators](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/how-news-creators-are-impacting-politics-and-media-around-world)). Breaking the algorithm needs 3–7 videos/week for months — that's your entire 10–15 hours. **Dead end unless you become a creator instead of a builder.**

### Newsletter cross-promo — real, but requires you to build a newsletter first
- **Substack Recommendations** is Substack-to-Substack: when someone subscribes to a publication, Substack surfaces recommended ones at that moment. One creator: *"brought us thousands of subscribers... a free growth feature 90% of Substack creators ignore,"* ~5 min setup. [writebuildscale.substack.com](https://writebuildscale.substack.com/p/2-years-of-substack-knowledge-in) **It does not promote an external web app.**
- **beehiiv Boosts** is a real CPA marketplace — you set a cost per verified subscriber (e.g. $2.50), other publishers recommend you, beehiiv takes ~20%. [beehiiv support](https://www.beehiiv.com/support/article/14492963616279-growing-your-audience-with-beehiiv-boosts) Again: newsletter-to-newsletter infrastructure.
- **The unlock is a companion newsletter** (e.g. a weekly "this week's biggest coverage gap" digest built from your own data). That's a real production commitment, not a growth hack — but it's also the single highest-converting format in this category (see Tangle, §6).
- **Zero-cost play available today:** direct cold email to **Tangle** (Isaac Saul — [readtangle.com/about](https://www.readtangle.com/about/)), **Numlock News** (Walt Hickey — [newslettercrew interview](https://www.newslettercrew.com/blog/1-500-newsletters-with-numlock-news-walt-hickey/)), and **The Flip Side** (Annafi Wahed — [Fast Company profile](https://www.fastcompany.com/91162993/flip-side-newsletter-bipartisanship)). All three are small, personality-driven operations where a founder-to-founder email is far more tractable than any algorithmic channel, and their audiences self-select for exactly your value prop. Pitch: *"we built a tool that operationalizes what you do editorially."*

### Everything else, briefly
- **YouTube (paid)** — the proven channel in this category, and out of reach today. See §6 for the Ground News numbers. Organic self-run YouTube is a multi-month content commitment competing directly with build time.
- **LinkedIn** — organic reach reportedly down to ~⅓ of prior levels ([remery.ai](https://remery.ai/blog/linkedin-organic-reach-crisis-tactics-2026)); B2B audience. Skip except founder-journey posts a journalist might see.
- **Instagram Reels** — same format mismatch as TikTok, smaller civic-news creator ecosystem. Skip.
- **Discord/Slack civic communities** — exist ([Alliance of Civic Technologists](https://www.civictechnologists.org/2026/01/january-2026-newsletter)) but are insider-facing: people *building* civic tech, not consuming it. Good for collaborators and feedback, not users.
- **Wikipedia external links — do not self-add.** WP:EL/WP:COI explicitly discourage links to your own site; they're routinely reverted. [Wikipedia:External links](https://en.wikipedia.org/wiki/Wikipedia:External_links), [Wikipedia:Yes, it is promotion](https://en.wikipedia.org/wiki/Wikipedia:Yes,_it_is_promotion). If independent editors cite your dossiers organically, that's different and much better.
- **HARO/Qwoted/Connectively** — HARO rebranded to Connectively and is fragmenting/winding down; Qwoted positions as successor. [qwoted.com](https://www.qwoted.com/connectively-haro-is-going-away-heres-how-qwoted-can-help/) Pitch yourself as an expert source on media literacy/misinformation. 10–20 min per pitch; one good citation beats a viral Reddit post for durable credibility. Opportunistic, not primary.
- **LION Publishers** maintains a public [Tools and Services Directory](https://lionpublishers.com/tools-services-directory/) and [Journalism Support Organizations](https://lionpublishers.com/journalism-support-organizations/) list — low-effort submission targets, small but credible referral source.

---

## 5. Google News & Discover — researched thoroughly, and the answer is not what the hypothesis assumed

### 5a. How inclusion actually works in 2026

**There is no application, and Publisher Center is not required for inclusion.** Google's own News content overview states: *"Google may find your site through our normal web crawl"* without special submission, and that publishers can conversely block content from Google News without affecting Search indexing. Eligibility requires content be *"high-quality"* and comply with Google News policies; Google automatically identifies news content across the web. Verification is via the **Google News performance report in Search Console**. [support.google.com/news/publisher-center/answer/9607025](https://support.google.com/news/publisher-center/answer/9607025)

Surfaces covered: **Top stories** (news-oriented queries), **News tab** of Search, **news.google.com**, Audio Briefing, and **News Showcase** (a separate, invite/partnership product).

**Article structured data is explicitly NOT required for Top Stories.** Google: *"While there's no markup requirement to be eligible for Google News features like Top stories, you can add `Article` to more explicitly tell Google what your content is about."* And: *"There are no required properties; instead, add the properties that apply to your content."* Recommended: `headline`, `image` (16:9, 4:3, 1:1), `datePublished`, `dateModified`, `author`. [developers.google.com/search/docs/appearance/structured-data/article](https://developers.google.com/search/docs/appearance/structured-data/article)

**Article page best practices for Google News** (concrete and actionable) — [support.google.com/news/publisher-center/answer/9607104](https://support.google.com/news/publisher-center/answer/9607104):
- Minimize redirects; use permanent 301s; *"make every page on your site reachable from at least one static text link"*
- **One clear date and time** between headline and article text, ISO 8601 in markup
- Headline in a prominent `<h1>`; *"Article titles should be at least 10 characters and between 2 and 22 words"*; must match the HTML `<title>`
- **Google prohibits artificially refreshing older stories without substantial updates**
- Relevant images ≥60x90px near the title — not logos or captions
- Explicit disclaimer: *"There's no guarantee that your site's articles will be displayed in Google News"*

**News sitemap constraints** — [developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap):
- **Only include URLs for articles created in the last two days.** Past two days, remove the URL or strip the `<news:news>` metadata
- Max **1,000 `<news:news>` tags per sitemap**
- `<news:name>` *"must exactly match the name as it appears on your articles on news.google.com"*
- Maintain one sitemap continuously rather than generating new ones

### 5b. Google News content policies
Prohibited categories: Dangerous content, Deceptive practices, Harassing content, Hateful content, Manipulated media, Medical content, Sexually explicit content, Violent extremist content, Violent & gory content, Vulgar language & profanity. [support.google.com/news/publisher-center/answer/6204050](https://support.google.com/news/publisher-center/answer/6204050)

Feature-specific, and directly relevant to you:
- **Ads & sponsored content:** *"Advertising and other paid promotional material on your pages"* must not exceed editorial content; sponsorships need *"clear disclosure to readers."*
- **Misleading content:** *"Preview content that misleads users to engage with it by promising details which aren't reflected"* is prohibited. **Your AI summaries are preview content under this policy.** A summary that overstates what the underlying article says is a policy violation, not just a quality problem.
- **Transparency — the requirement most likely to trip an AI aggregator:** news sources must provide **"clear dates and bylines,"** author/publication/publisher information, company or network ownership details, and contact information.

**The byline requirement is a real design constraint.** Who is the byline on an AI-generated summary? Google's helpful-content "How" guidance is the answer: *"Sharing details about the processes involved can help readers and visitors better understand any unique and useful role automation may have served."* ([developers.google.com](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)) — i.e., disclose the AI process explicitly, name a human editor/publisher, and publish an ownership + contact page. Do this before you pursue any Google News ambition.

### 5c. Google Discover eligibility
Content qualifies automatically if it is **indexed by Google** and meets Discover's content policies. **No special tags or structured data required.** Eligibility ≠ appearance. [developers.google.com/search/docs/appearance/google-discover](https://developers.google.com/search/docs/appearance/google-discover)

Quality guidance:
- No clickbait — no *"misleading or exaggerated details in preview content"* to boost engagement
- Titles must accurately represent content
- No sensationalism targeting *"morbid curiosity, titillation, or outrage"*
- Content should be timely, well-told, or **uniquely insightful**
- Filter out job applications, petitions, forms, code repos, unexplained satire

**Image requirements — the hardest technical gate, and fully specified:**
- **Minimum 1200px wide**
- **300,000+ total pixels** (1280x720 qualifies)
- **16:9 preferred**, landscape-optimized cropping
- **Must enable `max-image-preview:large`** in the robots meta tag, or use AMP — *without this, you are not eligible for the large-image Discover treatment at all*
- Avoid generic images (logos) and text-heavy graphics
- Specify via schema.org markup or `og:image`

Discover content policies mirror the Google News prohibited-content list plus the ads/misleading/transparency feature policies. [support.google.com/websearch/answer/9982767](https://support.google.com/websearch/answer/9982767)

### 5d. Google's actual policy on AI-generated and aggregated content — the critical section

Google does not ban AI content. It bans **scaled content abuse**, and the policy language was rewritten in 2024 to name generative AI explicitly. From [developers.google.com/search/docs/essentials/spam-policies](https://developers.google.com/search/docs/essentials/spam-policies):

> **Scaled content abuse:** *"Using generative AI tools or other similar tools to generate many pages without adding value for users"* — also **"scraping feeds"** and **creating multiple sites to obscure the scaled nature of the content.**

> **Scraped content:** *"Republishing content from other sites without adding any original content or value"*, and modifying content only slightly via synonymizing or automated techniques before republishing.

> **Site reputation abuse:** third-party content published on established sites to exploit their ranking signals.

And from the helpful-content documentation's **"Avoid creating search engine-first content"** self-assessment, quoted verbatim — two of these describe your summarization pipeline exactly:

> - *"Are you producing lots of content on many different topics in hopes that some of it might perform well in search results?"*
> - **_"Are you using extensive automation to produce content on many topics?"_**
> - **_"Are you mainly summarizing what others have to say without adding much value?"_**
> - *"Does your content leave readers feeling like they need to search again to get better information from other sources?"*
> - *"Are you changing the date of pages to make them seem fresh when the content has not substantially changed?"*

[developers.google.com/search/docs/fundamentals/creating-helpful-content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

Google's stated framework is **E-E-A-T with the explicit note that "trust is most important,"** applied via **Who / How / Why**:
- **Who** — clear bylines and author bios
- **How** — disclose your process, *especially automation*
- **Why** — content must serve people first, not primarily attract search traffic

### 5e. The blunt conclusion on Google

**Google News/Discover is not your single biggest traffic lever, and pursuing it as though it were would be a strategic error.** Three converging reasons:

**(1) Your summarization layer sits inside the definition of scaled content abuse.** An AI-summarized digest of 50–200 outlets' articles, generated at scale, is textually indistinguishable from *"using generative AI tools... to generate many pages without adding value"* combined with *"scraping feeds."* You could argue the cross-spectrum comparison **is** the added value — and that argument is probably correct on the merits — but you'd be arguing it against an automated classifier operating at scale, not a human reviewer. Design accordingly: never publish a page that is only a summary.

**(2) The dossiers are your actual SEO asset, and they're strong.** A structured, sourced, continuously-updated dossier on a politician or bill — built from OpenSecrets, GovTrack, ProPublica, FEC, and FARA — is **original information, research, and analysis**, which is the first question on Google's quality self-assessment list. It is not summarization. It has natural long-tail intent ("who funds Senator X," "what's in HR 1234"), evergreen value, and defensible E-E-A-T if you cite the primary sources visibly. **This is where the SEO effort belongs — 100% of it.** Give dossiers clean URLs, `Article`/`Dataset` markup, visible source attribution and last-updated dates, and 1200px+ 16:9 social images with `max-image-preview:large`.

**(3) Even if you win, the prize is shrinking.** Pew (68,879 searches from 900 US adults, March 2025, collected April 7–17 2025): when an AI summary appears, users click a traditional result in **8% of visits** vs **15%** without — nearly half. Clicks on links *inside* the AI summary: **1% of visits.** Sessions ended entirely in **26%** of AI-summary visits vs **16%** without. AI summaries appeared on ~**18%** of all searches. [pewresearch.org](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/)

**Practical near-term checklist (cheap, do all of it):**
- Publish an **About / Ownership / Contact / Editorial-and-AI-methodology page** — satisfies the Google News transparency policy, the "How" of E-E-A-T, and preemptively answers the HN methodology attack
- **Byline every page** with a human editor plus explicit AI-process disclosure
- Add `max-image-preview:large`; generate 1200px+ 16:9 images per dossier
- Ship a **news sitemap only if you publish genuinely original articles** — 2-day window, 1,000-URL cap. Do not put AI summaries of other people's articles in it
- Get the **dossiers** indexed, structured, and linked (LibGuides from §4 are literally backlinks to exactly this)
- **Do not** chase Top Stories with summary pages

---

## 6. Comparable products

### Ground News — the direct comparable (and the least transparent)

**Pricing, fetched live July 2026** ([ground.news/subscribe](https://ground.news/subscribe), cross-checked [thepricer.org](https://www.thepricer.org/how-much-does-ground-news-cost/)):

| Tier | Annual (web) | Monthly (iOS/Android) |
|---|---|---|
| Free | $0 | $0 |
| Pro | $9.99/yr (~$0.83/mo) | $0.99/mo |
| Premium | $29.99/yr (~$2.49/mo) | $3.99/mo |
| **Vantage** | **$99.99/yr (~$8.33/mo)** | $9.99/mo |

Group plans: 40% off for 2–9 seats, 50% off for 10+. **The effective price nearly everyone pays is ~$60/yr** — the ubiquitous YouTuber discount codes are 40% off Vantage ([mimoni.com](https://mimoni.com/stores/ground-news-promo-codes), July 2026).

**Subscriber count: NEVER PUBLISHED.** This is the single biggest reporting gap in the competitive set. CJR asked and Ground News declined ([cjr.org, "The business of balance"](https://www.cjr.org/analysis/the-business-of-balance-ground-news.php)). Not in Wikipedia, BetaKit, The Logic, or company materials. **Do not let anyone tell you a number for this — it doesn't exist publicly.**

**What is measurable:**
- Similarweb (June 2026): **~6.4M visits trailing 3 months (~2.1M/mo)**, #154 in News & Media Publishers, #10,977 globally, **68.5% direct traffic**, 72% US. [similarweb.com/website/ground.news](https://www.similarweb.com/website/ground.news/) *(That 68.5% direct share is itself notable — consistent with a heavily brand-marketed, app-driven product rather than an SEO-driven one.)*
- CJR cites ~8M Similarweb visits in a peak month and notes the app hit **#1 on Apple's free news app chart in spring 2025**.

**Funding — contradictory and worth understanding.** Ground News's own About page claims funding from subscribers and *"a small group of individual investors,"* explicitly **not** media companies, big tech, government, or institutional VC ([ground.news/about](https://ground.news/about)). PitchBook lists **8 rounds since 2015** with total documented raise of only **$1.01M** (investors: NaHCO3, 37 Angels, Blue Lagoon Capital, Something Good Ventures) — [pitchbook.com](https://pitchbook.com/profiles/company/340782-22). **That $1.01M is almost certainly an undercount** (several rounds show no disclosed amount) and is flatly inconsistent with ~78 employees plus nine-figure-reach YouTube marketing.

Founded by **Harleen Kaur** (CEO, ex-aerospace engineer) and brother **Sukh Singh** (CTO); Kitchener, Ontario; out of University of Waterloo's Velocity ecosystem. App launched Jan 15, 2020. Headcount: **78 per PitchBook (2026)**; ZoomInfo's "11–50" is stale. **Revenue: not disclosed anywhere.**

**The growth engine — this is the most important number in this entire report:**
- **Axios, Oct 22 2025**, citing Gospel Stats: Ground News was **the single most common brand sponsor on YouTube in H1 2025** — **1,863 sponsored video integrations, +202% YoY**, and **ranked #1 by total views at 664 million** — ahead of Squarespace, BetterHelp, Shopify, Incogni, DraftKings. [axios.com](https://www.axios.com/2025/10/22/youtube-sponsorship-creator-videos)
- SponsorRadar (2026 live tracker): **428 distinct creators, 2,255+ tracked deals, avg 5.3 deals per creator** — heavy repeat-buys on proven channels. Deliberately spans the ideological spectrum. Top partners: "American English With Brent" (76), Leeja Miller (68). [sponsorradar.com/brands/ground-news](https://sponsorradar.com/brands/ground-news)
- **Dollar spend and CAC: never disclosed, anywhere.** Any figure you see is inference.

**The criticism to learn from, before it lands on you:** CJR reports Ground News uses AllSides/MBFC/Ad Fontes ratings *"without consistent permission or compensation,"* and paywalls factuality ratings while leaving bias data free. A University of Texas study found **only 1 of 4 tested stories measurably reduced polarization.** [cjr.org](https://www.cjr.org/analysis/the-business-of-balance-ground-news.php) → **Get your AllSides/MBFC licensing and attribution unambiguously clean from day one.** It's both the right thing and it inoculates you against a documented, ready-made line of press attack. It's also, per §4, exactly the question HN will ask.

### AllSides — the "what changed" story: a pivot to B2B
Founded 2012 by John Gable (ex-Netscape, ex-Republican aide) and Scott McDonald; now AllSides Technologies Inc. Rates 1,400+ outlets on a 5-point scale; runs AllSides for Schools and Mismatch. [en.wikipedia.org/wiki/AllSides](https://en.wikipedia.org/wiki/AllSides)

**The 2026 news:** per its own live Wefunder campaign, **>90% of revenue now comes from enterprise clients**, not consumer subscriptions. Product lines: Bias Services (corporate media-bias auditing), Roundtables (dialogue/qualitative research), Balanced News Studio (curated content for corporate comms), plus AI bias-checker tools. Named clients include a Fortune 100 company (4-year relationship) and Newsweek; a **$500K Carnegie Corporation of New York grant** supports AllSides for Schools. **$441,180 raised from 736 investors** via Reg CF SAFE, early-bird round closed **April 23, 2026**. 2025 revenue was flat; **Jan–Feb 2026 alone earned >60% of all 2025 revenue.** [wefunder.com/allsides](https://wefunder.com/allsides)

**Read this as a survival pivot:** the company that invented the consumer bias-rating category concluded consumer subscriptions don't cover costs and became a B2B media-intelligence vendor.

### Tangle — the cleanest proof that reader revenue works
Isaac Saul's daily "what the left/right/center is saying" newsletter. Started at 13 readers; now **12 full-time employees** after 7 years.

**2025 actuals (self-reported, publicly transparent):**
- **500,000+ total readers** across 60+ countries
- **71,000–75,000 paying subscribers** (Press Gazette: 71,000; A Media Operator later: 75,000)
- Free-subscriber growth **+38% YoY**; paid growth **+23% YoY**
- **Free-to-paid conversion ~16–20%** — vs. the beehiiv median of 0.62% (§3). A ~25x outlier.
- **2025 revenue $4.15M** (Press Gazette) / **$4.5M ARR** (Indie Hackers) — different snapshots of the same curve
- Split: ~85% subscriptions (~$3.5M), ~15% advertising (~$500K)
- **2026 projection ~$6M**; ad revenue target $90K/month by Dec 2026, up from $50K/mo (Nov 2025) and $20K/mo (Jan 2025)
- **>90% of subscriptions are annual**

Pricing: newsletter-or-podcast **$59/yr**; bundle **$99/yr**; "All In Supporter" **$199/yr**. Zero outside investment. Moved **off Substack to Ghost specifically to avoid the 10% platform cut**.

[pressgazette.co.uk](https://pressgazette.co.uk/newsletters/politics-newsletter-makes-nearly-4m-in-subs-despite-giving-most-content-away/) · [amediaoperator.com](https://www.amediaoperator.com/news/political-newsletter-tangle-goes-live-with-profit/) · [indiehackers.com](https://www.indiehackers.com/post/creators/from-simple-newsletter-to-4-5m-yr-media-company-RgQf0f1CJEO8KzTFjExN)

**This is the single most instructive comparable for a solo builder** — no VC, 7 years, one editorial voice, ~$4M revenue, profitable. And note the mechanism: **the newsletter is the product**, the audience relationship is the moat.

### Straight Arrow News — billionaire-subsidized, unprofitable
Joe Ricketts (TD Ameritrade founder; previously shut down DNAinfo/Gothamist in 2017). Founded 2021, Omaha. Uses a **Ground News partnership** for its "Media Miss" bias tool. ~70 employees (July 2025); Jan 2025 traffic **1.8M visits/month (+40% MoM)**, 45% direct / 42% organic; June 2025 app traffic **+1,170% YoY**. Model: 60% ad-revenue target, **subscriptions planned for late Q3/Q4 2026 — not yet launched**. **Currently unprofitable; leadership targets breakeven by 2027.** Total Ricketts funding: **not disclosed**. GrowJo estimates ~$9.9M annual revenue (third-party estimate, not company-confirmed). No 2025–26 layoffs or shutdown found. [amediaoperator.com](https://www.amediaoperator.com/) · [en.wikipedia.org/wiki/Straight_Arrow_News](https://en.wikipedia.org/wiki/Straight_Arrow_News)

### The Factual — acquired, now a zombie
**Acquired by Yahoo, announced September 6, 2022.** [yahooinc.com press release](https://www.yahooinc.com/press/yahoo-announces-acquisition-of-the-factual-expanding-its-commitment-to-trusted-news-and-information) · [businesswire.com](https://www.businesswire.com/news/home/20220906005835/en/Yahoo-Announces-Acquisition-of-The-Factual-Expanding-its-Commitment-to-Trusted-News-and-Information)

**Current status (fetched July 2026): thefactual.com is still live and still displays stale subscription copy ("$5/mth or $25/yr after a two-week trial"), but shows no sign of active development and has no post-2022 coverage.** Accurate characterization: **dead as an independent product, technically live as a legacy URL.** No explicit shutdown was ever announced — the tech and team were absorbed into Yahoo News.

### Particle — funded, live, opaque
Founded by **Sara Beykpour** (ex-Twitter senior director of PM) and **Marcel Molina** (ex-Twitter/Tesla). Publisher-friendly positioning: prominently links and credits sources (Reuters, AFP, Fortune get highlighted "gold" positioning) rather than scraping.

- **Funding: $4.4M seed + $10.9M Series A led by Lightspeed = ~$15.3M disclosed.** [techcrunch.com, June 2024](https://techcrunch.com/2024/06/11/ai-news-reader-particle-adds-publishing-partners-and-10-9m-in-new-funding) · [techcrunch.com, Nov 2024 launch](https://techcrunch.com/2024/11/12/particle-launches-an-ai-news-app-to-help-publishers-instead-of-just-stealing-their-work)
- iOS Nov 2024; web May 2025; subsequent Atlantic partnership for long reads
- **Pricing: free, no paid tier found. MAU/downloads/revenue: not disclosed, no independent estimate located — UNAVAILABLE.** Alive, no negative signal into 2026, but scale is unknown.

### Improve the News → **Verity.News**, and Newsminimalist
**Improve the News has rebranded to Verity.News.** Run by the **Improve the News Foundation (501c3)**, founded October 2020 by MIT's **Max Tegmark** (president) and Tufts' Meia Chita-Tegmark. Free, ad-free, philanthropically funded — primarily by the **Future of Life Institute** (Tegmark's other org). Aggregates 5,000+ sources with AI-assisted, human-reviewed balancing. Self-reported (March 2025): **20M+ Reddit views since 2024, 15,000+ stories since 2020, 1M+ newsletter sends/month.** Won a 2025 Shorty Award (Audience Honor). [verity.news/about](https://verity.news/about)

*That "20M+ Reddit views" figure is worth a second look given §4 — it suggests a nonprofit, non-promotional framing can survive on Reddit where a commercial aggregator cannot.*

**Newsminimalist** — solo-operated importance-scored daily digest, actively publishing as of mid-2026. **Subscriber/revenue figures UNAVAILABLE.** Alive, small.

### The rest, briefly
- **Otherweb — effectively dead.** The live site (fetched July 2026) now reads: *"otherweb.com has been acquired by SAI Technologies. Stay tuned for new and improved services coming soon!"* — a placeholder, not a product. Founded by Alex Fink as a Public Benefit Corp; funding amounts never disclosed. [crunchbase.com/organization/otherweb](https://www.crunchbase.com/organization/otherweb)
- **Artifact — the most important cautionary tale.** Systrom & Krieger, launched Feb 2023 (~160,000 waitlist), **shut down January 2024**, team of 7. Systrom's stated reason: *"the market opportunity isn't big enough to warrant continued investment in this way."* **Acquired by Yahoo April 3, 2024.** [en.wikipedia.org/wiki/Artifact_(app)](https://en.wikipedia.org/wiki/Artifact_(app)) · [yahooinc.com](https://www.yahooinc.com/press) — elite founders, ample capital, excellent design, and they still concluded the addressable market and monetization ceiling were too small.
- **SmartNews — scale without durable engagement.** **$427.8M raised across 6 rounds** (Series F: $230M, 2021), **$2B valuation**, ~$104.5M ARR estimate, ~20M users. But headcount fell **685 (Dec 2022) → 519 (Dec 2024), ~24%**, after a **40% US/China layoff in Jan 2023**; TechCrunch (Jan 2024) reported it *"struggling to retain users."* [getlatka.com/companies/smartnews](https://getlatka.com/companies/smartnews) · [techcrunch.com/2023/01/12](https://techcrunch.com/2023/01/12/)
- **NewsBreak — the AI-content cautionary tale.** $115M Series C (2021, Francisco Partners). **June 2024: Reuters found ≥40 AI-generated stories with inaccuracies (2021–2024)**, including wrong food-bank hours that caused people to be turned away; NBC News found fully fabricated local-crime stories that spawned real GoFundMe scams. Company cited *"a content moderation system"* rather than human verification. Congressional scrutiny followed. [en.wikipedia.org/wiki/NewsBreak](https://en.wikipedia.org/wiki/NewsBreak) — **this is the specific failure mode an AI summarizer of local/political news must engineer against.**
- **1440 — 4.6M Daily Digest subscribers**; new verticals (Business/Finance, Science & Tech, Society & Culture) with **500,000+ combined**; Topics vertical drew **12M uniques / 15.6M visits** since a February launch; YouTube +135% YoY to 130,000+. **Valuation $101M.** Revenue not disclosed. [prnewswire.com](https://www.prnewswire.com/) · [pulse2.com](https://pulse2.com/)
- **The Flip Side** — freemium 5-minute digest, alive, ran a Wefunder community round; 2026 scale UNAVAILABLE. **Numlock News** — confirmed actively publishing July 2026 (issues dated July 7, 10, 14, 22, 23); subscriber/revenue UNAVAILABLE.
- **Semafor — the strongest funding/scale story.** **January 2026: raised $30M at $330M post-money**, its first priced round, no lead investor, no board seats. **2025 was its first profitable year, ~$40M revenue split evenly between events and advertising — not subscriptions.** Total raised ~$79M. Backers: Henry Kravis, David Rubenstein, Jorge Paulo Lemann, PSP Partners. [axios.com/2026/01/07/semafor-raises-30-million](https://www.axios.com/2026/01/07/semafor-raises-30-million)
- **NewsGuard — the most successful B2B model in this space.** Rates **35,000+ sources covering ~95% of online news consumption** across 9 countries. Licenses ratings to platforms, **AI companies**, ad companies, cybersecurity firms, researchers. Consumer extension $4.95/mo. Takes **no payment from the outlets it rates** (avoiding exactly the conflict CJR raised about Ground News's unpaid use of others' data) and states no active US government contracts since 2021. June 22, 2026: launched an **AI chatbot built on vetted journalism with publisher revenue-sharing** (CNN coverage). [newsguardtech.com/newsguard-faq](https://www.newsguardtech.com/newsguard-faq) · [cnn.com/2026/06/22](https://www.cnn.com/2026/06/22/media/newsguard-ai-chatbot-news-atlantic-publisher)
- **Perplexity as structural threat** — runs a formal **Publishers' Program** with revenue-sharing for cited publishers, plus **Comet Plus** reported at an **80/20 split favoring publishers**, tied to a $200M raise. [llmpulse.ai](https://llmpulse.ai/blog/perplexity-publishers-program) · [leadgen-economy.com](https://leadgen-economy.com/blog/perplexity-comet-200m-comet-plus-publisher-revenue-share) It disintermediates "compare the coverage" into a single synthesized answer with chatbot-native distribution. **Quantified impact on Ground News/Particle: not measured anywhere — directional risk, not a number.**

### Synthesis: which business models actually work

**Working, ranked by evidence quality:**
1. **B2B data/ratings licensing** (NewsGuard; AllSides now pivoting into it). Scales with AI-industry demand for vetted sources rather than fighting for consumer attention. AllSides' >90%-enterprise revenue mix is the loudest signal in this entire set.
2. **Bootstrapped reader membership with a real free→paid funnel** (Tangle: $4.15M → ~$6M projected, 12 people, no VC, profitable). The most replicable model for a solo builder.
3. **Patron-subsidized runway** (Straight Arrow News; early Semafor). Different risk profile — no fund clock — but the unit economics aren't proven, just deferred.
4. **Marketing-subsidized consumer freemium** (Ground News). Most visible, **least financially transparent** company in the category. Documented capital ~$1M against very likely multi-million-dollar annual influencer spend. **Whether Vantage conversion at $60–100/yr recoups that spend is the single biggest open question in this space** — and unanswerable from public data.
5. **Events + advertising, not subscriptions** (Semafor: ~$40M, first profitable year, 50/50 events/ads).

**What killed the dead ones:**
- **Artifact:** market-size ceiling, stated plainly by the founder. Elite team, good product, still not enough.
- **Otherweb:** slow death via acqui-flip to an unrelated buyer; the site is now a placeholder.
- **The Factual:** acquired for tech/team, brand left to wither — the most common fate for small credibility-scoring startups.
- **SmartNews (not dead, but instructive):** $427.8M raised, $2B valuation, still cut ~24% of headcount and was reported "struggling to retain users." **A feed of other people's content is commoditizable and vulnerable to platform-level attention shifts.**
- **NewsBreak (not dead, but damaged):** unverified AI-generated content caused real-world harm and triggered congressional scrutiny.

**What this means for you concretely:** the two models with *verifiable* unit economics are B2B ratings licensing and disciplined bootstrapped membership. Your **dossiers** are structurally closer to the first (a proprietary structured dataset over OpenSecrets/GovTrack/ProPublica/FEC/FARA, which is a licensable asset and an SEO asset) and a **companion newsletter** is the proven path into the second. The AI-summary aggregation layer — the part that looks most like Ground News — is the part with the worst SEO posture (§5), the worst Reddit posture (§4), the clearest legal/ethical exposure around ratings licensing (CJR on Ground News), and no publicly verified unit economics anywhere in the category.

---

## 7. What could not be verified — flagged, not guessed

**Research constraints hit this session:** WebSearch budget was fully exhausted (200/200) partway through; reddit.com is blocked at the proxy level (HTTP 403 on every path including old.reddit.com JSON and r.jina.ai fallbacks); several vendor pricing pages are client-rendered and return only meta tags.

1. **Umami Cloud exact pricing** — free/Hobby tier caps and paid tier dollar figures. Page is JS-rendered; docs, GitHub, blog, G2, Capterra all failed. Only confirmed: self-host is free/unlimited (MIT), Cloud is usage-based. *(Low impact — Umami has no funnels/retention, so it's disqualified regardless.)*
2. **Mixpanel "20M → 1M free tier cut"** — **UNVERIFIED.** No primary announcement, changelog, HN thread, or Reddit post found. Current 1M cap is confirmed from mixpanel.com/pricing. Do not treat the historical claim as fact.
3. **Amplitude free-tier retention-cohort depth** — their pricing page lists "20 behavioral cohorts" as a *Plus* feature atop Free's "basic product analytics." Genuinely ambiguous; would need a trial account to resolve. This ambiguity is part of why PostHog is the recommendation.
4. **Plausible pricing above the 10K-pageview band** — no primary table obtainable (JS slider; `/pricing` 404s). Third-party estimate of $39–69/mo at ~1M pageviews is unverified. *(Moot — no retention feature at any tier.)*
5. **Sprig's free-tier response limit and Starter price** — not published anywhere; confirmed absent from both sprig.com and G2.
6. **News-vertical D1/D7/D30 retention** — does not exist in any published vendor benchmark. AppsFlyer's tool is interactive-only; Adjust's vertical detail is gated behind a download; Business of Apps' news-category digits are paywalled. The "Streaming & Media" proxy is the best available and is **not** news.
7. **News-specific DAU/MAU stickiness** — no vendor publishes it.
8. **beehiiv newsletter CTR figures and news/politics category split** — the report exists and was fetched, but those specific numbers weren't extractable. Open rate 41%+ is confirmed.
9. **Parse.ly benchmark figures** — dashboard-gated, account required. Scroll-depth / article-completion benchmarks: no public current source found at all.
10. **Reddit rules — none verified against primary text.** All §4 Reddit rules come from secondary aggregators (some of which are SEO-content sites of middling reliability) plus documented community norms. **Read each subreddit's actual sidebar and wiki yourself before posting** — a domain-level shadowban is not a recoverable mistake.
11. **Ground News subscriber count, MAU, revenue, and YouTube ad spend** — none ever published. Similarweb traffic and Axios sponsorship counts are the only hard numbers that exist.
12. **Straight Arrow News total Ricketts funding** — not disclosed. GrowJo's ~$9.9M revenue figure is a third-party estimate.
13. **Particle MAU/downloads/revenue; Newsminimalist, The Flip Side, Numlock subscriber counts; NewsBreak 2026 scale** — all unavailable.
14. **Google's Feb 2023 AI-content guidance blog post** — page fetched but returned only metadata; the substantive quotes in §5 come instead from the current, canonical spam-policies and helpful-content documentation, which is the stronger source anyway since it's the live policy rather than a three-year-old blog post.

---

## Sources

Primary sources are linked inline throughout. The highest-load-bearing ones:

- [PostHog pricing](https://posthog.com/pricing) · [PostHog Next.js SDK docs](https://posthog.com/docs/libraries/next-js/posthog-next.md) · [PostHog self-host docs](https://posthog.com/docs/self-host) · [PostHog replay retention](https://posthog.com/docs/session-replay/data-retention)
- [Vercel Web Analytics limits & pricing](https://vercel.com/docs/analytics/limits-and-pricing) · [Mixpanel pricing](https://mixpanel.com/pricing) · [Amplitude pricing](https://amplitude.com/pricing) · [Plausible](https://plausible.io/) · [June shutdown announcement](https://www.june.so/blog/a-new-chapter)
- [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies) · [Google helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) · [Google Discover docs](https://developers.google.com/search/docs/appearance/google-discover) · [Google News content policies](https://support.google.com/news/publisher-center/answer/6204050) · [News across Google](https://support.google.com/news/publisher-center/answer/9607025) · [Article page best practices](https://support.google.com/news/publisher-center/answer/9607104) · [News sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap) · [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Pew: AI summaries and click-through](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/) · [Reuters Institute DNR 2026](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary) · [Pew social media & news fact sheet](https://www.pewresearch.org/journalism/fact-sheet/social-media-and-news-fact-sheet/) · [Chartbeat Q4 2025](https://www.chartbeat.com/resources/articles/global-audience-insights-from-the-fourth-quarter-of-2025/)
- [Axios: YouTube sponsorships / Ground News #1](https://www.axios.com/2025/10/22/youtube-sponsorship-creator-videos) · [CJR: The business of balance](https://www.cjr.org/analysis/the-business-of-balance-ground-news.php) · [Ground News pricing](https://ground.news/subscribe) · [AllSides Wefunder](https://wefunder.com/allsides) · [Press Gazette on Tangle](https://pressgazette.co.uk/newsletters/politics-newsletter-makes-nearly-4m-in-subs-despite-giving-most-content-away/) · [Wikipedia: Artifact](https://en.wikipedia.org/wiki/Artifact_(app))
- [Show HN guidelines](https://news.ycombinator.com/showhn.html) · [Show HN by the Numbers](https://danfking.github.io/blog/2026/04/23/show-hn-by-the-numbers/) · [Similarweb: Bluesky news referrals](https://www.similarweb.com/blog/insights/social-media-news/referral-traffic-shows-why-the-press-loves-bluesky/) · [Nieman Lab: social traffic 2026](https://www.niemanlab.org/2026/04/social-traffic-kinda-stinks-for-news-publishers-now-in-3-charts/) · [WSU media bias LibGuide](https://libguides.libraries.wsu.edu/c.php?g=616286&p=8196052)
- [FeedSense: feedback for solo founders](https://feedsense.co/blog/customer-feedback-solo-founder) · [beehiiv State of Newsletters 2026](https://www.beehiiv.com/blog/the-state-of-newsletters-2026) · [beehiiv State of Paid Newsletters 2026](https://www.beehiiv.com/blog/the-state-of-paid-newsletters-2026)agentId: a8b3877f88e1e8b5e (use SendMessage with to: 'a8b3877f88e1e8b5e', summary: '<5-10 word recap>' to continue this agent)
<usage>subagent_tokens: 132642
tool_uses: 27
duration_ms: 3373498</usage>