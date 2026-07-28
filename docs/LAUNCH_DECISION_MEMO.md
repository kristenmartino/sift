# Sift — Launch Decision Memo

**Written:** 2026-07-27
**Owner:** Kristen Martino
**Process:** the six role agents in `.claude/agents/`, run as an independent panel per that folder's README, over `docs/GROWTH_STRATEGY.md` and `docs/OPERATING_CONTEXT.md`.
**Status:** Complete. Red-team verdict in §7: **proceed with changes** — all seven required changes accepted, §4 rewritten accordingly.

**If you read one thing:** §2.5 (six weeks, zero commits — the input no other role checked) and §4.2 (a ~10-hour week-one test that replaces a ~115-hour quarter).

> **Standing rule for this document (per `OPERATING_CONTEXT.md` §8):** every factual claim is either traced to a file and line, cited to `GROWTH_STRATEGY.md` §10, or labeled **assumed**. Nothing here is inferred from the strategy docs alone.

---

## 1. Why this memo exists

`GROWTH_STRATEGY.md` was written on 2026-07-27 and proposes a 90-day plan to take Sift from "launched, not adopted" to an asset with revenue. It had not been pressure-tested, and it had not been checked against what the code actually does. This memo does both, then records what was decided.

**Settled before the panel ran:** Android v1 is **paused**. `GROWTH_STRATEGY.md` §9 supersedes `STATUS.md`'s committed Next-3. See §6, Q6.

---

## 2. What was verified in the code (2026-07-27)

Checked first-hand before anything was routed to the panel. These are facts, not positions.

### 2.1 Every Week-1 prerequisite in `GROWTH_STRATEGY.md` §3 is un-started

| Prerequisite | Verified state |
|---|---|
| PostHog / product analytics | No `posthog` dependency. `@vercel/analytics` and `@vercel/speed-insights` **are** installed (`package.json:19–20`) — but neither can produce a funnel or retention curve. No events defined. |
| No signup wall on the core path | **Violated.** `app/api/compare/route.ts:32` returns 401 without a Clerk `userId`; `middleware.ts:11` protects `/api/compare` and `/api/topics`. The declared activation event is behind auth. |
| `/about` | Does not exist. `/methodology`, `/colophon`, `/privacy`, `/terms` do. |
| Dossier SEO surface | No `app/sitemap.ts`, no `app/robots.ts`, no JSON-LD anywhere, no `max-image-preview`. Dossier routes do have `generateMetadata`. |
| Own domain | Not moved. `app/layout.tsx:47` `metadataBase` = `siftnews.kristenmartino.ai`; `next.config.js` CSP pins `clerk.siftnews.kristenmartino.ai`. |
| Human-review step (Q7) | Does not exist. |

### 2.2 Five findings the strategy documents do not contain

These came out of the panel and were then verified by hand. Each one changes a decision.

**a) The live masthead names a model as the editor.** `app/colophon/page.tsx:70` publishes: *"Edited by Claude. Built by Kristen Martino."* Sift currently makes an affirmative public statement that no human holds editorial responsibility — six days before EU AI Act Art. 50(4) applies (2026-08-02), and against Anthropic's Usage Policy, which requires human review for externally-published journalistic content. This is a 15-minute fix and it is the cheapest, highest-value item found anywhere in this review.

**b) The AI generation prompts contain no constraint about named living people.** `services/summarizer.py:83` instructs, in full: *"Summarize each of the following news articles in 1-2 concise sentences. Focus on the key facts and why the story matters."* A grep across `summarizer.py`, `story_synthesizer.py`, and `context_generator.py` for any constraint on defamation, living persons, legal outcomes, or allegation-vs-finding returns **nothing**. This runs over ~135 feeds every 30 minutes.

> **This reverses `GROWTH_STRATEGY.md` §4(d).** The doc ranks the *dossier* layer as the sharper defamation risk. The dossier tables are hand-seeded, sparse, and mostly render database fields rather than LLM prose. The **summarizer** is the uncontrolled surface generating unreviewed sentences about real people at volume. The risk ranking in §4 should be inverted.

**c) There is no way to collect an email address.** No capture form, no `mailto:` anywhere in `app/` or `components/`, no email provider in `package.json`. `GROWTH_STRATEGY.md` §7 names the subscriber list as *"the asset that actually transfers in a sale"*; §3 item 5 calls for a footer `mailto:`; §9 schedules "weekly digest issue #1" in days 1–30. None of the underlying capability exists. Both the growth and acquisition perspectives flagged this independently as the single most consequential omission in the plan.

