// ─── Sift Voice & Tone ──────────────────────────────────
//
// Every string in Sift passes through this file.
// Voice: the patient teacher who never makes you feel dumb.
// Authoritative without being preachy. Never partisan. Never editorializing.
// Rules: contractions always, active voice, no jargon, no exclamation marks.
// Show the data, link the source, let the reader conclude.

import type { StoryFraming } from "./types";

export const COPY = {
  header: {
    tagline: "The news, with footnotes",
  },
  footer: {
    main: "Sift reads from ~50 vetted outlets across the political spectrum, surfaces the civic context the news assumes you already know, and shows you who's behind every story. Every link goes to the original.",
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
    compareRow: "See angles",
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
        body:
          "Around 50 outlets, hand-picked to balance the political spectrum (AllSides Left → Center → Right), span sector specialties (finance, tech, science, climate, health), and clear a factual-reporting bar. Each outlet has a dossier with ownership, funding model, and external rating links — click any name below.",
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
    // Single editorial paragraph below the lead story. The "what is this".
    explainer:
      "Sift reads from ~50 vetted outlets every morning, summarizes the stories worth knowing, and links back to the originals \u2014 so you can stop checking ten tabs and get on with your day.",
    leadEyebrow: "Today\u2019s lead",
    leadFallbackTitle: "Today\u2019s stories are still being filed",
    leadFallbackBody:
      "The morning ingest is in progress. Open the feed for what\u2019s already in.",
    leadCta: "Read in full",
    feedCta: "Open the full feed",
    // Section heading for the multi-source comparison demo.
    compareEyebrow: "How outlets framed it",
    compareTitle: "The Federal Reserve\u2019s May rate decision",
    compareSubtitle: "One story, three angles. This is what Sift\u2019s compare view does on every topic.",
    compareCta: "Compare any topic",
    // Source colophon.
    colophonHeading: "Read from",
    colophonSummary: "~50 vetted outlets \u00b7 across the political spectrum \u00b7 refreshed every 10 minutes",
    // Footer colophon link.
    colophonLink: "Colophon",
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
