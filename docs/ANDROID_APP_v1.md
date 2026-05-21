# Sift Android — v1 plan

**Date:** 2026-05-20
**Status:** Active — phase 0 (decisions locked, scaffold pending)
**Companion docs:** [`IOS_VS_ANDROID.md`](./IOS_VS_ANDROID.md) (platform-first analysis), [`IOS_APP_ASSESSMENT.md`](./IOS_APP_ASSESSMENT.md) (the critique that shaped these decisions), [`HOW_IT_WORKS.md`](./HOW_IT_WORKS.md) (system end-to-end), `sift-api/docs/ASK_SIFT_PLAN.md`, `sift-api/docs/REFINED_COMPARE_PLAN.md`
**Sibling repos:** `kristenmartino/sift` (frontend) · `kristenmartino/sift-api` (backend) · `kristenmartino/sift-mcp` (MCP) · **`kristenmartino/sift-android`** *(new — to be created)*
**Stack:** Kotlin + Jetpack Compose + Material 3. Min SDK 26 (Android 8.0). Target SDK 35 (Android 15).

> **Amendment 2026-05-20:** v1 scope expanded to include Ask Sift agentic chat + Compare button (deterministic + Refined with lens). Timeline grew from ~10 weeks to ~12 weeks. Reasoning: without Ask Sift, native mobile is a polished reader competing with generic news apps; WITH Ask Sift it's a civic-literacy agent on the phone — the wedge that justifies native vs PWA. See updated v1 scope below.

> This plan is built from the iOS critique forward, not the iOS plan forward. Same surface, different lens: KPIs are at the top, monetization paragraph is in writing, design work is a named blocker, and the scope is justified explicitly — not inherited from a "feature parity" instinct.

---

## TL;DR — decisions locked

| Decision | Choice | Why |
|---|---|---|
| **Platform first** | **Android** | Apple Developer enrollment in flight; window has zero opportunity cost. Civic-literacy mission aligns with reach. Per `IOS_VS_ANDROID.md` Path A. |
| **Scope** | **Reader + share extension + Ask Sift agent chat + Compare button (deterministic + Refined)** | Civic-literacy differentiator goes native. ~10–12 week build. The agent chat is what justifies native vs PWA. |
| **Stack** | Native Kotlin + Jetpack Compose + Material 3 | Same reasoning as iOS native: best feel, full native API access. Not Compose Multiplatform — that was explicitly rejected in `IOS_VS_ANDROID.md`. |
| **API** | Reuse Next.js routes (per D33 in `DECISIONS.md`) + 4 net-new endpoints in `sift-api` (`/v1/share/sift-this`, `/v1/devices/register`, `/api/ask`, `/api/compare` with `lens`) | Don't proliferate a canonical API until a third client validates the surface. |
| **Min / Target SDK** | 26 / 35 | API 26 covers ~96% of active devices; gives us notification channels, scoped storage, share-target improvements. API 35 required by Play Store. |
| **Auth** | Clerk Android SDK | Matches web + future iOS. Same `Authorization: Bearer <jwt>` posture. |
| **Distribution** | Google Play Console (internal → closed → production) | $25 one-time fee, ~instant approval. No 4–8wk enrollment wait. |
| **Agent loop architecture** | **Server-side** (sift-api hosts the agent; mobile streams SSE) | Cost control + system-prompt iteration + Anthropic-key safety all easier server-side. Mobile never embeds an LLM key. |

## North-star KPIs (set from the start)

The single biggest lesson from the iOS plan critique: targets before code. These go into `KPIS.md` once Android is shipping data. Below this bar, "Android shipped" was a feature delivery, not a result.

| Metric | Target | When measured |
|---|---|---|
| D30 retention (Android) | ≥ 20% | Month 1 onward |
| Push opt-in rate | ≥ 50% | First 90 days |
| Push CTR | ≥ 4% | First 90 days |
| Share-extension uses per WAU | ≥ 2 | Month 1 onward |
| Web → Android install rate (via universal-link banner) | ≥ 8% | Month 2 onward |
| Android share of total WAU within 6 mo of launch | ≥ 30% | Month 6 |
| % sessions with ≥ 1 primer expand OR entity chip tap | ≥ 40% | Day 1 onward |
| **Ask Sift sessions per WAU** | **≥ 1** | **Month 1 onward** |
| **Ask Sift conversation completion rate** | **≥ 60%** | **First 90 days** |
| **Compare button taps per WAU** | **≥ 2** | **Month 1 onward** |
| **Refined Compare usage / total Compare usage** | **≥ 25%** | **First 90 days** |
| **Citation tap-through rate (from agent responses)** | **≥ 15%** | **Month 1 onward** |
| Crash-free session rate | ≥ 99.5% | Continuous |

