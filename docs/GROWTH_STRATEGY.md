# Sift — Growth & Exit Strategy

**Written:** 2026-07-27
**Status:** Proposed. Decisions in §8 are open until you make them.
**Scope:** How to take Sift from "launched with no users" to a product with real users, real feedback, and a defensible exit.

> Everything below is grounded in research conducted 2026-07-27. Legal material is reported case law and platform policy, **not legal advice** — the items in §4 are exactly the ones worth thirty minutes with an actual media/IP attorney.

---

## 1. The one thing to internalize first

**Your sellable asset is not the aggregator. It's the dossier dataset and the audience relationship.**

The AI-summarization layer — the part that looks most like Ground News — is simultaneously:

- The part with the **worst legal posture.** *Advance/Condé Nast v. Cohere* (S.D.N.Y., MTD denied 14 Nov 2025) held that non-verbatim "substitutive summaries" of news articles may plausibly infringe. *AP v. Meltwater* (S.D.N.Y. 2013) rejected fair use on all four factors for an aggregator that copied ledes and excerpts. Every fair-use ruling that went the *other* way (Alsup in *Bartz v. Anthropic*, Chhabria in *Kadrey*, UK *Getty*) is a **training** ruling and does not transfer to retrieval-and-summarize.
- The part with the **worst SEO posture.** Google's own helpful-content self-assessment asks, verbatim: *"Are you using extensive automation to produce content on many topics?"* and *"Are you mainly summarizing what others have to say without adding much value?"* Its spam policy names *"scraping feeds… to generate many pages"* as scaled content abuse. As of 15 May 2026 those policies formally extend to AI Overviews and AI Mode.
- The part with the **worst channel posture.** r/politics bans content aggregators outright. HN flags mission-forward political posts. Google won't rank summary pages.
- The part with **zero verified unit economics anywhere in the category.** Ground News has never disclosed subscribers, ARR, or valuation. Artifact — Instagram's founders, $0 revenue, 444K lifetime downloads — shut down with Systrom saying *"the market opportunity isn't big enough."* SmartNews raised $427.8M, hit $2B, then cut ~24% of headcount while "struggling to retain users." Otherweb was acqui-flipped into a placeholder page. The Messenger burned $50M and found no buyer at all.

The **dossiers** are the opposite on every axis. A structured, sourced, continuously-updated record of a politician's committee assignments, PAC contributions, and voting record — built from OpenSecrets, GovTrack, ProPublica, FEC, and FARA — is *original research and analysis*, which is the first thing on Google's quality checklist. It has long-tail search intent ("who funds Senator X," "what's in HR 1234"). It's evergreen rather than 48-hour-perishable. It's a licensable dataset. And it is the asset you actually own.

**Every strategic move for the next 90 days should shift weight from the summarizer to the dossiers.** That single reframe answers most of your other questions.

---

## 2. What "sellable" actually costs — the honest numbers

You asked what turns this into something you could eventually sell. Here is the floor, from the marketplaces themselves:

| Venue | Requirement | What it means |
|---|---|---|
| **Empire Flippers** | $1,500/mo net profit, 12-month average, 3+ months of analytics | 91% of submissions rejected; 25% of rejections are insufficient earnings/history |
| **Acquire.com** | No stated minimum on self-serve; advisory tier requires $100k+ TTM revenue | Median outcome **3.9x net profit**; sub-$100k-profit businesses average 3.7x |
| **Flippa** | None to list ($29 tier); manual vetting only at $50k+ asking | Valuation formula is *monthly net profit × 30–45*. Zero profit → zero |
| **Tiny** | $3M–$50M annual profit | Not applicable |

**There is no published transaction, anywhere, 2022–2026, where a zero-revenue news aggregator sold for a disclosed price.** Every observed outcome falls into three buckets:

1. **Undisclosed tech-only asset sale to a strategic.** Artifact → Yahoo (April 2024): technology only, **no team transferred**, price never disclosed, and it happened 2.5 months *after* the public shutdown announcement. Brigade/Causes → Countable (2019): IP and data only, engineering team sold separately to Pinterest.
2. **Acquihire** — priced on team scarcity, requires investors to make whole. A solo builder with no investors and no team has nothing to acquihire; the buyer's cheaper path is a job offer.
3. **No sale.**

