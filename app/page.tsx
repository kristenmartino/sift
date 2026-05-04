import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { getTopStoryForLanding } from "@/lib/db";
import type { Article, CategoryId } from "@/lib/types";

export const metadata: Metadata = {
  title: {
    absolute: "Sift — The news, with footnotes.",
  },
  description:
    "Sift reads hundreds of sources and adds the footnotes the news assumes you don't need — civic context, cross-spectrum framing, and the money behind every story. Linked to public records. Refreshed every 10 minutes.",
};

// ISR: re-render at most once every 10 minutes — same heartbeat as the
// pipeline cron. The lead story above the fold stays at-most-one-cycle stale
// without paying a DB round-trip on every visit.
export const revalidate = 600;

export default async function Home() {
  const lead = await getTopStoryForLanding();
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
      }
    : null;

  return <LandingPage leadStory={leadStory} />;
}
