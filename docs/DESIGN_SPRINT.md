# Sift Mobile — Design Sprint v0

**Date:** 2026-05-20
**Status:** Draft — first pass. Sprint output for the pre-engineering design phase named in [`ANDROID_APP_v1.md`](./ANDROID_APP_v1.md) §6 as "non-negotiable pre-week-1."
**Scope:** Android v1 first; patterns generalize to iOS v1.
**Owner:** Kristen + Claude

> The hardest question in the iOS plan critique: *"How does civic-literacy translate to a 6.1" portrait screen with thumbs-on-bottom ergonomics?"* This doc answers it. Six screens, the IA + interaction model for each, low-fi wireframes, and the open questions that need real visual mocks before we ship.

---

## TL;DR — the civic-literacy translation problem

Civic-literacy on the web has space. Each article page has:

- 250–800 word summary
- 60-word "What you should know first" primer + 0–4 term cards
- 6+ entity-link chips inline in the body
- Outlet badge with AllSides + MBFC ratings
- Cross-spectrum framing comparison (when story threading clustered multiple outlets)
- "Read at source" link

On a phone, surfacing all of this at once is a wall of text + chrome that nobody reads. The translation pattern is **progressive disclosure with editorial defaults**:

1. **Above the fold (always visible):** title, source name + reading time, the AI summary (3–4 lines), one tap-to-expand "What you should know" affordance, a "Read at source" button.
2. **Tap-to-expand:** the primer panel opens inline. Background paragraph + term chips appear.
3. **Tap a term chip:** modal bottom sheet with the term definition + "Open full dossier" CTA.
4. **Tap an entity chip (inline in the summary):** same modal bottom sheet pattern → dossier in Custom Tabs.
5. **Tap the outlet badge:** outlet dossier in Custom Tabs.
6. **Swipe up from the summary (or scroll past it):** cross-spectrum framing comparison appears as a section.

Default state is **scannable**. Civic depth is **always one tap away**. The user controls how deep they go.

---

## Screen inventory

Six surfaces in v1. Listed in order of importance to the civic-literacy mission.

| # | Screen | Sprint priority | Civic-literacy weight |
|---|---|---|---|
| 1 | **Article Detail** — primer + entity chips + outlet badge | **highest** — biggest translation risk | Heavy |
| 2 | **Feed** — category tabs + article cards | High — primary engagement surface | Light (outlet badge + category accent) |
| 3 | **Share Target** — receives URL, shows civic-literacy summary | High — the headline native feature | Heavy (mirrors detail screen) |
| 4 | **Topic Search** — vector + Claude fallback | Medium | Light |
| 5 | **Bookmarks** — local + Clerk sync | Medium | None (just metadata) |
| 6 | **Settings** — theme override, notification prefs, sign-out | Low | None |

---

## Screen 1: Article Detail (the big one)

### Information architecture

Anatomy, top to bottom:

1. **App bar** — back arrow, category color dot, "Top Stories" (or whichever category), bookmark icon (right), share icon (right).
2. **Hero block (scrollable, no card chrome):**
   - Image (16:9, RSS-provided, only if present)
   - Category chip (small, color-tinted)
   - Title (serif, 24–28sp, semibold)
   - Source name · published date · read time (single line, muted)
   - Outlet badge (compact — outlet name + AllSides political-lean dot)
3. **AI summary** (body, 16sp, 1.5 line-height) — 2–4 paragraphs.
4. **"What you should know first" panel (expandable)** — collapsed by default below the summary. Tap to expand.
5. **Cross-spectrum framing** (when available from story threading) — collapsed by default, similar pattern.
6. **Entity chips section** — `EntityLink[]` from the article, displayed as a horizontal-scrolling row of `SuggestionChip` components. Tap → bottom sheet → dossier in Custom Tabs.
7. **Sticky bottom CTA** — "Read at source" pill button. Always visible regardless of scroll.

### Low-fi wireframe

