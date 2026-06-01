# Sift — Phase 2: App-Wide Theme Migration Spec

**Where Phase 1 left things:** the homepage `/` was reskinned to the editorial "news, with footnotes" identity (warm-paper light + warm dark, vermillion accent, Fraunces / Hanken Grotesk / DM Mono), and that reskin was deliberately **scoped under `.sift-landing`** so it wouldn't leak. Two consequences define this phase:
1. **Fonts are already site-wide** (Fraunces/Hanken/DM Mono replaced Playfair/Source Sans everywhere). No font work here.
2. **Color is not.** `/news`, `/civic`, `/methodology`, `/colophon`, the civic dossiers, `/privacy`, `/terms` still run the **old stone/indigo palette**. This phase brings them onto the editorial palette.

Sift already has **light + dark** wired to `[data-theme]`. So there's **no "go dark?" decision** — the work is making the editorial palette correct across every surface **in both themes**, which means **two full token maps**, not one.

> Don't start until you have the surface/component inventory (homepage reskin already mapped much of it). Get sign-off on §1 (un-scoping) and §2 (the token system + the rating-chip rule) before migrating components.

---

## 1. The migration decision: un-scope, don't fork
The reskin's `.sift-landing` scoping was right for shipping one page safely; it's the wrong long-term structure.
- **(A) Promote `.sift-landing` tokens to a GLOBAL semantic layer, migrate surface-by-surface, retire stone/indigo.** One system, one source of truth. **Recommended.**
- **(B) Keep both palettes; migrate only some surfaces.** Leaves Sift permanently two-toned and doubles maintenance. Avoid.

**Recommendation: (A).** Step zero: lift the scoped tokens into global semantic tokens (§2) and **re-point the already-shipped homepage at the global names with zero visual change** — verify the homepage is pixel-identical before migrating anything else. Then migrate the rest and delete the old palette.

---

## 2. Token architecture — two full maps (light + dark)
Promote Phase 1's raw values to a **semantic layer** components consume (no raw hex in components), with **both** theme maps driven by the existing `[data-theme]` toggle.

**Surfaces**

| token | light | dark |
|---|---|---|
| `--surface-base` (page) | `#FBF8F1` | `#15120C` |
| `--surface-raised` (cards) | `#FFFDF8` | `#1F1A12` |
| `--surface-overlay` (menus/modals) | `#FFFFFF` | `#2A241B` |
| `--surface-sunken` (inputs/wells) | `#F3ECDD` | `#1C1813` |

**Text**

| token | light | dark |
|---|---|---|
| `--text-primary` | `#17130E` | `#F2ECDE` |
| `--text-secondary` | `#4C4438` | `#B9B1A0` |
| `--text-tertiary` | `#8A8071` | `#867D6C` |
| `--text-accent` (small accent text) | `#AE3417` | `#F0805E` |
| `--text-on-accent` | meet contrast on the accent fill | meet contrast |

**Borders**

| | light | dark |
|---|---|---|
| `--border` | `rgba(23,19,14,.14)` | `rgba(242,236,222,.15)` |
| `--border-strong` | `rgba(23,19,14,.22)` | `rgba(242,236,222,.24)` |
| `--border-subtle` | `rgba(23,19,14,.08)` | `rgba(242,236,222,.07)` |

**Accent (vermillion) + states**

| | light | dark |
|---|---|---|
| `--accent` | `#E0492A` | `#EC5B39` |
| `--accent-hover` | `#C13F22` | `#F06D4D` |
| `--accent-pressed` | `#AE3417` | `#D24A2C` |
| `--accent-subtle` (tint bg) | `rgba(224,73,42,.10)` | `rgba(236,91,57,.14)` |

**Status / feedback** (search errors, empty/fallback states, toasts — deeper on light, lighter on dark)

| | light | dark |
|---|---|---|
| `--success` | `#2E7D5B` | `#74D2A8` |
| `--warning` | `#B5621A` | `#E89B3C` |
| `--danger` | `#B3261E` | `#E5675A` |
| `--info` | `#2C6E94` | `#6FB1D8` |

**Focus ring:** `--ring` = the accent per theme; `:focus-visible { outline:2px solid var(--ring); outline-offset:2px }`. Never color-only.

`--text-on-accent` is the value to compute per theme: pick paper/white or a near-black warm so text on the accent fill meets **AA (≥4.5:1 body, ≥3:1 large/bold)** — verify in both themes; vermillion sits near the threshold.

Deliverable: one global tokens file (CSS vars under `[data-theme="light"]` / `[data-theme="dark"]` + Tailwind `extend`) and a token→value reference (both columns).

---

## 3. The brand-critical subsystem: rating chips & party tags (NEUTRAL)
Sift cites AllSides/MBFC verbatim, links the source, and does not editorialize about which side is more or less reliable — applied **symmetrically**. The theme must encode that.

