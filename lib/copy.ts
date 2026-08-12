// ─── Sift Voice & Tone ──────────────────────────────────
//
// Every string in Sift passes through this file.
// Voice: the patient teacher who never makes you feel dumb.
// Authoritative without being preachy. Never partisan. Never editorializing.
// Rules: contractions always, active voice, no jargon, no exclamation marks.
// Show the data, link the source, let the reader conclude.

import type { BudgetSourceKind, StoryFraming } from "./types";

// ── Outlet-count phrasing (issue #153) ──────────────────
// One source of truth for how the LIVE curated-outlet count reads, so it can't
// drift the way the old hardcoded "~50" did (28 copies, while the real set had
// grown to ~77). The data (outlet_profiles) proves a CURATED set — not which
// outlets are actively ingested — so the honest noun is "curated outlets".
// `n <= 0` (DB miss / empty) drops the number for a graceful, still-truthful
// fallback instead of printing "0".
const curatedOutlets = (n: number): string =>
  n > 0 ? `${n} curated outlets` : "curated outlets";

// The shared brand blurb — rendered in BOTH the /news footer and the landing
// footer. Pass the live count on the landing (the outlet list is already
// fetched for the colophon, ISR-cached); call with no argument on /news (a hot,
// per-request path that doesn't fetch the outlet list — render count-free
// rather than add a DB read there).
const siftBlurb = (n = 0): string =>
  `Sift curates ${n > 0 ? `${n} ` : ""}outlets across the political spectrum, ` +
  `surfaces the civic context the news assumes you already know, and shows you ` +
  `who's behind every story. Every link goes to the original.`;

/**
 * Monitored address for corrections. EMPTY UNTIL THE MAILBOX EXISTS.
 *
 * CorrectionPath renders nothing while this is empty, on purpose: an address
 * that does not receive mail is a correction path that silently fails, which
 * is worse than none and is precisely the defect class the org dossiers spent
 * 2026-07-28 removing (a ProPublica citation that 404'd, a FARA claim with no
 * filing behind it).
 *
 * Set it to a real, monitored mailbox — e.g. corrections@siftnews.io once
 * forwarding is configured on the domain — and it appears on /agencies,
 * /think-tanks and every org dossier at once.
 *
 * standards-counsel's rule (LAUNCH_DECISION_MEMO.md §5 B4): the window has to
 * be one that can actually be kept. 48 hours for a factual correction about a
 * named person; 7 days for everything else. Do not promise 24.
 */
export const CORRECTIONS_EMAIL = "corrections@siftnews.io";

