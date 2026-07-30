import type { Metadata } from "next";

import SelfDescriptions from "@/components/thinkTanks/SelfDescriptions";
import { listSelfDescribedOrgs } from "@/lib/db";

// ISR — a self-description changes when an organization rewrites its About
// page, which is rare. Matches the rest of the civic surface.
export const revalidate = 600;

const TITLE = "How policy organizations describe themselves — Sift";
const DESC =
  "Think tanks and advocacy organizations quoted from their own sites — not summarized, not rated, not characterized. Every quote linked to its source. No AI-generated text.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/think-tanks" },
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default async function ThinkTanksPage() {
  const orgs = await listSelfDescribedOrgs();
  return <SelfDescriptions orgs={orgs} />;
}
