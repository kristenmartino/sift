# Sift — iPhone App Plan (sift-ios v1)

**Date:** May 20, 2026
**Status:** Plan — not yet started
**Companion docs:** [`PRD.md`](./PRD.md), [`PROJECT_PLAN.md`](./PROJECT_PLAN.md), [`TECHNICAL_SPEC.md`](./TECHNICAL_SPEC.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)
**Sibling repos today:** `kristenmartino/sift` (Next.js, Vercel), `kristenmartino/sift-api` (FastAPI, Railway)
**New repo proposed:** `kristenmartino/sift-ios` (Swift, App Store Connect)

---

## TL;DR — decisions locked

| Decision | Choice | Why |
|---|---|---|
| Stack | **Native Swift / SwiftUI** | Best feel, full access to WidgetKit / share extension / APNs / Live Activities; matches the editorial polish of the web app. |
| v1 scope | **Focused reader MVP** | Feed across 10 categories + article detail with the civic-literacy footnotes + topic search + Clerk-synced bookmarks. Compare and civic dossier index ship in v1.1+. |
| API home | **Single canonical API in `sift-api`** (`/v1/feed`, `/v1/topic`, `/v1/articles/:id`, etc.) | What mature publishers do (NYT, WSJ, Bloomberg): one content API, many clients. The Next.js read routes migrate behind it over time. Avoids building a "mix" we'd have to unwind. |
| iOS-native features in v1 | **Push notifications, "Today on Sift" home-screen widget, "Sift this URL" share extension, offline cached feed** | These are the four that justify a native app vs a mobile-web bookmark. Everything else is deferred. |

The rest of this doc is the how.

---

## Why an iPhone app

Sift's reader surface is great on mobile web — but a phone is where news actually gets read, and three things on iPhone can't be done as a web page:

1. **A glance is a moment, not a session.** A home-screen widget shows the top story per category before the user even opens an app. That's where Sift's "the day in 10 categories" framing earns its keep.
2. **News breaks. Phones notify.** Followed topics → push notifications gives Sift a place in the "what just happened" loop that mobile web can't touch.
3. **The internet flows through Share.** "I saw this link, what's the actual story?" is the moment Sift's civic-literacy layer is most valuable — and on iPhone that moment routes through the Share sheet, which only a native (or extension-bearing) app reaches.

The bar for v1 is: a Sift user who installs the iOS app should never go back to mobile web for routine reading.

---

## v1 scope

### In v1 (focused reader MVP)

- **Feed across 10 categories** — Top, Technology, Business, Science, Energy, World, Health, Politics, Sports, Entertainment. Same source-of-truth as the web feed.
- **Article detail view** — title, summary, "What you should know first" primer panel, inline glossary chips with tooltip previews, outlet badge with AllSides/MBFC ratings. Tap-through to read the original source in `SFSafariViewController`.
- **Topic search** — vector-search powered, SSE-streamed results, same fallback semantics as web (`matchQuality: strong | weak`, `fallbackUsed: bool`).
- **Bookmarks** — synced via Clerk (iOS SDK), backed by the existing `bookmarks` table in Neon.
- **Auth** — Clerk iOS SDK for sign-in; bookmarks/notifications gated behind sign-in, anonymous browsing fully supported.
- **Theming** — Newsprint (light) + Late Edition (dark), tracking the system appearance by default. Same warm editorial palette as web.

### Four iOS-native features (also v1)

1. Push notifications for breaking / followed topics
2. "Today on Sift" home-screen widget
3. "Sift this URL" share extension
4. Offline reading / cached feed