```
┌──────────────────────────────────────────────┐
│  ←   ● Politics                    ☆   ⤴   │   <- App bar
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │           [RSS Image, 16:9]            │  │   <- Hero block
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│   [Politics]                                 │   <- Category chip
│                                              │
│   Senate Passes Bill on AI                   │   <- Title (serif)
│   Procurement After Cloture Vote             │
│                                              │
│   Politico · 2h ago · 4 min · 🟦 NYT (left-  │   <- Source row + outlet badge
│   leaning, high factual)                     │
│                                              │
│   ──────────────────────────────────────     │
│                                              │
│   The Senate voted 52-48 to advance a        │   <- AI summary
│   sweeping bill regulating federal AI        │
│   procurement, after Majority Leader Chuck   │
│   Schumer invoked cloture to end debate.     │
│   The legislation, S. 1234, would require…   │
│                                              │
│   ┌────────────────────────────────────┐    │
│   │ 📖 What you should know first    ▼ │    │   <- Primer panel (collapsed)
│   └────────────────────────────────────┘    │
│                                              │
│   ┌────────────────────────────────────┐    │
│   │ 🔀 How outlets framed it          ▼ │    │   <- Cross-spectrum (collapsed)
│   └────────────────────────────────────┘    │
│                                              │
│   Mentioned in this story:                   │   <- Entity chips
│   ┌──────┐┌──────┐┌────────┐┌──────────┐    │
│   │Schumer││S.1234││ Senate ││ OpenAI  │ ⟶  │
│   └──────┘└──────┘└────────┘└──────────┘    │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│       ┌────────────────────────────┐         │
│       │   Read at source ↗         │         │   <- Sticky CTA
│       └────────────────────────────┘         │
└──────────────────────────────────────────────┘
```

### Primer panel — expanded state

```
   ┌────────────────────────────────────┐
   │ 📖 What you should know first    ▲ │
   ├────────────────────────────────────┤
   │                                    │
   │ Background:                        │
   │ The bill follows months of debate  │
   │ over how the federal government    │
   │ should evaluate AI vendors.        │
   │ A previous version stalled in      │
   │ committee in March.                │
   │                                    │
   │ Key terms:                         │
   │  ╭──────────╮ ╭──────────────────╮ │
   │  │ cloture  │ │ procurement      │ │   <- Term chips
   │  ╰──────────╯ ╰──────────────────╯ │
   │  ╭──────────────────╮              │
   │  │ S. 1234 (H.R.…)  │              │
   │  ╰──────────────────╯              │
   │                                    │
   └────────────────────────────────────┘
```

Tap a term chip → modal bottom sheet:

```
   ────────────────────────────────────
                   ━━━            <- drag handle

   cloture

   A Senate procedure that requires
   60 votes to end debate on most
   legislation.

   Source: U.S. Senate Glossary
   ───
   ╭────────────────────────────────╮
   │ Open full dossier ↗            │
   ╰────────────────────────────────╯
   ────────────────────────────────────
```

### Cross-spectrum framing — expanded

```
   ┌────────────────────────────────────┐
   │ 🔀 How outlets framed it         ▲ │
   ├────────────────────────────────────┤
   │                                    │
   │  Left          Center        Right │
   │  ─────         ──────        ───── │
   │  Guardian      Reuters       NYP   │
   │  "Major win    "Senate       "Demo │
   │  for AI        passes AI     -crat │
   │  oversight"    bill"         power │
   │                              grab" │
   │                                    │
   │  See full comparison →             │
   └────────────────────────────────────┘
```

`See full comparison →` opens the existing `/compare` page in Custom Tabs. Native compare UI is v1.1.

### Interaction patterns

