# Sift — iOS vs Android (platform-first analysis)

**Date:** May 20, 2026
**Status:** Active — open decision
**Companion docs:** [`IOS_APP_PLAN.md`](./IOS_APP_PLAN.md), [`IOS_APP_ASSESSMENT.md`](./IOS_APP_ASSESSMENT.md)

The original iPhone plan assumed iOS-first by default. This document scrutinizes that assumption and recommends Path A (Android-first, with a PWA bridge on web first).

---

## The honest read

**Android-first is defensible for most news products. iOS-first is defensible for Sift specifically.** The reason has nothing to do with iOS being "better" — it's that Sift's content surface in v1 is U.S.-only (FARA, OpenSecrets, GovTrack, ProPublica, Congress.gov), and the U.S. news-engaged, educated, high-income audience — the people who'd actually use a civic-literacy reader — is ~65–70% iPhone. Globally Android dominates 70/30, but globally Sift's content doesn't apply.

That argument has a shelf life of about one quarter. The moment Sift broadens beyond U.S. civic content (UK Companies House data, EU Transparency Register, Canadian lobbying registry — all in scope for the same thesis), the platform math flips immediately. **iOS-first only works if Sift commits to a U.S. v1 and ships Android within ~6 months of the iOS launch.**

---

## What the tie-breaker actually depends on

| Optimize for | Picks |
|---|---|
| Engagement quality + monetization later | iOS first |
| Reach + mission scale (civic literacy for everyone) | Android first |
| Dev velocity & cost (no $99/yr, no enrollment delay, lenient store review) | Android first |
| News-app brand signal & TestFlight beta loop | iOS first |
| Lowest App Review rejection risk for AI summarization | Android first |
| Native widget / share-extension quality | iOS first (Android equivalents exist but OEM fragmentation degrades them) |

Three of those favor Android in ways the original plan didn't acknowledge. The one to weight heaviest right now: **dev velocity.** A solo builder mid-pivot can ship a Kotlin/Compose app to Play Store in roughly 60% of the time it takes to ship the same SwiftUI app to App Store, and the Play Store review is forgiving in ways App Review is not. For a not-yet-PMF product, that's enormous.

---

## The question to ask before iOS vs Android

If both platforms ship eventually — and for a civic-literacy product with global ambition, both should — the platform-first question is the wrong question. The right one is: **native-per-platform or cross-platform?** The original plan steered to native Swift because the question was "iOS-best." If the answer is now "we're shipping both," the math changes:

- **Two native codebases (SwiftUI + Compose):** ~1.8× the work, best feel, full access to widget / share / Live Activity / Glance.
- **Flutter or KMP shared core + native UI:** ~1.2–1.3× the work for both platforms vs one, near-native feel, slight degradation on the platform-specific native features.
- **PWA-first (delay native entirely):** ~0.1× the work — Sift's web app mostly already does this. Add `manifest.ts` (already there), service worker for offline, push via Web Push API (works on Android, partial on iOS 16.4+). Ship that in 1–2 weeks and use it to learn what natives users would actually pay for.

---

## Two paths forward

### Path A — Mission-first (Android leading)

1. Ship PWA-improved web first (~2 weeks): service worker for offline, install prompt, Web Push API.
2. Use it to learn what users actually do on phones — which features drive sessions, what content they bookmark, where they bounce.
3. Then Android-first native (~8 weeks, Kotlin/Compose), with content broadened beyond U.S.-only civic data to justify the global reach.
4. iOS follows ~Q4 2026.

### Path B — Audience-first (iOS leading, but smaller)

1. Ship PWA-improved web first (~2 weeks). Same as Path A.
2. Then the **share-extension MVP iOS app** sketched in [`IOS_APP_ASSESSMENT.md`](./IOS_APP_ASSESSMENT.md) (~4 weeks, not 10).
3. Android starts the moment the iOS share-extension validates the "Sift this URL" use case.
4. Full iOS reader follows once the share extension has signal.

---

## Recommendation

**Path A.** The civic-literacy mission is more aligned with Android's reach than iOS's premium audience, and the dev-velocity advantage of Android-first for a solo builder is decisive. The "but iPhone users pay more" argument only matters once there's something to charge for, which is the wrong problem to be solving in 2026.

The strongest counter to this recommendation: **if Sift stays U.S.-only through 2026**, Path B is closer to right (the U.S. civic-literacy audience really is iOS-skewed). The decision hinges on the geography of Sift's v1 content, which is itself an open product question.

---

## Decision queue (open)

The platform-first question can't be resolved alone — it depends on:

1. **Geographic scope of civic content** in v1. U.S.-only → tilts iOS. Global from the start → tilts Android.
2. **Native vs cross-platform vs PWA.** If PWA gets us 80% of the value at 10% of the cost, native ordering matters less.
3. **Monetization timeline.** Subscription in 2027? → iOS first matters. Free indefinitely? → Android first matters.
4. **Solo-builder reality.** 8–10 weeks of dev is 8–10 weeks not spent on the civic-literacy pivot. May argue for PWA-only through 2026.

These four decisions should land before the platform-first call is made.

---

*This document accompanies the iOS plan assessment and predates a final platform decision. Once a platform-first direction is chosen, this doc moves to `archived/` and the chosen path becomes the active plan.*