**d) The AI cost ceiling that `OPERATING_CONTEXT.md` §5 lists as non-negotiable is off by default.** `sift-api/app/config.py:23` — `ai_cost_guard_enabled: bool = False`; `.env.example:25` ships `false`. Whether Railway's env overrides it is **unverified**. This matters specifically because the proposed fix for the auth wall is to expose a 20–90-second AI workflow (`app/api/compare/route.ts:19–21`, `maxDuration = 60` against a documented ~90s backend) to anonymous traffic.

**e) Two dossier surfaces carry uncited claims about living people.** `components/.../PoliticianDossier.tsx:237` renders the methodology hint as a `<span>`, not a link, behind a stale comment deferring it to "Phase 2.D (PR #79)" — a phase `STATUS.md` records as shipped. PAC contribution figures for named members of Congress render with no adjacent citation. `components/.../OrgDossier.tsx:95–104` renders a **Sift-assigned** `political_lean` at 26px with a code comment promising a citation and no citation element present — which is Sift computing its own political rating, contrary to D37. `OutletDossier.tsx:120` does this correctly (`"Source: AllSides · last verified <date>"`) and is the pattern the others should copy.

### 2.3 Corrections applied to `OPERATING_CONTEXT.md` before the panel ran

- Outlet count: "~50–200" → **~135 sources ingested / 72 rated outlets** (prod after the #91 cleanup, 77→72; the seed CSV is not prod's source of truth, per D40).
- Analytics: "PostHog *(being added)*" → nothing is being added; Vercel packages present but funnel-incapable.
- Added §3 "Verified state of the launch prerequisites" and the COGS line (~$15/mo Anthropic pipeline spend, per `sift-api/STATUS.md` OQ1).
- Flagged the §5 cost-guard non-negotiable as unenforced.

---

### 2.4 Two more findings, verified after the panel raised them

**f) A first-party event pipeline already exists, and it can count nobody.** `lib/searchAnalytics.ts`, `searchAnalyticsLog.ts`, and `primerAnalyticsLog.ts` write to `search_queries` (migration 009) and `primer_expand_events` (migration 010), with HMAC'd IPs, a kill switch, and retention scripts. Two of §5's six proposed events therefore already have production write paths. **But both identity columns are NULL:** `x-sift-session-id` is read server-side in three places and set by **no client** (`app/api/news/topic/route.ts:211`, `app/api/primer/expand/route.ts:77` — the route comment claims *"Header is set client-side (localStorage UUID)"*; that code was never written), and `SEARCH_IP_SECRET` is read at `lib/searchAnalytics.ts:88` but appears in neither `.env.example` nor `.env.local`, so `hashIp()` returns null.

> Corrects §2.1: it is not true that "nothing is instrumented." The accurate statement is **events accumulate with no way to count distinct humans** — which is worse than nothing in one specific way, because it produces `count(*)` numbers that look countable and have no denominator of people. Fixing identity is ~1 hour and nothing else in the analytics plan is worth doing first.

**g) The dossier dataset is thinner than the strategic thesis assumes.** `OPERATING_CONTEXT.md` §2 rests on the dossiers being "original research over public records." Verified: `politician_profiles.csv` has 536 rows and `interest_group_ratings` is `{}` on **all 536**. PAC industry figures are a **2022-cycle** bulk import — `lib/copy.ts:258–264` records why: *"the OpenSecrets API was discontinued April 2025."* `org_profiles.csv` has 25 rows against migration 007's planned ~200; `bill_profiles.csv` has **1**. There is no scheduled refresh job; the only scheduler in `sift-api/app/main.py` runs the article pipeline.

> Three roles reached the same conclusion independently from different angles: the buyer ("I can reproduce that in a weekend — it is not a moat"), the researcher ("a plausible reading is: the five sites I already have bookmarked, plus stale money"), and the analyst (`entity_type` split is required before Q2 can be answered at all). **This is the single most consequential thing in this memo that could be wrong, and §4.3 makes falsifying it free.**

### 2.5 The finding that reorders everything — verified last, raised by `red-team`

**Both repos have had zero commits in six weeks.**

```
sift/      last commit  2026-06-17
sift-api/  last commit  2026-06-17
sift commits by month:  Feb 2 · Mar 44 · Apr 39 · May 51 · Jun 13 · Jul 0
```

`STATUS.md` reads **"Updated: 2026-06-02"** and **"Velocity: High (10+ PRs / week)."** It has been wrong for eight weeks. `CLAUDE.md`'s own pre-session ritual says to flag staleness beyond three days.

**Why this outranks every other finding:** every hour estimate in this memo and in `GROWTH_STRATEGY.md` is denominated in a budget — 10–15 hrs/week — whose observed value over the last six weeks is **zero**. `OPERATING_CONTEXT.md` §3 states that budget as a given. It is not a given; it is a claim, and it is the one input no other role checked. A plan calibrated to 10–15 and delivered at 0–4 does not degrade gracefully — it stops in week five with a half-built review gate, an `/about` page describing a process that isn't running, and forty people who got an email and never heard back.