## Monetization stance (set from the start)

Sift is **free through 2026**. Subscription exploration in 2027 contingent on hitting D30 ≥ 20%. Until then, every Android user is a net infra cost (~$0 fixed + per-user Claude inference on shares + agent loop conversations).

**Cost guardrails baked into v1:**
- `share-this-url` per-user daily cap of **20 calls**
- **Ask Sift / Refined Compare per-user-day cap: $5 signed, $2 anon** (shared budget pool); global daily ceiling $50 with alarm at $30
- **Per-turn hard cap $0.50** on agent loop (defense against runaway tool calls)
- Daily budget alarm at $30/day in Claude spend from sift-api Anthropic dashboard
- Push notification ceiling: max 5/day/user, max 1/15min/category
- Kill-switch env `ASK_SIFT_DISABLED=true` disables both `/api/ask` and the Refined Compare path instantly without a redeploy

---

## v1 scope

### In v1 (reader + share extension + agentic surfaces)

- **Feed across 10 categories** — Top, Technology, Business, Science, Energy, World, Health, Politics, Sports, Entertainment. Pull-to-refresh; pagination via opaque cursor.
- **Article detail** — title, summary, civic-literacy primer panel (expandable Material 3 ExpansionPanel), inline glossary chips (SuggestionChips with bottom-sheet tooltip), outlet badge (AllSides + MBFC ratings), entity-link chips. "Read at source" opens Custom Tabs (Chrome Custom Tabs, not WebView).
- **Topic search** — vector + Claude `web_search` fallback. SSE consumer via OkHttp's `EventSource`. Match-quality + fallback chips identical to web.
- **Bookmarks** — synced via Clerk + sift-api. Local-first via Room; sync queue for offline writes.
- **Theming** — Newsprint (light) + Late Edition (dark), tracking system appearance by default, with Settings override.
- **Ask Sift agentic chat** (new in v1 scope) — native Compose chat screen at the bottom-nav "Ask" tab. Sends user messages to `POST /api/ask`; consumes SSE stream with tool-call visibility ("Searching articles…" inline chips) and citation rendering (every tool-derived claim links to article detail). Stop-generation button, cap-hit / rate-limit / error states. Anonymous trial; Clerk-signed-in for sustained use. See `sift-api/docs/ASK_SIFT_PLAN.md`.
- **Compare button (deterministic + Refined)** (new in v1 scope; previously v1.1) — "Compare" button on `ArticleDetailScreen`. Opens a `CompareScreen` with outlet-by-outlet framing cards. The screen has a "Focus on…" text input: empty → deterministic `/api/compare` (current `compare_outlets` behavior); filled → Refined Compare agent path (lens-driven). Same endpoint, presence of `lens` parameter routes the backend. See `sift-api/docs/REFINED_COMPARE_PLAN.md`.

### iOS-native equivalent features for Android

| iOS plan v1 feature | Android v1 equivalent | Notes |
|---|---|---|
| Push notifications | **Firebase Cloud Messaging (FCM)** | Same UX: opt-in on intent (not first launch), category + followed-topic filters, dedup ≤ 1/15min/category, ≤ 5/day. |
| "Today on Sift" widget | **Glance widget (Compose-based)** in v1.1 | Deferred from v1 — adds a week and isn't a primary engagement surface. v1 has Quick Tile (Android equivalent of iOS Control Center) only. |
| "Sift this URL" share extension | **Share-target Activity** | `<intent-filter>` for `ACTION_SEND` with `text/plain` and `text/x-uri`. Receives URL, opens Sift, calls `/v1/share/sift-this`. |
| Offline cached feed | **Room cache + WorkManager periodic sync** | Same stale-while-revalidate behavior. 7-day cache, 50MB cap. |
| Ask Sift on iOS (future) | **Same architecture** | When iOS lands (Q4 2026), it inherits Ask Sift via the same REST/SSE endpoint. The agent backend is platform-agnostic. |

### Explicitly *not* in v1 — see [Backlog](#backlog-for-v11)