Where small content assets *with* revenue did trade, prices clustered near **1x revenue in cash**: Morning Chalk Up ($900K revenue → high six figures), Really Good Emails ($250K revenue, 220K subscribers, 100M annual pageviews → **$600K cash at close**, the other $6M in earnout through 2026).

**So the target is concrete: $1,500/month in net profit, sustained for 12 months.** That makes Sift a listable, roughly $30K–$70K asset with actual price discovery. It is not a life-changing number. It *is* the difference between an asset and a portfolio piece, and it's the only version of "sellable" that the evidence supports. Everything above that number is a function of how big the audience gets.

**Corollary:** the 12-month clock only starts when the first dollar arrives. If you want a sale conversation in 2027, month one of revenue needs to be roughly now.

---

## 3. Where to begin — the first two weeks

Do these in order. They are sized for 10–15 hrs/week.

### Week 1 (~10 hrs)

1. **Buy `siftnews.io` and move the product off `kristenmartino.ai`.** ~2 hrs. See §7 — this is a prerequisite for every goal you named, not a branding preference.
2. **Install PostHog.** ~2 hrs. `@posthog/next` is the only first-party Next.js App Router SDK in the category; funnels and retention cohorts are free-tier features; 1M events/month covers you well past 10,000 MAU. Identify users with the Clerk `userId` on sign-in. Details and event schema in §5.
3. **Kill the signup wall on the core experience.** ~3 hrs. A visitor must be able to run one bias comparison and read one dossier with zero auth. This is a hard requirement for Show HN (*"ideally without barriers such as signups or emails"*), for r/InternetIsBeautiful, and for Google indexing.
4. **Publish `/about` with ownership, contact, a named human editor, and an explicit AI-process disclosure.** ~2 hrs. This one page does four jobs at once: it satisfies Google News' transparency policy, the "How" of E-E-A-T, the EU AI Act Art. 50(4) editorial-responsibility exemption (**applies 2 August 2026 — six days from now**), and Anthropic's own Usage Policy, which requires human review by qualified professionals plus AI disclosure for *"media or professional journalistic content… automatically generate content and publish it for external consumption."* An unreviewed fully-automated summary feed is out of policy on the vendor you depend on most.
5. **Add a `mailto:` in the footer and a 3-question Tally form.** ~30 min. That is your entire feedback stack until you have 50–100 accumulated items. Do not evaluate Canny (free tier is now capped at 25 tracked users) or anything else in that category yet.

### Week 2 (~12 hrs)

6. **Write the operating context file and the role prompts.** Already drafted — see `docs/OPERATING_CONTEXT.md` and `.claude/agents/`. ~1 hr to review and correct the facts I guessed at.
7. **Make the dossiers the SEO surface.** ~6 hrs. Clean URLs, `Article`/`Dataset` structured data, visible primary-source attribution, a `last-updated` date, 1200px+ 16:9 social images, and `max-image-preview:large` in robots meta (without that tag you are **not eligible** for large-image Discover treatment at all). Do **not** put AI summaries of other people's articles into a news sitemap.
8. **Talk to five people.** ~4 hrs. Not a survey — five 20-minute calls with people who plausibly want this: a librarian who maintains a media-bias LibGuide, a civics teacher, a politically-exhausted friend, a journalist, a policy staffer. Script in `.claude/agents/user-researcher.md`. Five conversations at this stage are worth more than a thousand pageviews.
9. **Ship the first weekly digest.** ~2 hrs. See §6.

Notice what is *not* on this list: new features, the Android app, iOS, Product Hunt, a redesign. You have more product than you have evidence. The next 90 days are about correcting that ratio.

---

## 4. The risks you're not currently pricing

These are the things a buyer's diligence will find, and several have near-term dates.

