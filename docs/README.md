# Sift — docs map

Where to find things. Keep this current; if you add a new top-level doc here, add a row.

## Doc index

| Doc | Purpose | Audience |
|---|---|---|
| [`PRD.md`](./PRD.md) | Product vision + scope | Stakeholders, future-me |
| [`PRODUCT_STORY.md`](./PRODUCT_STORY.md) | Founder narrative | Interviewers, marketing |
| [`HOW_IT_WORKS.md`](./HOW_IT_WORKS.md) | End-to-end system walkthrough (~5-min read) | You, sketching on a whiteboard |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Deep technical architecture | Engineers, reviewers |
| [`TECHNICAL_SPEC.md`](./TECHNICAL_SPEC.md) | Data contracts + APIs | Engineers implementing changes |
| [`DECISIONS.md`](./DECISIONS.md) | ADR log — decisions and why (D1–D34, ongoing) | Engineers, future-me defending choices |
| [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) | Roadmap snapshot | Stakeholders |
| [`KPIS.md`](./KPIS.md) | Success rubric — current values vs targets | Operating cadence |
| [`FEATURE_SPECS.md`](./FEATURE_SPECS.md) | Feature-level specs (large; reference) | Engineers implementing a feature |

## Forward-looking plans

| Doc | Purpose |
|---|---|
| [`IOS_APP_PLAN.md`](./IOS_APP_PLAN.md) | iOS v1 plan — status: **under review** (see assessment) |
| [`IOS_APP_ASSESSMENT.md`](./IOS_APP_ASSESSMENT.md) | Cross-functional critique of the iOS plan |
| [`IOS_VS_ANDROID.md`](./IOS_VS_ANDROID.md) | Platform-first analysis — current lean: Android-first |

## Interview prep

Tuned for spoken delivery. Read 2–3 times before an interview; don't memorize phrasing — internalize the structure.

| Doc | When to use |
|---|---|
| [`interview-prep/30s-pitch.md`](./interview-prep/30s-pitch.md) | Elevator. "What do you work on?" |
| [`interview-prep/2min-overview.md`](./interview-prep/2min-overview.md) | Phone screen. "Walk me through your portfolio piece." |
| [`interview-prep/20min-walkthrough.md`](./interview-prep/20min-walkthrough.md) | Technical deep-dive. "Whiteboard the architecture." |

## Where ELSE to look (outside `docs/`)

| Where | What's there |
|---|---|
| `STATUS.md` (repo root) | Current focus, Open question, Next 3, Blocked-on, Recent decisions — single source of truth for "what's active right now" |
| `CLAUDE.md` (repo root) | Agent orientation — pre-session ritual, end-of-PR doc-impact check |
| `README.md` (repo root) | Quick start, env vars, scripts, deployment |
| `.claude/settings.json` | SessionStart hook auto-loads STATUS.md context; MCP server config |
| `.mcp.json` | github-projects MCP server config (Projects v2 tools) |

## Sister repos

| Repo | Role | Has its own STATUS / CLAUDE? |
|---|---|---|
| [`kristenmartino/sift-api`](https://github.com/kristenmartino/sift-api) | Backend — Python pipeline + LangGraph workflows + write path | Yes |
| `kristenmartino/sift-mcp` | MCP server (v0.1) — compare workflow as MCP tools; demo target | Yes (per separate Claude session) |
| `kristenmartino/portfolio-v2` | Case study deploy at `src/content/work/sift.mdx` | n/a |

---

*If you can't find something here, it's probably not written down yet. Open an issue, or ask Claude to write it.*