- Glance home-screen widget (v1.1 — earns its place once base reader has signal)
- Civic dossier index (`/civic` equivalent) — chips link to web dossier in Custom Tabs
- Live Activities equivalent (Android Live Updates landed in API 35 but tooling is immature)
- Wear OS companion
- Tablet-optimized layout (works on tablets, just not designed for them in v1)
- Daily-briefing audio (TalkBack-friendly text-to-speech reading; v1.2)
- Conversation persistence for Ask Sift (history of past chats) — v1.1
- Multi-lens Refined Compare (lens is single-string in v0)

---

## Architecture

### Stack choices (with brief justification)

| Concern | Choice | Why this, not the alternative |
|---|---|---|
| UI | Jetpack Compose + Material 3 | Standard for new projects since 2024. Faster iteration than XML+View. |
| Architecture pattern | Single Activity + Compose Navigation, ViewModels with `StateFlow` (MVI-ish) | Convention. Easy testing. Clear lifecycle. |
| DI | Hilt | De-facto Android standard. Compile-time validation. Solo-dev cost is low. |
| Networking | Retrofit + OkHttp + kotlinx.serialization | Battle-tested. Coroutines-first. OkHttp's `EventSource` handles SSE for both topic search AND Ask Sift agent streams. |
| Persistence | Room (with KSP) | Better tooling than SQLDelight for Android-only. Type-safe queries. |
| Image loading | Coil 3 | Kotlin-first, Compose-native, smaller footprint than Glide for new projects. |
| Concurrency | Kotlin coroutines + Flow | Standard. No RxJava. |
| Auth | Clerk Android SDK | Matches web + future iOS. SDK handles OAuth + JWT refresh. |
| Push | Firebase Cloud Messaging (FCM) | Free, standard. Required for Play Store delivery. |
| Background work | WorkManager | Standard for periodic background tasks. Handles Doze + battery optimization. |
| Analytics | PostHog Android SDK | Matches web. |
| Crash reporting | Sentry Android SDK | Matches sift web. |
| Testing | JUnit 5 + MockK + Compose UI Test + Turbine (for Flow testing) | Standard. |
| Code style | ktlint via Spotless Gradle plugin | Auto-formats on `./gradlew spotlessApply`. |
| CI | GitHub Actions + Gradle Build Action | Free for public repos. Caching for fast builds. |

### Module layout

Single `app` module for v1 (multi-module split is premature optimization for solo work):

```
sift-android/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── kotlin/ai/kristenmartino/sift/
│       │   │   ├── SiftApplication.kt          # @HiltAndroidApp; Sentry + PostHog init
│       │   │   ├── MainActivity.kt             # Single activity, ComponentActivity, sets Compose content
│       │   │   ├── data/
│       │   │   │   ├── api/                    # Retrofit interfaces + SSE clients (topic search, Ask Sift, Refined Compare)
│       │   │   │   ├── db/                     # Room database + DAOs
│       │   │   │   ├── model/                  # Domain models (mirror sift/lib/types.ts)
│       │   │   │   └── repository/             # ArticleRepository, BookmarkRepository, AgentRepository, CompareRepository
│       │   │   ├── di/                         # Hilt modules — NetworkModule, DatabaseModule, etc.
│       │   │   ├── nav/                        # Compose Navigation (NavGraph, Destinations)
│       │   │   ├── ui/
│       │   │   │   ├── theme/                  # Color, Type, Theme.kt (Newsprint / Late Edition tokens)
│       │   │   │   ├── feed/                   # FeedScreen, FeedViewModel, components
│       │   │   │   ├── article/                # ArticleDetailScreen, primer, entity chips
│       │   │   │   ├── search/                 # TopicSearchScreen, SSE consumer wiring
│       │   │   │   ├── ask/                    # AskScreen (Ask Sift chat) — streaming consumer, tool-call chips, citations
│       │   │   │   ├── compare/                # CompareScreen, outlet cards, Focus-on input (Refined Compare)
│       │   │   │   ├── bookmarks/              # BookmarksScreen, sync state UI
│       │   │   │   ├── share/                  # ShareTargetActivity — receives ACTION_SEND
│       │   │   │   ├── settings/               # SettingsScreen — theme override, notif prefs, sign-out
│       │   │   │   └── common/                 # SiftCard, OutletBadge, GlossaryChip, ToolCallChip, CitationLink, etc.
│       │   │   ├── push/                       # FCMService, device-registration sync
│       │   │   ├── work/                       # WorkManager workers (sync feed cache, sync bookmarks)
│       │   │   └── auth/                       # Clerk Android SDK wrapper
│       │   └── res/
│       │       ├── values/                     # strings.xml, themes.xml (Material 3 dynamic color opt-out)
│       │       ├── values-night/               # Late Edition dark mode
│       │       ├── drawable/                   # Diamond mark vector
│       │       └── mipmap-*/                   # Launcher icons (adaptive icon)
│       └── test/                                # Unit tests
│           └── androidTest/                     # Compose UI + integration tests
├── build.gradle.kts                            # Root, plugins block
├── settings.gradle.kts                         # plugin repos, project includes
├── gradle.properties                           # AndroidX, JVM args
├── gradle/
│   └── libs.versions.toml                      # Version catalog — single source of truth for deps
└── .github/workflows/android-ci.yml
```

