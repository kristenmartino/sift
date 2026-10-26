"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { TermListItem } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  congress: "Congress", courts: "Courts", executive: "The executive", elections: "Elections",
  constitution: "Constitution", immigration: "Immigration", "first-amendment": "Speech and the press",
  business: "Business and markets",
};
const CATEGORY_ORDER = ["constitution", "congress", "executive", "courts", "elections", "first-amendment", "immigration", "business"];
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

export default function TermLookup({ terms }: { terms: TermListItem[] }) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const matches = terms.filter((term) => words.every((word) =>
    normalize([term.term, ...(term.aliases ?? []), term.definition ?? ""].join(" ")).includes(word)));
  const rank = (category: string | null) => {
    const value = CATEGORY_ORDER.indexOf(category ?? "");
    return value < 0 ? CATEGORY_ORDER.length : value;
  };
  const categories = [...new Set(matches.map((term) => term.category))].sort((a, b) => rank(a) - rank(b));

  return <section aria-labelledby={`${inputId}-heading`}>
    <h2 id={`${inputId}-heading`} className="font-heading text-[23px] font-semibold mb-3">Find a term</h2>
    <label htmlFor={inputId} className="block font-body text-[14px] text-(--text-secondary) mb-2">Search terms, abbreviations, or a word in a definition</label>
    <div className="flex gap-3 items-center">
      <input ref={input} id={inputId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try filibuster, asylum, or IPO" className="w-full min-w-0 rounded-[6px] border border-(--border) bg-(--surface-raised) px-3 py-3 font-body text-[15px] text-(--text-primary) placeholder:text-(--text-secondary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)" />
      {query && <button type="button" onClick={() => { setQuery(""); input.current?.focus(); }} className="text-(--accent) underline underline-offset-4 font-body text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--accent)">Clear</button>}
    </div>
    <p role="status" className="font-body text-[13px] text-(--text-secondary) my-3">{words.length ? `${matches.length} matching ${matches.length === 1 ? "term" : "terms"}` : `${terms.length} terms`}</p>
    {words.length > 0 && matches.length === 0 && <p className="font-body text-[15px] text-(--text-secondary) py-5">No matching terms. Try a shorter word or clear the search to browse.</p>}
    <div className="mt-6">{categories.map((category) => <section key={category ?? "other"} className="mb-8">
      <h3 className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-secondary) mb-2">{category ? CATEGORY_LABELS[category] ?? category : "Other"}</h3>
      <ul>{matches.filter((term) => term.category === category).map((term) => <li key={term.slug} className="border-b border-(--border-subtle) last:border-0 py-4">
        <Link href={`/term/${term.slug}`} className="font-heading text-[19px] text-(--text-primary) no-underline hover:text-(--accent) hover:underline">{term.term} →</Link>
        {term.definition && term.definitionSource && <><p className="font-body text-[15px] text-(--text-secondary) leading-relaxed mt-2 max-w-[65ch]">{term.definition}</p><a href={term.definitionSource} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 font-body text-[13px] text-(--accent) hover:underline">Definition source ↗</a><span className="font-body text-[13px] text-(--text-secondary) mx-2">·</span></>}
        <Link href={`/term/${term.slug}`} className="inline-block mt-2 font-body text-[13px] text-(--accent) hover:underline">Related reporting →</Link>
      </li>)}</ul>
    </section>)}</div>
  </section>;
}
