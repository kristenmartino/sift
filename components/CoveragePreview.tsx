"use client";

import Link from "next/link";
import { buildSourceUnits } from "@/lib/storySources";
import { timeAgo } from "@/lib/utils";
import { COMPARE_SOURCES, CATEGORY_COMPARE_DEFAULTS } from "@/lib/constants";
import { compareDraftSignInHref, type CompareDraft } from "@/lib/compareDraft";
import type { Story } from "@/lib/types";

/** An evidence-backed reading preview, never a substitute for claim analysis. */
export default function CoveragePreview({ stories, draft }: { stories: Story[]; draft?: CompareDraft }) {
  const candidate = stories.map((story) => ({ story, units: buildSourceUnits(story.framings, story.articles).filter((unit) => unit.articles.some((article) => article.sourceUrl)) }))
    .find(({ units }) => units.length >= 2);
  const matchingSources = candidate?.units.map((unit) => COMPARE_SOURCES.find((source) =>
    source.key === unit.sourceName.toLowerCase() || source.label.toLowerCase() === unit.sourceName.toLowerCase()
    || source.key === unit.outlet?.name.toLowerCase())?.key).filter((key): key is NonNullable<typeof key> => Boolean(key)) ?? [];
  const selectedSources = matchingSources.length >= 2 ? matchingSources.slice(0, 5) : candidate ? CATEGORY_COMPARE_DEFAULTS[candidate.story.category] : [];
  const hasDraft = Boolean(draft?.topic.trim());
  const signInHref = hasDraft ? compareDraftSignInHref(draft!) : candidate
    ? compareDraftSignInHref({ topic: candidate.story.headline, sources: selectedSources })
    : "/sign-in?redirect_url=%2Fnews";
  return <section className="max-w-[900px] mx-auto py-4">
    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
      <div><p className="text-kicker uppercase text-(--accent) font-semibold">Explore the reporting</p>
        <h2 className="font-heading text-2xl font-bold mt-2">One story, several sources.</h2>
        <p className="text-sm text-(--text-secondary) mt-2 max-w-[60ch]">Read the original coverage below. Sign in to request a comparison of shared claims and differences across selected outlets.</p>
      </div>
      <div className="shrink-0">
        {signInHref ? <Link href={signInHref} className="inline-block px-4 py-2.5 rounded-[8px] bg-(--accent) text-white text-sm font-semibold no-underline">{hasDraft ? "Sign in to compare your topic →" : "Sign in to compare →"}</Link>
          : <p className="text-sm text-(--text-secondary) max-w-[32ch]">Enter a topic of 3–200 characters and select two to five outlets above to continue.</p>}
        {hasDraft && signInHref && <p className="text-xs text-(--text-secondary) mt-2 max-w-[32ch]">Your topic and selected outlets will be kept after sign-in.</p>}
      </div>
    </div>
    {candidate ? <div className="border border-(--border) rounded-[12px] bg-(--surface-raised) overflow-hidden">
      <div className="p-5 border-b border-(--border)"><p className="text-xs text-(--text-secondary)">Coverage preview · Latest reporting {timeAgo(candidate.story.publishedDate)}</p>
        <h3 className="font-heading text-xl font-bold mt-2">{candidate.story.headline}</h3>
        <p className="text-xs text-(--text-secondary) mt-2">Publisher headlines from this view. This is not a generated comparison or a finding of agreement.</p></div>
      <ul className="list-none m-0 p-0">{candidate.units.slice(0, 5).map((unit) => {
        const article = unit.articles.find((a) => a.sourceUrl)!;
        return <li key={unit.sourceName} className="p-5 border-b border-(--border-subtle) last:border-0">
          <p className="font-semibold text-sm text-(--text-primary)">{unit.outlet?.name ?? unit.sourceName}</p>
          <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" data-sift-source-id={article.id} className="text-sm text-(--accent) hover:underline block mt-1">{article.title} ↗</a>
          <p className="text-xs text-(--text-secondary) mt-1">Published {timeAgo(article.publishedDate)}</p>
        </li>;
      })}</ul>
    </div> : <div className="border border-(--border) rounded-[12px] p-5 text-sm text-(--text-secondary)">
      <p className="font-semibold text-(--text-primary)">How comparison works</p>
      <ol className="list-decimal pl-5 mt-3 space-y-2"><li>Choose a topic and two to five outlets.</li><li>Sift records which sources could be retrieved and analyzed.</li><li>Read the shared claims and differences alongside the available source evidence.</li></ol>
      <p className="mt-3">No recent, source-accounted saved comparison is available to preview.</p>
    </div>}
  </section>;
}
