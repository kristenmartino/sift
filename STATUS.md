# Sift — STATUS

**Updated:** 2026-08-07
**Tier:** v1.5 (civic-literacy pivot) — **feature work active** (un-paused 2026-08-05)
**Velocity:** **27 PRs merged 2026-08-05** (24 `sift-api`, 3 `sift`) — the largest single day in the project's history, against a six-week gap that ended 2026-07-30. By month: Mar 44 · Apr 39 · May 51 · Jun 13 · Jul 3. This line has twice been wrong in the *optimistic* direction (it read "High (10+ PRs / week)" through eight weeks of near-zero — see [`docs/LAUNCH_DECISION_MEMO.md`](./docs/LAUNCH_DECISION_MEMO.md) §2.5); treat a single day as a day, not a baseline.

> **Feature work is no longer paused** (2026-08-05). The evidence-only posture D46 set held from 2026-07-27 and is now lifted; the passage that used to sit here — arguing the 2026-07-30 commits fit inside it "on a technicality" — described a constraint that no longer applies.
>
> **What has not changed: the week-one librarian / policy-staffer test still has not been run.** Un-pausing the build does not answer Q1–Q3, and shipping is still the more comfortable of the two jobs. The difference is that this is now a sequencing question rather than a prohibition.

## Active focus

**Sourcing the dossier corpus, and the outreach that tests whether anyone wants it.** The two are no longer exclusive.

Shipped 2026-08-05 — the uncited-claims class of defect is closed across every population it appeared in:

- **111 rows cleaned of uncited prose about living people.** 102 executive / foreign-executive rows (migration 015) and 9 Supreme Court Justices (016), all traced to one un-merged branch's hand-run seeders on 2026-05-20, which also produced the 93 agency org rows 013 had already fixed. `docs/OPERATING_CONTEXT.md` §5 forbade all of it.
- **67 dossiers now publish**, gated on sourcing rather than on chamber: 47 U.S. executive, 13 foreign, 9 Justices. Sitemap **674 → 734 URLs**. Every claim-bearing field is paired with the record that backs it, dropped in the parser if the source is absent.
- Alongside: the linker's regex pre-gate, the cost breakdown, Neon retention, and `init.sql` finally describing all 15 tables.

**Next, in order.** The **~10-hour week-one test** (`LAUNCH_DECISION_MEMO.md`) is still the action that answers Q1, Q2 and Q3, and it is still unrun. Its prerequisites are now *all* met — B1/B2/B7 and B6 are done, and the dossier set it would point at is both larger and defensible. Nothing is blocking it except doing it.

