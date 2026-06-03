// ─── Sift Voice & Tone ──────────────────────────────────
//
// Every string in Sift passes through this file.
// Voice: the patient teacher who never makes you feel dumb.
// Authoritative without being preachy. Never partisan. Never editorializing.
// Rules: contractions always, active voice, no jargon, no exclamation marks.
// Show the data, link the source, let the reader conclude.

import type { StoryFraming } from "./types";

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
  compare: {
    loading: "Comparing coverage across sources\u2026",
    slow: "Searching multiple outlets \u2014 this takes 10\u201320 seconds",
    emptyTitle: "Multi-Source Comparison",
    emptyBody: "Enter a topic above to compare how different outlets cover it",
    placeholder: "Compare coverage across sources\u2026 e.g. \u201cFederal Reserve rate decision\u201d",
    another: "Compare Another Topic",
    anotherPlaceholder: "Enter a topic to compare across sources\u2026",
    button: "Compare coverage",
  },
  search: {
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
      interestGroupRatings: "Interest-group ratings",
      links: "Where to read more",
      notes: "Notes",
    },
    // External-link labels in stable display order.
    externalLinkLabels: {
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
      politicalLean: "Political lean",
      finances: "Finances",
      majorFunders: "Major funders",
      fara: "Foreign-agent registration (FARA)",
      links: "Where to read more",
      notes: "Notes",
    },
    // External-link labels in stable display order.
    externalLinkLabels: {
      propublica: "ProPublica Nonprofit Explorer",
      irs_990: "IRS Form 990",
      fara: "FARA filings",
      official: "Official site",
      wikipedia: "Wikipedia",
    } as Record<string, string>,
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
    annualBudgetLabel: (budget: string) => `Annual budget ~${budget}`,
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
  civicIndex: {
    eyebrow: "Civic dossiers",
    headline: "Civic dossiers",
    lede: "Curated context on the people, organizations, and bills that shape U.S. policy. Every dossier is sourced from public records \u2014 GovTrack, OpenSecrets, ProPublica's Nonprofit Explorer \u2014 with citations on every page.",
    politiciansEyebrow: (count: number) => `Politicians \u00b7 ${count}`,
    politiciansHeading: "Sitting members of Congress",
    orgsEyebrow: (count: number) => `Organizations \u00b7 ${count}`,
    orgsHeading: "Think tanks, advocacy groups, and PACs",
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
    emptyBills: "No bills curated yet.",
    billsMoreSoon: "More bills as they're curated.",
    backLink: "Back to Sift",
    methodologyHint: "Data comes from public records. Read the methodology.",
  },
} as const;
