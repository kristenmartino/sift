import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import TermDossier from "@/components/term/TermDossier";
import { mapArticleRows } from "@/lib/articleMapping";
import { getRecentArticlesByTerm, getTermBySlug, getTermCoverage } from "@/lib/db";
import { dossierMetadata } from "@/lib/metadata";
import { isPublishableTerm } from "@/lib/publishFloor";
import { termJsonLd } from "@/lib/structuredData";
import type { Article } from "@/lib/types";

// ISR — same 30-minute heartbeat as the other dossiers. The definition half
// changes when a human edits the CSV; the coverage half moves every pipeline
// cycle, which is the side that sets the cadence.
export const revalidate = 1800;

interface TermRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TermRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const term = await getTermBySlug(slug);
  if (!term) return { title: "Term not found" };

  // The floor reads coverage, so metadata has to compute it too. Both this
  // and the page body call `getTermBySlug` + `getTermCoverage`; `getTermBySlug`
  // is React-cached and the coverage query is 34-81ms on the GIN index, so the
  // duplicate is one indexed lookup per render, not a second page load.
  const coverage = await getTermCoverage(term);

  return dossierMetadata({
    title: `${term.term} — Civic term`,
    // Describes what the page uniquely has. The definitional half is Cornell's
    // and unwinnable against Wikipedia; the coverage half is the reason to
    // rank this page at all, so it leads.
    description:
      coverage.articleCount > 0
        ? `What ${term.term} means, and how ${coverage.outlets.length} outlets across the political spectrum are covering it — ${coverage.articleCount} stories in Sift's index.`
        : `What ${term.term} means, with its primary source, on Sift.`,
    indexable: isPublishableTerm(term, coverage),
    ogType: "article",
  });
}

export default async function TermDossierPage({ params }: TermRouteProps) {
  const { slug } = await params;
  const term = await getTermBySlug(slug);
  if (!term) notFound();

  // Sequential after the term resolves — both queries need the row's aliases
  // to build their match patterns, so there is nothing to prefetch in
  // parallel with the lookup the way the outlet route can.
  const [coverage, recentRows] = await Promise.all([
    getTermCoverage(term),
    getRecentArticlesByTerm(term, 12),
  ]);

  // `clean: false` matches the other dossiers — these rows are rendered as a
  // plain list, not through the feed's card pipeline.
  const recentArticles: Article[] = mapArticleRows(recentRows, { clean: false });

  return (
    <>
      <JsonLd data={termJsonLd(term)} />
      <TermDossier
        term={term}
        coverage={coverage}
        recentArticles={recentArticles}
      />
    </>
  );
}
