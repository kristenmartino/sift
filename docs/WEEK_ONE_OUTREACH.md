# Week-one test — outreach drafts

**Written:** 2026-07-28
**For:** the ~10-hour evidence test in [`LAUNCH_DECISION_MEMO.md`](./LAUNCH_DECISION_MEMO.md) §4.2
**Send target:** ~40 librarians, ~20 policy staffers
**Artifact:** `/agencies` — 25 federal agencies with cited statutory governance

> **These are not the interview-recruiting emails.** The memo's §3.4 recruiting email deliberately names no product, because it asks about behaviour before showing anything. These *send the link* — they are the test itself. Don't mix them up.

---

## The one question

Everything else is scaffolding around this:

> **Is this useful to you or your patrons, and does your institution pay for anything like it?**

The second clause is Q3 answered in writing, months earlier than the original plan reached it. It is the question that separates polite interest from a market.

---

## Librarian version

**Subject:** A cited page on who controls federal agencies — useful for your guide?

> Hi [name],
>
> I saw your [research guide on government information], specifically that you link [the specific resource they link].
>
> I've put together a page on **who actually controls 25 federal agencies**: how many members, who appoints them, term lengths, and whether the authorizing statute caps how many can share a political party. Thirteen of the twenty-five have that cap written into law. The FEC's six commissioners are limited to three per party — which is the structural reason it deadlocks 3–3, rather than a personality problem. The NLRB has no cap at all.
>
> Every line links to the section of the U.S. Code it came from. Nothing on the page is AI-generated.
>
> https://siftnews.io/agencies
>
> Two questions, if you have a minute: **is this useful to you or your patrons, and does your institution pay for anything like it?**
>
> Either answer helps. If it's not useful, that's the most useful thing you can tell me.
>
> Kristen Martino

~150 words.

---

## Policy-staffer version

Different reader, different opening. A legislative aide doesn't curate resources for patrons — they need a fact on a deadline, and they already know the subject matter. So the hook is sharper and the framing is "does this save you a lookup," not "would this suit your collection."

**Subject:** The partisan-balance caps, in one page with the statutes

> Hi [name],
>
> I saw your work on [specific bill / issue area / committee].
>
> I put together a page on the governance of 25 federal agencies — members, appointment, terms, and the statutory partisan-balance caps. Thirteen of the twenty-five have one. The FEC is capped at three of six, the NCUA at two of three, and the NLRB has no cap at all, which is the kind of thing that explains a deadlock story without explaining it as personalities.
>
> Every entry cites the section it came from, so it's usable in a memo rather than just orienting.
>
> https://siftnews.io/agencies
>
> If you have a minute: **is this useful in your work, and does your office pay for anything that covers this?** A "no, we use X" is genuinely useful — I'd rather know.
>
> Kristen Martino

~140 words.

---

## Why they're built this way

**The fact leads, not the product.** Both readers get pitched constantly. *"I built a resource"* is noise; *"the FEC can only ever be 3–3, here's the statute"* is usable tomorrow. If they read one sentence, it should be that one.

**"Nothing on the page is AI-generated"** (librarian version) pre-empts the live objection to civic reference tools. Dropped from the staffer version, where the citation itself carries more weight than the disclaimer.

**The last line licenses a no.** Without it, silence is uninterpretable. With it, *"not useful because X"* is a reply — and replies are the metric, not positive replies.

**Neither asks for a call, a signup, or a share.** One ask. Adding a second halves the response rate and muddies what a reply means.

---

## Personalization is not optional

The bracketed first line carries the email. `user-researcher` was explicit: a librarian answers a specific reference to their own published work and ignores everything else. **Forty personalized sends beat four hundred generic ones**, and it is ~2 minutes each to find what they actually link.

If you can't find something specific to reference, skip that recipient. A generic opener converts a warm contact into a burned one.

---

## Who to send to

**Not the media-bias LibGuide list.** That was the memo's original channel, and it fits `/think-tanks` better. `/agencies` is government-information reference — often a different librarian.

Search instead:
- `site:libguides.com "government information"`
- `site:libguides.com "federal agencies" research guide`
- `site:libguides.com "administrative law"`

Keep the media-bias list for a later `/think-tanks` send. Don't spend it here.

---

## Before sending

1. **Read the page cold**, as if you'd received this email. Only the badge has had an outside read, and it failed — "Why this matters" and the "What is missing" note are still unreviewed copy.
2. **Decide the URL.** See the domain note below.
3. **Set up the reply tracking** — `product-analyst`'s named-individuals sheet. Who replied, what they said verbatim, whether they asked for anything. Ten replies is the gate; the names matter more than the count.

---

## Domain

**✅ Done 2026-07-28.** `siftnews.io` is attached to the Vercel project and serving. `/agencies` and `/think-tanks` return 200 with correct content. `metadataBase` points at it (sift#181), so both hosts emit a canonical of `siftnews.io` — the old subdomain keeps working, which preserves the portfolio case-study link that `GROWTH_STRATEGY.md` §7 wanted kept for a year.

**Send links as `https://siftnews.io/agencies`.**

`acquirer` called the portfolio subdomain *fatal* for transferability — *"no buyer can acquire a subdomain of your personal portfolio."* That objection is answered, for $46/yr and about twenty minutes.

### What is still on the old host

Sign-in, bookmarks and compare. The three Clerk CSP entries in `next.config.js` still pin `clerk.siftnews.kristenmartino.ai`, so **someone who lands on `siftnews.io` and clicks Sign in hits a broken flow.** Theoretical at zero users, and it is the tradeoff that made this twenty minutes instead of six hours. Migrating the Clerk production instance is the 4–6 hour job `red-team` costed, and it still has no day-90 payoff on its own.

### Original assessment, kept for the record

The old host appears in only four places — three CSP entries in `next.config.js` pinning `clerk.siftnews.kristenmartino.ai`, and `metadataBase` in `app/layout.tsx`. **All three CSP entries are Clerk's**, and `/agencies` and `/think-tanks` use no auth at all.

So there is a cheap path that `red-team`'s 4–6 hour estimate didn't separate out:

**Minimal (~20 min):** attach `siftnews.io` to the project, update `metadataBase`. The public pages serve correctly on the new domain immediately. Auth flows (`/sign-in`, bookmarks, compare) would break *on the new domain* until Clerk's production instance is migrated — acceptable at zero users, and untouched by anything in this test.

**Full (~4–6 hrs):** also migrate the Clerk production instance and CSP. That is the estimate `red-team` costed, and it still has no day-90 payoff on its own.

**Recommendation: minimal, before sending.** A librarian evaluating a resource does notice a personal-portfolio subdomain, and this buys the credible URL for twenty minutes rather than six hours.