New directories vs original plan: `ui/ask/` (Ask Sift chat UI) and `ui/compare/` (Compare screen with Refined Compare integration).

### Data model

Domain models are Kotlin data classes mirroring `sift/lib/types.ts`. Same JSON shape, same field names (kotlinx.serialization with `@SerialName` for camel/snake mapping where needed).

Source of truth: `sift/lib/types.ts`. Kept in sync by:
1. A unit test that decodes a recorded fixture from each API endpoint into the Kotlin model — fails loudly when the API ships an unexpected shape.
2. A `make sync-models` script that prints a TS↔Kotlin field diff. Cheap heuristic, not codegen.

New domain models for v1:
- `AskMessage`, `AskRequest`, `AskSSEEvent` (text / tool_use / tool_result / done / error) for Ask Sift
- `CompareRequest` (with optional `lens` field), `CompareResponse` (refined: `outlets[]`, `summary`, `lens_coverage_quality`, etc.)

Codegen via OpenAPI is deferred to v1.1 once the field count crosses ~50 and manual drift starts hurting.

### Theming — Newsprint + Late Edition

Web colors live as CSS custom properties in `sift/app/globals.css`. Android mirrors them as a `Theme.kt` module:

```kotlin
object SiftColors {
    val Newsprint = lightColorScheme(
        primary = Color(0xFF1E1B16),    // warm-stone
        background = Color(0xFFF5F1E8), // newsprint paper
        // ... mirror the rest from globals.css
    )
    val LateEdition = darkColorScheme(/* ... */)
}
```

Values **copied, not computed** — design drift between web and Android is intentional, not accidental. Future v1.2 task: extract the palette into a JSON token file in `sift/` that both web and Android consume.

### Civic-literacy translation to Android

The biggest design risk from the iOS critique: civic-literacy doesn't translate to phone-sized progressive disclosure as-is. Same risk on Android. With Ask Sift + Compare, civic-literacy now has THREE touchpoints, not one:

**v1 design pattern (informed by Material 3 conventions):**