**a) Cloudflare default-blocks mixed-use crawlers on 15 September 2026** — for new customers, new sites of existing customers, and **all free-tier users**, alongside a shift from Pay Per Crawl to Pay Per Use. A meaningful share of 50–200 news sources sit behind Cloudflare. This is the most concrete near-term threat to your *ingest pipeline*, independent of any lawsuit, and it's seven weeks out. **Action: audit which of your sources are Cloudflare-fronted and what your fallback is.**

**b) EU AI Act Art. 50(4) applies 2 August 2026.** Deployers of AI systems generating text *"published with the purpose of informing the public on matters of public interest"* must disclose that it's artificially generated — exempt where content has undergone human review/editorial control and a named person holds editorial responsibility. The `/about` page in §3 is the fix. *(Whether the "Digital Omnibus" delays this date is unverified.)*

**c) The Anthropic indemnity does not cover your core risk.** Anthropic's Commercial Terms defend against IP claims on Outputs, but exclude *"(c) Inputs or other data provided by Customer."* Your RAG pipeline feeds scraped articles in as Inputs — that's the entire product. You also warrant that you *"have all rights and permissions required to submit Inputs."*

**d) The dossier layer carries independent defamation exposure — possibly the sharper risk.** *Starbuck v. Google* (Del. Super., MTD **denied 24 July 2026** — three days ago) held that AI disclaimers do not automatically defeat a defamation claim at the pleading stage. *Bouck v. Meta* (N.D. Cal., 27 Mar 2026) held §230 does **not** immunize AI-generated content. *Grybniak v. Google / v. X.AI* extend this from outright fabrication to **mischaracterization of real records** — alleging an AI said "committed securities fraud" where the record showed a no-admission SEC settlement on registration violations. That is precisely the failure mode of an auto-generated politician dossier drawing on FEC and court records. **Action: no dossier statement about a living person ships without a citation to the primary record, and the dossier generation prompt must forbid characterizing legal outcomes beyond what the record literally says.**

**e) Get your AllSides/MBFC licensing clean now.** CJR reported that Ground News uses AllSides ratings *"without consistent permission or compensation."* It's a documented, ready-made line of press attack, it's the first question HN will ask, and it's cheap to be on the right side of. Email both, get written permission or a licence, and put the terms on `/methodology`.

**f) Anthropic's Usage Policy** requires human review by qualified professionals for automatically-generated journalistic content published externally. Design a human-in-the-loop step you can point to.

**The honest summary:** none of this kills acquirability. It compresses the buyer pool, caps the multiple, and makes deal structure the whole negotiation. The genuinely favorable finding is that **no bias-comparison aggregator has ever been sued** — Ground News has run one since 2020 — and the ones that got sued (Perplexity, Cohere, Brave) are all much larger, and all *licensed nothing*.

---

## 5. Instrumentation — what to measure and what to ignore

**Stack: PostHog Cloud, free tier. Optionally add Vercel Web Analytics as an ad-blocker-immune sanity check (5 minutes, free on Hobby).**

Vercel Web Analytics, Plausible, and Umami **cannot produce a retention curve at any price** — the feature doesn't exist. For Vercel it's architectural: visitor identity is a daily-rotating hash. Don't self-host PostHog (their own docs call self-hosting *"officially unsupported"* with no data-loss guarantees).

### The events to define on day one

| Event | Why |
|---|---|
| `comparison_run` | **Your activation event.** Not signup. The moment someone sees how three outlets framed the same story is the moment the product delivers its promise. |
| `dossier_viewed` (+ `entity_type`) | Your differentiated, SEO-viable, licensable surface. |
| `primer_expanded` | Does anyone actually want "what you should know first"? Cheap to answer, expensive to assume. |
| `topic_searched` | Intent signal. What people search for is your roadmap. |
| `digest_subscribed` | The audience relationship — the thing that actually transfers in a sale. |
| `returned_within_7d` | Derived. Your only real early retention signal. |

### The honest benchmark situation

