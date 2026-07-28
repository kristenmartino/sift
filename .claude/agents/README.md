# Sift role agents

Six perspectives for running Sift like a product with a team behind it. Each is a Claude Code subagent — drop this folder at `.claude/agents/` in the `sift` repo and invoke by name, or paste any single file into a Claude Project's system prompt.

Every one of them reads `docs/OPERATING_CONTEXT.md` first. **Keep that file current — it's the shared substrate, and stale context is worse than none.**

| Agent | Use it when |
|---|---|
| **growth-lead** | Deciding where outreach hours go, planning a launch, designing or reviewing a channel experiment |
| **product-analyst** | Defining events, reading PostHog, judging whether a change worked, or being told a number means something |
| **user-researcher** | Planning interviews, writing a script, debriefing a call, synthesizing across people |
| **red-team** | Before anything expensive, and any time a plan feels obviously right |
| **acquirer** | Quarterly, before anything affecting ownership or transferability, and when deciding whether work builds a sellable asset |
| **standards-counsel** | New content surfaces, ingest changes, anything about a named living person, takedowns |

## Two ways to use them

**Sequential (a decision):** `red-team` → `growth-lead` → `red-team` again. Propose, attack, revise, re-attack. Most decisions need exactly this.

**Panel (a big question):** run `growth-lead`, `acquirer`, and `standards-counsel` on the same proposal independently, then reconcile the disagreement yourself. Where they conflict is where the real decision is.

## The weekly cadence — ~90 minutes

1. **`product-analyst`** — what did the numbers do, and is any of it real?
2. **`user-researcher`** — what did people say, and what did they actually do?
3. **`growth-lead`** — one channel action for the coming week
4. **`red-team`** — on whatever you decided
5. Update `STATUS.md` and the decision queue in `OPERATING_CONTEXT.md` §6

Monthly, add **`acquirer`**. Before any new content surface, add **`standards-counsel`**.

## A note on how to read them

These are deliberately opinionated and will tell you not to do things. That's the point — the failure mode of a solo product isn't a shortage of ideas, it's the absence of anyone whose job is to say no. If an agent's objection is wrong, argue with it; if you find yourself routing around one repeatedly, edit its prompt rather than ignoring it.
