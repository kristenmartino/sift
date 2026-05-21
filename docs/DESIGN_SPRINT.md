# Sift Mobile — Design Sprint v0

**Date:** 2026-05-20 (Screens 7–8 added 2026-05-21)
**Status:** Draft — expanded scope. Sprint output for the pre-engineering design phase named in [`ANDROID_APP_v1.md`](./ANDROID_APP_v1.md) §6 as "non-negotiable pre-week-1."
**Scope:** Android v1 first; patterns generalize to iOS v1.
**Owner:** Kristen + Claude

> The hardest question in the iOS plan critique: *"How does civic-literacy translate to a 6.1" portrait screen with thumbs-on-bottom ergonomics?"* This doc answers it. Eight screens (originally six; Ask Sift + Compare added 2026-05-21 per the Android v1 scope expansion to include agentic surfaces), the IA + interaction model for each, low-fi wireframes, and the open questions that need real visual mocks before we ship.

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
2. **Tap-to-expand:** the primer panel opens inline. Background paragraph + 1–2 **inline definitions** (term + plain-English explanation, visible without further taps) appear. Overflow terms (3rd+) become chips for tap-to-dossier.
3. **Tap a `→ dossier` link inside a primer definition:** direct to Custom Tabs (no bottom-sheet step — the user already read the definition inline).
4. **Tap an entity chip** (e.g., "Schumer", "S. 1234" in the Mentioned-in-this-story row): modal bottom sheet with the entity preview (politician's top industries / bill status / org lean / outlet ratings) + "Open full dossier" CTA → Custom Tabs.
5. **Tap the outlet badge:** outlet dossier in Custom Tabs.
6. **Swipe up from the summary (or scroll past it):** cross-spectrum framing comparison appears as a section.

Default state is **scannable**. Civic depth is **always one tap away**. The user controls how deep they go.

For the agentic surfaces (Ask Sift, Refined Compare), the translation principle becomes: **citation visibility is the trust mechanism.** Tool-call chips + inline citation links make the agent's grounding observable, not a black box.

---

## Screen inventory

**Eight surfaces in v1.** Expanded from six on 2026-05-21 — Screens 7 (Ask Sift) and 8 (Compare) added per `sift-api` #63 and the `ANDROID_APP_v1.md` v1 scope amendment moving agentic surfaces into v1 (was v1.1). Listed in order of importance to the civic-literacy mission.

| # | Screen | Sprint priority | Civic-literacy weight |
|---|---|---|---|
| 1 | **Article Detail** — primer + entity chips + outlet badge | **highest** — biggest translation risk | Heavy |
| 2 | **Feed** — category tabs + article cards | High — primary engagement surface | Light (outlet badge + category accent) |
| 3 | **Share Target** — receives URL, shows civic-literacy summary | High — the headline native feature | Heavy (mirrors detail screen) |
| 4 | **Topic Search** — vector + Claude fallback | Medium | Light |
| 5 | **Bookmarks** — local + Clerk sync | Medium | None (just metadata) |
| 6 | **Settings** — theme override, notification prefs, sign-out | Low | None |
| 7 | **Ask Sift** — agentic chat with streaming response | **High** — civic-literacy as differentiator | Heavy (citations mandatory; tool-call visibility is the trust signal) |
| 8 | **Compare** — outlet-by-outlet framing (deterministic + Refined lens path) | **High** — core comparison surface | Heavy (lens-driven framing on Refined path) |

---

## Design revisions

- **2026-05-20 (rev 1)** — **Primer pattern: chip-and-sheet → inline definitions.** The original draft surfaced primer terms as `SuggestionChip`s that opened a `ModalBottomSheet` on tap. Revised after visual review of the first Figma pass: the primer's job is to **teach** in one read; gating each definition behind another tap adds friction without value, and the rendered chip-only state felt empty / sparse. New pattern shows 1–2 definitions inline (term + plain-English definition), with `→ dossier` link to Custom Tabs for the rare case the reader wants to go deeper. The bottom-sheet pattern is now reserved exclusively for **entity chips** (people / orgs / bills / outlets mentioned in the article body), where a preview card is genuinely useful before click-through. See §Screen 1 § Primer panel — expanded state.
- **2026-05-21 (rev 2)** — **Sprint scope expanded to include Ask Sift + Compare screens.** The original sprint covered six screens; Android v1 was the reader + share extension. On 2026-05-21 the Android v1 plan absorbed Ask Sift agentic chat + Compare button (deterministic + Refined with lens) into v1 scope (`ANDROID_APP_v1.md` amendment). This rev adds Screens 7 and 8 with full IA + wireframes + open questions. Inventory + open-questions sections updated accordingly. No revisions to Screens 1–6.

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
4. **"What you should know first" panel (expandable)** — collapsed by default below the summary. Tap to expand → background paragraph + 1–2 inline definition cards (term + definition visible at once, no further tap required to read). Overflow terms (3rd+) become tap-to-dossier chips at the bottom of the panel.
5. **Cross-spectrum framing** (when available from story threading) — collapsed by default, similar pattern.
6. **Entity chips section** — `EntityLink[]` from the article, displayed as a horizontal-scrolling row of `SuggestionChip` components. Tap → bottom sheet → dossier in Custom Tabs.
7. **"Compare coverage" button** (added 2026-05-21) — secondary button below the entity chips, above the sticky CTA. Tap → Compare screen (Screen 8) with this article's topic pre-populated.
8. **Sticky bottom CTA** — "Read at source" pill button. Always visible regardless of scroll.

### Low-fi wireframe

```
┌────────────────────────────────────────────┐
│  ←   ● Politics                    ☆   ⤴   │   <- App bar
├────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │                                        │  │
│  │           [RSS Image, 16:9]            │  │   <- Hero block
│  │                                        │  │
│  └──────────────────────────────────────┘  │
│                                              │
│   [Politics]                                 │   <- Category chip
│                                              │
│   Senate Passes Bill on AI                   │   <- Title (serif)
│   Procurement After Cloture Vote             │
│                                              │
│   Politico · 2h ago · 4 min · 🟦 NYT (left-  │   <- Source row + outlet badge
│   leaning, high factual)                     │
│                                              │
│   ────────────────────────────────────     │
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
│   ╭──────────────────────────────────╮        │   <- Compare button (new!)
│   │  🔀 Compare outlets on this story    │        │
│   ╰──────────────────────────────────╯        │
│                                              │
├────────────────────────────────────────────┤
│       ┌──────────────────────────────┐         │
│       │   Read at source ↗         │         │   <- Sticky CTA
│       └──────────────────────────────┘         │
└────────────────────────────────────────────┘
```

*Note (2026-05-21):* the Compare button between entity chips and sticky CTA is new. It replaces the implicit "See full comparison →" link in the cross-spectrum panel — the cross-spectrum panel keeps its inline view but the dedicated button surfaces the compare-coverage flow more prominently.

### Primer panel — expanded state

The primer is the **teaching surface**. Its job: answer *"what do I need to know to understand this article?"* in one read, without further taps.

Pattern: background paragraph + 1–2 **inline definition cards** (term name + plain-English definition, visible at once). Overflow terms (3rd+) become `SuggestionChip`s at the bottom of the panel for tap-to-dossier. Cap: 2 inline definitions to keep primer height bounded — articles with many obscure terms surface the rest as chips.

```
   ┌──────────────────────────────────────────┐
   │ 📖  What you should know first         ▲ │
   ├──────────────────────────────────────────┤
   │                                          │
   │ The bill follows months of debate over   │
   │ how the federal government should        │
   │ evaluate AI vendors. A previous version  │
   │ stalled in committee in March after      │
   │ disagreements over disclosure            │
   │ thresholds.                              │
   │                                          │
   │ ─────────────────────────                │
   │                                          │
   │ cloture                     → dossier    │   <- inline definition 1
   │ A Senate procedure that requires 60      │
   │ votes to end debate and force a final    │
   │ vote on most legislation.                │
   │                                          │
   │ procurement                              │   <- inline definition 2
   │ How the federal government buys goods    │
   │ or services from private vendors —       │
   │ contracts, RFPs, vendor evaluation.      │
   │                                          │
   │ ─────────────────────────                │
   │                                          │
   │ More terms:                              │
   │  ╭──────────────────╮                    │
   │  │ S. 1234 (H.R.…)  │                    │   <- overflow chip (3rd+ term)
   │  ╰──────────────────╯                    │
   │                                          │
   └──────────────────────────────────────────┘
```

Each inline definition card:
- **Term name** (semibold, 14sp) + optional `→ dossier` link (only when the term resolves to a curated entity — e.g., a bill with a `bill_profile` row, or a regulatory concept with an org dossier).
- **Definition body** (regular, 13sp, ~1–2 sentences, 8th-grade reading level).
- Tap the `→ dossier` link → Custom Tabs to the dossier page. **No bottom sheet step** — the user already read the definition inline.

The 3rd+ key term renders as a `SuggestionChip` under "More terms:" — tap → bottom sheet (entity-chip pattern below) for the rare case the reader wants depth on an additional term.

**Why inline vs the chip-and-sheet pattern originally drafted:** see the §Design revisions section above. Short version: the primer's job is to teach in one read; a bottom sheet for every term turns teaching into a treasure hunt. The bottom-sheet pattern is reserved for entity chips below.

### Entity chip → bottom sheet pattern

Different from primer terms. When the user taps an entity chip in the "Mentioned in this story" row at the bottom of the article (a person, org, bill, or outlet), a `ModalBottomSheet` shows a preview card sourced from the curated dossier — *before* the user commits to leaving the article for Custom Tabs:

```
   ╭───────────────────────────────────────────╮
   │                  ━━━                     │   <- drag handle
   ├──────────────────────────────────────────┤
   │                                          │
   │ Chuck Schumer                            │
   │ D-NY · Senate Majority Leader            │
   │                                          │
   │ TOP PAC INDUSTRIES (2022 cycle)          │
   │   Securities & Investment      $2.4M     │
   │   Real Estate                  $1.1M     │
   │   Lawyers & Law Firms          $0.9M     │
   │                                          │
   │ Source: OpenSecrets                      │
   │                                          │
   │ ╭─────────────────────────────────────╮ │
   │ │ Open full dossier ↗                  │ │
   │ ╰─────────────────────────────────────╯ │
   │                                          │
   ╰───────────────────────────────────────────╯
```

Preview content varies by entity type (server returns the right shape based on `EntityLinkType`):
- **Politician** → party + chamber + state + top 3 PAC industries
- **Bill** → short title + status + sponsor name + cosponsors count
- **Org** → type + political lean + funding model + FARA registration flag
- **Outlet** → AllSides political-lean rating + MBFC factual rating + parent company

Tap **Open full dossier** → Custom Tabs to the corresponding web page (`/politician/:bioguideId`, `/bill/:billId`, `/org/:slug`, `/outlet/:slug`).

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

*Note (2026-05-21):* `See full comparison →` now opens the native Compare screen (Screen 8) instead of Custom Tabs to the web `/compare` page. Native Compare is in v1 scope per the Android v1 amendment.

### Interaction patterns

- **Bookmark toggle (☆/★)** — Material 3 IconButton in app bar. Toggle state on tap with a brief "Saved to bookmarks" snackbar. Bookmark persists locally first (Room), syncs to Clerk + Postgres in background.
- **Share button (⤴)** — Android share sheet. Pre-fills the article URL + title.
- **Primer panel expand** — `AnimatedVisibility` with `expandVertically()` + `fadeIn()`. ~200ms. No jank — measure on Pixel 9 with `BeyondBoundsLayout`.
- **`→ dossier` link in primer (inline definition)** — direct launch into Custom Tabs. No bottom-sheet step; the user has already seen the definition inline.
- **Overflow term chip tap** (rare — 3rd+ key term in primer) — opens `ModalBottomSheet` with the term definition + "Open full dossier" CTA.
- **Entity chip tap** (people / orgs / bills / outlets mentioned in the article) — opens `ModalBottomSheet` with the entity preview card (politician's top industries / bill status / org's lean / outlet ratings). "Open full dossier" → Custom Tabs.
- **Compare button (added 2026-05-21)** — navigates to Compare screen (Screen 8) with `topic` parameter pre-populated to this article's title. Compose Navigation.
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
┌─────────────────────────────────────────────┐
│  Sift                                  ◐    │   <- App bar
├────────────────────────────────────────────┤
│ Top │ Tech │ Business │ Science │ Energy │ → │   <- Tabs (scrollable)
├────────────────────────────────────────────┤
│                                              │
│ ┌─┬──────────────────────────────────────┐ │
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
│ ┌─┬──────────────────────────────────────┐ │
│ │ │  Reuters · 3 min · ⚪ AP                │ │
│ │ │  Federal Reserve Holds Rates Steady    │ │
│ │ │  The FOMC voted unanimously to keep... │ │
│ └─┴────────────────────────────────────────┘ │
│                                              │
└────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────┐
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
┌─────────────────────────────────────────────┐
│  ←                                  ＋ Save │   <- "+" adds to share history
├────────────────────────────────────────────┤
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
│   ────────────────────────────────────     │
│                                              │
│   [AI summary, 2-3 paragraphs]               │
│                                              │
│   ┌────────────────────────────────────┐    │
│   │ 📖 What you should know first    ▼ │    │
│   └────────────────────────────────────┘    │
│                                              │
│   Mentioned: [Section 230] [FCC] [Schumer]   │
│                                              │
├─────────────────────────────────────────────┤
│        ┌──────────────────────────────┐        │
│        │   Read at source ↗         │        │
│        └──────────────────────────────┘        │
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
┌─────────────────────────────────────────────┐
│  ←  ┌────────────────────────────────┐  ✕   │
│     │ 🔍 AI policy in EU healthcare  │      │   <- search input
│     └────────────────────────────────┘      │
├─────────────────────────────────────────────┤
│                                              │
│  Strong matches · 5 results                  │
│  ─────────────────────────────                  │
│                                              │
│  [ArticleCard]                               │
│                                              │
│  [ArticleCard]                               │
│                                              │
│  [ArticleCard]                               │
│                                              │
│  ───────────────────────────                   │
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
┌─────────────────────────────────────────────┐
│  Bookmarks                                   │
├────────────────────────────────────────────┤
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
┌─────────────────────────────────────────────┐
│  ←  Settings                                 │
├────────────────────────────────────────────┤
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

## Screen 7: Ask Sift (the new differentiator)

**Added 2026-05-21** per Android v1 scope expansion (`ANDROID_APP_v1.md` amendment, `sift-api` #63 Phase 4).

The chat surface that makes Sift's civic-literacy data accessible without users learning the navigation. **Highest design risk** alongside Article Detail because civic-literacy framing has to survive being delivered as conversational LLM output — not editorially-controlled prose. Citation enforcement is the trust mechanism; the screen has to make citations obvious without making them noisy.

### Information architecture

Anatomy, top to bottom:

1. **App bar** — back arrow + "Ask Sift" title + new-chat button ✏ (v1: starts a fresh conversation; v1.1: history sidebar).
2. **Chat surface** — scrollable column of `ChatMessageBubble`s.
   - **User messages** — right-aligned, filled `tertiaryContainer` background, plain text.
   - **Assistant messages** — left-aligned, filled `surface`, rich content:
     - **Tool-call chips** inline at the point the agent calls a tool: small pill with icon ("🔍 Searching articles…" / "📄 Looking up FERC…"). Animates indeterminate → checkmark on completion.
     - **Streaming text** — tokens appear as they arrive from SSE.
     - **Citation links** — superscript `[¹]`, `[²]` rendered as `Annotated String` with `ClickableText`. Tap → article detail. Citations are mandatory for every real-entity claim.
3. **Empty / first-run state** — three example prompt cards stacked vertically, tappable to populate the composer.
4. **Composer** (sticky bottom) — multi-line `TextField` (max 3 lines visible, scrollable beyond) + send `IconButton` (becomes stop-square while streaming) + character count (only visible when approaching 500-char limit).

### Low-fi wireframe — empty / first-run state

```
┌─────────────────────────────────────────────┐
│  ←   Ask Sift                            ✏  │   <- App bar (✏ = new chat, v1.1)
├────────────────────────────────────────────┤
│                                              │
│           [Sift Diamond Mark]                │
│                                              │
│   Ask Sift anything about today's news.     │
│   Sift will search its index + civic        │
│   dossiers and answer with citations.       │
│                                              │
│   ─────────────────────────────              │
│                                              │
│   ┌──────────────────────────────────┐      │
│   │ Compare how outlets covered the  │      │   <- Example prompt 1
│   │ most recent FERC ruling          │      │
│   └───────────────────────────────────┘      │
│   ┌──────────────────────────────────┐      │
│   │ Who funds Senator X's campaign?  │      │   <- Example prompt 2
│   └───────────────────────────────────┘      │
│   ┌──────────────────────────────────┐      │
│   │ What's happening in energy       │      │   <- Example prompt 3
│   │ policy this week?                │      │
│   └───────────────────────────────────┘      │
│                                              │
├─────────────────────────────────────────────┤
│  ┌────────────────────────────────────┐ ↗  │   <- Composer + send
│  │ Ask Sift…                          │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

### Low-fi wireframe — active conversation (streaming)

```
┌─────────────────────────────────────────────┐
│  ←   Ask Sift                            ✏  │
├────────────────────────────────────────────┤
│                                              │
│                          ╭─────────────────╮ │   <- User bubble
│                          │ What's happen-  │ │
│                          │ ing in energy   │ │
│                          │ policy this     │ │
│                          │ week?           │ │
│                          ╰─────────────────╯ │
│                                              │
│  ╭─────────────────────────────╮               │   <- Tool-call chip (done)
│  │ 🔍 Searching articles…  ✓ │               │
│  ╰─────────────────────────────╯               │
│  ╭─────────────────────────────╮               │   <- Tool-call chip (done)
│  │ 📄 Looking up FERC      ✓ │               │
│  ╰─────────────────────────────╯               │
│                                              │
│  This week saw three notable develop-       │   <- Streaming text
│  ments in energy policy. First, FERC[¹]     │   <- Inline citations
│  finalized Order 1920 on regional           │
│  transmission planning, requiring grid      │
│  operators to coordinate on long-term       │
│  buildouts[²]…                              │
│                                              │
│  ▌  (cursor blinking — still streaming)     │
│                                              │
├─────────────────────────────────────────────┤
│  ┌────────────────────────────────────┐ ■  │   <- Stop button (■) while streaming
│  │ Ask Sift…                          │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

### Tool-call chip pattern

Three states:
1. **In progress** — indeterminate spinner + tool name + ellipsis ("🔍 Searching articles…")
2. **Done** — checkmark + tool name ("🔍 Searching articles ✓")
3. **Failed** — × + error explanation ("🔍 Search failed: index unavailable")

Chips render inline in the assistant's response, in chronological order of tool calls. They DON'T collapse — visibility is the trust mechanism (users see what the agent did to ground its answer).

**Sprint decision (Q13):** chips inline within the prose, not in a separate collapsing "thinking" pane. Hiding them feels less transparent; inline reads as "here's how I worked through this."

### Citation rendering

- Inline citations use superscript notation: `[¹]`, `[²]`, `[³]`
- Each is a `ClickableText` annotation that opens the article detail screen
- Same article cited multiple times reuses the same number (`[¹]` reused if article reappears)
- Sources footer at the end of the assistant's response lists each numbered source with article title + source name, all tappable:

```
  Sources:
  [¹] Politico — "FERC Finalizes Order 1920…"
  [²] Reuters — "Grid operators face new…"
```

### Empty results / no-find state

When the agent runs but can't ground an answer, it returns honest "I couldn't find" prose:

> I searched Sift's index but couldn't find articles about that topic. Try asking about a different subject, or [browse curated stories →].

The "browse curated stories" is a clickable link back to feed.

### Error states

| Error type | Display |
|---|---|
| Per-turn cap hit ($0.50 mid-response) | Truncated message + "I had to stop early — your question was bigger than my per-turn budget. Try a more specific question." |
| Per-user-day cap hit | Sheet-style overlay: "You've reached today's Ask Sift limit ($5 signed / $2 anon). Try again tomorrow." + Browse stories CTA + Sign in CTA if anon |
| Global ceiling hit (`ASK_SIFT_DISABLED=true`) | "Ask Sift is temporarily unavailable. Try a curated story." + link to feed |
| Rate-limit (per-IP) | "Slow down — try again in a few seconds." (auto-retry after `Retry-After` seconds) |
| Upstream failure (Anthropic 5xx) | "Sift's brain is offline. Try a curated story." + link to feed |
| Network failure mid-stream | "Lost connection. [Retry]" — re-submits the last user message |
| Citation-policy violation | Output filter strips uncited sentences server-side, replaces with "I couldn't verify this in Sift's index." Doesn't error visibly |

### Interaction patterns

- **Send (↗)** — submit composer text as next user message. Posts to `/api/ask`. Clears composer.
- **Stop (■)** — visible while streaming. Aborts SSE connection; backend cancels upstream Claude call. Partial streamed response stays visible.
- **Tap citation `[¹]`** — opens article detail. Back returns to chat at the same scroll position.
- **Tap example prompt card** — populates composer with prompt text, focuses composer. User can edit before sending.
- **Long-press a message** — copy text / share message (v1.1).
- **Auto-scroll-to-bottom** — follows new tokens as they stream. Pulling up pauses auto-scroll until user scrolls back to bottom.

### Civic-literacy specifics

- **Every real-entity claim must have a citation.** Output filter enforces server-side (per `sift-api/docs/ASK_SIFT_PLAN.md` mitigations). UI shows citations as prominent superscript links so users can verify.
- **"I couldn't verify this" wording** when the agent runs but doesn't find data, NOT hallucination. UI renders this as a normal assistant message, not an error.
- **Tool-call visibility is the grounding signal** — seeing "🔍 Searching articles…" before the answer is what convinces users the agent is grounded, not making up training-data facts.

### Open design questions

- **Q12:** Show example prompts always (a section even when chat has history) or only on first run? Sprint vote: **only first run.** Once a conversation starts, the empty state goes away; users see prompts again via the "new chat" button.
- **Q13:** Tool-call chips inline vs in a collapsing "thinking" pane? Sprint vote: **inline.** Hiding them undermines the grounding signal.
- **Q14:** Show cost / token meter? Sprint vote: **no in v1.** Per-conversation cost is in internal telemetry but not user-visible — adds anxiety, doesn't help the user. Revisit v1.1 if power users ask.
- **Q15:** Voice input on Ask Sift? Sprint vote: **v1.1.** Adds permission ask + accuracy risk. Mic icon spot reserved in composer.

---

## Screen 8: Compare (deterministic + Refined with Focus on…)

**Added 2026-05-21** per Android v1 scope expansion (`ANDROID_APP_v1.md` amendment, `sift-api` #63 Phase 4).

The structured side-by-side comparison surface. Two paths behind one screen:

- **Deterministic** — "Compare outlets on this story." Tap the Compare button on Article Detail with no Focus, get outlet-by-outlet claims grouped by agreement.
- **Refined Compare** — Same screen, user fills the "Focus on…" input with a specific lens ("how outlets define impact on grid reliability", "explain X's stance", etc.). Sends a `lens` parameter; backend routes to an agent loop that returns lens-targeted framings instead of all claims.

Same data shape, same outlet cards. The lens parameter changes what's *in* the framing field per outlet (claim extraction vs lens-targeted synthesis) and adds a Summary section + "Not covering this lens" row.

### Information architecture

Anatomy, top to bottom:

1. **App bar** — back arrow (returns to Article Detail) + "Compare coverage" + share icon (v1.1).
2. **Topic header** — the article title and source that initiated this Compare. Static context.
3. **"Focus on…" input** — single-line `TextField` with placeholder and helper line. Empty by default. Filling it doesn't auto-trigger; user still taps Compare.
4. **Compare button** — primary `FilledButton`. Shows progress states: idle → "Comparing outlets…" → "Almost done…" → results.
5. **Results area:**
   - **Summary section** (Refined only) — 2–4 sentences synthesizing where outlets diverge on the lens. Body text, no card chrome.
   - **Outlet framing cards** — vertical list of `OutletFramingCard`. Each card has outlet header (name + lean dot + factual rating) + framing paragraph + inline citations + key phrase chips.
   - **"Not covering this lens" row** (Refined only) — horizontal pill row of outlets that had articles on the topic but didn't address the lens.
   - **Sources footer** — numbered list of article titles + source names (matches Ask Sift pattern).

### Low-fi wireframe — initial state (before submit)

```
┌─────────────────────────────────────────────┐
│  ←   Compare coverage                        │
├────────────────────────────────────────────┤
│                                              │
│  Comparing outlets on:                       │
│                                              │
│  Senate Passes Bill on AI Procurement        │
│  After Cloture Vote                          │
│                                              │
│  Politico · 2h ago                           │
│                                              │
│  ─────────────────────────────────────       │
│                                              │
│  ┌───────────────────────────────────┐     │   <- Focus on input
│  │ Focus on… (optional)               │     │
│  │                                    │     │
│  └────────────────────────────────────┘     │
│  e.g., "how outlets define impact on        │   <- Helper text
│  grid reliability"                          │
│                                              │
│  ⓘ Adding focus uses an AI agent —          │   <- Cost / time banner
│    ~30s vs ~15s. Counts toward Ask Sift     │     (only shown when Focus has text)
│    daily limit.                             │
│                                              │
│        ╭───────────────────────────╮          │   <- Compare button (primary)
│        │   Compare outlets    →   │          │
│        ╰───────────────────────────╯          │
│                                              │
└──────────────────────────────────────────────┘
```

### Low-fi wireframe — Refined Compare results (with Focus)

```
┌─────────────────────────────────────────────┐
│  ←   Compare coverage                        │
├────────────────────────────────────────────┤
│                                              │
│  Topic: Senate AI bill                       │
│  Focus: how outlets define cost impact       │
│                                              │
│  ─────────────────────────────────────       │
│                                              │
│  SUMMARY                                     │
│  Outlets diverge primarily on whether        │
│  cost-shift to ratepayers is the dominant   │
│  frame (WSJ, Fox) or a secondary concern    │
│  (Reuters, AP). All concede costs increase. │
│                                              │
│  ─────────────────────────────────────       │
│                                              │
│  ┌───────────────────────────────────┐     │   <- OutletFramingCard 1
│  │ 🟦  Reuters         left, high fac.│     │
│  │                                    │     │
│  │ Frames cost as secondary; relia-   │     │
│  │ bility is the dominant justifica-  │     │
│  │ tion.                       [¹][²] │     │
│  │                                    │     │
│  │ Key phrases:                       │     │
│  │  ╭──────────────╮ ╭──────────────╮ │     │
│  │  │reliability   │ │regional plan │ │     │
│  │  ╰──────────────╯ ╰──────────────╯ │     │
│  └───────────────────────────────────┘     │
│                                              │
│  ┌───────────────────────────────────┐     │   <- OutletFramingCard 2
│  │ 🟥  WSJ            right, high fac.│     │
│  │                                    │     │
│  │ Cost-shift to ratepayers is the    │     │
│  │ central concern; reliability is    │     │
│  │ noted in passing.            [³]   │     │
│  │                                    │     │
│  │ Key phrases:                       │     │
│  │  ╭──────────────────╮              │     │
│  │  │ratepayer impact  │              │     │
│  │  ╰──────────────────╯              │     │
│  └───────────────────────────────────┘     │
│                                              │
│  Not covering this lens:                     │   <- LensCoverageRow
│  ╭──────╮ ╭──────╮                          │
│  │ AP   │ │ Polit│                          │
│  ╰──────╯ ╰──────╯                          │
│                                              │
│  Sources:                                    │
│  [¹] Reuters — "FERC commissioners cite…"   │
│  [²] Reuters — "Regional planning rule…"    │
│  [³] WSJ — "Ratepayers face cost-shift…"    │
│                                              │
└──────────────────────────────────────────────┘
```

### Deterministic results (no Focus)

Same screen layout, but:
- **No SUMMARY section above cards** (no `lens` to synthesize)
- **Outlet card content shows "Claims" instead of "Framing"** — bullet-point claims, each with an agreement chip (unanimous / disputed / unique) and citation
- **No "Not covering this lens" row** (no lens to fail)
- **Faster** (~10–15s vs 20–40s); no cost-info banner

### Interaction patterns

- **Compare button tap** — submits to `/api/compare`. Posts `{topic, lens?}`. Empty Focus = null `lens` on backend. Shows streaming progress in the button area.
- **Tap citation `[¹]`** — opens article detail. Same as Ask Sift.
- **Tap key phrase chip** — opens Topic Search with that phrase pre-filled. Returns to Compare on back.
- **Tap outlet name** (in card header) — opens outlet dossier in Custom Tabs.
- **Long-press Focus input** — show recent lenses used (v1.1 — local storage of last 5).
- **Compare button while loading** — disabled; shows progress indicator.
- **Edit Focus + tap Compare again** — re-runs the comparison. Previous results cleared.

### Cost / time info banner

When Focus has text, a small info banner appears below the helper text and above the Compare button:

> ⓘ Adding focus uses an AI agent — ~30s vs ~15s. Counts toward Ask Sift daily limit ($5 signed / $2 anon).

Sets expectation on latency + cost-pool impact. Hidden when Focus is empty.

### Error states

Same set as Ask Sift (cap-hit, rate-limit, upstream, network), plus:

| Compare-specific error | Display |
|---|---|
| Empty / no results | "Couldn't find articles to compare on this topic. Try a different story." + link back to feed |
| Lens too vague (Refined only) | "Your focus is too broad. Try a more specific phrasing like: 'how outlets define X', 'each outlet's stance on Y', 'how they frame Z's character.'" |
| Refined Compare validation failure (Pydantic after retries) | Banner: "AI-driven comparison failed — showing all claims instead." Falls back to deterministic. |

### Civic-literacy specifics

- **Citation enforcement applies the same way as Ask Sift** — every framing claim must have an article_id citation. Output filter strips uncited framings server-side.
- **"Not covering this lens" is honest, not pejorative.** Some outlets genuinely don't address every lens; surfacing them as such is more informative than silent omission.
- **Outlet lean dot + factual rating** appear in every card so users see editorial position alongside framing — same data shape as the outlet badge on Article Detail.

### Open design questions

- **Q16:** Streaming results (each outlet card animates in as agent finishes it) vs batch (all results at once)? Sprint vote: **batch for v0.** Streaming per-outlet adds backend complexity (per-outlet SSE events). Revisit v1.1 if perceived latency complaints.
- **Q17:** Visually distinguish deterministic vs Refined ("Powered by AI" badge)? Sprint vote: **subtle distinction.** Refined shows the SUMMARY section + "Not covering this lens" row — those are visible markers. No explicit badge.
- **Q18:** Allow saving favorite lenses? Sprint vote: **v1.1.** Recent lenses (local) might land sooner.
- **Q19:** Compare from share extension directly? Sprint vote: **v1.1.** v1 share extension goes to article detail; user can tap Compare from there.

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
| `bodyLarge` | SansSerif | Normal | 16sp | 24sp | Body text, chat bubbles |
| `bodyMedium` | SansSerif | Normal | 14sp | 20sp | Card summary, captions, framing paragraphs |
| `labelLarge` | SansSerif | Medium | 14sp | 20sp | Buttons, chips, tabs, tool-call chips |
| `labelMedium` | SansSerif | Medium | 12sp | 16sp | Key phrase chips, citation superscripts |

*Added 2026-05-21: `labelMedium` for the smaller chip + citation marker uses on Screens 7 and 8.*

### Component inventory

Composables to extract as reusable primitives during Phase 2 + Phase 4 (each gets its own file in `ui/common/` once it's used 2+ times):

- [x] `ArticleCard` — already exists in `ui/feed/`
- [ ] `OutletBadge` — compact + full variants
- [ ] `EntityChip` — `SuggestionChip` + tap-to-bottom-sheet pattern (for "Mentioned in this story" row)
- [ ] `OverflowTermChip` — same shape as EntityChip, distinct color, used only for primer overflow terms (3rd+)
- [ ] `PrimerPanel` — expandable card with background paragraph + 1–2 `PrimerDefinition` items + optional overflow chip row
- [ ] `PrimerDefinition` — inline term + plain-English definition + optional `→ dossier` link
- [ ] `CrossSpectrumPanel` — expandable card with L/C/R columns
- [ ] `BottomSheetWithDossierCTA` — modal sheet with term/entity preview + "Open full dossier"
- [ ] `SiftAppBar` — branded top app bar variant
- [ ] `EmptyState` — illustration + copy + CTA pattern (bookmarks empty, no search results, etc.)
- [ ] `ReadAtSourcePill` — sticky bottom CTA

*Added 2026-05-21 (for Screens 7 and 8):*

- [ ] `ChatMessageBubble` — user (right-aligned, `tertiaryContainer` bg) and assistant (left-aligned, `surface` bg) variants. Assistant variant accepts rich content (tool-call chips + streaming text + citation links).
- [ ] `ToolCallChip` — inline indicator of agent tool use. Three states: in progress (spinner), done (checkmark), failed (×). Used inside `ChatMessageBubble` assistant variant.
- [ ] `CitationLink` — superscript `[N]` rendered as `ClickableText` annotation; opens article detail. Used in both Ask Sift assistant messages and Compare outlet framings.
- [ ] `StreamingText` — animated token-by-token text render driven by SSE `text` events. Cursor (▌) appears during streaming.
- [ ] `ChatComposer` — sticky bottom multi-line `TextField` + send/stop `IconButton`. Switches send icon → stop while streaming.
- [ ] `ExamplePromptCard` — empty-state prompt card used in Ask Sift first-run. Tappable to populate composer.
- [ ] `FocusOnInput` — single-line `TextField` + helper text. Used on Compare screen. When non-empty, sibling cost-info banner appears.
- [ ] `OutletFramingCard` — outlet header (name + lean dot + factual rating) + framing paragraph with inline citations + key phrase chips. Used on Compare screen for both deterministic (claims list) and Refined (framing paragraph) variants.
- [ ] `KeyPhraseChip` — searchable phrase chip; tap opens Topic Search with phrase pre-filled.
- [ ] `LensCoverageRow` — "Not covering this lens" horizontal pill row. Refined Compare only.
- [ ] `SourcesFooter` — numbered list of cited articles. Shared by Ask Sift assistant messages and Compare results.
- [ ] `AgentErrorBanner` — cap-hit / rate-limit / upstream-fail / global-disabled banner pattern. Shared across Ask Sift + Compare with consistent copy.
- [ ] `AgentProgressIndicator` — rotating-status-text variant for Compare's button progress ("Comparing outlets…" → "Almost done…").

---

## Gestures + transitions

- **Tab switch** — `HorizontalPager.animateScrollToPage()` (tab tap) or natural swipe gesture. ~300ms ease-in-out.
- **Card → Detail** — Material 3 shared-element-ish: card image expands to hero. Compose Animation API. (Stretch; may defer to v1.1 if implementation is finicky.)
- **Detail back** — standard back swipe (predictive back, Android 14+) + animated.
- **Primer expand** — `AnimatedVisibility(expandVertically + fadeIn)`, 200ms.
- **Bottom sheet show/dismiss** — Material 3 ModalBottomSheet default animation.
- **Theme switch** — `Crossfade` between theme states, 200ms.
- **Chat message append** (Screen 7) — `animateItemPlacement()` on `LazyColumn` items so new bubbles slide in from bottom.
- **Tool-call chip state transition** (Screen 7) — `Crossfade` from spinner → checkmark on tool completion.
- **Streaming text cursor** (Screen 7) — blinking `▌` rendered via `rememberInfiniteTransition` + alpha animation, 600ms cycle.
- **Compare results reveal** (Screen 8) — cards fade in together on batch arrival; later may switch to per-card streaming if Q16 votes change.

---

## Accessibility

Mandatory for Play Store review + the right thing to do regardless. Per-screen checklist:

- All `IconButton`s have non-null `contentDescription` (bookmark, share, theme toggle, send, stop, etc.).
- All `Text` color combos meet WCAG AA contrast (4.5:1 for body, 3:1 for large text) in **both** Newsprint and Late Edition palettes. Chat bubbles + tool-call chips also verified.
- Dynamic Type scaling — verified at 1.0x and 2.0x on Pixel 9. Chat surface (Screen 7) handles 2.0x without breaking the streaming text layout; Compare cards (Screen 8) reflow gracefully.
- TalkBack — every card has a meaningful announcement. New for v1.5: chat bubbles announced as "You said: X" / "Sift replied: X, with N citations." Tool-call chips announced as "Sift is searching articles" → "Search complete."
- Tap targets ≥ 48dp (chips, tabs, icons, send/stop buttons, example prompt cards).
- No color-only signals — outlet political lean uses a colored dot + label, not just color. Tool-call chip states use icon + text, not color alone.
- **Citation links** (Screen 7) — each citation has `contentDescription = "Citation N: article title from source name"` so TalkBack users get the source context.

Verification: every PR runs `./gradlew testDebugUnitTest` (won't catch a11y) + manual TalkBack pass on the changed surface. New for Phase 4: TalkBack pass on the Ask Sift + Compare screens specifically before closed beta.

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
| Q12 | Ask Sift: example prompts always or only on first run? | Only first run; new-chat button restores them |
| Q13 | Ask Sift: tool-call chips inline or collapsing thinking pane? | Inline (grounding signal) |
| Q14 | Ask Sift: show cost / token meter? | No in v1; revisit v1.1 if power users ask |
| Q15 | Ask Sift: voice input? | v1.1 (mic spot reserved in composer) |
| Q16 | Compare: per-outlet streaming or batch reveal? | Batch in v0; revisit v1.1 |
| Q17 | Compare: visually distinguish deterministic vs Refined? | Subtle (SUMMARY + Not covering row are the markers); no badge |
| Q18 | Compare: save favorite lenses? | v1.1 (recent lenses local maybe sooner) |
| Q19 | Compare from share extension directly? | v1.1 |

All open questions have provisional sprint votes; nothing here blocks Phase 2 / Phase 4 code work. Revisit each at v1 closed-beta usability test.

---

## What this sprint output does NOT cover

- **Pixel-perfect visual mocks in Figma.** Low-fi ASCII is enough to start coding; a Figma pass for Article Detail, Ask Sift chat, and Compare screens is a follow-up if visual review needs it.
- **Empty state illustrations.** Will use the Sift diamond mark + Material 3 illustration patterns for v1; custom illustrations are v1.2 polish.
- **Onboarding flow.** v1 doesn't have onboarding — first-launch goes straight to the feed. Sign-in is opt-in from Settings or any place that requires it (bookmarks, push, sustained Ask Sift use). Onboarding (3-screen carousel explaining civic-literacy + Ask Sift) is v1.1.
- **Tablet adaptive layout.** v1 supports tablet but doesn't optimize. Three-pane (categories / feed / detail) is v1.1.
- **Multi-lens Compare.** v0 supports single lens. Multi-lens UI (compare across two or more axes simultaneously) is v1.1.
- **Saved Ask Sift conversations.** v0 chats are ephemeral. History sidebar + named threads are v1.1.
- **Per-outlet streaming on Compare.** v0 is batch reveal. Per-outlet stream as agent completes is v1.1 if perceived latency is a complaint.
- **Voice input on Ask Sift.** Mic permission ask + STT accuracy risk; v1.1.

---

## Next steps

1. **Validate against this doc as Phase 2 ships** — the article detail PR should match the IA + interaction patterns here. If it doesn't, either the code adapts or the design updates (record as a Recent decision in `sift-android/STATUS.md`).
2. **Phase 4 ships against Screens 7 + 8** — the Ask Sift chat UI and Compare screen PRs should match the IA + interaction patterns from the new screen sections. Tool-call chips, citation rendering, Focus-on input behavior all match the spec.
3. **Eval set for Phase 4** — 50 Ask Sift prompts + 30 lens+topic pairs for Refined Compare. Citation rate ≥ 90% on Ask Sift; lens-relevance ratio ≥ 0.9 on Refined Compare. See `sift-api/docs/ASK_SIFT_PLAN.md` and `sift-api/docs/REFINED_COMPARE_PLAN.md` for details.
4. **First usability test target** — closed beta (week 10–11 per Android plan). Recruit 5 readers from the existing web user pool. Watch them use article detail, ask sift chat, and compare specifically.
5. **Figma pass on Ask Sift + Compare** — optional, before Phase 4 implementation. Useful if the ASCII wireframes aren't enough to lock visual decisions on tool-call chips, citation styling, or framing card layout.

---

*Sprint output complete. Phase 2 (Article Detail) and Phase 4 (Ask Sift + Compare) unblocked.*

*See also: [`ANDROID_APP_v1.md`](./ANDROID_APP_v1.md) (canonical decisions), `sift-api/docs/ASK_SIFT_PLAN.md` (Ask Sift backend spec), `sift-api/docs/REFINED_COMPARE_PLAN.md` (Refined Compare backend spec), [`HOW_IT_WORKS.md`](./HOW_IT_WORKS.md) (system end-to-end), [`IOS_APP_ASSESSMENT.md`](./IOS_APP_ASSESSMENT.md) (the critique that named this sprint as a blocker).*