export const COPY = {
  header: {
    tagline: "The news, with footnotes",
    // Non-time-sensitive masthead dateline. Deliberately carries no date or
    // issue number — those were computed from new Date() and froze stale into
    // the ISR-prerendered HTML (see LandingMasthead). Real freshness belongs
    // with the feed, not the marketing masthead.
    dateline: "Curated civic context for the day's news",
  },
  footer: {
    // Shared with landingReskin.footer.blurb via siftBlurb. The /news footer
    // calls it with no count (count-free); the landing passes the live count.
    main: siftBlurb,
    // Routes out of /news into the civic layer. Before these, the product's
    // main surface dead-ended at Privacy/Terms — the dossier corpus (the
    // whole pivot) was unreachable except through an inline entity chip.
    explore: [
      { label: "Civic dossiers", href: "/civic" },
      { label: "Agencies", href: "/agencies" },
      { label: "Think tanks", href: "/think-tanks" },
      { label: "Methodology", href: "/methodology" },
      { label: "Colophon", href: "/colophon" },
    ] as const,
  },
  // ── Theme names ───────────────────────────────────────
  // The themes are named, and the names are the personality: the toggle
  // shows the edition you'd switch to, same as the landing masthead.
  theme: {
    newsprint: "Newsprint",
    lateEdition: "Late Edition",
  },
  // ── First-run coaching ────────────────────────────────
  // One sentence, once, dismissible. Points at the two things visitors
  // don't discover on their own (the footnotes on story cards, compare in
  // the header). No tour, no spotlight — the reader is smart; one pointer.
  coach: {
    body: "New here? Every story carries its civic footnotes — and Compare reads the same story across outlets, side by side.",
    dismiss: "Got it",
    dismissAria: "Dismiss this note",
  },
  error: {
    title: "We hit a snag pulling today's stories",
    body: "Our AI is having a slow morning. Give it another shot \u2014 it usually sorts itself out.",
    button: "Try again",
  },
  loading: {
    slow: "Still reading through sources\u2026 good stories take a moment",
    slowTopic: "Searching articles\u2026 good matches take a moment",
    refresh: "Checking for new stories\u2026",
  },
  bookmarks: {
    title: "Saved Articles",
    emptyTitle: "Nothing saved yet",
    emptyBody: "Star any article to keep it here. Your reading list, your pace.",
  },
  // ── Share & cite ─────────────────────────────────────
  // Two verbs for the same instinct: "Share" hands a page to a person,
  // "Cite" hands it to a bibliography. The swapped labels confirm quietly —
  // copying a link is not an achievement, so no celebration.
  share: {
    share: "Share",
    shared: "Link copied",
    shareAria: "Share this page",
    cite: "Cite",
    cited: "Citation copied",
    citeAria: "Copy a citation for this page",
    // One citation shape, no style toggle: enough for a works-cited line or a
    // reference email, which is what a librarian or staffer actually pastes.
    citation: (entry: string, address: string, accessed: string, sources: string[]) =>
      `“${entry}.” Sift, ${address}. Accessed ${accessed}.` +
      (sources.length > 0 ? ` Underlying data: ${sources.join(", ")}.` : ""),
  },
  compare: {
    // Visible label on the /news header pill \u2014 the \u21cc glyph alone made the
    // flagship feature the hardest one to find.
    entry: "Compare",
    loading: "Comparing coverage across sources\u2026",
    slow: "Searching multiple outlets \u2014 this takes 10\u201320 seconds",
    // Stage lines mirror the real pipeline (search each outlet \u2192 extract
    // claims \u2192 write the summary) on typical timings. Honesty rule: they say
    // what the pipeline is doing, never which outlet has finished \u2014 the
    // client can't see that until the streaming path lands.
    stageSearch: (n: number) => `Searching ${n} outlet${n !== 1 ? "s" : ""}\u2026`,
    stageClaims: "Lining up the claims\u2026",
    stageSummary: "Writing the summary\u2026",
    // Results-header badge. Was reusing emptyTitle ("Multi-Source
    // Comparison"), which read like a menu item on the payoff screen.
    badge: "Multi-source compare",
    emptyTitle: "Compare the coverage",
    emptyBody:
      "Pick a topic and up to five outlets \u2014 Sift lines up where they agree, where they split, and what only one of them reports.",
    placeholder: "Compare coverage across sources\u2026 e.g. \u201cFederal Reserve rate decision\u201d",
    another: "Compare Another Topic",
    anotherPlaceholder: "Enter a topic to compare across sources\u2026",
    button: "Compare coverage",
    comparing: (labels: string) => `Comparing: ${labels}`,
    summary: "Summary",
    keyClaims: "Key Claims",
    // Agreement labels for claim chips. Rendered with status tokens
    // (success/info/warning + neutral) \u2014 claim agreement is a different axis
    // from political lean, but For/Against below stays neutral ink because
    // coloring outlets green/red visually scores them right/wrong.
    agreement: {
      unanimous: "All agree",
      majority: "Mostly agree",
      disputed: "Disputed",
      unique: "Unique angle",
    },
    for: "For:",
    against: "Against:",
    metaSources: (n: number) => `${n} source${n !== 1 ? "s" : ""} checked`,
    metaClaims: (n: number) => `${n} claim${n !== 1 ? "s" : ""} analyzed`,
    // Honesty caption for shared links \u2014 a ?compare= URL reruns the
    // comparison live rather than replaying a stored result.
    liveNote: "Generated live \u2014 opening a shared link runs the comparison fresh, so results can differ slightly.",
    signInTitle: "Sign in to compare",
    signInBody:
      "Source comparison uses AI to cross-reference multiple outlets. Sign in to run your own.",
    // The anonymous door: one real comparison per day, always dated, never
    // presented as live output. Replaces hitting a wall with seeing the
    // actual product — the honest version of a demo.
    dailyTitle: "Today's example",
    dailyBody: (when: string) => `A real comparison from the tool, generated ${when}.`,
    dailySignIn: "Sign in to run your own",
  },
  search: {
    // Visible label on the /news header pill, matching compare.entry.
    entry: "Search",
    placeholder: "What are you looking for?",
    resultsFor: (query: string) => `Results for \u201c${query}\u201d`,
    noResults: "No matches found",
    fallbackSearching: "\u2014 searching the web, try again shortly",
    fallbackUsed: "Supplemented with web search",
  },
  articles: {
    updated: "Updated just now",
    searchTopics: "Search Topics",
    emptyTitle: "No stories yet for this topic",
    emptyBody: "Check back in a bit \u2014 the AI is still looking.",
  },
  stories: {
    sourcesBadge: (count: number) => `${count} source${count !== 1 ? "s" : ""}`,
    expand: (count: number) => `View ${count} article${count !== 1 ? "s" : ""}`,
    collapse: "Hide sources",
    framing: (count: number) =>
      count === 1
        ? "How one outlet framed it"
        : count <= 3
          ? `How ${count} outlets framed it`
          : `How ${count} outlets covered this`,
    // Eyebrow shown above the cross-spectrum L/C/R columns, in place of
    // the standard "How N outlets framed it" header when the story
    // qualifies for cross-spectrum (≥3 bucketed framings, ≥2 buckets).
    crossSpectrumHeader: "Across the spectrum",
    crossSpectrumBucketLabels: {
      left: "Left",
      center: "Center",
      right: "Right",
    } as const,
    // Shown under the framing header only when the outlets actually span 2+
    // lean buckets — the rows are always sorted L→C→R, but the note should
    // only claim a spectrum when one is present. This ordering is the
    // product's best ambient feature; one line makes it legible.
    spectrumNote: "Sorted left to center to right — read down and watch the framing shift.",
    compareRow: "Compare coverage",
    moreFromOutlet: (count: number, outlet: string) =>
      `+${count} more from ${outlet}`,
    expandedMeta: (when: string, count: number) =>
      `Updated ${when} · ${count} ${count === 1 ? "source" : "sources"}`,
    analyzingFallback: "Sources are still being analyzed — articles below.",
    toneLabels: {
      neutral: "Straight",
      urgent: "Pressing",
      analytical: "Deep read",
      critical: "Skeptical",
      optimistic: "Hopeful",
    } as Record<StoryFraming["tone"], string>,
  },
  notFound: {
    title: "This page wandered off",
    body: "We looked everywhere \u2014 even had the AI search for it. Let\u2019s get you back to the stories.",
    button: "Back to Sift",
  },
  // Global error boundary (`app/error.tsx`). Triggers on any uncaught throw
  // in a server or client component below the root layout. The not-found
  // copy is intentionally playful; the error copy is intentionally plain.
  errorBoundary: {
    title: "Something broke on our end",
    body: "Try reloading. If it keeps happening, the stories on the home page should still load.",
    retry: "Try again",
    home: "Back to Sift",
  },
  topics: {
    modalTitle: "What do you want to track?",
    modalPlaceholder: "e.g. Florida utilities, AI in healthcare, Series A funding",
    generate: "Generate preview",
    generating: "Interpreting your topic\u2026",
    previewTitle: "Here\u2019s what I\u2019ll track",
    previewQueries: "Search queries",
    confirm: "Add topic",
    cancel: "Cancel",
    edit: "Edit",
    maxReached: "You\u2019ve hit the 5-topic limit. Remove one to add another.",
  },
  searchEmpty: {
    title: "Nothing matched that search",
    body: "Try different words \u2014 or let the AI surprise you.",
    button: "Browse today\u2019s stories",
  },
  glossary: {
    // Eyebrow shown above the inline list of resolved entities at the
    // foot of an article card. Phase 3.H — civic-literacy MVP.
    eyebrow: "Mentioned in this story",
    // Per-type prefix glyphs in the small mono register. Kept short so
    // the pills don't bloat the meta line.
    typeGlyphs: {
      politician: "◉",
      org: "◆",
      bill: "▸",
      outlet: "▣",
    } as Record<string, string>,
    // Phase 3.G.3 — chip tooltip preview, shown on hover/focus.
    tooltip: {
      politicianTopIndustries: "Top industries by PAC contributions (2022 cycle)",
      noPacData: "No PAC data on file for the 2022 cycle.",
      // Click-through hint at the foot of the tooltip.
      openDossierHint: "Open dossier →",
    },
  },
  primer: {
    // Eyebrow shown above the collapsed/expanded primer panel.
    eyebrow: "What you should know first",
    // Toggle button copy. Closed \u2192 opens; open \u2192 closes.
    show: "Show context",
    hide: "Hide context",
    // Section header inside the expanded primer when there are key terms.
    termsLabel: "Key terms",
  },
  methodology: {
    eyebrow: "Methodology",
    title: "How Sift sources the news",
    lede:
      "Sift reads from a hand-curated set of news outlets, surfaces ownership and funding for each, and links every bias and factual-reporting rating to its public source. The methodology is the product as much as the feature — here's exactly how it works.",
    sections: {
      includes: {
        kicker: "What Sift reads",
        body: (n: number): string =>
          `${n > 0 ? `${n} curated outlets` : "Curated outlets"}, hand-picked to balance the political spectrum (AllSides Left → Center → Right), span sector specialties (finance, tech, science, climate, health), and clear a factual-reporting bar. Each outlet has a dossier with ownership, funding model, and external rating links — click any name below.`,
        bucketLabels: {
          left: "Left",
          center: "Center",
          right: "Right",
          unrated: "Unrated or specialty",
        },
        unratedNote:
          "Outlets without an AllSides rating are typically peer-reviewed scientific journals (Nature, Science) or sector specialists (Carbon Brief, STAT News) where political-lean isn't the relevant axis. MBFC factual-reporting ratings still apply.",
      },
      excludes: {
        kicker: "What Sift excludes",
        body: "Some categories of source never enter the pipeline:",
        items: [
          "Aggregators (Google News, Yahoo News, MSN) — no original reporting.",
          "AI-content farms — synthetic articles without identifiable bylines.",
          "Outlets MBFC rates Low Factual or Very Low Factual — regardless of political lean.",
          "Sites without identifiable bylines, mastheads, or corrections policies.",
          "Crypto / health-supplement sites that brand themselves as news.",
        ],
      },
      bias: {
        kicker: "Where bias ratings come from",
        body:
          "Sift surfaces AllSides' political-lean rating for each outlet. AllSides classifies outlets into six buckets — Left, Lean Left, Center, Lean Right, Right, Mixed — based on a methodology that combines blind bias surveys, editorial reviews, and reader feedback. Sift never computes its own bias rating; we cite AllSides verbatim with a link to the source page on every dossier.",
        cite: "AllSides — methodology and ratings (allsides.com)",
        citeUrl: "https://www.allsides.com/media-bias/media-bias-rating-methods",
      },
      factual: {
        kicker: "Where factual-reporting ratings come from",
        body:
          "For factual reporting, Sift surfaces Media Bias/Fact Check (MBFC) ratings on a six-tier scale — Very High, High, Mostly Factual, Mixed, Low, Very Low. MBFC's methodology weighs sourcing standards, fact-check track record, corrections policy, and frequency of false claims. Same rule as bias ratings: we cite verbatim, never compute our own, and link to MBFC for verification.",
        cite: "Media Bias/Fact Check — methodology (mediabiasfactcheck.com)",
        citeUrl: "https://mediabiasfactcheck.com/methodology/",
      },
      symmetric: {
        kicker: "Symmetric application",
        body:
          "Every outlet gets the same treatment regardless of which side of the spectrum it sits on. Fox News and MSNBC are both shown with their AllSides ratings and MBFC factual-reporting tiers. National Review and The Nation get identical dossier shapes. Sift does not editorialize about which side is more or less reliable — that's the reader's call, with the data in front of them.",
      },
      cadence: {
        kicker: "Refresh cadence",
        body:
          "AllSides + MBFC ratings drift over time as outlets shift editorial direction, get acquired, or change sourcing standards. Sift hand-reviews every rating quarterly and stores a last-verified date alongside each one — it's the small mono caption under each rating on the dossier page. Outlet additions happen on demand when readers flag gaps; the inclusion criteria above are the only filter.",
      },
      suggest: {
        kicker: "Suggest an addition or correction",
        body:
          "If an outlet is missing, a rating looks stale, or anything in this methodology reads wrong, open an issue on GitHub or send a note. Sift is a portfolio project — corrections land fast.",
        github: "kristenmartino/sift on GitHub",
        githubUrl: "https://github.com/kristenmartino/sift/issues/new",
      },
    },
    backLink: "Back to Sift",
  },
  politicianDossier: {
    eyebrow: "Politician dossier",
    sections: {
      committees: "Committee assignments",
      topIndustries: "Top industries by PAC contributions (2022 cycle)",
      // Deliberately NOT "Interest-group ratings" (plural, general).
      // Only one scorecard is obtainable today, so the heading names
      // what it is: a third party's own record, attributed. Revisit
      // the wording when a second, differently-aligned rater lands.
      interestGroupRatings: "Advocacy-group scorecards",
      links: "Where to read more",
      notes: "Notes",
      // Migration 015. Committees / PAC industries / interest-group ratings
      // are all N/A for an executive official, so without this section every
      // conditional in PoliticianDossier collapses and the page is a name and
      // a chamber label.
      office: "Office of record",
    },
    // Row labels in the executive "Office of record" section. Each value on
    // the page is followed by the record it came from — no label here asserts
    // anything the linked record doesn't state.
    officeLabels: {
      roleTitle: "Office",
      held: "Held",
      nomination: "Nominated",
      confirmation: "Confirmed by the Senate",
      // Two different claims, so two different labels. The nomination record
      // naming a predecessor is a flat fact. A prior roll-call only shows whom
      // the Senate last confirmed — acting officials are never confirmed, so
      // "Preceded by" would overstate it.
      predecessor: "Preceded by",
      predecessorConfirmed: "Previous Senate-confirmed holder",
    },
    // Exact phrasing matters here. The Senate roll-call dates the successor's
    // confirmation, not the day the incumbent walked out — so the page says
    // what the record says and nothing more.
    officeSourceLabels: {
      statute: "Office established by",
      dates: "Term record",
      nomination: "Nomination record",
      vote: "Roll-call vote",
    },
    officeSuccessorNote: "until a Senate-confirmed successor took the office",
    // External-link labels in stable display order.
    externalLinkLabels: {
      official: "Official site",
      govtrack: "GovTrack",
      opensecrets: "OpenSecrets",
      votesmart: "Vote Smart",
      ballotpedia: "Ballotpedia",
      wikipedia: "Wikipedia",
    } as Record<string, string>,
    // Footer note shown when donor and rating data are both absent. Common
    // for senators not on the 2022 ballot (no PAC contributions during the
    // cycle) and for politicians without a public OpenSecrets profile.
    // Sift's PAC industry data comes from OpenSecrets bulk imports \u2014
    // re-runs cycle-to-cycle, not on a daily refresh (the OpenSecrets API
    // was discontinued April 2025). Interest-group ratings aren't yet
    // imported.
    notYetEnriched:
      "PAC contribution data isn't on file for the 2022 cycle \u2014 common for senators not on that year's ballot. Interest-group ratings aren't yet imported.",
    methodologyHint: "Data comes from public records. Read the methodology.",
    // Empty-state when industries/ratings are partially populated.
    industriesEmpty: "No donor-industry data yet for this cycle.",
    ratingsEmpty: "No interest-group ratings yet recorded.",
  },
  orgDossier: {
    eyebrow: "Org dossier",
    sections: {
      /** @deprecated migration 012 — Sift-assigned lean is no longer rendered. */
      politicalLean: "Political lean",
      selfDescription: "In its own words",
      governance: "Structure and appointment",
      finances: "Finances",
      majorFunders: "Major funders",
      fara: "Foreign-agent registration (FARA)",
      // Filed relationships between organizations (sift-api migration 027).
      // "Grants paid" and not "funding" — the 990 shows money this org sent
      // out, never who paid in. A public charity's donors are redacted from
      // the public copy of its own return, so the inbound side is genuinely
      // not knowable from this filing and the heading must not imply it is.
      grantsPaid: "Grants paid",
      relatedOrgs: "Related organizations",
      links: "Where to read more",
      notes: "Notes",
    },
    // ── Funding edges ────────────────────────────────────
    fundingEdges: {
      grantsIntro: (count: number, total: string, period: string) =>
        `${count} grant${count === 1 ? "" : "s"} of $5,000 or more, ${total} in total, as reported on the organization's own Form 990 for ${period}.`,
      relatedIntro:
        "Organizations this one declares as related on its Form 990. A declared relationship, not an inference by Sift.",
      // The gate, said out loud — and split by reason, because they are not
      // the same fact. Lumping them under one sentence told a reader that
      // The Heritage Institute's *name* mismatched when the truth is its EIN
      // simply is not in the e-filer index. A confident wrong explanation is
      // the failure this whole check exists to prevent.
      heldReviewNote: (count: number) =>
        `${count} further ${count === 1 ? "entry is" : "entries are"} withheld: the recipient name on the filing doesn't match the IRS record for the EIN it was filed under, so a person needs to check it before it appears here.`,
      heldUnmatchedNote: (count: number) =>
        `${count} more ${count === 1 ? "recipient is" : "recipients are"} not shown: the EIN on the filing isn't in the IRS index of electronic filers — often a consultancy, an LLC, or an organization small enough not to file — so there's nothing to check the name against.`,
      inboundNote:
        "This shows money paid out. A public charity's own donors are redacted from the public copy of its return, so who funds this organization can't be read from this filing.",
      sourceLink: (period: string) => `Source: Form 990, tax period ${period}`,
      noEin: "No EIN on record for this organization, so filed grants can't be matched to it.",
      amountUnknown: "Amount not stated",
    },
    // The caveat is not boilerplate — it is the whole reason this replaced a
    // Sift-assigned lean. A reader must not read a self-description as an
    // independent assessment, and organizations describe themselves favorably.
    selfDescriptionCaveat:
      "This is how the organization describes itself, quoted from its own site — not an assessment by Sift. Sift does not rate organizations.",
    selfDescriptionCitation: (checked: string | null) =>
      checked
        ? `Source: the organization's own site · last verified ${checked}`
        : "Source: the organization's own site",
    // External-link labels in stable display order.
    externalLinkLabels: {
      propublica: "ProPublica Nonprofit Explorer",
      irs_990: "IRS Form 990",
      fara: "FARA filings",
      official: "Official site",
      wikipedia: "Wikipedia",
    } as Record<string, string>,
    // Funders provenance. The previous caption read "Source: ProPublica
    // Nonprofit Explorer (latest 990)" directly under the named-funders list,
    // which the cited record does not support: public Form 990s redact
    // Schedule B, so the copies ProPublica hosts do NOT disclose individual
    // donors. A citation that invites a check and fails it is worse than none.
    // The 990 supports the *financial* figures; the donor names come from the
    // organizations' own disclosures and public reporting.
    fundersProvenance:
      "Compiled from the organizations' own disclosures (annual reports, donor listings) and public reporting. Public Form 990s do not disclose individual donors — Schedule B is redacted in the copies available to the public.",
    fundersFinancialsNote: "Financial figures:",
    // FARA disclosure copy. Symmetric — same wording regardless of which
    // country the org is registered to represent.
    faraRegisteredHeader: "Registered as a foreign agent",
    faraRegisteredBody: (countries: string[]) =>
      countries.length === 0
        ? "This organization is registered with the U.S. Department of Justice under FARA."
        : countries.length === 1
          ? `This organization is registered with the U.S. Department of Justice under FARA on behalf of ${countries[0]}.`
          : `This organization is registered with the U.S. Department of Justice under FARA on behalf of: ${countries.join(", ")}.`,
    // Single-line lede builder bits.
    foundedYearLabel: (year: number) => `Founded ${year}`,
    // Was `Annual budget ~${budget}` against an unsourced fixture figure.
    // "Annual budget" was never a checkable claim; a named figure from a named
    // filing is. The tilde is gone too — the figure is now exact.
    //
    // Keyed on which record the source is, because the two do not measure the
    // same thing. A 990 reports total functional expenses. OMB Historical
    // Tables report net outlays — net of offsetting receipts, hence GSA's
    // legitimate −$379M, which reads as a bug under the word "expenses".
    // These were a single hardcoded pair until 2026-08-07, so 23 agency pages
    // cited an OMB spreadsheet under the name of a Form 990 they do not have.
    annualBudgetLabel: (budget: string, fy: string, kind: BudgetSourceKind | null) =>
      kind === "ombOutlays"
        ? `Net outlays ${budget} · ${fy}`
        : kind === "form990"
          ? `Total expenses ${budget} · ${fy}`
          : // Neither record identified: state the figure, name nothing.
            `${budget} · ${fy}`,
    budgetSourceLabel: (kind: BudgetSourceKind | null) =>
      kind === "ombOutlays"
        ? "Per OMB Historical Tables, Table 4.1 (outlays by agency)"
        : kind === "form990"
          ? "Per the Form 990 on ProPublica Nonprofit Explorer"
          : "Per the cited source",
    methodologyHint: "Funding data comes from IRS 990s and FARA. Read the methodology.",
  },
  billDossier: {
    eyebrow: "Bill dossier",
    sections: {
      status: "Status",
      sponsor: "Sponsor",
      cosponsors: "Cosponsors",
      lobbying: "Lobbying spend",
      introducedDate: "Introduced",
      links: "Where to read more",
      notes: "Notes",
    },
    externalLinkLabels: {
      govtrack: "GovTrack",
      congress: "Congress.gov",
      opensecrets: "OpenSecrets (lobbying)",
    } as Record<string, string>,
    // Cosponsor count formatter — bill_profiles stores bioguide IDs only;
    // we don't fetch each politician for the dossier (would be N round
    // trips). Phase 3.F can backfill names if/when it's worth it.
    cosponsorCount: (count: number) =>
      count === 0
        ? "No cosponsors recorded."
        : count === 1
          ? "1 cosponsor"
          : `${count.toLocaleString("en-US")} cosponsors`,
    // Lobbying-spend pair labels.
    lobbyingFor: "For",
    lobbyingAgainst: "Against",
    lobbyingNotePending:
      "Lobbying-spend totals haven't been imported yet.",
    // Status pills are rendered with the same Fraunces 26 register as the
    // outlet dossier's bias/factual ratings.
    methodologyHint: "Data comes from public records. Read the methodology.",
  },
  dossier: {
    // Eyebrow shown above the outlet name.
    eyebrow: "Outlet dossier",
    // Section labels (mono kicker style).
    ownership: "Ownership",
    funding: "Funding",
    bias: "Political-lean rating",
    factual: "Factual reporting",
    links: "Where to read more",
    notes: "Notes",
    recentStories: "Recent stories on Sift",
    // Citation footer notes.
    citation: (source: string, lastChecked: string | null) =>
      lastChecked
        ? `Source: ${source} \u00b7 last verified ${lastChecked}`
        : `Source: ${source}`,
    methodologyHint: "Why these ratings? Read the methodology.",
    // External-link labels.
    externalLinkLabels: {
      wikipedia: "Wikipedia",
      official: "Official site",
      ownership: "Ownership reference",
    } as Record<string, string>,
    // Funder list label.
    majorFunders: "Major funders",
    // Empty state for the recent-stories list.
    noRecent:
      "No recent stories from this outlet on Sift. The pipeline reads from this outlet \u2014 nothing has surfaced in the last day or two.",
  },
  landing: {
    // Lead-story fallback + feed CTA, shown by components/landing/LeadStory.tsx
    // when the morning ingest hasn't filed a lead story yet. The rest of the old
    // `landing` block (the "what is this" explainer, the Fed compare demo, and
    // the colophon strings) was superseded by `landingReskin` and removed in the
    // #150 copy pass \u2014 all were 0-use.
    leadFallbackTitle: "Today\u2019s stories are still being filed",
    leadFallbackBody:
      "The morning ingest is in progress. Open the feed for what\u2019s already in.",
    feedCta: "Open the full feed",
  },
  // ─── Homepage reskin ("The news, with footnotes") ──────
  // Copy for the reskinned `/` sections. Kept separate from `landing` (still
  // used by the lead-story explainer + colophon) so neither clobbers the other.
  landingReskin: {
    nav: {
      links: [
        { label: "What Sift adds", href: "#adds" },
        { label: "Compare", href: "#compare" },
        { label: "Sources", href: "#sources" },
      ],
      cta: "Open Sift",
      menuOpen: "Close",
      menuClosed: "Menu",
    },
    hero: {
      eyebrow: "Curated civic context for the news",
      headingLead: "The news, with ",
      headingAccent: "footnotes",
      lede: (n: number): string =>
        `Sift curates ${n > 0 ? `${n} ` : ""}outlets across the political spectrum and adds the context the news assumes you already know — the background, the people and organizations involved, and how to read each source. Every link goes to the original.`,
      ctaPrimary: "Open Sift",
      ctaSecondary: "See what Sift adds",
      foot: (n: number): string => `${curatedOutlets(n)} · Left → Center → Right`,
    },
    card: {
      barLabel: "Today · Top story",
      badge: "civic context on",
      primerLabel: "What you should know first",
    },
    strip: (n: number): string[] => [
      curatedOutlets(n),
      "Left → Center → Right",
      "Ratings cited, never computed",
      "Every link goes to the original",
    ],
    manifesto: {
      eyebrow: "Why Sift",
      headingLead: "The news is written for people who ",
      headingEm: "already have the context.",
      body: "Most reporting assumes you know the players, the precedent, and where the source is coming from. Sift adds it back — so you can read across the spectrum and judge for yourself, with the footnotes in front of you.",
      spectrum: (s: {
        left: number;
        center: number;
        right: number;
        specialty: number;
      }): { label: string; count: number }[] => [
        { label: "Left", count: s.left },
        { label: "Center", count: s.center },
        { label: "Right", count: s.right },
        { label: "Specialty", count: s.specialty },
      ],
      spectrumCaption:
        "Hand-picked to balance the spectrum and clear a factual-reporting bar. Outlets without a political-lean rating are peer-reviewed journals or sector specialists.",
    },
    adds: {
      eyebrow: "What Sift adds",
      titleLead: "A footnote on ",
      titleIt: "every story.",
      subtitle:
        "Not a summary that replaces the article — context that lets you actually read it. The methodology is the product as much as the feature.",
      cards: [
        {
          icon: "i",
          title: "What you should know first",
          body: "A short primer on the background the story takes for granted — the precedent, the stakes, why it matters now.",
        },
        {
          icon: "A·z",
          title: "Terms you may not know",
          body: "The jargon, acronyms, and procedure defined inline, so the paragraph actually makes sense the first time through.",
        },
        {
          icon: "◈",
          title: "Who's involved",
          body: "Dossiers on the senators, agencies, and organizations named — who they are and where they sit, without leaving the story.",
        },
        {
          icon: "⇄",
          title: "The source & the spread",
          body: "Each outlet's AllSides lean and MBFC factual tier — cited and linked, never our own rating — plus how other outlets framed the same story.",
        },
      ],
    },
    compare: {
      eyebrow: "How outlets framed it",
      titleLead: "One story, ",
      titleIt: "three angles.",
      subtitle:
        "Sift shows what each outlet chose to emphasize — described, not labeled “biased” or “objective.” You read; the product does the legwork.",
      topicLabel: "Topic",
      topic: "The Federal Reserve's May rate decision",
      frames: [
        {
          outlet: "Reuters",
          lean: "AllSides: Center",
          quote: "Powell signals patience as inflation stays sticky; Fed leaves rates unchanged.",
        },
        {
          outlet: "Wall Street Journal",
          lean: "AllSides: Center",
          quote: "Markets read between the lines: rate cuts unlikely before the fall.",
        },
        {
          outlet: "Bloomberg",
          lean: "AllSides: Center",
          quote: "Wall Street recalibrates as rate-cut bets fade and bond yields climb.",
        },
      ],
      noteLine:
        "Same event, three emphases. Sift puts them side by side and lets you draw the line.",
      // Live-example variants — used when the daily compare example exists
      // (sift-api writes one real comparison per UTC day, migration 021).
      // The static Fed frames above stay as the fallback before the first
      // generation ever runs, still labeled honestly by noteLine.
      liveTitleIt: "side by side.",
      liveTopicLabel: "Today's comparison",
      liveDisputedVs: " vs ",
      liveNote: (date: string) =>
        `Generated ${date} by the compare tool — one real comparison a day, straight from the product.`,
    },
    sources: {
      eyebrow: "Curated & cited",
      titleLead: "",
      titleIt: (n: number): string =>
        n > 0 ? `${n} curated outlets.` : "Curated outlets.",
      titleRest: " Every rating sourced.",
      body: "Hand-picked across Left, Center, and Right, each with a dossier: ownership, funding model, AllSides lean, and MBFC factual tier — cited verbatim with a link, reviewed quarterly, and applied symmetrically to every outlet.",
      methodologyCta: "Read the methodology",
      exclusionsLabel: "What never enters the pipeline",
      exclusions: [
        { term: "Aggregators", desc: "no original reporting." },
        { term: "AI-content farms", desc: "synthetic articles without bylines." },
        { term: "Low-factual outlets", desc: "regardless of political lean." },
        { term: "Sites without", desc: "mastheads, bylines, or corrections policies." },
        { term: "Crypto & supplement sites", desc: "dressed up as news." },
      ],
      outletsLabel: "Curated outlets",
    },
    cta: {
      titleLead: "Read today's news — ",
      titleEm: "with the footnotes.",
      body: (n: number): string =>
        `${n > 0 ? `${n} curated outlets` : "Curated outlets across the spectrum"}, the civic context the news assumes you already know, and a link to the original on every story.`,
      ctaPrimary: "Open Sift",
      ctaSecondary: "How it works",
    },
    footer: {
      blurb: siftBlurb,
      cols: [
        {
          heading: "Read",
          links: [
            { label: "Today", href: "/news" },
            { label: "Civic", href: "/civic" },
          ],
        },
        {
          heading: "About",
          links: [
            { label: "Methodology", href: "/methodology" },
            { label: "Colophon", href: "/colophon" },
          ],
        },
        {
          heading: "Legal",
          links: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ],
        },
      ],
      bylinePre: "Designed & built by ",
      bylineName: "Kristen Martino",
      bylineHref: "https://kristenmartino.ai",
      tagline: "Every story links to the original.",
    },
  },
  // /agencies — the cited-governance page. Every string here describes a
  // statutory fact or the provenance of one. Nothing on this page is
  // AI-generated and nothing is Sift's own characterization, which is the
  // whole point of it: it is the one surface with no Cohere/Meltwater
  // exposure, no Art. 50(4) disclosure obligation, and no ratings licence
  // dependency. Keep it that way.
  agencies: {
    eyebrow: "Public records",
    headline: "Who controls a federal agency",
    dek: "Appointment, terms, and the partisan-balance limits Congress wrote into statute, for 25 federal agencies \u2014 each cited to the section of the U.S. Code it came from.",
    // #1 from the cold read: the masthead above this page says "the news, with
    // footnotes" and the nav shows a Sports tab. A government-information
    // librarian arriving from a cold email sees a news aggregator and has to
    // reconcile that with "no AI-generated text" before reading a word. Owning
    // the mismatch in one line beats letting them find it.
    contextNote:
      "Part of Sift, a news-context project \u2014 but this page is public-records reference, and contains no AI-generated text. 25 of the 93 agencies Sift holds appear here: the ones whose governing law has been read and cited.",
    // Per-agency and concrete. The first reader of this page asked what
    // "statutory partisan-balance limit" meant — naming a category made a
    // reader decode it; the numbers state the constraint outright. They
    // genuinely differ (FEC 3 of 6, NCUA 2 of 3), so this is computed.
    capLabel: (cap: number, total: number) =>
      `Max ${cap} of ${total} from one party`,
    // Used only when the numbers can't be read out of the statute with
    // confidence. A vaguer label beats a wrong number sitting next to a
    // source link that contradicts it.
    capLabelFallback: "Party balance required by law",
    capExplainerHeading: "Why this matters",
    // The finding, stated plainly. Counts are computed from live data.
    capExplainer: (capped: number, total: number) =>
      `${capped} of these ${total} agencies operate under a limit, written into their authorizing statute, on how many members may belong to one political party. The Federal Election Commission is the clearest case: six voting members, no more than three from either party, and no tie-breaking seat \u2014 so a party-line split is 3\u20133 and nothing carries. That is structural, not a matter of personality or of who is currently in office. Where a statute sets no such limit \u2014 the National Labor Relations Board, for instance \u2014 that absence is a fact about the agency too.`,
    countLine: (total: number) =>
      `${total} ${total === 1 ? "agency" : "agencies"} with cited governing law`,
    sourcePrefix: "Source:",
    dossierLink: "Full dossier",
    provenanceHeading: "How this page was made",
    provenance:
      "Each entry states only what the cited section says. Facts that change with an administration \u2014 who currently chairs an agency, its present composition, which president appointed the sitting majority \u2014 are deliberately absent: they go stale and there is no process here to refresh them. What remains is structural and durable.",
    notAiNote:
      "No part of this page is AI-generated. These are statutory facts, quoted or summarized from the sections linked beside each one.",
    incompleteHeading: "What is missing",
    incomplete: (shown: number, totalAgencies: number) =>
      `The other ${totalAgencies - shown} agencies Sift holds are omitted rather than summarized from memory. Each one appears here only once its governing statute has been read and cited \u2014 which is slower than filling the gaps from general knowledge, and is the point.`,
    empty: "No agency governance has been cited yet.",
    backLink: "Back to Sift",
  },
  // /think-tanks — the self-description page. Every rendered claim is the
  // organization's own wording, quoted and linked. Sift does not characterize
  // these organizations; that is the whole reason this replaced the
  // Sift-assigned political_lean (D37, migration 012).
  thinkTanks: {
    eyebrow: "In their own words",
    headline: "How policy organizations describe themselves",
    dek: "Each of these organizations, quoted from its own site \u2014 not summarized, not rated, not characterized by Sift. Every quote links to the page it came from.",
    countLine: (n: number) =>
      `${n} ${n === 1 ? "organization" : "organizations"}, quoted and cited`,
    nonPartisanBadge: "Also calls itself nonpartisan",
    faraBadge: (countries: string[]) =>
      countries.length > 0
        ? `Registered foreign agent \u00b7 ${countries.join(", ")}`
        : "Registered foreign agent",
    findingHeading: "What to notice",
    finding: (claiming: number, total: number) =>
      `${claiming} of these ${total} state an ideology and a claim of non-partisanship in the same breath \u2014 conservative, libertarian, progressive or liberal, alongside "nonpartisan" or a disclaimer of taking positions. Both halves are quoted below. Party and ideology are not the same thing, and an organization can honestly claim one while holding the other; a one-word label would have hidden the distinction entirely.`,
    sourcePrefix: "Their words, from",
    checkedPrefix: "last verified",
    dossierLink: "Full dossier",
    provenanceHeading: "How this page was made",
    provenance:
      "These are self-descriptions: what each organization says about itself, not an independent assessment. Organizations describe themselves favorably \u2014 that is exactly why the wording is quoted rather than paraphrased, and why the source sits beside every one. Sift assigns no rating to any organization on this page.",
    notAiNote:
      "No part of this page is AI-generated. Every quotation was read from the organization's own site on the date shown.",
    empty: "No self-descriptions have been cited yet.",
    backLink: "Back to Sift",
  },
  // Correction path (LAUNCH_DECISION_MEMO.md §5, B4). Rendered by
  // components/CorrectionPath.tsx, which no-ops while CORRECTIONS_EMAIL is
  // empty. Phrased for the audience these pages are being sent to: people who
  // check sources for a living and will find an error before anyone else does.
  corrections: {
    heading: "Found an error?",
    body: "Every claim on this page is meant to match the record it cites. If one doesn\u2019t \u2014 a misread statute, a broken link, a figure that doesn\u2019t match the filing \u2014 tell me and I\u2019ll fix it or take it down:",
    subject: "Correction \u2014 Sift",
    window:
      "Corrections about a named person are handled within 48 hours; everything else within a week. Corrections are noted, not silently overwritten.",
  },
  civicIndex: {
    eyebrow: "Civic dossiers",
    headline: "Civic dossiers",
    lede: "Curated context on the people, organizations, and bills that shape U.S. policy. Every dossier is sourced from public records \u2014 GovTrack, OpenSecrets, ProPublica's Nonprofit Explorer \u2014 with citations on every page.",
    politiciansEyebrow: (count: number) => `Politicians \u00b7 ${count}`,
    politiciansHeading: "Sitting members of Congress",
    orgsEyebrow: (count: number) => `Organizations \u00b7 ${count}`,
    // Was "Think tanks, advocacy groups, and PACs" \u2014 wrong twice over: there
    // are no PACs in the set, and it silently omitted the federal agencies,
    // which are the majority of it. The heading now names what's actually
    // there; orgsSubhead carries the split, derived from live counts rather
    // than hardcoded so it can't drift the way the old string did.
    orgsHeading: "Think tanks, advocacy groups, and federal agencies",
    orgsSubhead: (thinkTanks: number, advocacy: number, agencies: number) => {
      const parts: string[] = [];
      if (thinkTanks) parts.push(`${thinkTanks} think tank${thinkTanks === 1 ? "" : "s"}`);
      if (advocacy) parts.push(`${advocacy} advocacy organization${advocacy === 1 ? "" : "s"}`);
      if (agencies) parts.push(`${agencies} federal agenc${agencies === 1 ? "y" : "ies"}`);
      if (parts.length === 0) return "";
      const last = parts.pop() as string;
      return parts.length ? `${parts.join(", ")} and ${last}.` : `${last}.`;
    },
    billsEyebrow: (count: number) => `Bills \u00b7 ${count}`,
    billsHeading: "Landmark legislation",
    filterAll: "All",
    filterSenate: "Senate",
    filterHouse: "House",
    showingAll: (n: number) => `${n.toLocaleString("en-US")} total`,
    showingFiltered: (shown: number, total: number) =>
      `${shown.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`,
    emptyPoliticians:
      "No politicians match this filter. Try Senate, House, or All.",
    emptyOrgs: "No organizations curated yet.",
    // Cross-link into /agencies. States the payoff rather than the
    // destination — "see the agencies page" gives a reader no reason to
    // click; the partisan-balance fact does.
    agenciesCrossLink:
      "Who controls a federal agency \u2014 appointment, terms, and the party-balance limits written into statute \u2192",
    thinkTanksCrossLink:
      "How these organizations describe themselves \u2014 in their own words, quoted and linked \u2192",
    emptyBills: "No bills curated yet.",
    billsMoreSoon: "More bills as they're curated.",
    backLink: "Back to Sift",
    methodologyHint: "Data comes from public records. Read the methodology.",
  },
} as const;
