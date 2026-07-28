import type { Metadata } from "next";

import AgenciesGovernance from "@/components/agencies/AgenciesGovernance";
import { listAllOrgsLite, listCitedAgencies } from "@/lib/db";

// ISR — statutory governance changes on the order of decades, not days. The
// only thing that moves here is Sift citing another agency, so a 10-minute
// window matches the rest of the civic surface without staleness mattering.
export const revalidate = 600;

const TITLE = "Who controls a federal agency — Sift";
const DESC =
  "Appointment, terms, and the partisan-balance limits Congress wrote into statute. Every line cited to the section it came from. No AI-generated text.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/agencies" },
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default async function AgenciesPage() {
  const [agencies, allOrgs] = await Promise.all([
    listCitedAgencies(),
    listAllOrgsLite(),
  ]);

  // Total agency dossiers held, cited or not. Drives the "what is missing"
  // note — the page says out loud that most agencies are omitted rather than
  // quietly showing only the flattering subset.
  const totalAgencies = allOrgs.filter((o) => o.type === "agency").length;

  return (
    <AgenciesGovernance agencies={agencies} totalAgencies={totalAgencies} />
  );
}
