# One level deeper — Sift, Tarazu, GridPulse

For the moment after the portfolio intro, when the interviewer (Hannah) wants more. Each product answers the same
four questions: **deployment stage · intended vs. current users · one recent decision · what I own.** Each takes
about 60 seconds spoken. Let her choose which one.

**Handoff line, straight after the intro:**

> "I'm happy to go one level deeper on any of them: where each one is in its lifecycle, who it's built for, a recent
> decision I made, and what I own day to day. Which would be most useful?"

If she says "you pick": **Tarazu** for product-ownership or prioritization roles, **Sift** for AI or data-quality
work, **GridPulse** for ML, model evaluation, or reliability.

---

## Sift — news intelligence

**Deployment stage.**
> "Sift is in production and publicly available. The core reader launched in March. I'm now in the second phase,
> which adds a civic-literacy layer: every politician, organization, and bill mentioned in a story links to a
> sourced profile. It runs on three services that share one database, a Next.js frontend, a Python AI pipeline, and
> Postgres, and every change is gated by automated tests before release."

**Intended vs. current users.**
> "It's built for people who read the news professionally and need it sourced, like librarians, policy staff, and
> journalism programs. The first commercial model I'm pursuing is an institutional pilot rather than a consumer
> subscription. Right now I'm moving from building into structured validation with that audience."

**Recent decision.**
> "One I'm proud of: a lower-quality outlet was outranking the BBC in World news, and the obvious request was to
> rank sources by credibility. Before committing to it, I looked at the data. That change would have removed far more
> coverage from one side of the political spectrum than the other, which undermines the product's core promise of
> balanced coverage. The root cause turned out to be a classification defect, so I fixed that instead. The ranking
> policy stays open, with a clear sequence for when to revisit it."

**What I own.**
> "End to end: product direction and roadmap, the ingestion and AI summarization pipeline, the data model and its
> sourcing standards, the user experience, and how accuracy, reliability, and cost get measured."

---

## Tarazu — prioritization and decision management

**Deployment stage.**
> "Tarazu is live at tarazu.app. There's a free tier, and you can use it without an account. It scores a backlog with
> RICE, visualizes effort against impact, and uses Claude to draft scores and analyze the ranking. Most recently I
> shipped team workspaces, meaning shared workspaces with per-person attribution, as the foundation for the next
> phase."

**Intended vs. current users.**
> "The target is a product lead on a team of about five to thirty people, where priorities really are contested and
> there's no formal product-ops function settling them. Today it's in early access with a small group, and I'm
> validating the team use case before scaling the roadmap."

**Recent decision.**
> "The biggest recent call was a repositioning. Early use showed that prioritization decisions usually get made in a
> Slack thread or a meeting, and the tool gets opened afterward to record them. So I re-scoped Tarazu toward
> capturing decisions where they happen. The plan is three stages: capture the discussion, keep a permanent record of
> what was decided and why, and eventually calibrate estimates against outcomes. I wrote the vision with explicit
> assumptions, a validation plan, and a list of what we're deliberately *not* building, such as roadmapping and
> enterprise sales, so each stage is gated on evidence."

**What I own.**
> "Positioning, the product vision and validation plan, pricing, the roadmap and its non-goals, the data model and
> access controls, the AI integration, and the content. Tarazu is probably the clearest example of how I run a
> product: the reasoning behind each priority is written down and visible."

---

## GridPulse — energy-demand forecasting

**Deployment stage.**
> "GridPulse runs in production on Google Cloud. The web app serves only precomputed results. An hourly job produces
> forecasts, and a daily job retrains the models: XGBoost, Prophet, SARIMAX, and a weighted ensemble. It covers 51 US
> balancing authorities, essentially the entire lower-48 grid, and offers a public read-only API. Each new model
> version must pass an acceptance check that replays it through the real serving path before it can go live."

**Intended vs. current users.**
> "It's designed around four roles: a grid operations manager, a renewables analyst, an energy trader, and a data
> scientist validating models. Each one gets a tailored view of the same data. Today it's a demonstration platform,
> and I use it to hold myself to an operational standard for forecast quality and reliability."

**Recent decision.**
> "A recent one: there was a proposal to improve accuracy by training on more history and by reconciling regional
> forecasts so they add up to the national total. I tested both rigorously. Neither held up, so I didn't ship them.
> During that work I also caught a flaw in an early comparison that had looked very promising. I corrected the
> analysis, and then added automated checks so that kind of comparison error gets caught by the tooling rather than
> by a person reading the results. The decision wasn't just 'no'. It also led me to a different approach that did
> show promise."

**What I own.**
> "The product framing and personas, the evaluation policy that decides whether a model change counts as an
> improvement, the models and training, deployment and monitoring, and every published accuracy figure, each of which
> traces back to a single source of truth."

---

## Keep in your back pocket (only if asked directly)

Answer these honestly and briefly, then move forward. The interview framing above is accurate. These are the
specifics underneath it.

- **"How many users?"** Sift: the institutional outreach is the next step, so there are no paying users yet.
  Tarazu: a handful of early users. GridPulse: no operator users; it's a demonstration platform. Pivot:
  *"Building came first; my current focus is validation, and I've set clear thresholds for what would change the
  roadmap."*
- **"Revenue?"** Not yet, for any of them. Pivot: *"I've deliberately avoided monetizing before I've validated
  demand. Tarazu's vision doc rules out paid acquisition at its price point, for example."*
- **"Solo?"** *"Being solo means I own the consequences end to end, and no one downstream catches a bad scope call.
  Team collaboration is where my day job comes in."*

> Re-check before the call: user counts and validation status as of the interview date.