### 2.6 Dossier dataset — the exact numbers

Resolving a disagreement between two roles by reading the file directly:

```
politician_profiles.csv     536 rows
  interest_group_ratings    0 / 536 populated
  notes                     5 / 536 populated
  external_links            govtrack 536 · opensecrets 524 · ballotpedia 4 · wikipedia 4
  top_industries            2022-cycle bulk import (OpenSecrets API discontinued Apr 2025)
org_profiles.csv             25 rows   (migration 007 planned ~200)
bill_profiles.csv             1 row    (IRA; its own note records the sponsor retired,
                                        "so the dossier shows no linkable sponsor")
```

`user-researcher` described the links as five bookmark sites; `red-team` said two. **The data says two** — Ballotpedia and Wikipedia appear on 4 rows each. A politician dossier is: name, party, state, chamber, committees, a four-year-old PAC table, and two links to sites a policy staffer already has bookmarked.

**But `red-team` also found the thing five other roles missed, in the opposite direction:** the **25 org dossiers are genuinely good**. `org_profiles.csv` carries type, political lean, founded year, annual budget, major funders, FARA registration and countries, external links, and real synthesis in the notes. That *is* original assembly over public records. Honest inventory:

> ### ⚠️ Corrected 2026-07-27, after reading production directly
>
> **Everything above — and every role agent's reasoning — rests on `data/org_profiles.csv`, which has 25 rows. Production has 103.** The seed CSV stopped being prod's source of truth for orgs, exactly as D40 records for outlets. Nobody caught it because org seeding hadn't re-run since prod diverged.
>
> Prod composition: **93 agencies, 8 think tanks, 2 advocacy orgs** — with `notes`, `major_funders`, and `external_links` populated on all 93 agency rows. The org dataset is roughly **4× larger** than this memo assumed.
>
> Two consequences: the "Twenty-five American think tanks" framing for the week-one test (§4.2) is wrong twice — it was never 25 think tanks, and the agency set is far larger than credited. And the D37 `political_lean` violation was **103 rows wide in prod**, not 25; the parser fix suppresses all of them, but the scale of what had been asserted was 4× what the CSV showed.
>
> Worse, the CSV's 15 agencies used short slugs (`fcc`, `epa`, `cdc`) where prod uses full ones (`federal-communications-commission`). Running `seed_org_profiles.py` unmodified would have **inserted 15 duplicate agency dossiers** and put every sourced citation on the duplicates. Caught by taking a backup first; slugs remapped, citations written by targeted update instead.

Honest inventory, corrected against production:

| Asset | What it actually is |
|---|---|
| 10 think tank / advocacy dossiers | **A real dataset**, now with cited verbatim self-descriptions |
| 93 agency dossiers | Substantial and populated. **15 carry cited statutory governance; 78 do not** |
| 536 politician dossiers | A public directory with two bookmarks |
| 1 bill dossier | A placeholder, and a degraded one |
| 72 outlet ratings | A commodity licensed from someone else — and not yet licensed |

---

## 3. Where the panel disagreed

The README says the disagreements are where the real decision is. Four genuine ones, plus the strongest convergence.

### 3.1 Bluesky — a channel block, or founder dependency in costume?

**`growth-lead`:** a full two-week block, cut to 20 min/day (~1.7 hrs/wk), where the mechanic is starter-pack curators rather than the posting itself.
**`acquirer`:** "traffic that requires the founder to post every day is founder dependency wearing a distribution costume" — ~45 hours over 60 days, on the asset class that conveys worst, and a concentration flag in diligence.

**Reconciled — both, in the order they're right.** `acquirer` is correct that daily posting builds nothing transferable; `growth-lead` is correct that starter-pack placement is the cheapest reach into librarians and journalists that exists at $0. So: **keep it at 1.7 hrs/wk as a background activity, and demote it from owning a two-week block.** The freed block goes to §3.3. Kill criterion stays `growth-lead`'s: by day ~55, under 2 starter-pack additions → drop to twice weekly and reclaim the hours.

### 3.2 The five conversations — asset work or interview work?

**`acquirer`:** "INTERVIEW — almost purely. No asset, no traffic, no list, no revenue, nothing that appears in diligence."
**`growth-lead`:** folds them into Block 1 *as* the librarian cold-outreach channel, making one set of hours serve both.
**`user-researcher`:** they are the only thing that can close Q1 at all.

