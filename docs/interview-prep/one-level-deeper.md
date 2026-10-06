# One level deeper — Sift, Tarazu, GridPulse

For the moment after the portfolio intro, when the interviewer (Hannah) wants more. Each product gets the same four
answers: **deployment stage · actual vs. intended users · one recent decision · what I personally own.** Each is
about 60 seconds spoken. Let her choose which one; don't run all three.

**Handoff line, straight after the intro:**

> "I can go one level deeper on any of the three: where it's deployed, who actually uses it compared with who it's
> built for, a recent decision, and what's mine. Which would be most useful to you?"

If she says "you pick": pick **Tarazu** for a product-ownership or prioritization role, **Sift** for AI or
data-quality work, **GridPulse** for ML, model evaluation, or reliability.

> ⚠️ **Re-check before the call.** The figures below come from each repo's `STATUS.md` / `docs/VISION.md` as of late
> August 2026. User counts and outreach status may have changed since then. If the Sift week-one test or the Tarazu
> outreach has run, update the "actual users" lines. Those are the first things she'll probe.

---

## Sift — news intelligence

**Deployment stage.** In production and public at siftnews.kristenmartino.ai. The v1 general-audience reader shipped
in March 2026. v1.5 is the civic-literacy layer ("the news, with footnotes": linked dossiers on politicians, orgs,
bills, outlets) and is now live with feature work active. Three services share one database: Next.js on Vercel,
a Python/FastAPI + LangGraph pipeline on Railway, and Neon Postgres. CI gates every merge in both repos.

**Intended vs. actual users.**
- *Intended:* people who read the news professionally and need it sourced: librarians, policy staffers, journalism
  schools. The first commercial target is one paid pilot at $2–5K with a school or public library, not a consumer
  subscription.
