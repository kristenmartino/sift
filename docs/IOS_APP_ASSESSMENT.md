# Sift — iOS Plan Assessment (cross-functional)

**Date:** May 20, 2026
**Status:** Active — informs the next revision of [`IOS_APP_PLAN.md`](./IOS_APP_PLAN.md)
**Companion docs:** [`IOS_APP_PLAN.md`](./IOS_APP_PLAN.md), [`IOS_VS_ANDROID.md`](./IOS_VS_ANDROID.md)
**Audience:** founder + future-me + future Claude sessions

A senior-staff-level cross-functional review of the iPhone app plan as originally written. The plan is well-structured and the API recommendation is correct *for a later stage*, but for a pre-PMF solo build mid-pivot, the plan is shaped like work for a team of 8. The voices below capture what each stakeholder role would say if this were going through a real review.

---

## Round-the-table

**CEO / founder.** The biggest issue isn't in the doc — it's what isn't. Sift is mid-pivot to civic-literacy ("the news, with footnotes"). The pivot is the thesis. This plan ships an iPhone app whose v1 explicitly defers the dossier index, compare, and native civic views to v1.1. That ships a worse mobile-web wrapper of a half-pivoted product. The question to answer before any of this is greenlit: **does an iOS app accelerate the civic-literacy pivot, or distract from it?** If the answer isn't an obvious yes, don't build it yet.

**CPO.** Scope is "MVP" in name only. Four iOS-native features (push, widget, share extension, offline), plus a full reader, plus a new API surface, plus auth, plus bookmarks sync, plus universal links, in 8 weeks. That's a parity build with extra steps. A true MVP picks **one** native superpower and ships it: the share extension is the only one that materially changes the user's relationship with Sift ("what's the actual story behind this link" is the civic-literacy mission expressed in one gesture). Push and widget are table stakes for v1.5 once we know who actually uses the app.

**CTO / VP Eng.** The "what a real company would do" rationale for a new `/v1/*` API is correct in steady state and wrong for *this* state. Real companies arrived at one canonical API by collapsing duplicate ones over time — they didn't start with one when they had a single client. Right now there's one client (web) and one API (Next.js routes). Building a second API in `sift-api` before the second client exists means running two read paths in parallel for months. The pragmatic sequence: **ship native against the existing Next.js routes** (add a CDN cache shim if cold starts hurt — Vercel Edge cache does this for free), and only collapse into `sift-api` when the web migration is already scheduled. Shaves 2–3 weeks off the plan.

**Staff iOS engineer.** The 8-week timeline assumes a full-time iOS dev. The plan says "1 FT or 2 PT iOS + part-time backend." Where does that engineer come from? If it's the founder context-switching, double every estimate. Also: Apple Developer enrollment can be six weeks for new entities — push, share extension, and universal links **all require** the enrollment to be done before week 6 of dev. Start enrollment **today**, not week 1, or this plan slips silently. Lastly, SwiftData on iOS 17.0–17.2 has known issues; the plan acknowledges this but doesn't budget for the fallback to Core Data, which is a 1-week rewrite if it bites.

**Staff backend engineer.** The new `share_artifacts` table and the push_dispatcher node are the only genuinely new backend work. Everything else in `/v1/*` is renaming existing Next.js handlers to Python — pure cost, zero new capability. Cut the rename. Reuse the Next.js routes for native reads. The new endpoints you actually need are three: `POST /v1/devices/register`, `POST /v1/share/sift-this`, `GET /v1/widget/today`. That's it.

