# Ranking signals — the model behind D45

**Status:** signal model adopted 2026-08-10; stage 1 (saturating corroboration
+ cross-spectrum bonus) implemented 2026-08-10; stages 2–3 planned.
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