- **Bookmark toggle (☆/★)** — Material 3 IconButton in app bar. Toggle state on tap with a brief "Saved to bookmarks" snackbar. Bookmark persists locally first (Room), syncs to Clerk + Postgres in background.
- **Share button (⤴)** — Android share sheet. Pre-fills the article URL + title.
- **Primer panel expand** — `AnimatedVisibility` with `expandVertically()` + `fadeIn()`. ~200ms. No jank — measure on Pixel 9 with `BeyondBoundsLayout`.
- **Term chip tap** — opens `ModalBottomSheet` with `WindowInsets.ime` aware. Dragdownable. "Open full dossier" closes the sheet + launches Custom Tabs.
- **Entity chip tap** — same as term chip but the bottom sheet shows the entity's preview card (politician's top industries / org's lean / etc.).
- **Sticky CTA** — `BottomAppBar` or floating button. Stays at safe-area-respecting bottom. Tap → Custom Tabs with reader-mode hint (`CustomTabsIntent.Builder.setReadOnly(true)`).

### Open design questions

- **Q1:** Where exactly does the **outlet badge** sit? Currently spec'd on the source row. Alternative: as its own sub-card above the summary. Risk of cramming the source row.
- **Q2:** **Cross-spectrum framing** — collapsed by default? Or show the L/C/R headlines inline always? Worry: always-on adds 100–150px to every article; many articles don't have framing data, so the section would be hidden ~50% of the time anyway.
- **Q3:** **Entity chip order** — currently spec'd in source order (as they appear in the article). Alternative: politicians first, then bills, then orgs, then outlets. Risk: source order is contextual; sorted order is scannable. Sprint vote: source order; revisit after first usability test.
- **Q4:** **Image presence** — articles without an RSS image. Skip the image block entirely vs show a placeholder category-color gradient? Sprint vote: skip (matches web's text-first design).

---

## Screen 2: Feed

Lower design risk than article detail; the web pattern translates cleanly.

### IA

1. **App bar** — "Sift" wordmark (titleLarge, semibold) + theme-toggle icon (right).
2. **Category tabs** — `ScrollableTabRow` across all 10 categories. Selected tab has indicator underline in primary color.
3. **Pager** — each page renders a `FeedScreen` for that category.
4. **Article cards** — vertical list, 12dp gap. Card anatomy:
   - 4dp category color accent bar (left edge)
   - RSS image (16:9, if present)
   - Source name · read time (small, muted)
   - Title (serif, semibold, max 3 lines)
   - Summary (body, max 4 lines)
   - Outlet badge (compact form, only if outlet has AllSides/MBFC data)

### Wireframe

```
┌──────────────────────────────────────────────┐
│  Sift                                  ◐    │   <- App bar
├──────────────────────────────────────────────┤
│ Top │ Tech │ Business │ Science │ Energy │ → │   <- Tabs (scrollable)
├──────────────────────────────────────────────┤
│                                              │
│ ┌─┬────────────────────────────────────────┐ │
│ │ │  [Image]                               │ │
│ │ │                                        │ │   <- Article card
│ │ │  Politico · 4 min · 🟦 NYT             │ │
│ │ │                                        │ │
│ │ │  Senate Passes Bill on AI              │ │
│ │ │  Procurement After Cloture Vote        │ │
│ │ │                                        │ │
│ │ │  The Senate voted 52-48 to advance...  │ │
│ └─┴────────────────────────────────────────┘ │
│                                              │
│ ┌─┬────────────────────────────────────────┐ │
│ │ │  Reuters · 3 min · ⚪ AP                │ │
│ │ │  Federal Reserve Holds Rates Steady    │ │
│ │ │  The FOMC voted unanimously to keep... │ │
│ └─┴────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
   ↑   ↑                                    
   │   └─ rest of card (image, source, title, summary)
   └─ 4dp category accent bar
```

### Interaction patterns

- **Tap a card** → article detail (Compose Navigation).
- **Long-press a card** → quick actions menu (Bookmark / Share / Hide source). v1.1 — not in initial scope.
- **Pull to refresh** — single category refresh. Deferred to UX-pass PR (Material 3 PullToRefresh is finicky).
- **Swipe between tabs** — `HorizontalPager` (already wired in PR #3).
- **Theme toggle (◐)** — top-right icon. Tap to flip Newsprint ↔ Late Edition. Animates the palette swap in ~200ms.

### Open design questions

- **Q5:** **Featured card?** The web has a larger "featured" treatment for the top story per category. Phone real estate is tight; sprint vote = no featured treatment in v1, all cards equal weight. Revisit at v1.1 with usability data.
- **Q6:** **Outlet badge prominence on cards** — full badge with rating? Or just a colored dot indicating lean, expand on detail screen? Sprint vote = just a colored dot + outlet name on cards; full badge on detail.

---

## Screen 3: Share Target

The headline native feature. User shares any URL from Safari / Chrome / Messages / Twitter / etc. → Sift processes it → returns civic-literacy summary.

### IA

Two states:

**State A: Processing** (5–15 seconds while sift-api fetches + summarizes)

```
┌──────────────────────────────────────────────┐
│                                              │
│           [Sift Diamond Mark]                │
│                                              │
│          Sifting this article…               │
│                                              │
│         ╭────────────────────╮               │
│         │ ▰▰▰▰▰▱▱▱▱▱  35%   │               │   <- determinate progress
│         ╰────────────────────╯               │
│                                              │
│       politico.com/article/12345             │   <- the URL being processed
│                                              │
│         (tap to cancel)                      │
│                                              │
└──────────────────────────────────────────────┘
```

**State B: Result** (mirror of Article Detail screen)

Same anatomy as Screen 1. Title + source + summary + expandable primer + entity chips + Read at source.

Differences from regular Article Detail:
- App bar back arrow returns the user to the previous app (the source of the share intent).
- "Add to Sift" CTA replaces the bookmark icon — saves this URL to the user's share-history.
- No category color (no classification yet; the pipeline assigns later asynchronously).

### Wireframe (result state)

```
┌──────────────────────────────────────────────┐
│  ←                                  ＋ Save │   <- "+" adds to share history
├──────────────────────────────────────────────┤
│                                              │
│   ╭────────────╮                             │
│   │ politico.com                             │   <- Source pill
│   ╰────────────╯                             │
│                                              │
│   How Section 230 Reform Could Reshape       │
│   the Internet                               │
│                                              │
│   Politico · 12 min · 🟦                     │
│                                              │
│   ──────────────────────────────────────     │
│                                              │
│   [AI summary, 2-3 paragraphs]               │
│                                              │
│   ┌────────────────────────────────────┐    │
│   │ 📖 What you should know first    ▼ │    │
│   └────────────────────────────────────┘    │
│                                              │
│   Mentioned: [Section 230] [FCC] [Schumer]   │
│                                              │
├──────────────────────────────────────────────┤
│        ┌────────────────────────────┐        │
│        │   Read at source ↗         │        │
│        └────────────────────────────┘        │
└──────────────────────────────────────────────┘
```

### Error / edge-case states

- **Paywalled URL** — show the URL + source pill + a message: "Sift couldn't process this article — it may be behind a paywall or require login. Try again with the full URL or a different source." + Read at source button (still works).
- **Not-an-article URL** (homepage, search result page, video) — "This doesn't look like an article. Try sharing a specific story URL."
- **Network failure mid-process** — Cancel button + Retry button.
- **Rate-limit hit** — "You've sifted X articles today. Limit is 20 per day for signed-in users. Resets at midnight UTC." + sign-in CTA if anon.

### Open design questions

- **Q7:** **Indeterminate vs determinate progress bar.** Indeterminate is honest (we don't know exact timing). Determinate feels faster (research-backed). Sprint vote: indeterminate with rotating status text ("Fetching… → Summarizing… → Pulling civic context…") so it feels purposeful.
- **Q8:** **Return-to-source-app behavior.** Back arrow → previous app, or back arrow → main Sift app (transitions to home)? Sprint vote: back arrow returns to source app (matches share-sheet UX expectations); a separate "Open in Sift" link in the app bar opens the app.

---

## Screen 4: Topic Search

### IA

1. **App bar** — back arrow + search input (always focused on screen entry).
2. **Recent / suggested topics** (when input is empty) — chip row of last 5 searched topics + curated suggestions from analytics ("FCC rulemaking", "AI safety", "infrastructure bill").
3. **Results list** — same `ArticleCard` as feed, but with:
   - Match-quality indicator: "Strong matches" header (for vector results) or "Web search results" header (for Claude fallback).
   - SSE streams results as they arrive — cards animate in one at a time.
4. **Sticky search bar** — stays at top during scroll.

### Wireframe

```
┌──────────────────────────────────────────────┐
│  ←  ┌────────────────────────────────┐  ✕   │
│     │ 🔍 AI policy in EU healthcare  │      │   <- search input
│     └────────────────────────────────┘      │
├──────────────────────────────────────────────┤
│                                              │
│  Strong matches · 5 results                  │
│  ──────────────────────────                  │
│                                              │
│  [ArticleCard]                               │
│                                              │
│  [ArticleCard]                               │
│                                              │
│  [ArticleCard]                               │
│                                              │
│  ─────────────────────────                   │
│                                              │
│  Searching the web for more...               │   <- SSE fallback indicator
│  ▰▰▰▱▱▱                                      │
│                                              │
└──────────────────────────────────────────────┘
```

### Interaction patterns

- **Submit search** — enter key or search-action key. SSE connection opens.
- **Cancel** — ✕ in input clears + stops SSE.
- **Tap a result** → article detail (same as feed).
- **Empty results** — "Nothing matched your search. Try a broader topic, or [follow this topic] to get notified when articles arrive."
- **Topic follow** (later) — long-press a search query → save as followed-topic for push notifications.

### Open design questions

- **Q9:** **Voice search?** Material 3 search bar can have a mic icon. Defer to v1.1 — voice adds permission ask + accuracy risk.

---

## Screen 5: Bookmarks

### IA

1. **App bar** — "Bookmarks" + sign-in icon (if not signed in).
2. **Sync status** — small banner at top: "Synced to your account" / "Saving locally — sign in to sync" / "Syncing…".
3. **List of bookmarked articles** — `ArticleCard` (same component as feed).
4. **Empty state** — illustration + copy + CTA.

### Wireframe (empty state)

```
┌──────────────────────────────────────────────┐
│  Bookmarks                                   │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│              [Sift Diamond]                  │
│                                              │
│         No bookmarks yet.                    │
│                                              │
│      Tap the ☆ on any article to             │
│      save it for later. Sign in              │
│      to sync across devices.                 │
│                                              │
│      ╭──────────────────╮                    │
│      │   Browse stories │                    │
│      ╰──────────────────╯                    │
│                                              │
└──────────────────────────────────────────────┘
```

### Sync-state behavior

- **Anonymous user:** bookmarks stored locally (Room). Banner: "Saving locally. Sign in to sync."
- **Signed-in user, online:** bookmarks sync to Clerk + Postgres in background. Banner: "Synced to your account."
- **Signed-in user, offline:** writes queue locally. Banner: "Syncing when you're online…"
- **Conflict (article bookmarked on two devices simultaneously):** client wins for v1 — last-write per article. Revisit at v1.1 if user complaints.

### Open design questions

- **Q10:** **Bookmark organization** — flat list, or folders/collections? v1 = flat. Folders are v1.1 unless heavy demand.
- **Q11:** **Sort order** — most-recently-bookmarked or most-recently-published? Sprint vote: most-recently-bookmarked (matches user mental model — "I just saved this").

---

## Screen 6: Settings

Lowest design risk. Standard Material 3 settings patterns.

### Sections

1. **Account** — sign-in / sign-out, email, "Manage your Clerk account" link.
2. **Appearance** — Theme: System (default) / Newsprint / Late Edition (radio group).
3. **Notifications** — Master toggle + per-category toggles (when notif permission granted). "Followed topics" sub-screen (v1.1).
4. **About** — Version, methodology link, privacy link, terms link, "Built by Kristen Martino" credit.

### Wireframe (overview)

```
┌──────────────────────────────────────────────┐
│  ←  Settings                                 │
├──────────────────────────────────────────────┤
│                                              │
│   ACCOUNT                                    │
│   ┌────────────────────────────────────┐    │
│   │ kristen@example.com                │    │
│   │ Sign out →                         │    │
│   └────────────────────────────────────┘    │
│                                              │
│   APPEARANCE                                 │
│   ┌────────────────────────────────────┐    │
│   │ Theme         System ▾             │    │
│   └────────────────────────────────────┘    │
│                                              │
│   NOTIFICATIONS                              │
│   ┌────────────────────────────────────┐    │
│   │ Breaking news                  ◯  │    │
│   │ Followed topics →                  │    │
│   └────────────────────────────────────┘    │
│                                              │
│   ABOUT                                      │
│   ┌────────────────────────────────────┐    │
│   │ Version          0.1.0             │    │
│   │ Methodology  →                     │    │
│   │ Privacy      →                     │    │
│   │ Terms        →                     │    │
│   └────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Design tokens (Android, Material 3)

These tokens go in `app/src/main/kotlin/ai/kristenmartino/sift/ui/theme/`. Some already exist in `Color.kt` / `Type.kt` from Phase 1; this sprint formalizes the rest.

### Spacing scale

| Token | dp | Use |
|---|---|---|
| `space.0` | 0 | — |
| `space.1` | 4 | inline gaps |
| `space.2` | 8 | small padding |
| `space.3` | 12 | card internal padding |
| `space.4` | 16 | screen edges |
| `space.5` | 24 | section breaks |
| `space.6` | 32 | large vertical rhythm |
| `space.7` | 48 | hero spacing |

(Not implemented as a Compose object yet — opportunity for v1.1 cleanup; v1 keeps inline `dp` values.)

### Type scale

(Already in `Type.kt`, repeated here for design-spec completeness.)

| Token | Family | Weight | Size | Line height | Use |
|---|---|---|---|---|---|
| `displayLarge` | Serif | Bold | 57sp | 64sp | Splash, hero |
| `headlineLarge` | Serif | SemiBold | 32sp | 40sp | Article detail title |
| `titleLarge` | SansSerif | Medium | 22sp | 28sp | App bar, card titles |
| `bodyLarge` | SansSerif | Normal | 16sp | 24sp | Body text |
| `bodyMedium` | SansSerif | Normal | 14sp | 20sp | Card summary, captions |
| `labelLarge` | SansSerif | Medium | 14sp | 20sp | Buttons, chips, tabs |

### Component inventory

Composables to extract as reusable primitives during Phase 2 (each gets its own file in `ui/common/` once it's used 2+ times):

- [x] `ArticleCard` — already exists in `ui/feed/`
- [ ] `OutletBadge` — compact + full variants
- [ ] `EntityChip` — Suggestion chip + tap-to-bottom-sheet pattern
- [ ] `TermChip` — same shape as EntityChip, distinct color
- [ ] `PrimerPanel` — expandable card with background + terms
- [ ] `CrossSpectrumPanel` — expandable card with L/C/R columns
- [ ] `BottomSheetWithDossierCTA` — modal sheet with term/entity preview + "Open full dossier"
- [ ] `SiftAppBar` — branded top app bar variant
- [ ] `EmptyState` — illustration + copy + CTA pattern (bookmarks empty, no search results, etc.)
- [ ] `ReadAtSourcePill` — sticky bottom CTA

---

## Gestures + transitions

- **Tab switch** — `HorizontalPager.animateScrollToPage()` (tab tap) or natural swipe gesture. ~300ms ease-in-out.
- **Card → Detail** — Material 3 shared-element-ish: card image expands to hero. Compose Animation API. (Stretch; may defer to v1.1 if implementation is finicky.)
- **Detail back** — standard back swipe (predictive back, Android 14+) + animated.
- **Primer expand** — `AnimatedVisibility(expandVertically + fadeIn)`, 200ms.
- **Bottom sheet show/dismiss** — Material 3 ModalBottomSheet default animation.
- **Theme switch** — `Crossfade` between theme states, 200ms.

---

## Accessibility

Mandatory for Play Store review + the right thing to do regardless. Per-screen checklist:

- All `IconButton`s have non-null `contentDescription` (bookmark, share, theme toggle, etc.).
- All `Text` color combos meet WCAG AA contrast (4.5:1 for body, 3:1 for large text) in **both** Newsprint and Late Edition palettes.
- Dynamic Type scaling — verified at 1.0x and 2.0x on Pixel 9. Hero block doesn't break at 2.0x.
- TalkBack — every card has a meaningful announcement: "{Source}, {readTime} minute read. {Title}. {Summary preview}."
- Tap targets ≥ 48dp (chips, tabs, icons).
- No color-only signals — outlet political lean uses a colored dot + label, not just color.

Verification: every PR runs `./gradlew testDebugUnitTest` (won't catch a11y) + manual TalkBack pass on the changed surface.

---

## Open questions (consolidated)

| # | Question | Sprint vote / status |
|---|---|---|
| Q1 | Outlet badge — source row or own sub-card? | Source row (v1); revisit if cramped |
| Q2 | Cross-spectrum — collapsed by default or always inline? | Collapsed by default |
| Q3 | Entity chip order — source-order or sorted-by-type? | Source order |
| Q4 | Articles without images — skip or placeholder? | Skip (matches web) |
| Q5 | Featured card on feed? | No (v1.1 with usability data) |
| Q6 | Outlet badge on cards — full or just dot? | Just dot + outlet name |
| Q7 | Share-target progress — determinate or indeterminate? | Indeterminate with rotating status text |
| Q8 | Share-target back arrow — to source app or main Sift? | Source app |
| Q9 | Voice search? | v1.1 |
| Q10 | Bookmark organization — folders? | Flat (v1.1 if demand) |
| Q11 | Bookmark sort order? | Most-recently-bookmarked |

All open questions have provisional sprint votes; nothing here blocks Phase 2 code work. Revisit each at v1 closed-beta usability test.

---

## What this sprint output does NOT cover

- **Pixel-perfect visual mocks in Figma.** Low-fi ASCII is enough to start coding; a Figma pass for the article detail screen is a follow-up if visual review needs it.
- **Empty state illustrations.** Will use the Sift diamond mark + Material 3 illustration patterns for v1; custom illustrations are v1.2 polish.
- **Onboarding flow.** v1 doesn't have onboarding — first-launch goes straight to the feed. Sign-in is opt-in from Settings or any place that requires it (bookmarks, push). Onboarding (3-screen carousel explaining civic-literacy) is v1.1.
- **Tablet adaptive layout.** v1 supports tablet but doesn't optimize. Three-pane (categories / feed / detail) is v1.1.

---

## Next steps

1. **Validate against this doc as Phase 2 ships** — the article detail PR should match the IA + interaction patterns here. If it doesn't, either the code adapts or the design updates (record as a Recent decision in `sift-android/STATUS.md`).
2. **First usability test target** — closed beta (week 10–11 per plan). Recruit 5 readers from the existing web user pool. Watch them use the article detail screen specifically.
3. **Figma pass on article detail** — optional, before Phase 2 PR #3 (the chrome PR). Useful if the ASCII wireframe isn't enough to lock visual decisions.

---

*Sprint output complete. Phase 2 unblocked.*

*See also: [`ANDROID_APP_v1.md`](./ANDROID_APP_v1.md) (canonical decisions), [`HOW_IT_WORKS.md`](./HOW_IT_WORKS.md) (system end-to-end), [`IOS_APP_ASSESSMENT.md`](./IOS_APP_ASSESSMENT.md) (the critique that named this sprint as a blocker).*