- **Primer panel** (`articles.context_primer`) — collapsed by default below the article summary as a Material 3 ExpansionPanel. Headline: *"What you should know first"*. Expand reveals the background paragraph + 0–4 term cards.
- **Glossary chips** (terms inside primer) — Material 3 SuggestionChips. Tap opens a ModalBottomSheet with definition + "Open full dossier" CTA → Custom Tabs to `/dossier/...` on the web (native dossier pages are v1.2).
- **Entity chips** (`articles.entity_links`) — same SuggestionChip pattern, distinct color (uses the article's category accent). Tap → Custom Tabs to the dossier page.
- **Outlet badge** (AllSides / MBFC ratings) — Material 3 Badge below the source name. Tap → outlet dossier in Custom Tabs.
- **Ask Sift screen** — bottom-nav "Ask" tab. Chat surface with streaming response, inline tool-call chips, citation links to article detail. Empty state shows 3 example prompts ("Compare how outlets covered the most recent FERC ruling", "Who funds Senator X's campaign?", "What happened in energy policy this week?").
- **Compare screen** — reached from article detail "Compare" button. Outlet-by-outlet cards. "Focus on…" text input above the cards: empty → deterministic (all claims grouped); filled → Refined Compare via agent loop (lens-driven framings).

**Design sprint**: 1 week before week 1 of engineering. Wireframes for the SIX touchpoints above + the share-target receiver flow + the new Ask + Compare screens. Anti-pattern to avoid: a wall of text under a sticky header. Use the sprint output as the visual reference; defer Figma-to-code production until week 2.

### Auth — Clerk Android SDK

- Sign-in flow opens Clerk's SDK-provided UI (Apple, Google, email — same providers web allows).
- Post-sign-in, SDK exposes session JWT. Every authenticated request to `/v1/*` and `/api/ask` and `/api/compare` carries `Authorization: Bearer <jwt>`.
- Anonymous browsing supported: feed, topic search, and limited Ask Sift / Refined Compare work without sign-in (with aggressive per-IP rate limits). Bookmarks, push registration, "Sift this URL", and full Ask Sift / Refined Compare quota require sign-in.

---

## API contract

Per [`DECISIONS.md#D33`](./DECISIONS.md), we don't build a canonical `/v1/*` API in `sift-api` for this client. Android reads from the existing Next.js routes; net-new endpoints in `sift-api` are scoped to genuinely new functionality.

| Method | Path | Owner | Auth | Purpose |
|---|---|---|---|---|
| `GET` | `https://siftnews.kristenmartino.ai/api/news?category=:id&limit=:n&after=:cursor` | sift (Next.js) | none | Feed |
| `GET` | `https://siftnews.kristenmartino.ai/api/news/topic?q=:query` (SSE) | sift (Next.js) | none | Topic search |
| `GET` | `https://siftnews.kristenmartino.ai/api/bookmarks` | sift (Next.js) | Clerk JWT | List bookmarks |
| `POST` | `https://siftnews.kristenmartino.ai/api/bookmarks` | sift (Next.js) | Clerk JWT | Add bookmark |
| `DELETE` | `https://siftnews.kristenmartino.ai/api/bookmarks/:id` | sift (Next.js) | Clerk JWT | Remove bookmark |
| `POST` | `https://sift-api-production.up.railway.app/v1/share/sift-this` | **sift-api (new)** | Clerk JWT (or anon w/ rate limit) | Process arbitrary URL via pipeline |
| `POST` | `https://sift-api-production.up.railway.app/v1/devices/register` | **sift-api (new)** | Clerk JWT | Register FCM token + topic/category prefs |
| `POST` | `https://sift-api-production.up.railway.app/api/ask` (SSE) | **sift-api (new)** | Clerk JWT (or anon w/ rate limit) | Ask Sift agentic chat. Body: `{messages, session_id?}`. Returns SSE stream (text, tool_use, tool_result, done, error). |
| `POST` | `https://sift-api-production.up.railway.app/api/compare` | **sift-api (new path on existing endpoint)** | Clerk JWT (or anon w/ rate limit) | Outlet comparison. Body: `{topic, lens?, outlets?}`. Empty `lens` → deterministic path; filled → Refined Compare agent loop. |

The four new endpoints in sift-api are scoped to the Android work + the agentic surfaces — they're the genuinely new functionality. Everything else is reused.

### Conventions

- All responses are camelCase JSON (matches existing).
- ISO-8601 dates as strings.
- Cursor pagination via opaque base64.
- Errors: `{ "error": string, "details"?: string }` — matches `NewsApiError`.
- Android sends `User-Agent: Sift-Android/1.0` + `X-Sift-Client: android/1.0`.
- API base URL is configurable per build variant (debug → staging if/when we add one; release → prod).
- SSE event shapes for `/api/ask` documented in `sift-api/docs/ASK_SIFT_PLAN.md`.

---

## Cross-repo work

| Repo | What changes | Status |
|---|---|---|
| **`kristenmartino/sift-android`** *(new)* | Entire codebase: app, share-target, FCM service, **Ask screen + Compare screen**, tests, CI. ~15–18k LOC at v1 ship estimate. | To be created |
| **`kristenmartino/sift-api`** | Add `POST /v1/share/sift-this`, `POST /v1/devices/register`, **`POST /api/ask` (agent endpoint, SSE)**, **`POST /api/compare` with `lens` param (Refined Compare agent path)**. Add `device_registrations` + `share_artifacts` tables. Add `push_dispatcher` workflow node + FCM sender. Land merge of sift-mcp into sift-api (handlers used by both agent loops). | Net-new — weeks 5–8 of phasing below |
| **`kristenmartino/sift`** | Web `/ask` chat UI; Compare button gains "Focus on…" input (Refined Compare). Optional: "Get it on Google Play" banner; Android App Link verification (`/.well-known/assetlinks.json`). | Web `/ask` + Compare input land alongside backend in weeks 6–8; banner/App Link optional |

### Google Play prerequisites

Order these in week 1 of engineering so they don't bottleneck week 11.

1. **Google Play Developer Account** — $25 one-time. Apple wishes its enrollment were this fast.
2. **FCM project** — Firebase console, register app, download `google-services.json`. Free up to 100M messages/day.
3. **App signing key** — generate via Android Studio, store in 1Password. Play App Signing handles key escrow if you opt in.
4. **App Links verification** — Generate the digital asset links JSON. Host at `siftnews.kristenmartino.ai/.well-known/assetlinks.json` (sift repo task).
5. **Privacy policy URL** — Required by Play Store. The existing `/privacy` page suffices; verify it covers Android-specific data collection (FCM token, device identifier).
6. **Data safety form** — Play Console's privacy questionnaire. Sift collects: account info (Clerk), device identifier (FCM token), product interaction (PostHog), crash data (Sentry). Pre-fill answers.
7. **AI-summarization disclosure** — Reviewer notes explain Ask Sift's grounding policy (tools query Sift's index; no training-data assertions about real entities; citations enforced). Methodology page linked.