**Hard rules:**
- **Political lean is never hue-coded.** AllSides buckets (Left, Lean Left, Center, Lean Right, Right, Mixed) and party tags (R / D / I) render in **neutral ink** — the same `--text-secondary` for Left and Right. No red/blue. Differentiate by **label and position**, not color — e.g. a small 5-tick position glyph in neutral ink with the relevant tick filled.
- **Every rating chip cites + links its source** (AllSides / MBFC page) with an external-link affordance, and shows the last-verified date caption (DM Mono).
- **Factual-reporting tier** (Very High → Very Low): default **tonal/neutral** (a neutral fill-level indicator, not green-good/red-bad). Flag for sign-off if a restrained quality encoding is wanted instead.

Build these as first-class primitives (`OutletChip`, `LeanGlyph`, `FactualChip`, `PartyTag`) so the reader, the comparison view, and all dossiers share one neutral, sourced treatment.

---

## 4. The `/news` reader — the real product, and the density story
High-traffic, long-session surface; "density" is **dense civic metadata + long-form reading**, not charts.
- **Reading comfort, both themes:** Fraunces headlines / Hanken body / DM Mono metadata; body measure ~60–72ch, line-height ~1.6, comfortable sizes. The warm dark (`#15120C`, not pure black) is an intentional long-reading choice — preserve the warmth.
- **Article card:** headline, neutral `OutletChip` (lean + factual + source link), source/time meta, summary, the collapsible **"What you should know first" primer** (keep the open-event behavior the privacy policy documents), inline **term-definition footnotes**, "Read in full" → **original** (external affordance).
- **Comparison view ("how outlets framed it"):** side-by-side framings, neutral chips, described-not-labeled.
- **Category nav** (Today / Technology / … / Entertainment) and **topic search**: input + results + **loading / empty / fallback** states all themed.

## 5. Civic + dossiers
- **Directory pages** (politicians, orgs, bills): scannable typographic density, neutral `PartyTag`s, clear hover/focus, links to individual dossiers.
- **Individual dossiers:** profile + (outlets) ownership/funding + ratings, (people/orgs/bills) role/status, with **citations** (GovTrack / OpenSecrets / ProPublica) in a consistent sourced/external-link style.

## 6. Methodology / colophon / legal
Long-form content pages — apply the editorial reading styles (same measure/scale as the reader's article body). `/colophon` was partly updated in Phase 1 (fonts line); finish its palette + confirm the "Set in" copy.

## 7. Performance & integrity (non-negotiable)
- CSS-only theming via the existing `[data-theme]`; **no new blocking calls**; don't regress the "<50ms article, AI in the background" posture.
- Graceful degradation everywhere (empty/error/fallback states themed).
- **No email capture** (write-paths live in `sift-api` per `CLAUDE.md`); no new dependencies; keep the diamond mark.

---

## Recommended sequence (sub-phases)
- **2a** — Promote tokens to the global semantic layer (both maps) + **re-point the homepage at the global names with zero visual change (verify first)** + build primitives, including the §3 neutral rating-chip / party-tag subsystem.
- **2b** — The `/news` reader (§4). Reading-comfort pass in both themes.
- **2c** — Civic + dossiers (§5).
- **2d** — Methodology / colophon / legal (§6) + remaining surfaces; then **delete the old stone/indigo palette** and grep to confirm nothing references it.
- **2e** — QA: AA contrast in **both** themes, reading comfort, a **rating-chip / party-tag neutrality audit** (no partisan color anywhere), performance check, reduced-motion, responsive.

**Pause after 2a** for verification of primitives + the unchanged homepage before touching the reader.

## Risks
- **The reader is the product** — both themes must be genuinely comfortable; the migration must not slow it.
- **Neutrality is brand-critical** — any partisan color-coding on lean or party tags betrays Sift's symmetric-citation ethos. Hard rule, audited in 2e.
- **Two-theme QA doubles the surface** — light (warm paper) and dark (warm dark) fail differently.
- **Test breakage** — tests assert copy/markup; migrate tests to new contracts while preserving intent.
- **Un-scoping regression** — promoting `.sift-landing` tokens globally must not change the shipped homepage; verify pixel-parity before touching other surfaces.

## Done criteria
- `tsc --noEmit`, `build`, and the test suite pass (CI parity); homepage visually unchanged after un-scoping.
- Every surface on the **global token system in both themes**; **no stone/indigo or hardcoded colors remain** (grep).
- Rating chips, lean glyphs, and party tags **neutral and sourced** everywhere; factual tier neutral (or sign-off-approved restrained encoding).
- Reader comfortable for long reading in both themes; focus-visible rings present; AA contrast holds in both; `<50ms` posture and graceful-degradation states intact.
- Responsive at ~375 / 768 / 1200; `prefers-reduced-motion` respected.
- Summary of changed files + deferred TODOs (e.g. `TODO(live-compare)` still pending from Phase 1).
