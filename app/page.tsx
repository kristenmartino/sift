import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import {
  getAllOutletProfiles,
  getDailyCompareExample,
  getOutletProfilesMap,
  getTopStoryForLanding,
  resolveOutletForSourceName,
} from "@/lib/db";
import { reportError } from "@/lib/observability";
import { parseContextPrimer } from "@/lib/primer";
import type { Article, CategoryId, OutletProfile } from "@/lib/types";

export const metadata: Metadata = {
  title: {
    absolute: "Sift — The news, with footnotes.",
  },
  description:
    "Sift curates outlets across the political spectrum and adds the civic context, cross-spectrum framing, and money trail the news assumes you already know. Every claim links to a public record.",
};

// ISR: re-render at most once every 10 minutes. This bounds staleness of the
// server-fetched lead story + outlet list only — the masthead carries no
// date/issue stamp (see LandingMasthead), so nothing time-sensitive freezes
// into the ISR cache. The background pipeline refreshes content every ~30 min.
export const revalidate = 600;

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
  const primer = lead ? parseContextPrimer(lead.context_primer) : null;
  const leadStory: Article | null = lead
    ? {
        id: lead.id,
        title: lead.title,
        summary: lead.summary || "",
        sourceUrl: lead.source_url,
        sourceName: lead.source_name,
        publishedDate: lead.published_date?.toISOString() ?? null,
        imageUrl: lead.image_url,
        category: lead.category as CategoryId,
        readTime: lead.read_time,
        whyItMatters: lead.why_it_matters ?? undefined,
        importanceScore: lead.importance_score ?? undefined,
        ...(primer ? { contextPrimer: primer } : {}),
        ...(leadOutlet ? { outlet: leadOutlet } : {}),
      }
    : null;

  return (
    <LandingPage
      leadStory={leadStory}
      outlets={outlets}
      dailyCompare={dailyCompare}
    />
  );
}