---

## Phasing & milestones

10–12 weeks to closed beta, 12–14 to production. Assumes 1 full-time solo dev or 2 part-time. Bracketed estimates include design sprint pre-week-1.

### Pre-week 1 — design sprint (1 week)

- Wireframes for: feed grid, article detail with primer + entity chips, topic search, bookmarks list, share-target receiver flow, settings, **Ask Sift chat screen, Compare screen with Focus-on input**.
- Theme tokens documented (mirror web Newsprint / Late Edition).
- Loaner Android device or emulator setup (Pixel 9 image is the test target).

### Week 1 — foundations

- `sift-android` repo created. Gradle init via local Claude (per Phase 1 of this plan).
- Hilt + Retrofit + OkHttp + kotlinx.serialization wired.
- First Retrofit call: `GET /api/news?category=top` rendering a `LazyColumn` of titles. No styling yet — verify the wire works.
- GitHub Actions CI: ktlint + unit tests + Gradle build matrix.
- Google Play Developer account application submitted.
- FCM project created.

### Week 2 — feed + theme

- `FeedScreen` with category tabs (HorizontalPager + TabRow).
- `SiftArticleCard` matches the web's text-first design. Outlet badge. Category color dot.
- Newsprint / Late Edition theme tokens; respect system appearance + Settings override.
- Pull-to-refresh, loading skeletons (Compose Placeholder modifier), error state.

### Week 3 — article detail + civic-literacy

- `ArticleDetailScreen` rendering primer, glossary chips, outlet badge, entity chips.
- Custom Tabs (Chrome Custom Tabs) for "Read at source" and dossier links.
- Material 3 ExpansionPanel + ModalBottomSheet patterns.

### Week 4 — search + bookmarks

- `TopicSearchScreen` with the OkHttp `EventSource` SSE consumer.
- Match-quality / fallback chips identical to web.
- Bookmarks UI; Room schema; sync with `/api/bookmarks`.

### Week 5 — auth + sift-api merge backbone

- Clerk Android SDK integration.
- Sign-in flow + JWT carry on protected endpoints.
- Anonymous browsing path verified.
- **Backend**: `sift-api` #62 Phase 0 (merge source) + Phase 1 (cost caps) ships. Handlers now live in sift-api ready for agent loop integration.

### Week 6 — offline cache + Ask Sift backend

- Room schema for cached articles.
- Stale-while-revalidate on app launch.
- "Last updated" UI; offline banner.
- WorkManager periodic sync (15-min intervals, only on unmetered network unless user opts in to "always sync").
- **Backend**: `POST /api/ask` agent endpoint ships. Anthropic Messages API + 5 tools wired. SSE streaming. Cost cap integration. Eval set initial pass (50 prompts).

### Week 7 — Ask Sift Android UI + share target

- **`AskScreen`** with OkHttp EventSource SSE consumer. Streaming text + inline tool-call chips + citation links to `ArticleDetailScreen`. Empty state with 3 example prompts. Stop-generation button. Cap-hit / error states.
- `<intent-filter android:name="android.intent.action.SEND" />` on a dedicated `ShareTargetActivity`.
- `sift-api`: `POST /v1/share/sift-this` — fetch URL → summarize → primer → entity-link, return `Article` shape, store in `share_artifacts` table (per-user, 7-day cache).
- Anonymous rate limit, signed-in rate limit (20/day per user).

### Week 8 — Refined Compare (backend + UI) + push (FCM)