**Head of Design.** Civic-literacy on a phone is not "the web layout but smaller." The "What you should know first" primer is a paragraph + glossary tooltips — on iPhone that's a wall of text under a sticky header that no one will read. The native translation needs design work that isn't in this plan: progressive disclosure (collapsed by default, tap-to-expand the term you don't know), maybe an inline footnote pattern (number superscript → bottom sheet), maybe an entirely different IA. **No screens, no flows, no wireframes are referenced.** Add a 2-week design sprint before week 1 of engineering, or we'll rebuild this in v1.1.

**Head of Growth.** Three issues. (1) **Why iPhone first, not Android?** Android is 70%+ of global share. Civic-literacy news appeals strongly outside the U.S. The plan doesn't justify the platform choice. See [`IOS_VS_ANDROID.md`](./IOS_VS_ANDROID.md). (2) Universal links are listed as "optional." They're the single highest-leverage growth feature — every shared Sift article URL, viewed by anyone with the app installed, should open in the app. Make it required v1. (3) **No ASO plan.** App name, keywords, screenshots, first-screen pitch — the plan gives App Store work two weeks at the end. Reality: the listing is the conversion funnel. Start it week 1 in parallel.

**Head of Data / Analytics.** The plan's success metrics are crash-free rate and p95 latency. Those are health metrics, not success metrics. **Missing entirely:**

- D1, D7, D30 retention targets
- Push opt-in rate target (industry median: 50–60% for news)
- Push CTR target (industry median: 3–5%)
- Bookmark rate per session (proxy for "did the article matter")
- Share extension usage per WAU (proxy for share-extension PMF)
- "Read at source" tap rate (proxy for trust — too high means the summary failed)
- Median session length & sessions/week
- Web→app install rate (universal-link conversion)

Without these, the team will ship features and have no way to know what worked. Adding the instrumentation later is 2× as expensive as adding it now.

**Head of Editorial / Civic Mission.** The plan treats civic-literacy as a feature ("primer + glossary + entity chips") rather than the product. The push notification design — `importance_score > 0.9` + "breaking" heuristic — replicates exactly the notification pathology Sift was built to push back against. Sift's notifications should not be "X just happened, panic." They should be "you've been reading about X for two weeks; here's the new ruling and the three industries that lobbied against it." That's the differentiated push experience. The current spec ships generic breaking-news push, which is a race to the bottom we'll lose to AP and CNN.

**CFO / Finance.** Where's the unit economics? Each "Sift this URL" call burns a Claude Haiku summarization + primer generation + entity-link pass. Estimate ~$0.005–$0.02 per call. Daily cap of 50 per user = up to $1/user/day worst case. With no monetization story in the plan, every active user is a net cost. Before any of this ships, the plan needs a paragraph on: **what does Sift charge for, and when?** If the answer is "later," the iOS build should be aggressively conservative on per-user inference cost (lower share-extension cap, cache aggressively, batch primer generation).

**Legal / Privacy.** Two real risks understated. (1) **Apple §4.7 / §5.2.1 for news aggregators.** Sift summarizes copyrighted content. AP, Reuters, and Bloomberg have moved aggressively on AI summarization in 2025–26. The methodology page is good defense but not bulletproof. Get a content-rights review before submission, not after rejection. (2) **iOS push registration creates an `apns_token ↔ clerk_user_id` link** — that's a PII relationship that needs a DPA-compliant retention policy and deletion path (Clerk user deletion must cascade to `device_registrations`). Not in the plan.

**Head of Support / Community.** Currently support burden is ~zero (web app, no support channel published). An iOS app with push notifications adds: "why did I get this notification," "the widget is blank," "I can't sign in on my phone," "the share extension didn't work for this URL." Plan needs a support channel before launch (a single `support@` email is fine) and the founder needs to budget ~3hrs/week for response in the first month.

---

## Synthesis — what should change

1. **Decide the strategic question first.** Before any iOS work: is the iPhone app accelerating the civic-literacy pivot, or running in parallel to it? If parallel, kill or defer the iOS plan. If accelerating, the civic-literacy features (dossiers, primer, entity-linking) must be in v1, not v1.1. Either answer is fine; the current plan straddles both and gets neither.

2. **Shrink v1 by 60%.** Pick **one** of {push, widget, share-extension} for v1. Vote: share extension, because it expresses the civic-literacy mission in a single gesture and is the only one that adds a behavior the web can't. Drop the others to v1.1. Offline cache stays — table stakes.

3. **Skip the new `/v1/*` API for now.** Use the existing Next.js routes; add Edge caching if needed. Build only the three genuinely new endpoints in `sift-api`. Reclaim ~2 weeks.

4. **Front-load design.** A 2-week native-IA design sprint before any Swift is written. Specifically: how the primer + glossary + entity chips translate to phone-sized progressive disclosure.

5. **Instrument before you ship, not after.** PostHog + Sentry + a defined KPI dashboard (D1/D7/D30 retention, push opt-in, push CTR, share-extension WAU, "read at source" rate, web→app install rate) live before TestFlight, with explicit targets in the plan.

6. **Add a revenue paragraph.** Even if it's "Sift is free through 2026 and explores subscription in 2027," put the actual decision in writing so eng knows the cost ceiling.

7. **Justify iPhone-first explicitly, or do Android first.** See [`IOS_VS_ANDROID.md`](./IOS_VS_ANDROID.md). One sentence in the plan: "iPhone first because [editorial users / English-speaking U.S. market / TestFlight pipeline / iOS HIG fits civic-literacy patterns]." If you can't write that sentence with conviction, reconsider.

8. **Apply for Apple Developer Program today.** Not week 1. Today. It's the single longest lead-time item.

---

## KPI scorecard the plan needs (and currently lacks)

| KPI | Target for "iOS was worth building" | Why |
|---|---|---|
| D30 retention (iOS) | ≥ 25% | Below this and the app is uninstalled before push earns its keep |
| Push opt-in rate | ≥ 50% | Industry-median news app; below means our permission ask is mistimed |
| Push CTR | ≥ 4% | Sift's differentiated push thesis lives or dies here |
| Share extension uses / WAU | ≥ 2 | Validates the "what's the actual story" use case |
| Web → iOS install rate (via universal link banner) | ≥ 8% | Validates the funnel exists |
| Sessions / WAU | ≥ 5 | News habit formation; under 3 and we're a one-time-read app |
| % of sessions ending in ≥ 1 primer expand or chip tap | ≥ 40% | Civic-literacy actually being used, not just shipped |
| iOS share of total WAU within 6 mo | ≥ 30% | Validates the platform-priority call |

Set these targets in the plan. Without them, "the iOS app shipped" is a feature delivery, not a result.

---

## Where I'd land if asked to commit

If I were the deciding voice: **defer the iOS app by one quarter.** Spend that quarter completing the civic-literacy pivot on web, getting to a credible web KPI floor (DAU > 1K, D30 > 20%), and *then* build native — with civic-literacy as the headline feature, not a footnote. The current plan is technically sound but strategically premature. Shipping it in May–July 2026 would consume the founder for 10 weeks at the exact moment the web product needs the most attention.

If that's not the call and native ships now: cut to the **share-extension MVP** sketched above, ship it in 4 weeks not 10, and use the launch to learn what the next native feature should be.

---

*This document is the cross-functional review record for `IOS_APP_PLAN.md`. When the plan is revised, this assessment stays put as the historical record of what the panel said. Subsequent reviews go in new files (`IOS_APP_ASSESSMENT_v2.md`, etc.) or are appended below with date headers.*