**No analytics vendor publishes news-vertical D1/D7/D30 retention or DAU/MAU.** Mixpanel's 2026 State of Digital Analytics has no media bucket. UXCam's 2026 compilation states outright: *"News applications are not mentioned as a distinct category."* The closest proxy is Streaming & Media (D1 ~35%, D7 ~15%, D30 ~7%) and it is not news. Don't let anyone hand you a news benchmark — it doesn't exist.

What *is* measured: **Chartbeat Q4 2025 global average engaged time per pageview is 26 seconds.** That number is your reality check — and note that if your summaries genuinely save people time, low engaged-time may be a *success*. **Engaged time is the wrong north star for you. Return frequency is the right one.**

### At your stage, the real metric is manual

Below a few hundred retained users, cohort curves are noise. **Keep a spreadsheet of named individuals who came back unprompted.** At 10–50 users you do the power-user curve by hand, and that is correct, not a shortcut. Instrument now so the cohorts exist when volume arrives; read them later.

---

## 6. Distribution — ranked, with the dead ends named

**Ranked by expected value at $0 and 10–15 hrs/week:**

1. **University library LibGuides + civic-literacy orgs.** The most underrated channel and the one where your positioning is an *advantage*. Media-bias LibGuides at WSU, UAB, South Dakota State, Stony Brook, Macalester and dozens more already link AllSides and Ad Fontes as the standard citations. Librarians curate these lists and accept well-credentialed submissions. They're long-lived, low-churn, and Google-indexed — so this doubles as durable backlink authority pointed at exactly the pages (dossiers) that need it. Also pitch News Literacy Project, Poynter's MediaWise, and Stanford's Civic Online Reasoning.
2. **Bluesky.** Despite X having ~33x more total traffic, Bluesky sends *comparable* referral traffic to major news sites (X drives only ~1.7x as much desktop traffic to nytimes.com; Bluesky beats Threads 5x). Cause: the algorithm doesn't demote links. No launch spike — 30–60 min/day for months. Growth comes from getting added to **starter packs** (asking a curator directly is normal practice there), posting into **custom feeds**, and a repeatable daily format: *"here's how five outlets covered X today."*
3. **Reddit: r/SideProject and r/InternetIsBeautiful.** One-shot spikes. r/InternetIsBeautiful can be tens of thousands of visits in 48h but removes anything promotional and requires no signup wall. **Never post the same URL to more than 1–2 subs per week** — repeated cross-posting from a low-karma account can trigger a silent site-wide *domain* shadowban, which is not a recoverable mistake. r/dataisbeautiful is viable only with original OC (a real chart from your bias data, source + tool disclosed).
4. **Direct cold email to civic newsletter editors** — Isaac Saul (Tangle), Walt Hickey (Numlock), Annafi Wahed (The Flip Side). All small, personality-driven operations where founder-to-founder email is far more tractable than any algorithm, and their audiences self-select for your value prop. Pitch: *"we built a tool that operationalizes what you do editorially."*
5. **Hacker News — one credible shot, framed as engineering.** Median Show HN score is **2 points**; 50 points is top 6%. A documented front-page result: ~6,000 pageviews, ~500 uniques, zero direct sales, but four inbound research inquiries. **HN flags politics** — recurring, documented, years-long. Title it *"Show HN: A bias-comparison engine over 150 outlets using AllSides/MBFC ratings + LLM summarization"*, not the civic mission. Have your ratings-licensing answer ready; they will ask.
6. **HARO/Qwoted + LION Publishers directory.** Low volume, durable backlinks, ~15 min per pitch. Opportunistic.

**Dead ends — don't spend hours here:**

