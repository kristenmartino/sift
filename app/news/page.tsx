import type { Metadata } from "next";
import NewsAggregator from "@/components/NewsAggregator";

export const metadata: Metadata = {
  title: "News — Sift",
  description:
    "AI-curated news summaries across technology, business, science, energy, world, and health.",
};

export default function NewsPage() {
  return <NewsAggregator />;
}
