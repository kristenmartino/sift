import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: {
    absolute: "Sift — AI-Curated News, Already Read for You",
  },
  description:
    "AI-curated news summaries from 100+ sources across technology, business, science, energy, world, and health. Updated every 10 minutes.",
};

export default function Home() {
  return <LandingPage />;
}