**Reconciled — `growth-lead`'s framing dissolves the conflict, and `acquirer` supplies the reason it matters.** Run the calls as the outreach. And note `acquirer`'s point that the Android pause *requires* them: "without the conversations the pause reads as abandonment; with them it reads as judgment."

### 3.3 Is $1,500/mo net reachable? — the biggest strategic disagreement with the plan

**`GROWTH_STRATEGY.md` §7:** $5/mo consumer subscriptions, gate the dossiers.
**`acquirer`:** not reachable this way. At $5 with Stripe fees (~$4.56 net) and $80–120/mo infra at real usage, **$1,500/mo net needs ~350 paying subscribers** — implying 1,800–2,200 engaged free subscribers at Tangle's outlier 16–20%, or 7,000–17,500 at a realistic 2–5%. And Empire Flippers wants a **12-month average**, not month 12. Verdict: not before 2029 on this path. Proposed instead: **4 institutional customers at $375/mo**, reusing the librarian outreach already in Blocks 1–2.

**Reconciled — adopt the institutional path as the *hypothesis to test*, not as a decision.** It is supported from three directions: `acquirer`'s arithmetic, `growth-lead`'s LibGuide channel, and `user-researcher`'s Round-1 composition (2 policy staffers + 2 librarians — i.e. the institutional buyers). But `user-researcher` supplies the falsifier that stops this from being wishful: **if ≥3 of 5 staffers say their org already pays for Quorum / FiscalNote / LegiStorm / Bloomberg Government, the wedge is dead** — that willingness-to-pay already belongs to incumbents with sales teams. So Round 1 tests it before anything is built.

**Keep the $5 ask anyway, for `growth-lead`'s reason, at his lower price:** ask the twenty most engaged users by name whether they'd pay. Two hours, no Stripe, same information. Build the rails the week ten people say yes in writing.

### 3.4 Does launch traffic wait for the blocking list?

**`standards-counsel`:** a hard blocking list before the first external link is posted.
**`growth-lead`:** delaying a spike costs nothing; delaying a compounder costs the whole runway — and the fall LibGuide window closes in late August.
**`user-researcher`:** the entire schedule holds only if outreach begins within 48 hours.

**Reconciled, and the resolution is better than any single position.** `user-researcher`'s recruiting email **deliberately does not name or link the product** — it asks about behavior. It therefore sends nobody to the site and clears `standards-counsel`'s gate entirely. So: **research outreach starts within 48 hours; nothing that points a stranger at the site ships until B1–B6 land.** No conflict, once the recruiting email is read closely.

### 3.5 The strongest convergence — three roles independently designed one thing

- **`growth-lead`:** don't just delete `auth()` — a 20–90s workflow under a 60s cap gives an anonymous visitor a spinner and a 504. Pre-render ~15 comparisons as static `/compare/[slug]` pages: instant, indexable, no cost exposure.
- **`standards-counsel`:** the review step requires an architectural change — a state where AI text exists in the database but is not served. Without it you cannot claim the Art. 50(4) exemption.
- **`product-analyst`:** log `compare_attempted` *above* the `auth()` call. The wall becomes an instrument instead of a silence.

**These compose into one design.** Pre-rendered comparisons are reviewed before publishing, which *is* the human-review gate; the gate is the Art. 50(4) exemption; the 401 becomes measurable while the wall stands. One ~6-hour job closes a growth problem, a compliance requirement, and a measurement gap. **This is the load-bearing decision of the launch.**

### 3.6 One place the panel corrected the strategy document

`GROWTH_STRATEGY.md` §4(d) ranks the dossier layer as the sharper defamation risk. `standards-counsel` read the actual prompts and reversed it — see §2.2(b), verified. **§4's risk ranking should be inverted:** the summarizer is the uncontrolled surface; the dossiers mostly render database fields.

---

## 4. The launch decision — as revised by `red-team`

> The plan below is **not** the one reconciled in §3. `red-team` returned *"proceed with these changes — and they are not optional trims,"* plus an explicit *"do not launch the full §4.1 sequence as written."* Per the process rule set before the panel ran, that verdict is honored rather than overridden to keep the plan intact. The superseded version is preserved in §8 so the change is auditable.

**The decision: run a ~10-hour test in week one, and let its result decide whether the other ~110 hours happen at all.**

### 4.1 Re-baselined budget

The plan is re-denominated at **6 hrs/week, not 10–15** — the number now written down, against §2.5's observed zero. The full §3 sequence costs ~113–121 hours against a 120–180 hour quarter that also contains an active job search; nine of its line items were uncosted. It does not fit, and it adds **zero rows** to the dataset the whole strategy says is the asset.

### 4.2 What happens, in order

**Today — 50 minutes.** B1, B2, B7 (§5). Independent of everything below; nothing blocks them.