- **Product Hunt.** Ranks #11–30 get <700 visitors and <30 signups; even #1 launches are modest (Dub.co's #1 → 663 signups). Overall traffic is roughly half its 2018–19 peak while the bar to win has risen. The audience is founders, not civic-news readers. Skip until you have a network to mobilize.
- **X/Twitter.** Chartbeat: global client traffic from X is **down 70% since 2022**. Structurally suppresses outbound links. Brand-presence only, minutes per week.
- **TikTok / Reels.** Political content there performs as personality-led commentary, not reference-tool demonstration. Breaking the algorithm needs 3–7 videos/week for months — that is your entire time budget. Dead end unless you become a creator instead of a builder.
- **r/politics.** Explicitly bans content aggregators and syndicated/reposted content. Expect removal, not traffic.
- **Wikipedia self-linking.** WP:EL/WP:COI; routinely reverted.
- **YouTube creator sponsorships.** The proven channel in this exact category — Ground News was the **#1 brand sponsor on all of YouTube in H1 2025** (1,863 integrations, 664M views, 428 distinct creators). It works, and it is closed to you at $0. File it under "what revenue buys."

**Google News/Discover is not the lever you think it is.** Discover eligibility is automatic once indexed; there's no application. But Pew (March 2025, 68,879 searches) found that when an AI summary appears, users click a traditional result in **8% of visits vs 15% without**, and click links *inside* the summary **1% of the time**. The prize is shrinking even if you win it — and you'd be arguing "our comparison adds value" against an automated classifier, not a human. **Put 100% of the SEO effort on dossiers.**

---

## 7. The two decisions you asked me to make

### Should you buy `siftnews.io`? **Yes. This week. It's $37.99.**

Not for branding. Because **`siftnews.kristenmartino.ai` is un-sellable by construction.** No buyer can acquire a subdomain of your personal portfolio. Website Closers' transferability checklist — the section that kills more small deals than any other — starts with domain ownership and transfer procedure. Right now the answer to "what domain am I buying?" is "you're not."

It also serves the other three goals you named. Google News' transparency policy wants clear publisher/ownership identity; a portfolio subdomain reads as a demo, not a publication. For career proof, "I run siftnews.io" lands differently in an interview than "here's a project on my portfolio site." And for the learning loop, a product on its own domain is one you treat differently.

Availability as of today: `siftnews.io` **$37.99/yr** (available), `getsift.news` **$17.99/yr** (available), `siftnews.ai` **$160/2yr** (available). `siftnews.com`, `sift.news`, and `siftnews.app` are all **taken**. Take `.io`, keep the `kristenmartino.ai` subdomain 301-redirecting for a year so you don't lose the case-study link.

