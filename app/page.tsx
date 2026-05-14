import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { getTopStoryForLanding } from "@/lib/db";
import { parseContextPrimer } from "@/lib/primer";
import type { Article, CategoryId } from "@/lib/types";

export const metadata: Metadata = {
  title: {
    absolute: "Sift — The news, with footnotes.",
  },
  description:
    "Sift reads from ~50 vetted outlets across the political spectrum and adds the civic context, cross-spectrum framing, and money trail the news assumes you already know. Every claim links to a public record.",
};

// ISR: re-render at most once every 10 minutes — same heartbeat as the
// pipeline cron. The lead story above the fold stays at-most-one-cycle stale
// without paying a DB round-trip on every visit.
export const revalidate = 600;

export default async function Home() {
  const lead = await getTopStoryForLanding();
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
      }
    : null;

  return <LandingPage leadStory={leadStory} />;
}