- *Actual:* no validated external users yet. The "week-one test" (about 10 hours of direct outreach to that
  audience, asking in writing whether they'd use it and pay) is designed and every prerequisite is met, but it
  hasn't been run.
- *Say it plainly:* "The honest gap is demand evidence. I paused feature work for a while specifically to force that
  question, and the next step is the outreach, not more building."

**One recent decision: declined to rank news by source credibility.** A tabloid was outranking BBC in the World tab,
and the obvious fix was to down-weight lower-rated outlets. Before building it, I measured: 6 of the 10
right-of-centre outlets sit at "mixed" factual or below, against 1 of 19 on the left. A credibility weight would have
removed roughly 60% of one side's coverage in a product whose pitch is showing the whole spectrum. The real defect
was local crime being misfiled into "World." So I fixed the classifier, kept the factual rating as a published,
binary gate rather than a hidden weight, and recorded it as an open question with a set order: fix the bug,
re-measure, and reopen the policy only if a gap remains.
- *Backup decision (cost/ops):* a crawler walking the sitemap pushed hosting to 75% of its CPU allowance, so I made
  dossier pages prebuilt and scoped auth middleware to the seven routes that actually read a session (D62).

**What I own.** All of it: product direction and roadmap, the ingestion and summarization pipeline, the
dossier data model and its sourcing rules ("no claim publishes without its source", enforced in code), the UX, and
the evaluation of accuracy, reliability, and cost. That includes validating the AI grader that scores summary
accuracy before trusting it with a model-switch decision.

---

## Tarazu — prioritization and decision management

**Deployment stage.** Live at tarazu.app since February 2026: a free tier, guest mode with no account, and
sign-in with cloud sync. Built on Next.js, Clerk, and Supabase on Vercel, with Claude drafting RICE scores and
analysing the ranking. Paid tiers are marked "Planned" and no payment integration exists. Team workspaces
(organizations, shared workspaces, per-person attribution) shipped in late August as groundwork for the next stage.

**Intended vs. actual users.**
- *Intended:* a product lead on a 5–30 person team where priorities really are contested and nobody has the
  authority to mandate a process. Below that size a founder just decides. Above it, a product-ops function
  makes adoption a sales motion, which I've ruled out.
- *Actual:* fewer than five users, all personal contacts, and $0 revenue. When I measured production on 2026-08-23,
  every cloud table held zero rows, because guest mode never writes to the database.
- *Say it plainly:* "The product works and isn't adopted. I wrote down why: it asks one person to score a backlog
  alone, and prioritization only needs structure once more than one person has a stake."

**One recent decision: re-scoped from a single-player scoring tool to capturing decisions where they're made.**
My diagnosis was that the decision happens in a Slack thread or meeting and the tool gets opened afterward to record
it, so scores get fitted to the outcome. The plan is three gated stages: capture in Slack, then turn each decision
into a permanent record with who said what, then calibrate estimates against outcomes, which is the hard-to-copy part.
Two smaller calls inside it show the reasoning:
- I measured production before planning a data migration. Zero rows meant nothing to migrate, so that phase was
  re-scoped instead of built.
- The two assumptions everything depends on ("PMs feel this as a top-three pain" and "teams want defensible over
  fast") are labelled **unvalidated** in the vision doc. A 30-day outreach test with a stated success bar gates the
  roadmap past that point.
- I also wrote down non-goals: roadmapping, feedback aggregation, enterprise sales, and Teams.

**What I own.** Everything: positioning, the vision doc and its validation plan, pricing, the roadmap and its
non-goals, the data model and authorization (dual-read org/owner access), the AI prompts, and the content and SEO.
*Bridge line:* "Tarazu is the clearest example of how I run a product. The reasoning behind each priority is written
down, including what I don't know yet."

---

## GridPulse — energy-demand forecasting

**Deployment stage.** In production on Google Cloud at gridpulse.kristenmartino.ai. A stateless Cloud Run web app
reads only from Redis. An hourly scoring job and a daily training job (XGBoost, Prophet, SARIMAX, and a weighted
ensemble) cover 51 US balancing authorities, about 100% of lower-48 load. There's also a public read-only JSON API.
Every deploy is CI-gated, and each retrain has to pass a serve-path acceptance gate before it can go live.

**Intended vs. actual users.**
- *Intended:* four personas: a grid-ops manager deciding whether to dispatch capacity, a renewables analyst, an
  energy trader, and a data scientist validating models.
- *Actual:* no operator or trading desk uses it for daily decisions. My own roadmap describes it as "could be real,
  not is real." It's used as a demo and as a test bed for evaluation and reliability practice.
- *Say it plainly:* "I deliberately deferred the 'make it operator-grade' investment until a real user appears. It's
  only worth that money with someone on the other side."

**One recent decision: said no to more training history and to hierarchical reconciliation (August 2026).** A proposal
(issue #231) said a 365-day training window would switch Prophet's yearly seasonality back on. The code needs 730
days, so it could never work as written. I tested the strongest version of the idea anyway, and Prophet lost on the
key regions. A first pass also reported "21 of 28 regions win" on a longer window. I withdrew that result: its control
trained on as little as 35 days and was scored in a mode production never runs. Corrected, it showed 0 of 6
decisive wins. Reconciliation was a no-op or harmful at the headline lead time. I shipped guards so misaligned
comparisons fail automatically instead of relying on me to catch them.
- *Backup decision:* the serve-path acceptance gate (ADR-010). About 27% of retrains for one region dived in real
  serving even though the holdout looked fine, so every candidate is now replayed through the real serve path before
  it can replace the live model.

**What I own.** All of it: the product framing and personas, the evaluation policy (decide on WAPE across rolling
windows, publish MAPE, and veto a "win" that breaks bias limits), the models and training, deployment and
monitoring on Cloud Run, and the public claims. A cited number has to trace back to one canonical facts file.

---

## If she pushes on "solo"

> "Being solo means I own the consequences end to end. Nobody downstream catches a bad scope call or a flaky
> release. What it can't show is working through a team, so I lean on my day job for that. What these products show
> is that I state what's validated versus assumed, and that I measure before I build."