*(Set expectations on the domain as a standalone asset: DNJournal's 2026 sales chart shows the reported .com market thinning below ~$50K around position #68, and civic-adjacent names top out in the low five figures — IdentityTheft.org $30K, CampusPride.org $47.5K. A coined compound brandable with no exact-match value is a low-four-figures asset at best. Buy it as infrastructure, not as an investment.)*

### Should you charge? **Yes — within 90 days. But gate the dossiers, not the summaries.**

Three reasons, in order of weight:

1. **Willingness to pay is the highest-information signal available to you, and it's the only one that starts the 12-month clock in §2.** Ten people paying $5/month tells you more than a thousand pageviews, and it converts Sift from "portfolio piece" to "asset with a P&L" — which is the actual thing that makes it sellable, listable, and interview-proof.
2. **Charging for the dossiers is legally and strategically clean. Charging for the summaries is neither.** Ground News paywalls factuality ratings it doesn't own and took a CJR hit for it. Your dossiers are original work built from public records — you own them, they're defensible, and monetizing them is the version of this that survives diligence.
3. **The two business models with *verified* unit economics in this category are B2B data/ratings licensing and bootstrapped reader membership.** AllSides — the company that *invented* the consumer bias-rating category — now takes **>90% of revenue from enterprise clients** and is raising on Wefunder. Read that as a survival pivot: consumer subscriptions didn't cover costs. Meanwhile Tangle proves the other path — $4.15M in 2025 revenue, 71,000 paid subscribers, 16–20% free-to-paid conversion (vs. a 0.62% beehiiv median), 12 employees, zero outside capital.

**Concrete shape:** free tier keeps browsing, comparison, and a sample of dossiers. **Sift Civic, $5/month or $40/year**, unlocks the full dossier index, saved entities, and the weekly digest archive. Price low deliberately — you're buying information, not revenue. Stripe takes an afternoon.

**And build the newsletter.** It's the proven format in this niche and — critically — **the subscriber list is the asset that actually transfers in a sale.** A weekly "biggest coverage gap of the week," generated from your own comparison data, is a real production commitment and the single highest-converting thing you could ship. It also gives you something to send the LibGuide librarians and the newsletter editors in §6.

---

## 8. The questions that need answering — the decision queue

These are the questions to run through the role prompts in `.claude/agents/`. Each has a decision owner (you), a deadline, and the evidence that bears on it.

| # | Question | Why it's live | Decide by |
|---|---|---|---|
| Q1 | **Who is the wedge user?** Civics teacher, librarian, policy staffer, politically-exhausted generalist, or journalist? | You cannot pick a channel, a price, or a roadmap without this. The five conversations in §3 exist to answer it. | Week 3 |
| Q2 | **Is the dossier or the comparison the product?** | §1 argues dossier. If you disagree, the SEO, pricing, and legal plans all change. | Week 4 |
| Q3 | **Free-to-paid line — where exactly?** | §7 proposes gating dossiers. Alternatives: gate the digest archive, gate saved entities, or go donation/nonprofit. | Week 8 |
| Q4 | **Do you pursue AllSides/MBFC licences, or build your own ratings?** | Building your own re-introduces lean-as-value, which D37 already rejected. Licensing costs money and takes email. Using them unlicensed is the CJR attack. | Week 4 |
| Q5 | **What happens to ingest on 15 Sept 2026?** | Cloudflare's default block. Concrete, dated, operational. | Week 6 |
| Q6 | **Does the Android build survive contact with this plan?** | 12 weeks of build time against zero validated demand is the single biggest resource question on the board. §3 says pause it. | Week 4 |
| Q7 | **What's the human-review step?** | Required by Anthropic's AUP and the EU AI Act exemption. Needs to be real, not nominal. | Week 2 |
| Q8 | **US-only or global civic content?** | Already open in `STATUS.md`. US-only makes the dossier moat deeper and the compliance surface smaller. | Week 12 |
| Q9 | **What is the walk-away?** If Sift has <100 weekly actives and <$100 MRR at day 180, what happens? | Deciding this *now*, cold, is the difference between a disciplined experiment and a sunk-cost spiral. Artifact's founders made this call and were right to. | **Now** |

---

## 9. The 90-day plan

**North-star metric: weekly returning users who ran a comparison or opened a dossier.** Not signups, not pageviews.

### Days 1–30 — Make it measurable and legible
- Domain moved; PostHog live with the §5 event schema; auth wall removed from the core path
- `/about` with ownership, named editor, AI disclosure; `/methodology` updated with ratings provenance
- Dossier SEO pass complete
- Five user conversations done and written up
- Weekly digest issue #1 shipped
- **Gate:** Do you know who the wedge user is? If not, do five more conversations before building anything.

### Days 31–60 — Get the first hundred real users
- LibGuide outreach: 25 librarians, personalized, one at a time
- Bluesky daily format running; 3+ starter packs
- Show HN, once, framed technically, on a Tuesday morning
- One r/SideProject post, one r/InternetIsBeautiful post, two weeks apart
- Cold emails to Tangle / Numlock / The Flip Side
- **Gate:** 100 people who used it, 20 who came back in week two. If not, the problem is the product or the wedge — not the channels.

### Days 61–90 — Charge, and find out
- Stripe + Sift Civic tier live at $5/mo
- Ask the twenty most engaged users directly, by name, to pay
- AllSides/MBFC licensing resolved in writing
- Cloudflare ingest contingency shipped
- First P&L: revenue, Claude/Voyage/Neon/Railway/Vercel COGS, gross margin *(buyers investigate below 65%)*
- **Gate:** ≥10 paying users. That is the proof-of-concept for everything in §2.

**What you deliberately do not do in 90 days:** Android, iOS, new AI features, a redesign, Product Hunt, expanding source count. You have more product than evidence. Fix the ratio.

---

## 10. Sources

Full research files: acquisition/exit landscape and analytics/distribution landscape, compiled 2026-07-27. Highest-load-bearing sources:

- [Acquire.com multiples report, Jan 2026](https://blog.acquire.com/acquire-com-biannual-acquisition-multiples-report-jan-2026/) · [Empire Flippers sell page](https://empireflippers.com/sell/) · [Empire Flippers rejection rate](https://empireflippers.com/rejection-rate-vetting-process/) · [Flippa pricing](https://flippa.com/pricing) · [FE International SaaS diligence checklist](https://www.feinternational.com/blog/saas-due-diligence-checklist-buyers) · [Website Closers diligence checklist](https://www.websiteclosers.com/resources/due-diligence-checklist-for-selling-a-business/)
- [Court rules AI news summaries may infringe (*Cohere*)](https://copyrightlately.com/court-rules-ai-news-summaries-may-infringe-copyright/) · [AP v. Meltwater summary (U.S. Copyright Office)](https://www.copyright.gov/fair-use/summaries/ap-meltwater-sdny2013.pdf) · [Dow Jones v. Perplexity](https://www.loeb.com/en/insights/publications/2025/08/dow-jones-and-company-inc-v-perplexity-ai-inc) · [Starbuck v. Google, MTD denied 24 Jul 2026](https://reason.com/volokh/2026/07/24/conservative-commentator-robby-starbucks-lawsuit-alleging-google-ai-had-defamed-him-can-go-forward/) · [Anthropic Commercial Terms](https://www.anthropic.com/legal/commercial-terms) · [Anthropic Usage Policy](https://www.anthropic.com/legal/aup) · [EU AI Act Art. 50](https://artificialintelligenceact.eu/article/50/) · [Cloudflare crawler policy, 1 Jul 2026](https://techcrunch.com/2026/07/01/cloudflares-new-policy-pushes-ai-companies-to-pay-for-publishers-content/)
- [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies) · [Google helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) · [Google Discover docs](https://developers.google.com/search/docs/appearance/google-discover) · [Google News content policies](https://support.google.com/news/publisher-center/answer/6204050) · [Pew: AI summaries and click-through](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/)
- [PostHog pricing](https://posthog.com/pricing) · [PostHog Next.js SDK](https://posthog.com/docs/libraries/next-js/posthog-next.md) · [Vercel Web Analytics limits](https://vercel.com/docs/analytics/limits-and-pricing) · [Chartbeat Q4 2025 engaged time](https://www.chartbeat.com/resources/articles/global-audience-insights-from-the-fourth-quarter-of-2025/) · [Reuters Institute DNR 2026](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary)
- [CJR: The business of balance (Ground News)](https://www.cjr.org/analysis/the-business-of-balance-ground-news.php) · [AllSides Wefunder](https://wefunder.com/allsides) · [Press Gazette on Tangle](https://pressgazette.co.uk/newsletters/politics-newsletter-makes-nearly-4m-in-subs-despite-giving-most-content-away/) · [Axios: Ground News #1 YouTube sponsor](https://www.axios.com/2025/10/22/youtube-sponsorship-creator-videos) · [Why Artifact failed](https://techcrunch.com/2024/01/18/why-artifact-from-instagrams-founders-failed-shut-down/) · [Yahoo acquires Artifact](https://www.yahooinc.com/press/yahoo-announces-the-acquisition-of-artifact-the-news-discovery-platform-created-by-instagram-cofounders-kevin-systrom-and-mike-krieger)
- [Show HN guidelines](https://news.ycombinator.com/showhn.html) · [Show HN by the Numbers](https://danfking.github.io/blog/2026/04/23/show-hn-by-the-numbers/) · [Similarweb: Bluesky news referrals](https://www.similarweb.com/blog/insights/social-media-news/referral-traffic-shows-why-the-press-loves-bluesky/) · [WSU media bias LibGuide](https://libguides.libraries.wsu.edu/c.php?g=616286&p=8196052) · [DNJournal 2026 YTD domain sales](https://www.dnjournal.com/ytd-sales-charts.htm)
