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