- **Backend**: `POST /api/compare` gains `lens` parameter; agent path implementation. Reuses Ask Sift backbone (Anthropic SDK, tool layer, cost caps).
- **Android**: `CompareScreen` reached from article detail. Outlet cards. "Focus on…" input that toggles deterministic ↔ Refined Compare paths. Citation rendering.
- **Backend**: `device_registrations` table, `POST /v1/devices/register`, `push_dispatcher` workflow node, FCM sender.
- **Android**: `FirebaseMessagingService` subclass, notification channels per category, permission request post-intent (not first launch).
- E2E test: insert flagged article via psql, observe FCM delivery on a real device.

### Week 9 — polish + Play Console listing

- Crash + analytics wiring (Sentry, PostHog).
- Privacy nutrition labels (Data Safety form) filled.
- App Links verification deployed.
- App icon (diamond mark adaptive icon), splash screen.
- Internal testing track populated (you + 5 friends).
- AI-summarization reviewer notes drafted (Ask Sift grounding policy, methodology link).

### Week 10 — closed beta

- Open beta via "Closed testing" track (up to 100 testers).
- Bug-fix from internal feedback.
- Performance sweep — verify cold start ≤ 1.5s on Pixel 9, p95 frame time ≤ 16ms on feed scroll.
- **Eval set check**: 50-prompt Ask Sift eval re-run; verify ≥ 90% citation rate, no uncited entity claims in spot check.

### Weeks 11–12 — polish + agent-loop hardening

- Bug-fix from closed beta.
- Tune Ask Sift system prompt based on real user transcripts (privacy-safe sampling).
- Refined Compare eval (30 lens+topic pairs) re-run; verify lens-relevance ratio ≥ 0.9.
- Cost telemetry validated: per-conversation cost surfacing, cap-hit rates within expected bounds.

### Weeks 13–14 — production submission

