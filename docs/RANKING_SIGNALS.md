# Ranking signals — the model behind D45

**Status:** signal model adopted 2026-08-10; stages 1 (saturating
corroboration + cross-spectrum bonus) and 2 (civic-entity-density boost)
implemented 2026-08-10; stage 3 implemented 2026-08-11 — the drift tripwire
lives in sift-api's `services/feed_balance.py` (daily snapshots to the
`feed_balance` table, migration 022) and the blind-pairs eval in
`scripts/eval_ranking_pairs.py`; first labeling session scored 2026-08-11
(sift-api#200: pre-v2 13/25, v2 13/25 — a tie by the harness's own banding);
stage 4 (opinion genre) implemented 2026-08-11 from that session's overrule
patterns. **Session 3 scored 2026-08-11** against the four changes that shipped
that day — see [Session 3](#session-3--the-day-the-eval-earned-its-keep).

## Session 3 — the day the eval earned its keep

22 pairs scored, 3 skipped, blind, sampled where the current formula disagrees
with the one it replaced.

| formula | agrees with the labeler |
|---|---:|
| pre-v2 (importance × decay) | 10/22 (45%) |
| v2 as of stages 1–5 | **7/22 (32%)** |
| **current** (stages 1–7 + floor) | **14/22 (64%)** |

On the 13 contested pairs the labeler sided with current **10 times (77%)** —
past the ±2 band the harness refuses to call. The 2026-08-11 changes earned
their keep.

**The win is entirely in stories, which is the change under test confirming
itself rather than a diffuse improvement:**

| | contested | current correct |
|---|---:|---:|
| stories | 6 | **6/6** |
| articles | 7 | 4/7 |

Stages 1, 7 and the floor all touch story ranking. Nothing else moved.

### Two results that are not good news

**On the 9 control pairs all three formulas scored 4/9** — below chance. Where
the formulas *agree*, the labeler disagreed with them more often than not. The
sample is tiny, but nothing shipped on 2026-08-11 touched the shared core
(`importance × decay`), and this is the first evidence that core is the weak
part. Session 4 should sample controls deliberately rather than as filler.

**All three misses were `world`, and they are one pattern:**

| labeler picked | current picked |
|---|---|
| Afghanistan's 20m girls and women | a beach-trespasser arrest |
| Ukrainians helping a traumatized generation | a stray cat covered in red dye |
| Raúl Castro's grandson as power broker | a Chicago murder-suicide |

That is the spectacle-over-consequence failure stage 6 exists to fix — but
`LOW_IMPORTANCE_DAMPENER` is **scoped to `top` only**, and **46% of `world`
articles score importance ≤ 2**. The topical tabs were left as complete
coverage by design (stage 6); this is the first evidence that the design costs
something real in `world`.

Underneath it sits a **classifier** defect, not a ranking one: a Texas stray
cat and a Chicago murder-suicide are categorised as `world` at all. Ranking
cannot recover from that. Both are filed rather than fixed here.

## Stage 4 — opinion is not a top story (added from eval evidence)

The first labeling session's clearest pattern: in half the overrules the
labeler rejected op-eds and horse-race commentary the formulas had ranked
as news, and the spectrum bonus actively *rewarded* opinion roundups
(op-eds across lanes trivially span L/C/R buckets — disagreement, not
corroboration). The response, deterministic and $0:

- `articles.is_opinion` (migration 023), set at store time by sift-api's
  `services/genre.py` from **outlet-declared markers only** — URL path
  segments (`/opinion/`, `/commentary/`, `/editorial(s)/`, `/op-ed/`,
  `/commentisfree/`) and title prefixes ("Opinion:", "Editorial |").
  Precision-first: "Analysis:" is deliberately unflagged, and the flag is
  `NOT NULL DEFAULT FALSE` — no marker IS the reported verdict.
  Retroactive via `scripts/backfill_opinion.py` (lockstep SQL patterns).
- Ranking: opinion ranks × `OPINION_DAMPENER` (0.6) at any importance, in
  the SQL pools and the client re-rank; stories inherit it when ≥ half
  their members are opinion; opinion never takes the landing hero.
- Spectrum bonus counts only framings whose outlet contributed at least
  one *reported* member article.
- `feed_balance.opinion_share_top10` records the policy's effect, untripped.
- Known residual: opinion not declared in URL/title. An LLM genre key on
  the context call is the named follow-up if the residual matters; the
  second labeling session will say.

## Stage 5 — roundup containers are not stories (added from eval evidence)

Session 2 of the eval (sift-api#204, pairs drawn from the live top feed)
found program episodes and daily briefs sitting near the top of 'top':
"Morning news brief" at importance 4, Bloomberg show episodes, NYT's "The
Evening". They are **containers** — their summaries recite the day's
biggest events, so the importance model scores the events rather than the
item. The original doom-feed session's pinned #1, "D4vd Charged with
Murder | Case by Case", was the same defect wearing a crime headline.

- `articles.is_roundup` (migration 024), set at store time by
  `services/genre.py:detect_roundup` from title patterns measured on prod
  first: `| <Show> M/D/YYYY` episodes, `| <Show>` segment suffixes, named
  briefs, dated program titles, NPR's `X. And, Y` two-part brief. Fox's
  "MORNING GLORY:" is excluded — an op-ed column, already `is_opinion`.
- Ranking: × `ROUNDUP_DAMPENER` (0.4) in the SQL pools and the client
  re-rank; never takes the hero. Harder than the opinion dampener because
  a container is never the best version of a story — the underlying event
  is also in the feed, reported directly.
- Not applied to stories: clustering works on articles, and a container
  rarely clusters. Revisit if one ever leads a story.

## Stage 7 — corroboration multiplies significance, it does not replace it

*"Still too many local news stories about deaths/tragedies."* Stories ranked
on outlet count alone; **importance never entered the story formula at all**.
Measured 2026-08-11 at the (1, 2.0) constants #231 tuned: a New York Harbor
drowning with **18 outlets and mean member importance 1.9** scored 6.78
against a 169-death Colombian earthquake's 7.09 — a **1.05× ratio**.
System-wide, **302 of 475 stories had max member importance ≤ 2**. Wire
pickup of a local tragedy was indistinguishable from a major event.

The fix is one multiplier: a story's base significance is the **mean
importance of its member articles** — 18 outlets each scoring a drowning a 2
is 18 votes for "minor", not one vote for "major" — divided by
`STORY_IMPORTANCE_CENTER`.

**Centering is what keeps it honest.** Dividing every story by a constant
cannot reorder stories among themselves; it only shifts stories against
articles. Swept against six category pools, replaying the real query shapes:

| center | avg stories in top 20 | story-vs-story reordering |
|---:|---:|---:|
| 2.0 | 7.5 ⚠️ floods | 89 |
| 2.4 | 6.0 | 89 |
| **2.5** (observed mean) | **~5.7** ✓ unchanged | **89** |
| 2.6 | 5.5 | 89 |
| 3.0 | 4.3 ⚠️ starves | 89 |

Baseline share is 5.7. Reordering is 89 at *every* center — so the center is
purely the mix knob, and 2.50 (the observed mean across 116 pooled stories)
holds the mix #231 tuned while adding 89 units of reordering, against the 53
that PR bought. The earthquake gains ×1.68, the drowning ×0.76: a 1.05 ratio
becomes 2.3.

Deliberately *not* a cliff at importance ≤2 (the article rule's shape). A
continuous factor fixes the mid-range too — a 7-outlet wildfire evacuation at
mean 3.7 now separates from a 6-outlet trial at mean 2.3, which a cliff
leaves tied.

### The floor: real news is never averaged into invisibility

*"Will breaking news that's genuinely important but thinly covered end up
buried?"* Mostly no — and stage 7 is why. Before it, an importance-5 article
**dropped** from 5.00 to 3.20 the moment a second outlet picked it up, because
the story score replaced the article score. With stage 7 it *rises* to 6.39.
A heavily-covered but minor story now outranks fresh important news for
**1.1 hours** rather than 7.7.

One residual: the mean that defends against wire pickup also **averages a
single important article down**. Measured over 523 prod stories in 48h, 98
(19%) rank below their best member — but only **5** have a best member at
importance 4–5, which is the case that matters:

```
health    3 outlets  mean 2.8  max 5  ->  4.15
politics  4 outlets  mean 1.8  max 4  ->  3.09
business  2 outlets  mean 2.5  max 4  ->  3.20
```

So significance is floored at the best member's importance, **gated at ≥4**:

```
significance = max(coverage × mean/CENTER, max_member_importance)   if max ≥ 4
             =     coverage × mean/CENTER                           otherwise
```

**The gate is the whole design.** An unconditional floor would undo stage 7 —
it lets one outlet's importance score set the story's rank, which is exactly
the single-outlet leverage the mean was chosen to remove. Above 4 that leverage
is worth paying: an importance-5 article is what the publication most wants
surfaced, and burying it because its co-members were fluff is a worse error
than over-ranking one story.

Applied to **significance only**, before the dampeners — D48 (grim), opinion
and the spectrum bonus still multiply on top. Those are deliberate policy, and
a floor that outran them would silently revert them.

Replayed against prod across eight categories: **top-20 churn 0–1, two stories
lifted, 21–34 ms either way.** A safety net that is inert in normal conditions
and fires only on the case it exists for. Set `STORY_FLOOR_MIN_IMPORTANCE`
above 5 to disable.

## Stage 6 — the front page is for news (added from product direction)

*"Sift should be showing important news, not so much entertainment."*
Measured 2026-08-11 before building: **303 of 489 'top' articles in a week
scored importance ≤ 2**, and only 8 carried `tone='light'`. The front page
was not filling with celebrity content — it was filling with **crime
spectacle** ("Naked champion swimmer accused of killing security guard",
"Penthouse Pet calls ex-hubby from jail"), *correctly* scored 1–2 and
surfacing purely on freshness. Two layers, because two different things
were wrong:

| Layer | Catches | Mechanism |
|---|---|---|
| Low-importance weight | Spectacle that importance already scores 1–2 | `category='top' AND importance ≤ 2` → × `LOW_IMPORTANCE_DAMPENER` (0.35) |
| Genre | Non-news that legitimately scores 3+ | `genre IN ('feature','soft')` → × `NON_NEWS_DAMPENER` (0.5) |

- **Scoped to 'top'.** An importance-2 sports result belongs in Sports; the
  topical tabs remain complete coverage. Only the front page holds the bar.
- **Set `LOW_IMPORTANCE_DAMPENER` to 0 for a hard floor** (importance ≤ 2
  never appears in 'top'). 0.35 is the graceful version: the 2/3 boundary
  is exactly where a mis-scored article would be silently lost, and
  non-grim importance scores have not been re-scored under the
  scope-of-consequence rubric.
- **Genre applies to standalone articles only** — deliberately absent from
  the stories query. Stories rank on corroboration, so a feature or
  tabloid piece inside a multi-outlet story does not drag the story down
  and still appears in its source list ("how this was covered"). A lone
  soft article standing on its own is what gets demoted, never coverage of
  a real event. Neither weight touches story ranking.
- Genre is stored as three values (`news | feature | soft`) while the
  policy treats feature and soft alike, so the two can be split later
  without a re-backfill.
**Owns:** what the feed ranking is allowed to value, and why. Companion to
[`DECISIONS.md`](./DECISIONS.md) D45 (rank by civic impact) and D48 (cap and
dampen, never hide).

## Where ranking stands today (post-D48)

```
article rank = importance(1-5, scope-of-consequence rubric)
             × e^(-age_days)                    [clamped: no future dates]
             × 0.6 if grim AND importance ≤ 3   [the D48 dampener]
story rank   = live member count × e^(-age_days)   [SQL pool]
             ≈ (3 + 0.5×min(sources-1, 4)) × decay [client, visible order]
+ per-outlet pool cap (6 of 50) · classifier keeps single-incident crime out of 'top'
```

## The signal model

Scope of consequence (the importance rubric) is the floor, not the whole
answer. Signals that belong, ordered by how much we trust them:

1. **Corroboration** — how many independent newsrooms judged this worth
   covering. Editorial consensus as a measurable signal; the hardest to game;
   already partially encoded (story member count). Most worth strengthening.
2. **Novelty of change** — news is state *changes*, not states. An ongoing
   war generates fifty daily items but ranks only when something changed.
   Recency decay is the crude proxy; the honest version is "what changed on a
   developing story," which is **blocked on story identity** (story_id is a
   hash of the member-article set — see STATUS.md's foreclosure note).
3. **Decision-relevance (civic impact)** — does knowing this change what a
   reader might *do as a citizen*: vote, evacuate, comment on a rulemaking,
   budget differently. This is D45's "civic impact," and Sift has a signal
   for it nobody else has: **entity-link density to the civic dossiers**. A
   story touching three bills and two members of Congress is
   decision-relevant in a way no wire crime story is.
4. **Durability** — the front-page-of-history test: will it matter in a
   month? Court rulings and treaties pass; a naked swimmer with a water
   bottle does not. Not directly measurable; corroboration + civic-entity
   density approximate it.
5. **Accountability** — power being checked. The deliberate exception to
   scope: an investigation into one corrupt official "affects" few people
   directly but is core civic value. Encoded as the public-figure carve-out
   in the importance rubric; any future rubric edit must preserve it.

**Anti-signals — never rank on these:** emotional intensity ("attention is
not impact" — in the rubric), virality, outlet volume (the per-source cap).
These are the three failure modes that produced the 2026-08-10 doom feed.

## Ranking v2 — implementation plan (staged, deterministic, no new LLM calls)

### Stage 1 — strengthen corroboration, and unify the two story formulas

Today the SQL pool ranks stories by raw `COUNT × decay` while the client
re-ranks them as `(3 + 0.5×min(n-1,4)) × decay` — the pool is truncated
under a different order than the reader sees. Unify on one saturating form
in BOTH places (SQL + `NewsAggregator.tsx`):

```
story rank = (3 + STORY_BOOST × ln(1 + sources)) × decay × spectrum_bonus
spectrum_bonus = 1 + SPECTRUM_BOOST × (distinct AllSides buckets − 1)   # 1.0–1.2
```

- `ln(1 + sources)` (precedent: the edition branch's rank math) stops an
  18-member wire pile-up from lapping a 6-outlet story 3×.
- `spectrum_bonus` reuses the left/center/right bucketing that
  `lib/crossSpectrum.ts` already computes for display: coverage that spans
  the spectrum is stronger corroboration than three same-lane outlets.
  Compute at the API layer from member outlets' `allsides_rating`.
- Constants: `STORY_BOOST ≈ 0.8`, `SPECTRUM_BOOST ≈ 0.1`, both named, both
  revert to today's behavior at documented neutral values.

**`sources` means distinct outlets, as of 2026-08-11.** Both formulas counted
`COUNT(a.id)` — article rows — which is a different quantity: over 7 days of
complete stories, 29% had more articles than outlets and 18% were at ≥1.5×,
because one high-volume outlet can file several pieces on one event. That let a
single outlet manufacture the corroboration this curve exists to measure — the
same wire pile-up the `ln` was chosen to damp, arriving through the variable
rather than the shape. `articleCount` is still what the card displays; the two
are separate fields end to end now.

**Corroboration was a very weak ranking signal until 2026-08-11.** At the
original `(base 3, boost 0.8)` the term spanned only 3.88 (2 outlets) to 5.36
(18) — a 1.38× range — against `decay = EXP(-age_days)`. So **the entire 2 → 18
range was worth 7.7 hours of freshness**, and the base constant was 77% of the
score at n = 2. Replaying the switch to distinct outlets moved 0 of 20 in every
category except politics, which moved one story — not because the variable was
wrong, but because the term barely ordered anything.

### The weighting: `(1, 2.0)`, and why the base had to move too

**These two constants do different jobs, and only one of them is about
coverage.** `STORY_BASE` sets where stories sit against **standalone articles**,
which score `importance × decay` on a 1–5 scale — so raising `STORY_BOOST`
alone lifts every story against every article at once. That reorders the feed,
but mostly by crowding articles out, not by ranking stories on coverage.

Replayed against prod over six categories (`top`, `politics`, `world`,
`business`, `technology`, `sports`), scoring stories and standalone articles in
one list exactly as `NewsAggregator.rankScore` does:

| base | boost | avg stories in top 20 | story-vs-story reordering | 2 → 18 |
|---:|---:|---:|---:|---:|
| 3 | 0.8 | 5.8 | — | 7.7h |
| 3 | 1.6 | **8.5** | 32 | 11.6h |
| 2.5 | 1.6 | 7.5 | 36 | 12.6h |
| 2 | 1.6 | 6.8 | 42 | 13.9h |
| 2 | 2.0 | 7.7 | 46 | 15.1h |
| 1.5 | 2.0 | 7.2 | 50 | 16.6h |
| **1** | **2.0** | **5.8** | **53** | **18.4h** |

Boost-only at 1.6 buys 32 units of reordering by pushing the story share from
5.8 to 8.5 per top-20 — sports went 9 → 14, and 19 of 20 at boost 2.5. `(1, 2.0)`
buys **53** at a story share **identical to today's**. Coverage moves the feed;
the story/article mix does not move at all.

Sanity at the shipped constants: a 2-outlet story scores 3.20 (just over an
importance-3 article), an 18-outlet story 6.89 (above the importance-5 ceiling),
and a thinly-covered grim story lands at 1.92 under D48's dampener. The `ln`
still saturates, so a wire pile-up cannot lap a 6-outlet story — that guard was
never what was wrong.

For scale, decay halves a score every 16.6 hours. See
`sift-api/docs/SOURCE_SCALING.md`.

### Stage 2 — civic-entity density (the D45 signal)

Per article: `civic_links` = count of **distinct** dossier-resolved entities
in `articles.entity_links` (types politician | org | bill | outlet, weighted:
bill and politician count 1.0, org 0.5, outlet 0). Then:

```
civic_boost = 1 + CIVIC_BOOST × min(weighted_civic_links, 3)    # CIVIC_BOOST ≈ 0.1 → max +30%
article rank ×= civic_boost        [SQL pool + client re-rank, same constant]
story civic_boost = max over member articles
```

- Deterministic and free: `entity_links` is already on every feed row;
  `jsonb_array_length`-class work in the computed ORDER BY (which was never
  index-servable anyway — feed-perf CI is the regression gate).
- Cap at +30% so civic density re-orders within a tier but cannot promote a
  routine item over a disaster. Composes multiplicatively with the
  dampener: a grim low-importance story about a named bill still gets both
  effects, by design.

### Stage 3 — validate before it ships (D45 says "empirically")

1. **Replay harness** (pattern from the D48 rollout): old vs new ORDER BY
   against prod, read-only. Assertions: no importance-5 item leaves the top
   decile; grim share of top 10 does not rise; mean distinct-outlet count of
   the top 10 stories rises (that is the point of stage 1).
2. **Hand-ranked pairs:** ~25 story pairs, blind A/B ("which is the more
   important top story?") vs the formula's ordering; ship only if the new
   formula agrees with the hand ranking at least as often as the old one.
3. **Drift tripwire:** extend `feed_health` with the top-10 grim share and
   mean civic-link density so a regression is a logged event, not a vibe.

### Deferred, with reasons

- **Novelty of change** — needs story identity that survives membership
  changes (centroid/entity-based, not content-hash) + retained prior
  syntheses. That is the "what changed" feature's schema work; do it there.
- **Paywall / reader accessibility** (named in D45) — needs a curated
  `outlet_profiles.paywall` column first; cheap once curated, pointless before.
- **Durability & accountability as computed signals** — stay rubric-carried;
  revisit only if the eval in stage 3 shows the formula burying either.
