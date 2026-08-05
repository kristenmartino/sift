# Sift — STATUS

**Updated:** 2026-08-05
**Tier:** v1.5 (civic-literacy pivot) — **feature work resumed 2026-08-05**, by explicit decision, after ~6 days of the evidence-only posture D46 set
**Velocity:** Six-week gap broken 2026-07-30 (3 PRs: [#190](https://github.com/kristenmartino/sift/pull/190), [`sift-api#113`](https://github.com/kristenmartino/sift-api/pull/113), [`sift-mcp#19`](https://github.com/kristenmartino/sift-mcp/pull/19)). By month: Mar 44 · Apr 39 · May 51 · Jun 13 · Jul 3. **2026-08-05: 5 PRs merged** — [#197](https://github.com/kristenmartino/sift/pull/197) here, [`sift-api#129`](https://github.com/kristenmartino/sift-api/pull/129) / [`#130`](https://github.com/kristenmartino/sift-api/pull/130) / [`#131`](https://github.com/kristenmartino/sift-api/pull/131) / [`#132`](https://github.com/kristenmartino/sift-api/pull/132) — plus the executive role-provenance work still on a branch. Read that as one concentrated day, not a new baseline; the 2026-07-31 burst of 8 was also followed by four quiet days. Prior to 2026-07-30 this line read "**Zero.** Last commit 2026-06-17," which was accurate when written; before that it read "High (10+ PRs / week)" and had been wrong for eight weeks — see [`docs/LAUNCH_DECISION_MEMO.md`](./docs/LAUNCH_DECISION_MEMO.md) §2.5.

> ⚠️ **The 2026-07-30 work was engineering, not the evidence D46 asked for.** It was measurement rather than features — bug fixes, an eval harness, test verification — so it sits inside the evidence-only posture on a technicality. But the memo's stated next action is the **~10-hour week-one librarian/policy-staffer test**, and that has still not been run. Zero replies counted, because zero emails sent. Engineering is the comfortable work here; the outreach is the one that answers Q1–Q3.
>
> ⚠️ **Still true on 2026-08-05, and the day made it sharper.** Feature work is un-paused and a lot shipped — but **zero emails have still been sent**, so Q1–Q3 remain unanswered by anyone outside this repo. What changed is that two of the pause's own premises turned out to be wrong, and both were wrong in the direction of *understating* the asset: the inventory below was badly stale, and the dossiers had no crawl path at all, so "is anyone finding these?" had never been a fair question. Neither discovery is a substitute for the test. The honest read is that the day removed excuses rather than evidence.

## Active focus

**Launch evidence, not features.** Per [`docs/LAUNCH_DECISION_MEMO.md`](./docs/LAUNCH_DECISION_MEMO.md) — the output of running `docs/GROWTH_STRATEGY.md` through the six role agents in `.claude/agents/` — the next action is a **~10-hour week-one test**: publish the 25 org dossiers as one static page, send it to ~40 librarians and ~20 policy staffers with one question ("is this useful, and does your organization pay for anything like it?"), and count replies. That test answers Q1, Q2, and Q3 simultaneously. If nobody replies, Q9 triggers in week one instead of day 180.

Budget is re-baselined to **6 hrs/week**, against an observed six weeks of zero. Cut by name: Bluesky, domain migration (deferred — buy the name, don't migrate yet), the dossier SEO pass, and Show HN.

> **The dossier SEO pass was un-cut and shipped on 2026-08-05** ([#197](https://github.com/kristenmartino/sift/pull/197)). It was cut on a cost estimate; what the work actually found is that there was **no `sitemap.ts`, no `robots.ts`, and no structured data anywhere in the app** — 838 dossiers with no declared crawl path. That is not an optimization pass, it is the difference between the asset being visible and not. `docs/GROWTH_STRATEGY.md:68` had scoped it at ~6 hrs and it was accurate.

**Blocking and independent of all of the above — ~50 minutes, do today:** remove *"Edited by Claude"* from the `/colophon` masthead (`app/colophon/page.tsx:70` — the live site currently states that no human holds editorial responsibility, six days before EU AI Act Art. 50(4) applies); add the living-persons / legal-outcome constraint block to the three generation prompts in `sift-api/services/` (they currently contain none); and set `SEARCH_LOGGING_ENABLED=false` in `.env.local` (local dev against the prod `DATABASE_URL` is writing rows into the analytics tables now). Then B6 — the org-dossier citation fix — which is a prerequisite for the week-one test, not a parallel task.

Paused, preserved, not deleted: Android v1 (see Recent decisions), the sift-mcp→sift-api merge ([`sift-api#62`](https://github.com/kristenmartino/sift-api/issues/62)), Ask Sift + Refined Compare ([`sift-api#63`](https://github.com/kristenmartino/sift-api/issues/63)), theme migration 2E QA.

## Open strategic question

**Is there enough product here to launch?** Raised by the panel and not settled. The strategic thesis (`OPERATING_CONTEXT.md` §2) is that the dossier dataset is the sellable asset.

**The inventory this question rested on was wrong, and understated the asset. Corrected against prod 2026-08-05:**

| | This section previously said | Actually in prod |
|---|---|---|
| politicians | 536, all sitting Congress | **638** — 436 house, 100 senate, 56 executive, 46 foreign-executive |
| orgs | 25 | **103** — 93 agencies, 8 think tanks, 2 advocacy |
| bills | **one** | **25** |
| outlets | 72 | 72 ✓ |

The 536 / 25 / 1 figures came from the seed CSVs in `sift-api/data/`. **Prod diverged from those CSVs months ago** — that is the D40 drift, worse than [`sift-api#91`](https://github.com/kristenmartino/sift-api/issues/91) recorded: 102 politician rows existed that no file in either repo described. Anything quoting dossier counts must query the tables, never the CSVs.

Still true, and still the weak part: `interest_group_ratings` empty on all 638 rows, PAC figures from the 2022 cycle (OpenSecrets API discontinued Apr 2025), no refresh job on any profile table, and only **665 of 838 dossiers clear the publish floor** (`lib/publishFloor.ts`) — the rest render but are `noindex` because they have no sourced substantive field.

The honest inventory is now: one real dataset (the org dossiers), one public directory that got materially deeper today (638 politicians, 47 executives newly on primary records), one small-but-real bill set (25), and one commodity not yet licensed (72 outlet ratings). The week-one test is still what answers this question, and it still has not been run.

**"What changed" on a developing story — candidate feature, not committed.**

Surfaced 2026-07-27 while checking whether Sift already had one. **It does not, and the current architecture forecloses it** — recording the mechanics here so this isn't re-investigated later:

- [`workflows/story_workflow.py:210`](https://github.com/kristenmartino/sift-api/blob/main/workflows/story_workflow.py) derives `story_id = sha256(sorted article IDs)[:16]`. Identity is a hash of **the article set**, so a story that gains a fourth outlet becomes a *different* story, not an updated one.
- Lines 166–173 NULL `story_id` for every article in the category inside the window each run, then re-cluster from scratch ("articles may have been re-clustered differently").
- The `ON CONFLICT (id) DO UPDATE` upsert therefore rarely fires; the prior story row is orphaned once its articles repoint.
- `RECENCY_WINDOW_HOURS = 48` — older coverage leaves threading entirely.
- **No prior version is retained anywhere.** `stories` has single `headline`/`summary` columns, `articles` a single `summary`; no history table, no revision column. Every re-synthesis overwrites and discards. A three-day story is re-synthesized ~144 times and leaves no record of what it used to say.

**Why it's worth keeping on the list:** it is the natural companion to "the news, with footnotes," it is commentary *on* coverage rather than a substitute for the article (a better legal posture than the summarizer per `LAUNCH_DECISION_MEMO.md` §2.2b/§3.6), and one hard part already exists — [`workflows/compare_workflow.py:225–228`](https://github.com/kristenmartino/sift-api/blob/main/workflows/compare_workflow.py) already extracts claims tagged `unanimous | majority | disputed | unique`.

**Why it is NOT next:** it fails the test set in D46 — *does this add a row to the asset the strategy says is being sold?* It doesn't. Building it now would be the third consecutive quarter of shipping product instead of finding out whether anyone wants it, and the memo's pre-mortem sentence that is already true is *"the dossier dataset ended the quarter exactly as it began."*

**How it gets decided for free:** add one line to the week-one test email — *"would 'what changed since yesterday' on a developing story be useful to you?"* Evidence at zero build cost. Real scope if it ever proceeds: a thread identity independent of the article set (centroid- or entity-based, not a content hash), retained prior syntheses, and a diff surface — schema + workflow + UI, not a feature flag.

**Geographic scope of civic content + monetization timeline.**

Both are still open, but the frame around them changed on 2026-07-27 and the old framing is no longer the right one to reason from.

**What's superseded:** native platform direction was resolved 2026-05-20 as **Android-first** (Path A from [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md)), and this section previously asked whether Android-first "holds longer-term or eventually pairs with iOS-as-second-platform." **D46 paused Android entirely**, so that question is not live — there is no native platform direction to hold or pair while both clients are paused. The 2026-05-20 reasoning stands on its own terms and is preserved in [`docs/IOS_VS_ANDROID.md`](./docs/IOS_VS_ANDROID.md) and [`DECISIONS.md` D32](./docs/DECISIONS.md); it simply isn't what's being decided now. Re-open it only if the un-pause condition in [`sift-android/STATUS.md`](https://github.com/kristenmartino/sift-android/blob/main/STATUS.md) is met — a wedge whose behavior is mobile-shaped, *and* real replies to the week-one test.

**What's actually still open, re-framed as web questions:**

- **Q8 — US-only or global civic content** (`OPERATING_CONTEXT.md` §6, week 12). Everything in `LAUNCH_DECISION_MEMO.md` assumes a US-only posture, now explicit rather than tacit. US-only makes the dossier moat deeper and the compliance surface smaller.
- **Q3 — monetization.** No longer "free indefinitely vs subscription exploration in 2027." The memo's target is **one paid pilot at $2,000–5,000 once** (a journalism school or public library, invoiced directly — no procurement, no VPAT), not a consumer subscription. The $5/mo consumer path was shown not to reach $1,500/mo net before ~2029. Willingness-to-pay gets asked in writing in the week-one test, months earlier than this section assumed.

Both are now answered by the same evidence the wedge question is waiting on, not by platform strategy.

**Rating system + entity coverage — how far past AllSides bias + MBFC factual?**

Surfaced 2026-06-01. The **neutrality rule**, the **"won't do" calls** (MBFC credibility, MBFC's bias scale, the "Questionable" flag — all re-introduce lean-as-value), and the plain-language `Bias rating:` / `Factual Reporting:` labels (#147) are settled in [`docs/DECISIONS.md` D37](./docs/DECISIONS.md). Still open: **MBFC country + press-freedom** (RSF / Freedom House) — the §3-clean expansion, "pursue when prioritized" (paid license + ToS) — and extending the dossier system to journalists / world leaders / a genre taxonomy. See OQ5 + D37 in [`docs/DECISIONS.md`](./docs/DECISIONS.md).

## Next 3

1. **[~15 min, most of this is done]** B1 + B2 + B7 from [`LAUNCH_DECISION_MEMO.md`](./docs/LAUNCH_DECISION_MEMO.md) §5. Verified 2026-08-05: **B1 shipped** — `/colophon` now names a human who "holds editorial responsibility", the Art. 50(4) exposure is closed. **B7 shipped** — `SEARCH_LOGGING_ENABLED=false` is set in `.env.local`, so local dev no longer writes analytics rows into prod. **B2 is one-third done**: `services/summarizer.py:192` carries the constraint (*"Never characterize a legal outcome beyond what the source literally says"*), but `services/primer_generator.py` has **no constraint block at all** and it generates prose about named people. That is the remaining item, and it is small. `effort-hours`.
2. **[week 1]** B6 (org-dossier citations, §5.1) → publish the org dossiers as one static page → ~60 emails → count replies. **This is the launch.** `effort-days`.
3. **[gated on #2]** Ten conversations in two rounds, per the pre-registered decision rules in the memo §6 (Q1/Q2). Only happens if replies arrive. `effort-week`.

**Carried in from 2026-08-05, sequenced behind the above:** finish the entity-link backfill — halted at 213,000/282,960 to stop it writing regex false positives, resumes with `backfill_entity_links.py --include-empty` once the `_REGEX_INELIGIBLE_NAMES` blocklist lands; and decide the **297 residual chips** for the five outlet names the one-off cleanup did not cover (~74% wrong, but a blanket strip destroys ~78 correct ones — `--mode llm` over just those 297 costs ~$0.30). Both are in [`sift-api/STATUS.md`](https://github.com/kristenmartino/sift-api/blob/main/STATUS.md) with the measurements.

**Deliberately not next:** SSR/streaming ([#56](https://github.com/kristenmartino/sift/issues/56)), the civic-literacy final mile ([#98](https://github.com/kristenmartino/sift/issues/98)), the web `/ask` chat UI, Refined Compare's "Focus on…" input, Android. All are building; none can be justified until the week-one test returns. The failure mode this plan exists to correct is shipping more product instead of finding out whether anyone wants the product that exists.

## The 10 think-tank rows are demo fixtures — scoped cleanup, 2026-07-28

**Root cause, from our own commit message.** `data/org_profiles.csv` was created in [`100789a`](https://github.com/kristenmartino/sift-api/commit/100789a) (2026-05-06, sift-api#26), which describes its contents as *"a handful of **example rows** … so downstream sub-phases have something to render against **during local development**"* and *"**starter rows to exercise the seed pipeline**."* The same commit planned *"Phase 3.B replaces the politician CSV with all 535 sitting Congress members"* — and it did. **The org CSV had no equivalent replacement phase, so the fixtures shipped to production and stayed.**

The data confirms it. Two populations, two signatures:

| | 10 think tanks | 93 agencies |
|---|---|---|
| Budget precision | 1–2 significant figures, all round millions | precise to $1,000 (incl. a negative for GSA) |
| Duplicates | $9M twice, $55M twice | none |
| ProPublica EINs | **5 of 10 return 404** | n/a |

The five correct EINs belong to the best-known organizations; the five broken ones to the less famous. That is the signature of writing from recall rather than from records.

**This revises a panel finding.** `red-team` called the org dossiers *"a real dataset — the only original research in the repo"* and the launch memo repeated it. That was assessed from the CSV without checking how the CSV came to exist. The **93 agency rows** look like real extraction; the **10 think-tank rows are fixtures**. Only the self-descriptions added 2026-07-27 are verified against a primary source.

### ✅ Fixed 2026-07-28 — Brookings was flagged a registered foreign agent

`fara_registered = true` with `["Qatar"]`, rendering as *"Registered as a foreign agent"* on the dossier and a badge on `/think-tanks`. **Nothing supports it.** Brookings' Qatari funding is real and documented (the Doha Center, launched 2007 with Qatar's Ministry of Foreign Affairs); FARA *registration* is a different fact. In Aug 2022 four senators [wrote to the Attorney General](https://www.grassley.senate.gov/news/news-releases/senators-push-doj-on-fara-compliance-of-brookings-institution) arguing Brookings *should be required* to register — which presupposes it had not — and no source shows it ever did. The row carried no `fara` link, so the claim rendered uncited.

Cleared in prod and in the seed CSV. **Rule going forward: `fara_registered = true` requires an `external_links.fara` URL.** A legal-status claim about a named organization is the sharpest thing on these pages.

### Field-by-field state

| Field | State | Verifiable from | Disposition |
|---|---|---|---|
| `fara_registered` | ✅ fixed | FARA registry | Done |
| `annual_budget_usd` | **All 10 wrong.** Errors both directions — Heritage understated ~$44M, Manhattan overstated ~3× | ProPublica 990s — **figures already gathered** | Replace with **total functional expenses + fiscal year** |
| `external_links.propublica` | **5 of 10 are 404s** | Corrected EINs **already in hand** | Fix: EPI `521368964`, AEI `530218495`, ACS `522313694`, Manhattan `132912529`, Roosevelt `237213592` |
| `major_funders` | 30 names, **zero sources**. ProPublica *cannot* support them — public 990s redact Schedule B | Grantmaker 990-PF Schedule I (the funder's filing, not the recipient's) | **Decision needed** — see below |
| `notes` | Uncited prose; several are characterizations | Nothing — they are editorial | Drop characterizations, keep sourced facts |
| `founded_year` | Plausible, unverified | Org's own site | Verify in passing |
| `political_lean` | Deprecated (012), unrendered | — | Drop the column |

### The two decisions

**1. `major_funders`.** Naming Charles Koch Foundation as a funder of Cato, or Open Society as a funder of CAP, is a specific claim about a named organization's financial relationships — with the same fixture provenance as the budgets. Verification is structurally awkward: the recipient's 990 legally cannot show donors, so each pair must be checked against the *funder's* filing. Note also that **DonorsTrust / Donors Capital Fund appear in 4 of the 10 lists and exist specifically to anonymize donors** — confirming a grant from them is possible but tells a reader nothing about ultimate source.
Options: **(a)** drop the section; **(b)** verify all 30; **(c)** verify the top 1–2 per org and drop the rest.

**2. `notes`.** Brookings' reads *"Centrist policy think tank"* — the political lean D37 removed, surviving in prose. CAP: *"Founded by John Podesta. Closely associated with the Democratic establishment."* Cato: *"Long-running Koch family backing."* ACS: *"Progressive counterpart to the Federalist Society."* `standards-counsel` flagged these during the panel and they are still live. Heritage's *"Authored Project 2025 policy framework"* is the one checkable fact among them.

### ✅ Minimum scope completed 2026-07-28

Budgets replaced with total functional expenses read to the dollar from each Form 990, each carrying a fiscal year and a source; the 5 dead ProPublica links corrected; `major_funders`, `notes` and `political_lean` removed. `sift-api`#110 + `sift`#178.

**`founded_year` also dropped, after attempting to verify it.** Only **2 of 10** could be confirmed from the organization's own site — Cato (*"Since 1977…"*) and the Federalist Society (*"Founded in 1982…"*) — and **both matched the stored value**. The other eight do not state a founding year on their About or History pages; Heritage and EPI block automated fetches.

That is a materially better result than the budgets (10/10 wrong), and suggests the fixture author got stable well-known facts right while fabricating the specific ones. But the available fallbacks fall below the standard now applied to every other field here: Wikipedia is secondary, and ProPublica's **"Ruling year" is the IRS determination year — a different fact.** Labelling it "Founded" would repeat the funders-citation error, where the cited record could not support the claim attached to it.

Dropped rather than keeping the two confirmable: **one unsourced field on an otherwise fully-sourced page is the field a reader spot-checks precisely because everything else is cited.**

**Every rendered field on those 10 dossiers now carries a source or is absent.** Verified row by row.

### ⚠️ Still open: `founded_year` on the 93 agency rows

All 93 have it, and it is still rendered and still unsourced. Not dropped, because that population has different provenance — its budget figures are precise to the dollar and include a negative, so it looks like real extraction rather than fixtures. **It has not been verified.** Note also that founding is often already stated, with a citation, inside `governance_structure` (EPA: *"began operations on December 2, 1970"*), so the separate field may be redundant as well as unsourced.

### Original recommended scope — minimum, then stop

Fix budgets to cited expenses, fix the 5 dead links, drop `major_funders` and the editorial `notes`, drop `political_lean`. Result: 10 dossiers where every rendered field is sourced — thinner, and defensible to a librarian.

The funder map is the more interesting artifact and probably the best original research available here, but it fails D46's test: it adds no evidence about whether anyone wants this. **Ship the thin correct version, send the emails, let replies decide whether the funder work is worth it.**

**Does not block the week-one test if `/agencies` is the send** — different rows, real provenance, no budgets or funders rendered.

## The 102 executive dossiers were uncited prose about living people — fixed 2026-08-05

Same defect as the org `notes` at `:94` above, reproduced in a population created afterwards, and sharper because these are living people.

All 102 rows with `chamber IN ('executive','foreign-executive')` carried a populated `notes` field of uncited biographical claims and characterizations — *"First African-American Secretary of Defense"* (Austin), *"Former hedge-fund executive (Key Square Group)"* (Bessent) — behind an `external_links` blob that was usually **only Wikipedia**. [`docs/OPERATING_CONTEXT.md`](./docs/OPERATING_CONTEXT.md) §5 forbids a dossier claim about a living person without a citation to the primary record, and `:109-113` had already rejected Wikipedia as a source when it dropped `founded_year` rather than cite it.

Only `/outlet/*` renders an article list, so these pages are profile-only: **the uncited notes *were* the page.** That is why `listSitemapEntries()` in `lib/db.ts` withheld all 102 — including Trump, Biden, Putin and the entire Cabinet, among the highest-mention entities in the corpus.

**What replaced it** (migration `015_politician_role_provenance.sql`, `sift-api`): twelve columns in which every claim-bearing field is paired with the source column that backs it, on 013's `annual_budget_usd`/`_fy`/`_source` pattern — statutory `role_title` + `role_title_source`, role dates + source, `nomination_date`/`predecessor_name` + the congress.gov PN record, `confirmation_date`/`confirmation_vote_result` + the senate.gov roll-call. `lib/politician.ts` drops any value whose source is absent, so an uncited claim cannot reach the page.

**The records are machine-gathered, not recalled** — recall is what produced the org fixtures and the Brookings FARA claim. `scripts/scrape_executive_records.py` reads Senate roll-call vote menus (111th–119th) and api.congress.gov; `scripts/verify_role_sources.py` refetches all 24 distinct role sources and asserts each literally names the office. Findings worth keeping:

- **A naive substring check "verified" 42 U.S.C. §4321 as establishing the EPA Administrator.** It doesn't — the phrase appears in a 2022 appropriations *note* on a 184KB page. The verifier now strips notes and rejects matches preceded by Deputy/Associate/Under.
- **The nomination's verbatim *"vice \<name\>"* clause covers only 2 of 37 rows.** An incoming administration files its Cabinet en bloc and those records carry no clause — PN11-1 is just *"Scott Bessent, of South Carolina, to be Secretary of the Treasury"*, because the office falls vacant at the transition rather than "vice" a named person. The other 35 come from the Senate's previous confirmation to the same office, which is a **narrower** claim: it is silent about acting officials, who are never confirmed. `predecessor_source` records which of the two it was and the UI labels them differently — *"Preceded by"* vs *"Previous Senate-confirmed holder"*. Collapsing them into one label would have been the small unsourced embellishment this whole migration exists to remove.
- **Inferring a former official's end date from the successor's confirmation is only safe over a contiguous scrape.** A sparse range put Hillary Clinton in office until **2021** (Blinken) because Kerry's 2013 confirmation had never been fetched. The scrape is now contiguous and the inference refuses to cross an unread Congress.

**Result: 58 rows published, 44 withheld, 102 cleaned.** The publish gate in `listSitemapEntries()` and `lib/publishFloor.ts` is no longer `chamber IN ('house','senate')` — it is the thing it always meant, sourcing. Sitemap **674 → 732 URLs**, no duplicates. Withheld rows still render and still resolve entity chips; they simply aren't advertised.

### The 46 foreign-executive rows: 11 sourced, 35 withheld

Attempted 2026-08-05. Each was probed against its own government's official site, requiring the page to name **both** the office and the person — a U.S. statute establishes an office without naming anyone and the officeholder is evidenced separately by a roll-call, but a foreign government's page is the only record here, so it has to carry the whole claim. `verify_role_sources.py` enforces that via a `verify_name` column.

**11 verify and now publish**: Starmer and Sunak (gov.uk person pages), Macron (elysee.fr), Putin (kremlin.ru biography), Carney (pm.gc.ca), Albanese (pm.gov.au), von der Leyen (commission.europa.eu), Wong (pmo.gov.sg), Guterres (un.org/sg), Meloni (governo.it), Sharif (pmo.gov.pk).

**35 do not, for three reasons that are worth separating:**

1. **Unreachable from CI** — Modi, Tusk, Ramaphosa, Zelensky, Netanyahu, Mitsotakis, Lee, Erdoğan, Khamenei and others return 403/404 or time out. These pages very likely exist and a human can open them; the rule is simply that we do not cite what we have not fetched. This is the fixable bucket.
2. **The page is a news feed, not a record.** Several official homepages say "President Tinubu" today and will not next term. That satisfies "has a URL" while failing the actual standard — the same shape as the Wikipedia link this migration removed. What makes the U.S. rows work is that a U.S. Code section and a 2021 roll-call are *permanent and addressable*. Only a person-specific official biography page is the foreign equivalent, and most governments don't publish one.
3. **Former officeholders have no archive.** Of 13 formers only Sunak had a durable official page. An office page names the incumbent, so publishing Merkel or Trudeau from one would assert they still hold the office — precisely the defect being fixed.

**The check caught a live error.** `gov.uk` states Keir Starmer was Prime Minister **5 July 2024 to 20 July 2026**. He left office three weeks ago. Sift's uncited note still read *"Prime Minister of the United Kingdom (since July 2024)"*, and sourcing him to `gov.uk`'s office page rather than his person page would have published a false claim about a living person. **This population is stale in ways nothing currently detects** — there is no refresh job on any profile table, and for foreign rows no equivalent of the Senate roll-call that dates a U.S. handover. Treat the 35 withheld rows as unverified data, not merely unpublished.

Nine U.S. rows are also withheld — White House staff, DOGE, and Fauci hold or held posts with no statutory record naming them.

**Q8 is not settled by this.** Publishing 11 foreign dossiers is a smaller commitment than a global posture, but it is not zero; if Q8 closes "US-only", these 11 are what gets withdrawn.

## Data integrity — open, surfaced 2026-07-27

Both found while applying migration 012 to prod. Neither blocks the week-one test; both should be resolved before the org dossiers go in front of people who read 990s and statutes for a living.

1. **`org_profiles` has the D40 divergence — prod 103 rows, seed CSV 25.** The CSV's 15 agencies used short slugs (`fcc`, `epa`, `cdc`); prod uses full ones (`federal-communications-commission`). Running `scripts/seed_org_profiles.py` unmodified would have inserted **15 duplicate agency dossiers** and written every sourced citation onto the duplicates — the same failure D40 records for `outlet_profiles` (`bbc` → `bbc-news`), on a second table. Slugs are now remapped in the CSV and citations were written by targeted UPDATE instead of a full upsert. **Still open:** the seeder remains upsert-only and never prunes, so nothing prevents this recurring; and the CSV still doesn't describe the other 78 prod agency rows. Prod backup at `sift-api/data/org_profiles.prod-backup-2026-07-27.csv`.

2. **Budget figures are unverified and at least one is wrong.** EPI's `annual_budget_usd` reads **$9,000,000**; EPI's own About page states a **2024 operating budget of $13.3M**. Not corrected — the budget column is cited on-page to ProPublica 990 data, and substituting a self-reported fundraising figure would break that provenance without resolving which is right. The same doubt applies to the other nine think-tank budgets, and to agency budgets, where prod and CSV disagree outright (EPA: prod **$36.97B** vs CSV **$10B**, neither verified). **Do a single pass against ProPublica/990s and decide what the column means** — filing-year figure vs self-reported operating budget — before publishing. Deliberately excluded from the 012 write for this reason.

## Blocked-on

- Apple Developer Program enrollment (deferred — iOS work waits behind Android v1)
- Triage of `sift-api` #62 (merge) and #63 (Ask Sift + Refined Compare) into the sequenced roadmap

## Recent decisions

Cross-repo architecture decisions now live in [`docs/DECISIONS.md`](./docs/DECISIONS.md) (the canonical register); entries below keep their dates + links and point there instead of duplicating.

- **2026-08-05** — **Feature work un-paused, and the dossier set made discoverable for the first time** ([#197](https://github.com/kristenmartino/sift/pull/197)). There was **no `sitemap.ts`, no `robots.ts`, and zero structured data** anywhere in the app: the 838-row asset `OPERATING_CONTEXT.md` §2 calls sellable had no declared crawl path, so every prior argument about whether the dossiers were "working" was untestable. Now 674 URLs (9 static + 665 dossiers), `Person`/`Organization`/`Legislation`/`NewsMediaOrganization` JSON-LD, and a **publish floor** (`lib/publishFloor.ts`) that generalises the rule `listCitedAgencies` already applied to `/agencies`. **Catalog set and published set are now deliberately different** — a thin row still renders and still resolves an entity chip, it just isn't advertised; `follow: true` on withheld pages keeps their public-record links crawlable.

  Three traps, all found by reading rendered HTML rather than by tests. **`max-image-preview:large` does not belong in robots.txt** — Google reads it from the meta tag or `X-Robots-Tag` and ignores it there; `GROWTH_STRATEGY.md:68` implies otherwise. **`robots: undefined` does not inherit** — Next merges metadata by key and a key *present* in the child wins even when undefined, so returning undefined for publishable dossiers silently stripped that directive from every one of them; the unit test asserting the old behaviour was itself wrong. And **JSON-LD must never assert more than the page can source**, because search engines surface it as fact with the citation links gone: `sameAs` built from values had published a White House budget spreadsheet as "another EPA", and `legislationPassedBy` was claiming an introduced-and-died bill was a statute.

- **2026-08-05** — **Entity-link coverage was 7.6%, and most of the miss was names, not missing dossiers** ([`sift-api#129`](https://github.com/kristenmartino/sift-api/pull/129), [`#131`](https://github.com/kristenmartino/sift-api/pull/131)). A new read-only audit (`scripts/audit_unlinked_entities.py`, snapshot committed) anti-joined `articles.entities` against the catalog for the first time: of 282,931 articles only **21,614 carried any `entity_links` at all**. "Pentagon" appeared in 756 articles with no chip although the DoD dossier existed. Hence `entity_aliases` (migration 014) — curated surface forms, validated four ways against the live catalog, never derived (the #40 lesson was that *derived* aliases are unsafe, not that aliases are). Coverage is now **15.4%**, 2x, with ~70k articles still unprocessed.

  **Two findings worth keeping.** 67% of unlinked mention-volume is sports and entertainment, outside the civic frame entirely — reading the gap without that split overstates it ~3x. And the regex-mode backfill **manufactured false positives from outlet names that are ordinary English** ("the nation's fuel" → The Nation, 1,523 articles; also `nature`, `foreign-policy`, `reason`, `slate`): 5,838 bad chips on 3,872 articles, since cleaned. The LLM path never made this mistake — it reads context — so this was introduced by choosing the free matcher for a corpus-wide run and not asking what else a context-free matcher would catch. Root cause and the full audit are in [`sift-api/STATUS.md`](https://github.com/kristenmartino/sift-api/blob/main/STATUS.md).

- **2026-08-05** — **The 102 executive dossiers' uncited `notes` replaced with primary-record fields; the sitemap gate is now sourcing, not chamber** (migration 015). Full write-up in the section above. Two things worth carrying forward. First, **the publish floor was doing its job on its first day**: `listSitemapEntries()` was written the same morning (see the entry below — before it there was no sitemap at all), and its very first output withheld Trump, Biden, Putin and the whole Cabinet, the highest-mention entities in the corpus, rather than publish uncited claims about living people. That was the right trade, and the floor caught the defect within hours of existing. *(Corrected: an earlier draft of this entry said the floor had withheld them "for eight months". It had not — nothing was withheld before 2026-08-05 because nothing was published; there was no crawl path.)* Second, **the failure repeated across populations**. The org `notes` defect was diagnosed and fixed on 2026-07-28; the executive rows were created afterwards and reproduced it exactly. Fixing an instance is not fixing the class. The class-level guard is that no claim-bearing column ships without a source column beside it, enforced in the parser rather than in JSX — `lib/politician.ts` now drops the pair, the same way `lib/org.ts` nulls the budget triple.
- **2026-07-30** — **D26/D27 accuracy claims retracted; cross-language test contracts pinned** ([#190](https://github.com/kristenmartino/sift/pull/190), with [`sift-api#113`](https://github.com/kristenmartino/sift-api/pull/113)). [`DECISIONS.md`](./docs/DECISIONS.md) had claimed **"~97% accuracy on event-level clustering"** (and ~90% for embedding similarity) with **no eval set, no metric, and no test of the clusterer at all**. Both are retracted and marked unmeasured; a labeled corpus + chance-corrected ARI harness now exists in `sift-api` and will replace them with a real number. Two adjacent D26 claims were also wrong and are corrected: "all prompts batched, not per article" (the entity linker is one realtime call *per article*) and "~$52/month" (actual ~$10/day, ~6× off). D27's rejection of a two-pass hybrid rested on "max 50 articles per category is small enough" — that max is a `LIMIT 50` that silently drops articles from threading, so the premise was a bug. Also pinned `stableHash` goldens and the duplicated Anthropic price table as cross-repo contracts, since `stableHash` generates the primary key of every article row and is independently reimplemented in Python; drift in either language now turns exactly one suite red. **Portfolio note:** an unbacked accuracy figure in a public decision register was the single worst artifact in these repos, and it was load-bearing in interview conversations.
- **2026-07-27** — **Android v1 paused for 90 days; launch re-planned around evidence** → [`DECISIONS.md` D46](./docs/DECISIONS.md). `docs/GROWTH_STRATEGY.md` §9 supersedes this file's previous committed Next-3. `sift-android` had reached Phase 2 (nav host, feed, article detail, Custom Tabs) — that work is **preserved, not deleted**; the repo gets a paused banner. Rationale: 12 weeks of build against zero validated demand was the largest resource question on the board, and the buyer's read is that a Phase-2 Android repo with zero users was never a transferable asset. The interview cost is real and is recovered only if the user conversations actually happen — without them the pause reads as abandonment, with them it reads as judgment. Full reasoning, the panel's disagreements, and the disposition of Q1–Q9 in [`docs/LAUNCH_DECISION_MEMO.md`](./docs/LAUNCH_DECISION_MEMO.md).
- **2026-07-27** — **Q7 (human review) closed on Tier A only**, after the red-team reopened a richer design. Automated deterministic gate, zero recurring human hours, shadow-mode week first, and **no review count published on `/about`** until the process survives four unassisted weeks. Reason: a lapsed compliance metric on the Art. 50(4) page is worse than the masthead bug it was meant to replace. → memo §6.
- **2026-07-27** — **Q9 (walk-away) closed and pulled forward** from day 180 to **day 90**: fewer than 5 named humans who returned unprompted triggers it. Also triggered if ten conversations produce "no wedge identified." → memo §6.

- **2026-06-03** — **Reader accessibility (paywall) as a ranking signal** → [`DECISIONS.md` D45](./docs/DECISIONS.md). Prefer surfacing freely-reachable sources for high-impact stories so readers don't hit a paywall at every turn; needs a per-outlet access field (free / metered / hard). Tracked at [#160](https://github.com/kristenmartino/sift/issues/160).
- **2026-06-02** — **"Every word is gold" audit ([#150](https://github.com/kristenmartino/sift/issues/150)) — empirical, not vibes** → [`DECISIONS.md` D38](./docs/DECISIONS.md). 500-article lexical-novelty test; the frontend overlap-suppressor was rejected on the evidence; quality fixed at generation ([`sift-api#90`](https://github.com/kristenmartino/sift-api/issues/90)); dead `landing.*` copy dropped ([#154](https://github.com/kristenmartino/sift/pull/154)). Stale "~50 outlets" → live count ([D39](./docs/DECISIONS.md); [#153](https://github.com/kristenmartino/sift/issues/153) / [#155](https://github.com/kristenmartino/sift/pull/155)); outlet-table drift ([D40](./docs/DECISIONS.md); [`sift-api#91`](https://github.com/kristenmartino/sift-api/issues/91)).
- **2026-06-01** — **Product direction from the AllSides teardown + provenance work.** (a) "Every word is gold" content bar → [D38](./docs/DECISIONS.md). (b) Expand sources toward ~200 "curated AND rated" → [D44](./docs/DECISIONS.md) ([#151](https://github.com/kristenmartino/sift/issues/151)). (c) In-feed keyword/tag filtering — client-side, deterministic, zero-LLM — spec'd in [#149](https://github.com/kristenmartino/sift/issues/149) (not yet a D-entry). (d) Rank by civic impact, not volume → [D45](./docs/DECISIONS.md).
- **2026-06-01** — **App-wide editorial theme migration + neutral rating primitives** → [`DECISIONS.md` D36](./docs/DECISIONS.md) (theme un-scope) + [D37](./docs/DECISIONS.md) (§3 neutrality). 2A–2D shipped ([#144](https://github.com/kristenmartino/sift/pull/144) / [#145](https://github.com/kristenmartino/sift/pull/145) / [#146](https://github.com/kristenmartino/sift/pull/146)); 2E QA remaining. Includes the Tailwind v4 unlayered-reset fix.
- **2026-05-31** — **Homepage (`/`) reskinned to the editorial "news, with footnotes" identity** (Phase 1; scoped under `.sift-landing`, then un-scoped app-wide in [D36](./docs/DECISIONS.md)). Fraunces / Hanken Grotesk / DM Mono site-wide; warm-paper + vermillion, accent bands pinned dark in both themes. Open: "How outlets framed it" is static — `TODO(live-compare)`.
- **2026-05-20** — **Native + agentic architecture calls** → `docs/DECISIONS.md`: `sift-mcp` merges into `sift-api` ([D41](./docs/DECISIONS.md)); mobile is REST-only ([D42](./docs/DECISIONS.md)); Refined Compare (`lens`) + Ask Sift in v1.5 scope, web + Android ([D43](./docs/DECISIONS.md)); iOS under review ([D32](./docs/DECISIONS.md)); canonical `/v1/*` deferred ([D33](./docs/DECISIONS.md)). Tracked at [`sift-api#62`](https://github.com/kristenmartino/sift-api/issues/62) (merge) + [`#63`](https://github.com/kristenmartino/sift-api/issues/63) (agentic).
- **2026-05-20** — **Android-first leaning** (Path A) for native; civic-literacy mission aligns with reach, not premium audience. *(Was "Open — see OQ1 + [D32](./docs/DECISIONS.md)". **Superseded 2026-07-27 by D46** — Android paused, so there is no live native-platform question. Retained as the historical record of why Android-first was chosen.)*
- **2026-05-20** — DMCA audit: Railway footprint **low-risk** under the fair-use clause; real exposure is publisher-direct, not host-mediated. Methodology update queued (sift-api#54 / OQ2).
- *(sift-mcp side, in that repo's STATUS: hybrid index+web; 26-outlet smart-exclusion pool; `load_dotenv(override=True)`; `compare_outlets` unified-claims-array shape — folds into `sift-api` when [`#62`](https://github.com/kristenmartino/sift-api/issues/62) merges.)*

---

*See also: [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md), [`docs/DECISIONS.md`](./docs/DECISIONS.md), [`docs/PRODUCT_STORY.md`](./docs/PRODUCT_STORY.md), [`docs/ANDROID_APP_v1.md`](./docs/ANDROID_APP_v1.md), [`CLAUDE.md`](./CLAUDE.md). Sibling repos: `sift-api` (backend), `sift-mcp` (MCP server — merging into sift-api per #62).*