- Screenshots for Play Store (phone 6", tablet 7" + 10").
- Reviewer notes; demo account; AI-summarization disclosure.
- Submit to production. Play Store review: typically 1–3 days, expect 1 round of resubmission.

### Post-launch

- Watch crash-free-session rate (≥ 99.5%), cold start p95, push delivery rate (FCM dashboard), web→app install rate, **Ask Sift session-per-WAU, Compare button taps, citation tap-through rate**, agent loop cost trajectory.
- Read user reviews daily for first 2 weeks; mine for v1.1 priorities.

---

## Risks & open questions

| Risk / question | Mitigation / next step |
|---|---|
| **Solo dev burnout on a 12-week build.** | Time-box by week. If week 4 isn't done by end of week 5, cut topic search to v1.1. If week 8 (Refined Compare) is slipping, ship Compare as deterministic-only and add lens path post-launch. |
| **API drift between this client and `sift/lib/types.ts`.** | Contract test in `sift-android/app/src/test/` decodes recorded fixtures. Runs on every PR. |
| **Civic-literacy UX doesn't translate.** | Design sprint pre-week-1 is non-negotiable. Six touchpoints to wireframe; defer anything that doesn't pass a "would I read this on a phone" sniff test. |
| **FCM cost runaway from `/v1/share/sift-this`.** | 20/day/user signed-in cap. Daily $30 Anthropic budget alarm. Per-user `share_artifacts` 7-day cache. |
| **Ask Sift cost runaway from abusive users.** | Per-turn $0.50 hard cap. Per-user-day $5 signed / $2 anon. Global $50/day ceiling with alarm at $30. Kill-switch env `ASK_SIFT_DISABLED=true` for instant disable. Email-gated signin for sustained use. |
| **Ask Sift hallucination on civic content.** | System prompt mandates tool-grounded answers. Output filter strips uncited entity claims. Citation density target ≥ 1 per real-entity claim. 50-prompt eval set with weekly regression check. Methodology paragraph public. |
| **Refined Compare lens-relevance drift.** | 30 lens+topic eval pairs. Lens-relevance ratio target ≥ 0.9. Schema enforcement via Pydantic; agent retries up to 2x if output invalid. |
| **Play Store rejects AI-summarization app under content rights.** | Methodology page + per-article source attribution + Custom Tabs for "Read at source." Reviewer notes explain grounding policy. Play Store has been more permissive than App Review on AI summarizers in 2026 but not zero-friction. |
| **Play Store rejects AI chat under content moderation.** | Reviewer notes pre-emptively cover: agent only references Sift's curated index (no general LLM Q&A); grounding policy + citation enforcement; cost caps prevent abuse; kill-switch documented. |
| **Civic data shape changes during v1.5 web pivot.** | Models tolerate optional fields. Contract test catches drift. Freeze v1 Android against web shapes as of week 1; treat civic-pivot field additions as additive only. |
| **Latency complaints on Ask Sift (5–30s per turn).** | Streaming progress (tokens within ~2s). Inline tool-call chips so users see the agent is grounded, not stuck. Cap turn at 30s; surface cost-cap-hit messages clearly. |
| **Open question: cross-platform reuse when iOS lands.** | None of v1 is shared. By the time iOS starts (Q4 2026), KMP / Compose Multiplatform may have matured enough to factor common Kotlin into a shared module. Reassess at iOS week 0. |
| **Open question: Glance widget priority.** | v1 deliberately defers Glance widget. Decide at v1.1 based on whether feed engagement signals demand it. |
| **Open question: Ask Sift conversation persistence.** | Out of v1 scope. session_id field reserved in API for v1.1 add. |

---

## Backlog for v1.1+

Tracked here so v1 scope discussions have a destination for cut features. None of these block v1.

- **Native civic dossier views** — politicians, orgs, bills, outlets. Today they open in Custom Tabs.
- **Glance home-screen widget** ("Today on Sift") — small + medium sizes.
- **Ask Sift conversation persistence** — saved threads, history.
- **Ask Sift voice input** — speech-to-text → chat.
- **Multi-lens Refined Compare** — compare on multiple lenses simultaneously.
- **Lens templates / saved-lens shortcuts** for Refined Compare.
- **Wear OS companion** — glance + complications.
- **Tablet-optimized layout** — three-pane (categories / feed / detail).
- **Live Updates** (Android 15 API 35) — for developing stories.
- **TalkBack-friendly text-to-speech briefing** — daily 5-minute audio of top stories.
- **Bookmark collections / read-later** — folders, tags.
- **Reading-level toggle** — once `ReadingLevels` field on `Article` is populated by the pipeline.
- **KMP / Compose Multiplatform refactor** — shared core when iOS lands.
- **Direct migration of web to read from `sift-api`** — collapsing into a canonical API; see D33.

---

## File inventory at v1 ship (estimated)

- `sift-android` — ~120 Kotlin source files, ~15–18k LOC (app + share-target + FCM service + Ask + Compare screens + tests).
- `sift-api` — +4 net-new endpoints (`/v1/share/sift-this`, `/v1/devices/register`, `/api/ask`, `/api/compare` w/ lens), +2 tables (`share_artifacts`, `device_registrations`), +1 workflow node (push_dispatcher), +FCM sender, +sift-mcp merge. ~2,500 net-new LOC.
- `sift` — web `/ask` chat UI, Compare button gains "Focus on…" input. ~1,500 net-new LOC. Plus optional: 1 Get-on-Google-Play banner + `.well-known/assetlinks.json`.

---

## How this plan differs from the iOS plan

Quick reference for the cross-functional critique that shaped this doc:

| iOS plan v1 issue | How Android v1 addresses it |
|---|---|
| KPIs in appendix | KPIs in §2, before architecture; includes Ask Sift + Compare engagement metrics |
| No monetization paragraph | §3 Monetization stance — explicit "free through 2026, subscription explore in 2027 contingent on D30 ≥ 20%", with shared budget pool for Ask Sift + Refined Compare |
| No design sprint budgeted | Pre-week-1 design sprint named as non-negotiable; six touchpoints called out including Ask Sift + Compare screens |
| Apple Developer enrollment lead time understated | Google Play account is $25/instant; week 1 task |
| Parity-shaped 4-feature scope | Reader + share extension + Ask Sift chat + Compare button (deterministic + Refined). Ask Sift is the differentiator that justifies native vs PWA. |
| Premature canonical `/v1/*` API | Reuse Next.js routes; 4 net-new endpoints in sift-api (share, device-register, ask, compare-with-lens) |
| Civic-literacy as feature, not headline | Civic-literacy translation has six touchpoints (primer, glossary chips, entity chips, outlet badge, **Ask Sift chat**, **Compare screen**); called out as "biggest design risk" |
| Lawyer review only at submission | Lawyer 30-min consult before "Sift this URL" ships (week 7), not at week 12 |
| Generic news app risk | Ask Sift agentic chat as the v1 wedge — civic-literacy agent on the phone, not just a reader |

---

*This plan supersedes the Android-related sections of `IOS_VS_ANDROID.md`. Once approved, Phase 1 (local Claude scaffold via meta-prompt) and Phase 2 (web Claude application code) begin.*