Paused, preserved, not deleted: Android v1 (see Recent decisions), the sift-mcp→sift-api merge ([`sift-api#62`](https://github.com/kristenmartino/sift-api/issues/62)), Ask Sift + Refined Compare ([`sift-api#63`](https://github.com/kristenmartino/sift-api/issues/63)), theme migration 2E QA.

## Open strategic question

**Is there enough product here to launch?** Raised by the panel and not settled. The strategic thesis (`OPERATING_CONTEXT.md` §2) is that the dossier dataset is the sellable asset. Verified composition: `interest_group_ratings` empty on all 536 politician rows, PAC figures from the 2022 cycle (OpenSecrets API discontinued Apr 2025), 25 orgs against a planned ~200, **one** bill, no refresh job. The honest inventory is one real dataset (the 25 org dossiers — genuinely good, real synthesis), one public directory with two bookmarks per row (536 politicians), one placeholder (1 bill), and one commodity not yet licensed (72 outlet ratings). The week-one test is designed so this question gets answered by strangers rather than argued internally.

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

- ~~**Q8 — US-only or global civic content**~~ **CLOSED 2026-08-05 — global** → [`DECISIONS.md` D47](./docs/DECISIONS.md). Entry point is intergovernmental organizations sourced to founding treaties, **not** more foreign heads of state — the day's evidence was that 33 of 46 head-of-state rows could not be verified at all, and the 13 that could decay (gov.uk had Starmer leaving office three weeks before Sift noticed). A treaty is a fixed document at a stable URL. First tranche: UN, NATO, IMF, WHO, WTO, European Commission, ILO. Does **not** decide global news sources, which stay gated on Q4.
- **Q3 — monetization.** No longer "free indefinitely vs subscription exploration in 2027." The memo's target is **one paid pilot at $2,000–5,000 once** (a journalism school or public library, invoiced directly — no procurement, no VPAT), not a consumer subscription. The $5/mo consumer path was shown not to reach $1,500/mo net before ~2029. Willingness-to-pay gets asked in writing in the week-one test, months earlier than this section assumed.

Both are now answered by the same evidence the wedge question is waiting on, not by platform strategy.

**Rating system + entity coverage — how far past AllSides bias + MBFC factual?**

Surfaced 2026-06-01. The **neutrality rule**, the **"won't do" calls** (MBFC credibility, MBFC's bias scale, the "Questionable" flag — all re-introduce lean-as-value), and the plain-language `Bias rating:` / `Factual Reporting:` labels (#147) are settled in [`docs/DECISIONS.md` D37](./docs/DECISIONS.md). Still open: **MBFC country + press-freedom** (RSF / Freedom House) — the §3-clean expansion, "pursue when prioritized" (paid license + ToS) — and extending the dossier system to journalists / world leaders / a genre taxonomy. See OQ5 + D37 in [`docs/DECISIONS.md`](./docs/DECISIONS.md).

## Next 3

1. **[week 1] The week-one test — send it.** `LAUNCH_DECISION_MEMO.md` §5.1: publish the dossiers as one static page, send to ~40 librarians and ~20 policy staffers with one question ("is this useful, and does your organization pay for anything like it?"), count replies. Answers Q1, Q2 and Q3 at once; if nobody replies, Q9 triggers in week one rather than day 180. **Every prerequisite is now met** — B1/B2/B7 shipped, B6 shipped, and the page it points at is 67 sourced dossiers rather than 25. `effort-days`.
2. ~~**`role_verified_at` on the publish floor.**~~ **Shipped 2026-08-07** ([#202](https://github.com/kristenmartino/sift/pull/202)). `ROLE_VERIFICATION_MAX_AGE_DAYS = 90` in `lib/publishFloor.ts`, mirrored as a SQL interval in `listSitemapEntries`; only foreign rows decay, because a US executive's title comes from a statute and their departure from a roll-call, both permanent. A stale row keeps rendering and drops out of the sitemap.
3. **[gated on #1]** Ten conversations in two rounds, per the pre-registered decision rules in the memo §6 (Q1/Q2). Only happens if replies arrive. `effort-week`.

**Nothing else is blocking #1.** The entity-link backfill finished 2026-08-07 (see Recent decisions), the false-positive cleanup is done, and item 2 above closed the last known correctness gap in what the sitemap advertises. The remaining work on this list is one email send.

**Deliberately not next:** SSR/streaming ([#56](https://github.com/kristenmartino/sift/issues/56)), the civic-literacy final mile ([#98](https://github.com/kristenmartino/sift/issues/98)), the web `/ask` chat UI, Refined Compare's "Focus on…" input, Android. Feature work being un-paused does not make these next — it makes the *ordering* a judgement rather than a rule, and the judgement is still that a corpus nobody has been asked about does not need more surfaces.

**Not built, deliberately, and why** — a cron that re-verifies sources and auto-unpublishes on failure. The observed failure mode is bot-blocking, not office change: 6 of the foreign sources return hard 403s and 3 more render in JS. Wiring prod writes to a signal that is roughly half infrastructure noise would drop correct rows the first time a government site rate-limits us. #2 above gets the same guarantee by expiry instead.

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

- **2026-08-05** — **Q8 closed: global** → [`DECISIONS.md` D47](./docs/DECISIONS.md). Sift covers non-US civic institutions. The entry point was chosen on evidence rather than preference: sourcing all 46 `foreign-executive` rows the same day returned 13, and the 33 failures were structural (hard 403s, JS-rendered pages, formers with no official archive). The 13 that verified **decay** — their only evidence of incumbency is a page naming them today. IGOs invert that: a founding treaty is fixed, at a stable URL, and describes an institution rather than a living person. 7 rows seeded (UN, NATO, IMF, WHO, WTO, European Commission, ILO), 25 treaty phrases verified, 0 failures — after the check rejected four first attempts, including an IAEA statute reachable only as a PDF, which was dropped rather than cited unverified. `OPERATING_CONTEXT.md` §6's warning stands and is accepted: the compliance surface is now wider, across jurisdictions less forgiving than the US.

- **2026-08-05** — **Feature work un-paused.** D46's evidence-only posture, set 2026-07-27, is lifted. It did the job it was built for — it stopped a quarter of building against zero validated demand, and it forced the launch memo — but the constraint had started reading as a prohibition on work that was in fact *fixing correctness*, and 27 PRs merged the same day it came off. Two things it should NOT be read as: the week-one test is still unrun and still the thing that answers Q1–Q3, and "Deliberately not next" in the Next 3 still holds. What changed is that the ordering is now a judgement call rather than a rule.

- **2026-08-05** — **Feature work un-paused, and the dossier set made discoverable for the first time** ([#197](https://github.com/kristenmartino/sift/pull/197)). There was **no `sitemap.ts`, no `robots.ts`, and zero structured data** anywhere in the app: the 838-row asset `OPERATING_CONTEXT.md` §2 calls sellable had no declared crawl path, so every prior argument about whether the dossiers were "working" was untestable. Now 674 URLs (9 static + 665 dossiers), `Person`/`Organization`/`Legislation`/`NewsMediaOrganization` JSON-LD, and a **publish floor** (`lib/publishFloor.ts`) that generalises the rule `listCitedAgencies` already applied to `/agencies`. **Catalog set and published set are now deliberately different** — a thin row still renders and still resolves an entity chip, it just isn't advertised; `follow: true` on withheld pages keeps their public-record links crawlable.

  Three traps, all found by reading rendered HTML rather than by tests. **`max-image-preview:large` does not belong in robots.txt** — Google reads it from the meta tag or `X-Robots-Tag` and ignores it there; `GROWTH_STRATEGY.md:68` implies otherwise. **`robots: undefined` does not inherit** — Next merges metadata by key and a key *present* in the child wins even when undefined, so returning undefined for publishable dossiers silently stripped that directive from every one of them; the unit test asserting the old behaviour was itself wrong. And **JSON-LD must never assert more than the page can source**, because search engines surface it as fact with the citation links gone: `sameAs` built from values had published a White House budget spreadsheet as "another EPA", and `legislationPassedBy` was claiming an introduced-and-died bill was a statute.

- **2026-08-05** — **Entity-link coverage was 7.6%, and most of the miss was names, not missing dossiers** ([`sift-api#129`](https://github.com/kristenmartino/sift-api/pull/129), [`#131`](https://github.com/kristenmartino/sift-api/pull/131)). A new read-only audit (`scripts/audit_unlinked_entities.py`, snapshot committed) anti-joined `articles.entities` against the catalog for the first time: of 282,931 articles only **21,614 carried any `entity_links` at all**. "Pentagon" appeared in 756 articles with no chip although the DoD dossier existed. Hence `entity_aliases` (migration 014) — curated surface forms, validated four ways against the live catalog, never derived (the #40 lesson was that *derived* aliases are unsafe, not that aliases are).

  **Final, after the full-corpus backfill completed 2026-08-07: 55,137 of 287,978 articles carry a chip — 19.1%, up from 7.6%. 2.51×, +33,523 articles, 77,465 chips.** One alias accounts for 26,706 of them (`trump` → `EXEC-TRUMP-DJ`); then `united-states-senate` 5,133, `the-white-house` 3,550, `supreme-court-of-the-united-states` 3,013, `united-states-congress` 2,547. Every one of those dossiers already existed and was simply unnameable.

  **Two coverage numbers are in circulation and both are right.** This 19.1% is corpus-wide. [`sift-api/STATUS.md`](https://github.com/kristenmartino/sift-api/blob/main/STATUS.md) quotes **22.06%** from `eval_linker_gate.py`, which samples only `created_at > NOW() - N days` — recent articles run through the pipeline with aliases already active, and skew more political. Neither supersedes the other; quote the denominator with the figure.

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
