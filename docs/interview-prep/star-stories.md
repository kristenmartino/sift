# STAR stories — recruiter versions

Three behavioral stories, written for a recruiter screen: plain language, no jargon, ~1 minute each spoken.
Save the technical detail for hiring-manager and engineering rounds — sources for each are linked at the bottom
of its section so the deeper version can be rebuilt from the record.

**Delivery tips**

- Keep each to about a minute. Recruiters want the shape and the result, not the mechanism.
- Short on time? Lead with the result: *"I cut our database costs by 60% by finding…"*
- Skip the dollar figure on story 3 — it's small in absolute terms. "60%" and "26 days" carry it.

---

## 1. "I found a problem in my own work and fixed it so it couldn't happen again"

*Use for: a mistake you made · attention to detail · ethics / integrity*

- **Situation:** Sift publishes profile pages about public figures — executives, Supreme Court justices, foreign
  leaders. My rule was that every claim has to cite a source.
- **Task:** In a review I found 111 profiles with claims that had no sources. The rule was being broken, on pages
  about real people.
- **Action:** I traced every one of them to a single shortcut: some data had been loaded by hand from an unfinished
  version of the project. I removed the unsourced text. Then I changed how pages get published, so a claim without
  a source never appears. Sourcing became part of the system instead of something I had to remember.
- **Result:** 69 profiles now publish, each claim paired with its source, and this kind of error can't come back.

**Line to land:** *"Fixing the 111 pages was the easy part. What mattered was making sure no page could be published
that way again."*

Sources: `STATUS.md` → Active focus (shipped 2026-08-05); sift-api migrations 015 and 016.

---

## 2. "The obvious fix was wrong, and data showed me why"

*Use for: disagreeing with the obvious answer · judgment · using data to decide*

- **Situation:** A tabloid was showing up in Sift's World news section more often than the BBC. The instinct was to
  push lower-quality outlets down the rankings.
- **Task:** Decide whether that was the right fix before building it.
- **Action:** I checked the numbers first. Penalizing outlets with weaker accuracy ratings would have removed about
  60% of the right-leaning sources but only about 5% of the left-leaning ones. For a product whose whole pitch is
  showing every side of a story, that would quietly make it partisan. When I looked closer, the real problem was
  simpler: local crime stories were being filed under "World" by mistake.
- **Result:** I fixed the filing mistake, so the problem went away and Sift stayed balanced. I also built a way to
  measure how often stories get misfiled, so the fix can be checked.

**Line to land:** *"The fix that sounded right would have caused a bigger problem than the one it solved. Checking
before building saved the product's credibility."*

Sources: `STATUS.md` → Open strategic question 2 (2026-08-17); sift-api#227, sift-api#263, sift-api#266.

---

## 3. "A cost nobody was going to notice"

*Use for: problem-solving · ownership · saving money · curiosity*

- **Situation:** Sift's database is meant to switch itself off when nobody is using it, so you only pay when it's
  busy. The setting was turned on.
- **Task:** The bill said it had run for 26 days straight without switching off. Nothing was broken and nothing
  looked wrong, so it would have been easy to ignore.
- **Action:** I tracked it down. Two background processes were checking in every few minutes, so the database never
  went quiet long enough to sleep. I removed them, wrote checks to confirm the database now sleeps properly, and set
  a standing rule against building that pattern again.
- **Result:** The database bill dropped by about 60%. The fix didn't need a settings change, just an understanding
  of why the setting wasn't working.

**Line to land:** *"There was no error to chase. I looked because the bill didn't make sense."*

Sources: `docs/DECISIONS.md` D54; sift-api `scripts/verify_idle_locally.py`, `scripts/verify_neon_idle.py`.

---

# Role-targeted set: Technical Product Owner

Picked for a TPO posting (Wealth Enhancement, 2026-10) that weights four things: **defect triage and root cause**,
**accepting or rejecting work against criteria**, **prioritizing under regulatory constraints**, and **AI literacy —
validating AI output for accuracy, not just using it.** Stories 1 and 2 above carry over; reframe them as below. Two
new stories (A and B) fill the AI-literacy and acceptance-criteria gaps.

**Reframes for the stories above**

- **Story 1 (uncited claims) → a compliance story.** A rule existed, it was being broken, I found the single source,
  and I made the rule enforce itself instead of depending on people remembering it. In a regulated firm, say it in
  exactly those terms.
- **Story 2 (misfile vs. ranking) → defect triage.** The requested fix treated a symptom. I investigated before
  committing the work, the data showed a serious side effect, and I fixed the real defect instead.

---

## A. "I tested the AI that checks the AI"

*Use for: AI literacy · validating AI output · acceptance criteria · data-driven decisions*

- **Situation:** Sift uses AI to summarize news articles, and a second AI grades each summary for accuracy. I wanted
  to use those grades to decide whether a cheaper AI model was good enough to switch to.
- **Task:** Before trusting the grades with a business decision, make sure the grader itself could be trusted. Its
  first result looked perfect: it agreed with itself 100% of the time.
- **Action:** I realized a grader that rejects *everything* would also agree with itself 100% of the time — so that
  score proved nothing. I planted known errors, like a made-up number, and measured two things: does it catch the
  errors, and does it leave correct work alone? It caught every planted error, but it also flagged 41% of *correct*
  summaries as wrong. I traced that to rules that were too strict, rewrote them, and re-tested each round. Along the
  way I found it couldn't see the headline the summary was based on, and that it was declaring a winner on too small
  a sample. I also found one thing it simply can't detect — a quietly dropped "allegedly" — and documented that
  limit instead of reporting a number I couldn't stand behind.
- **Result:** False alarms fell from **41% to 2.4%** while it still caught **100%** of planted errors. With a grader
  I could trust, the answer to the business question was clear: the cheaper model was **indistinguishable** on
  accuracy.

**Line to land:** *"An AI score that looks perfect is a reason to check harder. I didn't make the decision until I
could trust the thing measuring it."*

Sources: sift-api#245, sift-api#264.

---

## B. "Making 'done' actually mean done"

*Use for: acceptance criteria · accepting or rejecting work · reducing recurring defects · delivery predictability*

- **Situation:** Sift had a large automated test suite, and everything passed.
- **Task:** Find out whether "everything passes" actually meant the product worked.
- **Action:** I checked whether the tests *could* fail. I broke the product on purpose — for example, removing the
  spending limit on an expensive AI feature — and the tests still passed. I rewrote the ones that couldn't catch
  anything, added a check that flags tests which can't fail, and then made passing a hard requirement before any
  change ships. Until then, a failing test was only advisory.
- **Result:** Every change now has to clear a gate that genuinely checks the work, in both codebases.

**Line to land:** *"A green checkmark isn't an acceptance criterion unless it can turn red."*

Sources: `STATUS.md` → Recent decisions, 2026-08-17 and 2026-08-18.

---

**Backups**

- **Story 3 (database cost)** — operational efficiency, root cause on a production issue.
- **One backlog, one source of truth** (sift#303) — moved the work queue out of a status document and into GitHub
  issues so priority and blocked status live in one place. Small, but a clean 30-second answer to "how do you keep a
  backlog healthy?"

**Gaps to cover from other roles** — Sift is a solo project, so it can't credibly answer these:

- Cross-functional work: Product Managers, architecture, business stakeholders, cross-team dependencies.
- Agile ceremonies with a team: sprint planning, refinement, sprint commitments.
- Financial services and its platforms: Salesforce, Orion, Tamarac.

Bridge line if asked how Sift relates: *"Sift is where I make every product-owner call myself, from prioritization to
acceptance to which defects matter. My day job is where I've done it with a team."*