These are detailed in [§iOS-native features](#ios-native-features-in-v1).

### Explicitly *not* in v1 — see [backlog](#backlog-for-v11)

- Multi-source compare (LangGraph fan-out)
- Full civic-dossier index browse (`/civic` equivalent — politicians/orgs/bills)
- Live Activities for developing stories
- Siri shortcuts / App Intents
- iPad-optimized layout
- watchOS companion
- Daily-briefing audio
- Outlet dossier full pages (the badge in v1 links out to the web page for the full dossier)

---

## iOS architecture

### Tech choices

| Concern | Choice |
|---|---|
| UI | SwiftUI (iOS 17+ target — gives us SwiftData, observable macros, `.contentTransition`, sensible inspector APIs) |
| Persistence | **SwiftData** for bookmarks cache + offline article cache; UserDefaults for theme + small prefs |
| Networking | `URLSession` with `async/await`; SSE via `URLSession.bytes(for:)` line iterator |
| Concurrency | Structured concurrency (`async/await`, `TaskGroup`) — no Combine |
| Auth | Clerk iOS SDK (`@clerk/clerk-ios`) — provides session tokens we forward to sift-api as `Authorization: Bearer <jwt>` |
| Image loading | `AsyncImage` for v1; promote to `Nuke` or `Kingfisher` only if we hit the cache/perf wall |
| Analytics | PostHog iOS SDK (matches what the web uses for search analytics today) |
| Crash reporting | Sentry iOS — already on the team's free tier |
| CI | GitHub Actions + Fastlane (`scan`, `gym`, `pilot`) — same Actions account as `sift` / `sift-api` |
| Distribution | TestFlight → App Store Connect |
| Min iOS | **iOS 17.0** (covers 92%+ of active iPhones at ship time; SwiftData and the new SwiftUI animations are worth the floor) |

### Module layout

```
sift-ios/
├── Sift.xcodeproj
├── Sift/                           # Main app target
│   ├── App/
│   │   ├── SiftApp.swift           # @main, scene config, Clerk init
│   │   ├── AppRouter.swift         # Tab + deep-link routing
│   │   └── Theme.swift             # Newsprint / Late Edition tokens (mirror web)
│   ├── Feed/
│   │   ├── FeedView.swift          # Category tabs, feed list
│   │   ├── FeedViewModel.swift     # @Observable; loads /v1/feed
│   │   ├── ArticleCard.swift       # Mirrors components/ArticleCard.tsx
│   │   ├── StoryCard.swift         # Mirrors components/StoryCard.tsx (v1.1)
│   │   └── CategoryPicker.swift
│   ├── ArticleDetail/
│   │   ├── ArticleDetailView.swift
│   │   ├── ContextPrimerView.swift # "What you should know first"
│   │   ├── GlossaryChip.swift      # Inline civic-term tooltip
│   │   ├── OutletBadge.swift       # AllSides + MBFC chip
│   │   └── EntityLinksList.swift   # People / orgs / bills mentioned
│   ├── Search/
│   │   ├── TopicSearchView.swift
│   │   └── SSEClient.swift         # Generic SSE consumer over URLSession.bytes
│   ├── Bookmarks/
│   │   ├── BookmarksView.swift
│   │   └── BookmarkStore.swift     # SwiftData + Clerk sync
│   ├── Auth/
│   │   ├── ClerkClient.swift       # Wraps the Clerk SDK
│   │   └── SignInView.swift
│   ├── Networking/
│   │   ├── SiftAPI.swift           # Typed client for sift-api
│   │   ├── Endpoints.swift
│   │   └── Models/                 # Decodable mirrors of lib/types.ts
│   ├── Persistence/
│   │   ├── SwiftDataSchema.swift
│   │   └── OfflineCache.swift      # See §Offline reading
│   ├── Push/
│   │   ├── PushRegistrar.swift     # APNs token → POST /v1/devices/register
│   │   └── NotificationHandler.swift
│   └── Resources/
│       ├── Assets.xcassets
│       └── DiamondMark/            # SiftLogo mirrored as PDF + SF Symbol variants
├── SiftWidget/                     # WidgetKit extension target
│   ├── SiftWidget.swift
│   ├── TodayOnSiftWidget.swift
│   └── Provider.swift              # WidgetKit TimelineProvider → /v1/widget/today
├── SiftShare/                      # Share extension target
│   ├── ShareViewController.swift
│   └── SiftThisHandoff.swift       # Posts URL to /v1/share/sift-this, opens main app
├── SiftTests/                      # XCTest unit tests
├── SiftUITests/                    # XCUITest smoke flows
├── Fastfile
├── .github/workflows/ios-ci.yml
└── README.md
```

Three Xcode targets, one Swift Package (`SiftCore`) for code shared between the main app and the widget/share extensions (data models, networking client, theme tokens). The package is in-repo, not a separate repo.

### Data model — Decodable Swift mirrors

The iOS `Models/` directory is a **type-faithful mirror of `sift/lib/types.ts`**. The TypeScript file is the source of truth; the Swift mirrors are hand-written and kept in sync by:

1. A unit test that decodes a recorded fixture JSON response from each `/v1/*` endpoint into the Swift model — fails loudly when the API ships a shape we don't expect.
2. A `make sync-models` script that prints a side-by-side TS-vs-Swift field list; cheap heuristic, not codegen. Codegen (via `quicktype` or an OpenAPI spec) is an option we promote to if drift gets painful — explicitly deferred to v1.1.

Field-by-field mapping for the v1 surface:

| TS | Swift |
|---|---|
| `Article` (lib/types.ts) | `struct Article: Decodable, Identifiable` — `id`, `title`, `summary`, `sourceUrl`, `sourceName`, `publishedDate: Date?`, `imageUrl: URL?`, `category: CategoryId`, `readTime: Int`, `whyItMatters: String?`, `importanceScore: Double?`, `contextPrimer: ContextPrimer?`, `outlet: OutletProfile?`, `entityLinks: [EntityLink]` |
| `CategoryId` | `enum CategoryId: String, Decodable, CaseIterable` — same 10 cases |
| `ContextPrimer`, `ContextPrimerTerm`, `PrimerTermLink` | direct structs |
| `OutletProfile`, `OutletAllSidesRating`, `OutletMbfcRating` | direct structs + enums |
| `EntityLink`, `EntityLinkType`, `CivicContext` | direct structs + enum |
| `TopicSearchResponse`, `SSEResultsEvent`, `SSEDoneEvent`, `SSEErrorEvent` | direct structs |

Date decoding uses `JSONDecoder.DateDecodingStrategy.iso8601` everywhere. The web sends ISO-8601 already; sift-api will commit to the same on its mobile endpoints (see [§API contract](#api-contract)).

### Theming

The web has two themes — Newsprint (light) and Late Edition (dark) — defined as CSS custom properties in `sift/app/globals.css`. The iOS app mirrors them as a `Theme` struct exposing `Color` tokens; the values are copied (not computed) so design drift between web and iOS is intentional, not accidental. A future v1.1 task: extract the palette into a JSON token file in `sift/` that both web and iOS consume.

### Auth

- Clerk iOS SDK for the sign-in flow (presents Apple, Google, email — same providers the web allows).
- After sign-in, the SDK gives us a session JWT. Every request to `/v1/*` (except `/v1/feed` and `/v1/topic`, which are public-readable) sends `Authorization: Bearer <jwt>`.
- `sift-api` already trusts the Clerk JWT verification logic that the Next.js routes use today — we add the same verifier (FastAPI dependency) on the new mobile endpoints. The Clerk JWKS URL is environment-config; no per-client divergence.
- Anonymous browsing is supported: feed and topic search work without a token. Bookmarks, push registration, and "Sift this URL" require sign-in.
- **No Sign in with Apple-specific path** in v1 because Apple requires SIWA *only* when the app offers third-party social sign-in. Since Clerk includes Apple as one of its providers, Apple's review guideline §4.8 is satisfied — confirm with the reviewer notes at submission.

---

## API contract

### Recommendation: single canonical API in `sift-api`

**Where this lands:** all iOS endpoints live in `sift-api` under `/v1/*`. The Next.js routes (`/api/news`, `/api/news/topic`, etc.) stay where they are *for the web app only* in the short term, but the long-term plan is to migrate the web to read from `sift-api` too, collapsing duplication.

**Why this, and not a split:**

- A mature publisher (NYT, WSJ, Bloomberg, Reuters) runs one content API consumed by every client. Per-client adapters live inside each client, not in the backend.
- `sift-api` already owns the write path *and* the data. Read endpoints there are colocated with the freshness signals (pipeline state, last-run timestamps) and avoid the Vercel function cold-start tax on user-visible reads.
- The Next.js routes are tied to App Router conventions and SSR — they're a poor surface to expose to a second client.
- "Mix" (iOS reads from Vercel, writes/compare to Railway) is a transient state during migration, never a target. Building it as a target means you'll unwind it later.

The cost: net-new Python endpoints to write in `sift-api`, and the web migration to schedule (it can lag — iOS doesn't wait on it).

### Endpoints required for v1

All endpoints are JSON. SSE endpoints stream `text/event-stream`. All require `X-Sift-Client: ios/1.0` for analytics + per-client rate budgeting; protected endpoints additionally require `Authorization: Bearer <clerk-jwt>`.

| Method | Path | Auth | Purpose | Mirrors today's web |
|---|---|---|---|---|
| `GET` | `/v1/feed?category=:id&limit=:n&after=:cursor` | none | Articles + stories for a category, cursor-paginated. Returns `NewsApiResponse` shape. | `sift/app/api/news/route.ts` |
| `GET` | `/v1/articles/:id` | none | Single article with full `ContextPrimer`, `entityLinks`, `outlet`. iOS uses this for share-extension follow-up and push deep links. | (new — web has it via the in-memory list) |
| `GET` | `/v1/topic?q=:query` (SSE) | none | Topic search streaming `results` / `done` / `error` events. Same payload shape as web. | `sift/app/api/news/topic/route.ts` |
| `GET` | `/v1/widget/today` | none | Compact feed shape (10 categories × top 1 story each, `title`, `sourceName`, `imageUrl`, `id`). Cacheable at edge for 5 min. | (new — widget-specific shape) |
| `POST` | `/v1/devices/register` | Clerk JWT | Register an APNs token + topic preferences. Body: `{ apnsToken, categories: CategoryId[], followedTopics: string[] }`. Idempotent on `apnsToken`. | (new) |
| `DELETE` | `/v1/devices/:apnsToken` | Clerk JWT | Unregister on sign-out or notif-permission revoke. | (new) |
| `GET` | `/v1/bookmarks` | Clerk JWT | List user bookmarks. | `sift/app/api/bookmarks/route.ts` |
| `POST` | `/v1/bookmarks` | Clerk JWT | Add a bookmark `{ articleId }`. | `sift/app/api/bookmarks/route.ts` |
| `DELETE` | `/v1/bookmarks/:id` | Clerk JWT | Remove a bookmark. | `sift/app/api/bookmarks/route.ts` |
| `POST` | `/v1/share/sift-this` | Clerk JWT (or anon w/ rate limit) | Sift an arbitrary URL: fetch → summarize → primer → entity-link, return an `Article` shape (not persisted to feed; per-user keyed in a new `share_artifacts` table). | (new — see §share extension) |

### Conventions

- **All responses are camelCase JSON.** sift-api currently mixes camel and snake in its Pydantic models; the new `/v1/*` surface is camelCase to match the iOS Swift expectations and the existing web client. Internal snake_case stays in the DB layer.
- **Dates are ISO-8601 strings**, not Unix timestamps. Matches what the web sends today.
- **Errors use `{ "error": string, "details"?: string, "code"?: string }`** — same as the existing `NewsApiError` shape.
- **Versioning:** anything in `/v1/*` is treated as a public contract. Breaking changes go to `/v2/*`. The iOS app pins to the major version at build time (`SiftAPI.basePath = "/v1"`).
- **Cursor pagination** uses opaque base64 cursors (`after=:cursor`), not page numbers. The cursor encodes `(publishedDate, id)` so paging is stable as new articles ingest.

### Backwards-compat for the web (no breakage in v1)

The web keeps reading from its current Next.js routes. The new `/v1/*` endpoints in sift-api are net-additive — nothing the web depends on changes. A separate plan (`docs/WEB_API_MIGRATION.md`, future) lays out moving the web off Next.js routes onto `/v1/*`; that's not blocked by, and doesn't block, the iOS ship.

---

## iOS-native features in v1

These are the four that earn the native app. Each gets a concrete v1 design.

### 1. Push notifications

**Trigger sources**

- **Breaking news in a subscribed category** — the pipeline node that writes a new article can flag `is_breaking: bool` based on a heuristic (TODO: which signals? Likely `importance_score > 0.9` + `published_within_last_30min`). For now: simple threshold, refined post-launch.
- **A followed topic has a new strongly-matching article** — user follows a topic (custom_topic in the existing schema); pipeline checks new articles against followed-topic embeddings; cosine ≥ 0.85 → push.

**Pipeline addition (in `sift-api`)**

- New table `device_registrations(apns_token text PRIMARY KEY, clerk_user_id text, categories text[], followed_topic_ids uuid[], created_at, last_seen_at)`.
- New workflow node `push_dispatcher` runs after `store` in `pipeline_workflow.py`. For each new article, computes the target audience and enqueues APNs sends.
- APNs sending via the `apns2` Python package, HTTP/2 with token auth. Apple Developer account: required ahead of time (4–8 weeks if not already enrolled).
- Per-user dedupe: max one push per user per 15 minutes per category, max 5/day across everything. Hard-coded for v1; user-tunable in v1.1.

**iOS app**

- Request notification permission on first launch *only* after the user shows intent (taps "Notify me when news breaks" in onboarding, not a cold prompt). Apple's HIG strongly discourages the cold permission ask.
- Notification payload includes `articleId` + category + a deep link (`sift://article/:id`).
- Tapping the notification opens the app directly to `ArticleDetailView` for that article — `AppRouter` handles the deep link.

**Out of scope for v1:** notification grouping/threading, rich notifications with images (defer until we see what the real engagement patterns look like — pretty notifications without earned trust will get muted).

### 2. "Today on Sift" home-screen widget

**Sizes:** small + medium for v1; large defers to v1.1.

**Small widget:** one story — the top story from the "Top" category. Headline (3 lines max), source name, category color dot. Tapping opens the article.

**Medium widget:** four stories arranged as a 2×2 — top stories from Top, Politics, Technology, Business (or user's first four "favorite" categories, set in app settings). Tap-target per cell.

**Timeline**

- WidgetKit `TimelineProvider` requests a snapshot at midnight local and every 4 hours after that.
- Each refresh hits `GET /v1/widget/today` (cached at edge for 5 min — same data for every device, no per-user shape in v1).
- Failure mode: timeline keeps the last successful snapshot for up to 24h; widget never goes blank, only goes stale.

**Out of scope for v1:** Lock Screen widget, StandBy widget, watchOS complication. Deferred to v1.1.

### 3. "Sift this URL" share extension

The use case: user is reading a link in Safari / Messages / Twitter and wants Sift to do its civic-literacy thing — *"what's the actual story, and what should I know about it?"*

**iOS side**

- `SiftShare` extension target, declared for `public.url` and `public.plain-text` activity types.
- The extension UI is a tiny SwiftUI sheet: "Sift this article?" + a spinner. Calls `POST /v1/share/sift-this` with the URL.
- On success, hands off to the main app via `UIApplication.open(sift://share/:artifactId)`. Main app deep-links to a temporary `ArticleDetailView` rendering the response.
- Failure modes (paywall, JS-rendered page, not-an-article): the extension shows a one-line reason and a "Try anyway" button that re-posts with `force: true`. Won't gold-plate this in v1 — the long-tail of weird pages is large.

**Backend side**

- New endpoint `POST /v1/share/sift-this { url }` in `sift-api`.
- Reuses the existing pipeline pieces in `services/`: a one-off invocation of `summarizer.summarize` + `embedder.embed` + the primer generator + entity_linker. No DB write to `articles` (the feed is curated from RSS, not user submissions); writes a row to a new `share_artifacts` table keyed by `(clerk_user_id, url_hash)` so repeats are cached for 7 days.
- Rate-limited: 10 / hour / signed-in user, 3 / hour / anon (anon goes through a soft IP-derived limit).
- LLM cost guardrail: a `max_share_artifacts_per_day_per_user` config (default 50) so a runaway abuser can't burn the Claude bill.

**Anti-abuse**

- URL allowlist *(not)*: we don't restrict URLs — restricting kills the use case. We rely on rate limits + a daily cost ceiling instead.
- Spam URLs (porn, malware) get caught by Claude's existing safety filters when summarization runs; we surface a generic "couldn't process this page" response rather than a content reason.

### 4. Offline reading / cached feed

The minimum that matters: a user on a subway shouldn't see a blank app.

**What's cached**

- The most recent successful `/v1/feed` response per category (10 categories × ~30 articles ≈ 300 article rows), persisted via SwiftData.
- For each cached article, the body of the latest `ContextPrimer` + `entityLinks` (small JSON, fine to inline).
- *Not cached:* original-source web content. Tapping "Read at source" while offline opens `SFSafariViewController` which handles offline gracefully (shows its own offline UI). We don't try to scrape and store source HTML.

**Behavior**

- On app launch: paint cached feed first, then revalidate against `/v1/feed` in the background. Web-style "stale-while-revalidate."
- A small "Last updated 14m ago" line under the category header. Stale > 2h → muted color; stale > 24h → "Showing yesterday's news" banner.
- Cache eviction: keep the most recent 7 days of articles, evict older. Cap total disk usage at 50 MB (images dominate — we ship a max image cache size to `AsyncImage`'s underlying cache).

**Bookmarks offline**

- Bookmark adds while offline queue locally in SwiftData and sync to `/v1/bookmarks` when network returns. Removes likewise. Conflict policy: client wins for v1 (a removed bookmark stays removed even if the server reinstated it from another device); we revisit if we see complaints.

---

## Cross-repo work

| Repo | What changes | Why |
|---|---|---|
| **`kristenmartino/sift-ios`** *(new)* | Entire iOS codebase: app, widget, share extension, tests, Fastlane, CI. | Net-new client. |
| **`kristenmartino/sift-api`** | Add `/v1/feed`, `/v1/articles/:id`, `/v1/topic`, `/v1/widget/today`, `/v1/devices/*`, `/v1/bookmarks/*`, `/v1/share/sift-this` endpoints. Add `device_registrations` + `share_artifacts` tables (init.sql + a migration). Add `push_dispatcher` workflow node + APNs sender. Move JSON shape to camelCase for `/v1/*` only. | Single-canonical-API decision lands here. |
| **`kristenmartino/sift`** | No required changes for iOS to ship. *Optional:* App Store / Open Graph banner ("Get the app") on the marketing page; deep-link verification (`apple-app-site-association` served at `/.well-known/apple-app-site-association`) so `siftnews.kristenmartino.ai/article/:id` links open the iOS app when installed. | Marketing + universal-links polish, not blocking. |

### Apple developer prerequisites (start now — these have lead time)

1. **Apple Developer Program enrollment** — $99/yr; 24–72h for personal, can be 4–8 weeks for new business entities. **Start in week 1.**
2. **App Store Connect app record** — needs a bundle ID, name ("Sift — News with Footnotes"?), category (News), age rating, privacy nutrition labels.
3. **APNs key (.p8)** — generate once, store in Railway env as `APNS_AUTH_KEY` for `sift-api`.
4. **Universal Links domain verification** — host `apple-app-site-association` JSON at `siftnews.kristenmartino.ai/.well-known/apple-app-site-association`.
5. **Privacy nutrition labels** — Sift collects: account info (Clerk), device identifiers (APNs token), product interaction (PostHog), crash data (Sentry). Draft these against the [App Store Connect questionnaire](https://developer.apple.com/app-store/app-privacy-details/) early; reviewer will check.
6. **App Review prep** — demo Clerk account credentials in reviewer notes, "Sign in not required to browse feed" explicitly called out, content moderation policy linked (the existing `/methodology` page is the right URL).

---

## Phasing & milestones

Eight working weeks to TestFlight, ten to App Store. Assumes 1 full-time iOS dev or 2 part-time, plus part-time backend availability in `sift-api` weeks 1–3.

### Week 1 — foundations

- Create `kristenmartino/sift-ios` repo, Xcode project, Swift Package `SiftCore`.
- Apple Developer enrollment kicked off.
- `sift-api`: scaffold `/v1` router, port `/api/news` semantics into `/v1/feed`, deploy. Camel-case JSON model wrappers in place.
- Smoke: iOS app loads `/v1/feed?category=top` and renders article titles in a `List`.

### Week 2 — feed + theme

- `FeedView` with category tabs (`TabView` + a horizontal scroller for the 10 categories).
- `ArticleCard` matches the web's text-first design; outlet badge; category color dot.
- Newsprint / Late Edition theme tokens; respect system appearance + a manual override in Settings.
- Pull-to-refresh; loading skeletons; error state.

### Week 3 — article detail + civic-literacy

- `ArticleDetailView` rendering the full primer, glossary chips with tap-to-expand tooltips, entity-link chips that link to the web dossier in `SFSafariViewController` (full native dossier views deferred to v1.1).
- Outlet badge tap → outlet dossier in `SFSafariViewController`.
- "Read at source" → `SFSafariViewController` with reader mode hint.

### Week 4 — search + bookmarks + auth

- Clerk iOS SDK integration; sign-in / sign-up flow.
- `TopicSearchView` with the SSE consumer (`SSEClient.swift`). Match-quality / fallback chips identical to web.
- Bookmarks UI; local store with SwiftData; `/v1/bookmarks` sync on sign-in.
- `sift-api`: `/v1/topic` SSE endpoint, `/v1/bookmarks` endpoints.

### Week 5 — offline cache

- SwiftData schema for cached articles.
- Stale-while-revalidate behavior on app launch.
- "Last updated" UI; offline banner.
- Cache eviction + size cap; verify on a low-storage device.

### Week 6 — push notifications

- `sift-api`: `device_registrations` table; `/v1/devices/register` + `DELETE`; `push_dispatcher` workflow node; APNs sender via `apns2`.
- iOS: `PushRegistrar` requests permission post-intent; foreground / background handling.
- End-to-end test: insert a flagged article via psql, observe APNs delivery on a real device.

### Week 7 — widget + share extension

- `SiftWidget` target; `/v1/widget/today` endpoint; small + medium widget layouts.
- `SiftShare` target; `/v1/share/sift-this` endpoint reusing existing summarizer + primer code; deep-link handoff.
- Both manually tested across light / dark / both Newsprint and Late Edition themes.

### Week 8 — polish + TestFlight

- Crash + analytics wiring (Sentry, PostHog).
- Privacy nutrition labels filled in App Store Connect.
- Universal links live (`apple-app-site-association` deployed).
- App icon (the diamond mark as a PDF, generated for all required sizes), launch screen.
- Submit to TestFlight; internal testers (you + design + 5 friends) onboarded.

### Weeks 9–10 — App Store submission

- Bug-fix from TestFlight feedback.
- Screenshots for App Store (6.7" + 6.1" + iPad Pro 12.9" minimum — the iPad shots can be "iPhone app, scaled" until v1.1).
- Reviewer notes prepared; demo account; methodology link.
- Submit for review; expect 1–3 day turnaround, plan for 1 round of resubmission.

### Post-launch

- Watch crash-free-session rate (target ≥ 99.5%), `/v1/feed` p95 latency (target ≤ 800ms cold), push delivery rate.
- Read user reviews daily for the first 2 weeks; mine for v1.1 priorities.

---

## Risks & open questions

| Risk / question | Mitigation / next step |
|---|---|
| **Apple Developer enrollment delays.** New entities can take 4–8 weeks. | Start week 1. No work blocks on it until TestFlight (week 8). |
| **App Store review of news apps + AI summarization.** Reviewers occasionally flag aggregators for §4.7 (content origin) or §5.2.1 (proper rights). | Methodology page + per-article source attribution + clear "read at source" affordance. We don't republish, we summarize-with-citation. Plenty of precedent (Apple News, Artifact). |
| **APNs cost & deliverability.** APNs is free; the cost is the LLM inference + DB queries that decide *who* to push to. | Per-user rate limits and a daily push budget. Monitor `push_dispatcher` p95 in week 6. |
| **"Sift this URL" abuse / cost runaway.** Each share triggers a Claude summarization + primer generation. | Hard daily budget per user; soft IP-based limit for anon. Telemetry on `share_artifacts` insert rate. |
| **Civic-literacy shape changes between now and ship.** The web civic pivot is mid-flight (`plans/sift-civic-literacy.md`). | iOS data models tolerate optional fields (`contextPrimer?`, `outlet?`, `entityLinks` defaulting to `[]`). API contract test catches shape drift in CI. We freeze the v1 iOS surface against the web shapes as of week 1 and treat civic-pivot field additions as additive. |
| **The web Next.js routes vs new `/v1/*` — drift between them.** | Long-term we migrate web to `/v1/*`. Short-term we just don't let drift happen — the new endpoints in `sift-api` reuse the same `lib/db.ts` query patterns (translated to Python). A small contract test in `sift` confirms `/api/news` and `/v1/feed` return semantically equivalent payloads for the same category. |
| **Open question: SwiftData under load.** SwiftData has rough edges in iOS 17.0–17.2 with large CloudKit-backed stores. | We're not using CloudKit (bookmarks sync goes through Clerk + sift-api, not iCloud). Local-only SwiftData has been stable. If it bites, fall back to Core Data. |
| **Open question: do we ship a dossier index in v1?** | Currently scoped out. Dossier *chips inside an article* link to the web `/dossier/...` page via `SFSafariViewController` — good enough for v1. Full native dossier views are v1.1. |
| **Open question: paywalled outlets in the feed.** | Same behavior as the web: Sift summary is shown; "Read at source" leads to a paywall the user sees. No change in v1. |

---

## Backlog for v1.1+

Tracked here so the v1 scope discussion has a destination for cut features. None of these block v1.

- **Multi-source compare** — port `/api/compare` SSE workflow; native UI for the framings comparison view.
- **Native civic dossier views** — politicians, orgs, bills, outlets. Today they open in `SFSafariViewController`; native pages give us deep-link smoothness + offline.
- **Civic dossier index browse** — equivalent of the web `/civic` page on iOS.
- **Live Activities** for developing stories — Dynamic Island + lock screen updates as a story evolves (new outlets, new claims surfaced by compare).
- **Lock Screen widgets + StandBy widget**.
- **Siri shortcuts / App Intents** — "Hey Siri, sift today" → opens to the Top tab; "Sift this" share intent for voice.
- **watchOS companion** — glance + complications; tap-through to phone for the article body.
- **iPad-optimized layout** — three-pane layout (categories / feed / detail), keyboard shortcuts.
- **Daily-briefing audio** — Claude-narrated summary of the top 5 stories with the civic footnotes inline. Pairs well with CarPlay.
- **Bookmark collections / read-later** — moving from a flat list of bookmarks to user-defined folders.
- **Reading-level toggle** — the `ReadingLevels` field on `Article` is already forward-declared in `lib/types.ts`. Render "Simpler / Default / Detailed" picker when the pipeline starts writing alternates.
- **OpenAPI spec + codegen** — when the manual TS↔Swift mirroring gets painful (probably around 50+ model fields), generate from an OpenAPI spec emitted by sift-api.
- **Migration of web to `/v1/*`** — own plan doc; not iOS-blocking.

---

## Appendix — file inventory at v1 ship (estimated)

- `sift-ios` — ~120 Swift source files, ~12k LOC (app + widget + share extension + tests + SiftCore package).
- `sift-api` — +12 net-new endpoints across 3 new routers (`mobile_feed.py`, `devices.py`, `share.py`), +2 tables, +1 workflow node, ~1,500 net-new LOC.
- `sift` — no required changes; +1 marketing banner + 1 well-known file if we wire universal links in v1 (~50 LOC).

---

*This plan supersedes the iOS section (currently empty) of `PROJECT_PLAN.md`. Once approved, the v1.1+ backlog above gets promoted to its own tracking doc, and the iOS-specific changes to `sift-api` move into that repo's `CLAUDE.md` orientation.*
