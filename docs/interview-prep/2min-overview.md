# 2-minute overview

For when someone says *"walk me through your portfolio project"* on a phone screen. Aim for ~90 seconds spoken — leaves 30 seconds for the first follow-up.

---

## The pitch (3 sentences)

Sift is an AI-curated news reader with a civic-literacy layer — *"the news, with footnotes."* The footnotes are the differentiator: every politician, organization, bill, and outlet that appears in a story links to a structured dossier I built from public records — OpenSecrets for campaign finance, GovTrack for voting records, FARA for foreign-agent registrations, AllSides + MBFC for outlet political lean. So when an article references "Schumer" or "the Inflation Reduction Act," readers get the funding sources and lobbying spend without leaving the page.

## The architecture (3 boxes)

Three boxes, one database. **Vercel** hosts the Next.js frontend. **Railway** runs the Python pipeline — FastAPI + LangGraph workflows that pull from 100+ RSS feeds every 10 minutes, summarize each article with Claude Haiku 4.5, embed with Voyage AI, and write to **Neon Postgres** with pgvector. The frontend reads from Postgres in ~50ms; AI never runs in the user's request path for the browse experience.

There's a second live-AI path for power features: topic search uses vector similarity over indexed embeddings with a Claude `web_search` fallback for niche queries, and multi-source compare uses a LangGraph fan-out workflow to query 2–5 outlets in parallel and synthesize how each framed the same story.

## The key trade-off

The architecturally interesting decision is **splitting AI by SLA**. Browse needs to be 50ms — it's the daily habit. Compare can take 10–15 seconds — it's the moment-of-need. One SLA model couldn't serve both, so the pipeline runs AI at ingestion time for browse and at request time for compare. The whole category-browsing experience is a database read.

## Where it stands

v1 — the general-audience aggregator — shipped March 2026 at about $9/month all-in. v1.5 is the civic-literacy pivot, currently in flight: dossier expansion (170 new entries last month), entity linker promotion, primer instrumentation. v2 is a native client; I'm leaning Android-first while iOS Apple Developer enrollment processes.

## Happy to dive into

> Trade-offs, the LangGraph compare workflow, how the dossier data is sourced, the iOS plan that just got cross-functionally critiqued and rewritten — whichever is most relevant to you.

---

*Live at [siftnews.kristenmartino.ai](https://siftnews.kristenmartino.ai). For the deep cut, see [`docs/HOW_IT_WORKS.md`](../HOW_IT_WORKS.md) or [`20min-walkthrough.md`](./20min-walkthrough.md).*
