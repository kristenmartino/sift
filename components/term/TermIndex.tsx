import Link from "next/link";
import CorrectionPath from "@/components/CorrectionPath";
import LandingMasthead from "@/components/landing/LandingMasthead";
import TermLookup from "./TermLookup";
import { COPY } from "@/lib/copy";
import type { TermListItem } from "@/lib/types";

/** Definitions and lookup lead; periodic corpus measurements remain optional. */
export default function TermIndex({ terms, heldCount }: { terms: TermListItem[]; heldCount: number }) {
  const c = COPY.termIndex;
  const totalMatches = terms.reduce((count, term) => count + term.articleCount, 0);
  const totalUnnamed = terms.reduce((count, term) => count + term.unnamedCount, 0);
  const example = [...terms].sort((a, b) => b.unnamedCount - a.unnamedCount)[0];
  const measuredAt = terms.map((term) => term.computedAt).filter((date): date is string => date !== null).sort()[0] ?? null;
  const gapNote = c.gapNote(terms.length, terms.length + heldCount);

  return <div className="min-h-screen bg-(--surface-base) text-(--text-primary)">
    <LandingMasthead />
    <main id="main-content" className="max-w-[800px] mx-auto px-6 pt-8 md:pt-12 pb-24">
      <header className="mb-7">
        <p className="font-body text-kicker uppercase text-(--text-secondary) mb-3">{c.eyebrow}</p>
        <h1 className="font-heading text-[32px] md:text-[44px] font-bold leading-[1.05] tracking-tight">{c.headline}</h1>
        <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[62ch] leading-relaxed">{c.dek}</p>
      </header>
      {terms.length === 0 ? <p className="font-body text-[15px] text-(--text-secondary) italic">{c.empty}</p> : <TermLookup terms={terms} />}
      <details className="mt-10 border-y border-(--border) py-4">
        <summary className="font-body text-[14px] text-(--text-secondary) cursor-pointer focus-visible:outline-2 focus-visible:outline-(--accent)">Sources and historical coverage measurements</summary>
        <div className="font-body text-[14px] text-(--text-secondary) leading-relaxed mt-4 space-y-3">
          <p>{c.contextNote}</p>
          {measuredAt && <p>{c.asOf(measuredAt)}</p>}
          {totalUnnamed > 0 && example && <p>{c.finding(totalUnnamed, totalMatches, example.term)}</p>}
          {gapNote && <p>{gapNote}</p>}
          <ul>{terms.map((term) => <li key={term.slug} className="py-1"><Link href={`/term/${term.slug}`} className="text-(--accent) hover:underline">{term.term}</Link> — {c.rowCoverage(term.articleCount, term.outletCount)}{term.unnamedCount > 0 ? `; ${term.unnamedCount.toLocaleString()} matched through a primer only` : ""}</li>)}</ul>
        </div>
      </details>
      <div className="mt-10"><CorrectionPath /></div>
      <p className="font-body text-[14px] mt-8"><Link href="/news" className="text-(--accent) hover:underline">{c.backLink} →</Link></p>
    </main>
  </div>;
}
