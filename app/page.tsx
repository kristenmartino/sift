import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import {
  getAllOutletProfiles,
  getDailyCompareExample,
  getOutletProfilesMap,
  getTopStoryForLanding,
  resolveOutletForSourceName,
} from "@/lib/db";
import { mapArticleRow } from "@/lib/articleMapping";
import { reportError } from "@/lib/observability";
import type { Article, OutletProfile } from "@/lib/types";

export const metadata: Metadata = {
  title: {
    absolute: "Sift — The news, with footnotes.",
  },
  description:
    "Sift curates outlets across the political spectrum and adds the civic context, cross-spectrum framing, and money trail the news assumes you already know. Every claim links to a public record.",
};

// 600 -> 1800 on 2026-08-14, and this is the page that carries the reason for
// all of them.
//
// Every ISR revalidation runs lib/db.ts against Neon, and Neon's compute
// scales to zero only after 300s with no query. A dozen pages each on their
// own 600s timer, staggered by whenever they were last requested, produce a
// query far more often than every 300s under nothing more than crawler
// traffic — which is enough to hold the compute open around the clock. That
// was measured, not assumed: after sift-api stopped polling, the compute still
// showed 26 days of unbroken uptime, and pg_stat_activity named the waker as
// this app via Neon's pgbouncer.
//
// 1800s is not arbitrary. The background pipeline writes every 1800s, so the
// data cannot be fresher than that and a shorter window buys nothing but
// compute time. See sift/docs/DECISIONS.md D54.
//
// ISR: re-render at most once every 30 minutes. This bounds staleness of the
// server-fetched lead story + outlet list only — the masthead carries no
// date/issue stamp (see LandingMasthead), so nothing time-sensitive freezes
// into the ISR cache. The background pipeline refreshes content every ~30 min.
export const revalidate = 1800;

export default async function Home() {
  const [lead, outletProfiles, outletMap, dailyCompare] = await Promise.all([
    getTopStoryForLanding(),
    // Curated outlet list for the source colophon. Guarded so an outlet-data
    // miss degrades to an empty list rather than breaking the landing (same
    // posture as getTopStoryForLanding returning null).
    getAllOutletProfiles().catch((err) => {
      reportError("page.home.outletProfiles", err);
      return [];
    }),
    // source_name → OutletProfile map (module-cached, 1h TTL — shared with
    // /api/news). Lets the hero card resolve the lead source's AllSides + MBFC
    // ratings the same way the feed does, with no extra round-trip on a warm
    // cache. Guarded to an empty map so a miss degrades to a card without
    // rating chips, never a broken page.
    getOutletProfilesMap().catch((err): Map<string, OutletProfile> => {
      reportError("page.home.outletProfilesMap", err);
      return new Map();
    }),
    // Daily compare example for the comparison section. Null (not yet
    // generated / DB miss) falls back to the static labeled illustration.
    getDailyCompareExample().catch((err) => {
      reportError("page.home.dailyCompareExample", err, { level: "warning" });
      return null;
    }),
  ]);
  const outlets = outletProfiles.map((o) => ({
    slug: o.slug,
    name: o.name,
    allSidesRating: o.allSidesRating,
  }));
  // Resolve the lead story's source to its curated outlet (AllSides lean + MBFC
  // tier) via the same alias path the feed uses. Null when the source isn't a
  // curated outlet — the hero card omits the rating chips rather than inventing
  // them (never fabricate ratings on the homepage).
  const leadOutlet = lead
    ? resolveOutletForSourceName(outletMap, lead.source_name)
    : null;
  const leadStory: Article | null = lead
    ? mapArticleRow(lead, { outlet: leadOutlet, clean: false })
    : null;

  return (
    <LandingPage
      leadStory={leadStory}
      outlets={outlets}
      dailyCompare={dailyCompare}
    />
  );
}