**Week 1 — the cheap test, ~10 hours.** This is the launch.

1. **Publish the org dossiers as one static page.** ⚠️ Re-scope per §2.6: prod holds **103 orgs (93 agencies + 10 think tanks/advocacy)**, not 25, so `red-team`'s pitch line *"Twenty-five American think tanks"* is not usable. Two honest framings, pick one: **(a) the 10 think tanks** — *"Ten American think tanks: who funds them, and how they describe themselves, in their own words"* — smaller, fully cited, and it carries the nonpartisan-and-ideological finding; or **(b) the 15 cited agencies** — *"Who actually controls fifteen federal agencies: appointment, terms, and the partisan-balance caps written into statute."* Do **not** publish all 93 — 78 have no cited claim. No auth, no AI text, no comparison, no new routes, no domain move. ~4 hrs.
2. **Send it to ~40 librarians and ~20 policy staffers**, one question: *"Is this useful, and does your organization pay for anything like it?"* ~5 hrs.
3. **Count replies.** ~1 hr.

**Why this is the right test.** It answers Q1 (who responds), Q2 (they got a dossier and no comparison — if they ask for comparison, that is the answer), Q3 (they answer willingness-to-pay in writing), and the dossier-value question, **simultaneously, in week one**. And it sidesteps four structural problems the full sequence walks into:

- **No Art. 50(4) exposure** — public records, not AI text. No disclosure obligation, no Q7 hours.
- **No AllSides/MBFC licensing dependency** — no ratings on the page.
- **No signup wall, no 504, no cost exposure, no `/compare/[slug]` build.**
- **No news-avoidance problem** — and nobody else on the panel named this. Every channel in the §3 sequence points at a front door that is *reading AI summaries of the news*, in a market where §7 of the operating context records 42% actively avoiding news and usage down 12pp since 2020. **The org dossiers are not news. They are reference** — no avoidance problem, no freshness problem, no *Cohere*/*Meltwater* problem.

**Gate.** If nobody replies, that is the day-90 answer arriving in week one, and Q9 triggers cheap and early — which is exactly what Q9 is for. If ten people reply, there is a list, a wedge, and an evidence-backed reason to build the rest.

**Weeks 2–3, only if the gate passes.** Ten conversations in two rounds, using `user-researcher`'s script and pre-registered decision rules — now with respondents rather than cold strangers. Email capture form. AllSides/MBFC letters. Analytics identity (~1 hr).

### 4.3 Cut, by name

Not trimmed — cut, freeing ~35 hours.

| Cut | Why | Dissent on the record |
|---|---|---|
| **Bluesky** (20 hrs) | The panel argued itself out of this and then kept it at reduced dosage. Reducing the dose of something you've concluded builds nothing is a compromise with yourself, not a reconciliation. The starter-pack ask is real — that's *one* DM, 30 min, not 20 hrs. | — |
| **Domain migration** (4–6 hrs) | `next.config.js` pins CSP to `clerk.siftnews.kristenmartino.ai`; moving means a new Clerk production instance, re-issued OAuth redirects, and a live failure mode of "nobody can sign in." Zero effect on any day-90 observable, and it resets indexing history immediately before an SEO pass. | ⚠️ **`acquirer` dissents, strongly** — calls this FATAL for transferability and "the highest-leverage two hours available at any price." Both are right about different goals. **Deferred, not rejected:** buy the domain now (~$38, it's the scarce thing); migrate when there is evidence anyone wants the product. |
| **Dossier SEO pass** (4 hrs) | Pointed at 536 rows containing name/party/state/committees and two links. There is nothing there to rank, and it is close to Google's scaled-content language. | Revisit if the org dossiers grow. |
| **Show HN** (4 hrs) | Median score 2, HN flags politics, and it carries a licensing-letter dependency. A lottery ticket priced as a milestone. | — |

### 4.4 Changes to `GROWTH_STRATEGY.md` §9 adopted

1. **AllSides/MBFC licensing moves from days 61–90 to week 1–2.** Unanimous across all three Round-1 roles.
2. **Cloudflare contingency moves from days 61–90 to days 31–45.** The block lands 2026-09-15, ~day 50 — the plan currently ships the fix two weeks after the thing breaks.
3. **The day-60 gate (100 users, 20 returning) moves to day 90.** `growth-lead`: the channels in that block cannot reach it — LibGuides don't publish inside 30 days, median Show HN is 2 points. Missing a mistimed gate would wrongly indict the product. Day-60 gate becomes: *15 named people, and did any return unprompted?*
4. **Email capture precedes the digest by weeks.** It does not currently exist at all.
5. **Five conversations → ten, in two rounds.** Elimination, then confirmation.
6. **Q2 may close before Q1** and on firmer evidence — it is a within-person comparison, so 10 people give 10 paired observations rather than 10 split four ways. The stated order is backwards.
7. **Stripe deferred past day 90.** A 10-payer gate against ~40 identified users is a 25% conversion ask — better than Tangle's category-best 16–20%. Do the ask, skip the rails.

### 4.5 The falsification test — withdrawn, because it is already answered

§3 proposed spending five research calls watching whether people scroll to External Links and open GovTrack or OpenSecrets, with ≥3 of 5 killing the "dossier as original research" thesis.

**`red-team` killed the test on the grounds that the CSV already answers it,** and the numbers in §2.6 confirm it: the field is literally named `external_links`, it contains govtrack on 536/536 and opensecrets on 524/536, `interest_group_ratings` is empty on all 536, and the money is from 2022. Running ten interviews to discover that is 14 hours spent confirming a `wc -l`.

**Replaced by:** the org dossiers move into the wedge position (§4.2). Keep the 7c observation as a free byproduct of any call that happens — just don't spend calls on it as the primary test. **And do not show anyone the politician dossiers as the pitch** until orgs go from 25 to 100, or accept that the 25 orgs *are* the asset.

---

## 5. Pre-launch blocking list

Blocking = ships before the first external link points a stranger at the site. From `standards-counsel`, verified in §2.

| # | Item | Cost | Why blocking |
|---|---|---|---|
| **B1** | Fix the masthead. `app/colophon/page.tsx:70` — remove *"Edited by Claude."* A named human holds editorial responsibility, same name everywhere. | 15 min | The site currently publishes an admission that no human is responsible. Do this today regardless of everything else. |
| **B2** | Add the living-persons constraint block to `services/summarizer.py:83`, `story_synthesizer.py:34`, `context_generator.py:53` — never characterize a legal outcome beyond the source; charged ≠ guilty; settled ≠ found liable; attribute contested claims. | 30 min | §2.2(b). Highest-value item on the list. |
| **B3** | Ship `/about`: publisher identity, named editorial responsibility, what is AI-generated, the review policy as it actually operates, corrections window, limits. | 2 hrs | Art. 50(4) applies **2026-08-02**. |
| **B4** | A correction path that works without a GitHub account — monitored address on `/about`, in the footer, on every dossier and article surface. **No `mailto:` exists anywhere in the app today.** | 1 hr | Documented notice-and-correction is the strongest mitigation a one-person publisher has. |
| **B5** | Visible AI labeling at the point of consumption, not only in policy pages. | 1 hr | The actual Art. 50(4) disclosure obligation. |
| **B6** | Fix uncited claims on `/org/[slug]` and `/politician/[bioguide]` — §2.2(e). Copy the `OutletDossier.tsx:120` citation pattern. Drop or source the org `political_lean`. | 2 hrs | D37 violation plus uncited claims about living people. **Promoted to most urgent of B3–B6 by the §4.2 decision** — see below. |
| **B7** | Set `SEARCH_LOGGING_ENABLED=false` in `.env.local` and as a Preview-scoped Vercel var. | 5 min | `lib/searchAnalytics.ts:97` gates only on that var — **no `NODE_ENV` guard**. Local dev against the prod `DATABASE_URL` is writing real rows into the analytics tables now. |

**Not blocking, but early:** analytics identity (~1 hr — nothing else in measurement works first), email capture, the AllSides/MBFC letters, verifying whether Railway overrides `ai_cost_guard_enabled` before any anonymous compare path opens.

### 5.1 One consequence of the §4.2 decision the panel did not chase

`red-team`'s week-one test publishes the **org dossiers** and emails them to ~40 librarians and ~20 policy staffers. That is the right test — but it points the sharpest-eyed possible audience directly at the one surface with verified uncited claims about named living people (§2.2e): a **Sift-assigned** `political_lean` rendered at 26px with no citation, and notes asserting *"Founded by John Podesta. Closely associated with the Democratic establishment"* and *"Long-running Koch family backing."*

`red-team` argued the cheap test carries "no Art. 50(4) exposure" because it is public records rather than AI text. That is correct about the *AI* exposure and silent about the *citation* exposure, which is the one that matters here. Librarians and policy researchers are professional source-evaluators; an uncited characterization is the first thing they will check, and `standards-counsel`'s §1 rule ("a citation or it doesn't render") is not a case-by-case judgment call.

**Therefore: B6 is a prerequisite for the week-one test, not a parallel task.** Sequence it as `B1 → B2 → B7 → B6 → publish`. It also happens to make the page better: a funder list with a source link per funder is more convincing to that audience than one without. Note too that the current funders citation (*"Source: ProPublica Nonprofit Explorer (latest 990)"*) does not support the claim it is attached to — public 990s redact Schedule B, so named individual funders are not verifiable from that source. Fix the label or fix the citation before it goes to people who know that.

---

## 6. Decision queue — disposition

| # | Question | Disposition |
|---|---|---|
| **Q1** | Who is the wedge user? | **Blocked on evidence.** Ten conversations, two rounds, by week 3. Pre-registered close conditions and kill criteria per wedge are set *before* call #1. Honest permitted outcome: **"no wedge identified"** — which is the Q9 conversation arriving early and cheap. |
| **Q2** | Dossier or comparison? | **Blocked on evidence, and may close first.** Pre-registered: dossier wins if ≥6/10 first-clicks from `/civic` land on a dossier and ≥4 scroll past the fold without opening an external link. **Third outcome pre-registered:** if the surface people spend longest on is the article with primer + entity chips, Q2 was malformed and gets re-posed rather than answered. |
| **Q3** | Free-to-paid line | **Partly answered in week one, and the target changed.** The §4.2 email asks willingness-to-pay directly, in writing, before anything is built. **`red-team` rewrote §3.3's target:** not four institutional subscribers at $375/mo but **one paid pilot** — a journalism school or public library paying **$2,000–5,000 once** for a custom civic-literacy resource. Invoiced by a person: no procurement, no VPAT, no recurring commitment. Reason: §3.3's institutional path fails before the procurement cycle, at the vendor form — US public universities generally gate on a **VPAT / Section 508 conformance report**, plus W-9, privacy review, EZproxy/SSO, COUNTER stats; fall-2026 library budgets closed in spring 2026; and the first question is *"who maintains this if you're hired?"* asked of a product whose stated context is an active job search. The revised falsifier is *"could your institution buy this from a sole proprietor with no VPAT?"* — not *"do you pay for Quorum?"* Rails still wait for ten written yeses. |
| **Q4** | AllSides/MBFC licence | **Moved forward to week 1–2.** Letters drafted by `standards-counsel`. Interim provenance paragraph on `/methodology` — *"Sift has requested written permission and will remove the ratings if either organization asks."* Gates Show HN, press, and any institutional path. |
| **Q5** | Cloudflare, 2026-09-15 | **Deferred to days 31–45** (not 61–90). Does **not** block launch: `services/rss.py` fetches only publisher feed XML, never article pages, under an honest self-identifying UA. Audit = one script, ~2 hrs. ⚠️ The UA's contact URL points at the old domain — update it as part of the domain move. Editorial rule: **if any spectrum bucket loses >⅓ of its outlets, the "balanced across the spectrum" copy gets corrected before the next publish.** |
| **Q6** | Android | **CLOSED 2026-07-27 — paused.** §9 supersedes `STATUS.md`. `sift-android` Phase 2 work is preserved. `acquirer`: sale-neutral (a Phase-2 repo with zero users was never a transferable asset); interview-negative **unless** the conversations happen. |
| **Q7** | The human-review step | **REOPENED by `red-team`, then closed on a different answer.** The §3 design (Tier A gate + **daily** 15-min sample + weekly diff + a review count **published monthly on `/about`**, ≈1.75 hrs/wk) was rejected on a specific and correct argument: today `colophon:70` is an *accurate statement of a bad fact*, fixable in 15 minutes. A published compliance metric on the Art. 50(4) page that lapses in month two — and a daily obligation with no reader and no deadline will lapse — becomes an *inaccurate statement of a good fact*, in writing, on the page a plaintiff or regulator reads first. That trades a 15-minute fix for a durable liability. The coverage was also aimed wrong: §3.5's hard gate protects 15 static pages while the summarizer firehose (§2.2b) runs unreviewed.<br><br>**Adopted instead: Tier A only — deterministic, automated, zero recurring human hours.** Hold anything matching legal-process vocabulary or naming a person not matchable to `politician_profiles.bioguide_id`. Keep the **shadow-mode week** before committing (the best-designed element of the original). **Publish no review count on `/about` until the process has survived four consecutive unassisted weeks.** `/about` describes the policy; it does not report a metric. If the gate fires >~30/day, shrink the corpus — the sports and entertainment feeds are the obvious cut and are also the lowest civic value. |
| **Q8** | US-only or global | **Deferred to week 12.** Everything in this memo assumes a US-only posture; that assumption is now explicit. |
| **Q9** | The walk-away | **CLOSED — and pulled earlier.** Original: <100 weekly actives and <$100 MRR at day 180. Adopted trigger, from `product-analyst`: **if day 90 shows fewer than 5 named humans who returned unprompted, trigger Q9 then, not at day 180.** Five in 90 days at this hour budget does not reach 100 weekly actives before the job search ends. Also triggered early if ten conversations produce "no wedge identified." |

---

## 7. Red-team verdict

**PROCEED WITH CHANGES** — delivered as *"these are not optional trims,"* with an explicit **"do not launch the full §4.1 sequence as written."** All seven required changes were accepted and are reflected above. The one place the panel is left in open disagreement — the domain migration — is recorded as a dissent in §4.3 rather than resolved by averaging.

**What `red-team` affirmed as sound, unchanged:**

- B1, B2, B7 — correct, cheap, urgent
- §3.4's resolution (the recruiting email names no product, so it sends nobody to the site — no conflict between the compliance gate and the 48-hour outreach clock)
- Day-60 → day-90 gate move, and its replacement with *"15 named people, did any return unprompted?"*
- Q2 may close before Q1, on the within-person-comparison reasoning
- Defer Stripe; do the ask, skip the rails
- Q9 pulled from day 180 to day 90
- Q5's analysis — `services/rss.py` fetches feed XML only, so Cloudflare does not block launch
- Q7's shadow-mode week
- Inverting `GROWTH_STRATEGY` §4(d)'s risk ranking

**The pre-mortem's load-bearing sentence — already true today:**

> *"Sift went two weeks without a commit, then four."*

Six weeks, both repos, last commit 2026-06-17, while `STATUS.md` reads *"Velocity: High (10+ PRs / week)."*

**And the second:**

> *"The dossier dataset ended the quarter exactly as it began."*

Nothing in the original §3 sequence added a single row to any profile table. Not one line item improved the asset the entire strategy says is the thing being sold. That is the test any future proposal should have to pass.

---

## 8. Process record

**Panel:** `growth-lead`, `acquirer`, `standards-counsel` run independently and blind to each other (README panel mode); then `user-researcher` and `product-analyst`; then `red-team` on the reconciled proposal (README sequential mode). Each received its own role prompt verbatim, the corrected `OPERATING_CONTEXT.md`, and one specific question. None saw another's output.

**Panel independence held.** Four substantive disagreements are recorded in §3, plus one direct conflict of fact between `user-researcher` and `red-team` about `external_links`, resolved in §2.6 by reading the CSV — `red-team` was right.

**Superseded:** the §3 reconciliation produced a 12-week, ~113–121 hour sequence (research outreach in 48 hrs → B1–B6 → 10 conversations → email capture + licensing → pre-rendered compare → LibGuide wave + SEO → Show HN, with Bluesky in background). It was replaced wholesale in §4 after `red-team` established that the budget it assumed has an observed value of zero. It is described here rather than deleted so the revision is auditable.

**Verified by hand, not delegated:** every claim in §2, plus the `red-team` git-history and dossier-composition claims, and the `product-analyst` claim that a first-party event pipeline already exists. Three of those reversed something this memo or `OPERATING_CONTEXT.md` had previously asserted.

**Both previously-unverified items are now resolved** (checked 2026-07-27 via `vercel env ls` and `railway variable list --service sift-api`; names only, no values read):

**The AI cost guard is OFF in production. Confirmed.** Neither `AI_COST_GUARD_ENABLED` nor `DAILY_AI_COST_LIMIT_USD` appears among the 45 variables set on the `sift-api` Railway service, so nothing overrides `app/config.py:23`'s `ai_cost_guard_enabled: bool = False`. **The `OPERATING_CONTEXT.md` §5 non-negotiable — "AI cost ceiling stays on" — has never been on.** At ~$15/mo and zero users this is currently harmless. It stops being harmless the moment anything opens an anonymous path to the 20–90s compare workflow, which is exactly what the original §3 plan proposed. **Turn it on before, not after.**

**`SEARCH_IP_SECRET` IS set** — Preview and Production, added ~72 days ago. So `hashIp()` returns a real hash in prod and **`ip_hash` is populated**, contrary to what was recorded above. Corrections that follow:

- The `product-analyst` finding that *both* identity columns are null is **half right**. `session_id` is genuinely null everywhere (no client sets `x-sift-session-id` — a verified code fact). `ip_hash` works in production.
- **There is more countable data in `search_queries` and `primer_expand_events` than anyone assumed.** `COUNT(DISTINCT ip_hash)` is available today, retroactively, with no code change. It is a coarse proxy for humans — shared NATs undercount, mobile IP rotation overcounts — but it is a denominator, and the memo previously said there was none. Query it before building anything.
- **The secret is also set on Preview**, which combined with the missing `NODE_ENV` guard (B7) means preview-deploy traffic writes rows that look exactly like production rows. B7's Preview-scoped `SEARCH_LOGGING_ENABLED=false` matters more than stated.
