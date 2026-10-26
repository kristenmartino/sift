"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { countryName, orgTypeLabel, stateName } from "@/lib/civic";
import type { BillListItem, OrgListItem, PoliticianListItem } from "@/lib/types";

interface CivicLookupProps {
  politicians: PoliticianListItem[];
  orgs: OrgListItem[];
  bills: BillListItem[];
}

/** Lookup uses only the directory already loaded with this page. */
export default function CivicLookup({ politicians, orgs, bills }: CivicLookupProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const entries = useMemo(() => [
    ...politicians.map((person) => {
      const international = person.chamber === "foreign-executive" || person.bioguideId.toUpperCase().startsWith("FOREIGN-");
      const place = person.state ? (international ? countryName(person.state) : stateName(person.state)) : "";
      const office = person.chamber === "senate" ? "Senator" : person.chamber === "house" && !international
        ? "Representative" : person.chamber === "scotus" ? "Supreme Court justice" : "Public official";
      return { name: person.name, href: `/politician/${person.bioguideId}`, label: [office, place].filter(Boolean).join(" · "), aliases: person.bioguideId };
    }),
    ...orgs.map((org) => ({ name: org.name, href: `/org/${org.slug}`, label: orgTypeLabel(org.type),
      aliases: org.name.split(/\s+/).filter((word) => !/^(and|of|the|for)$/i.test(word)).map((word) => word[0]).join("") })),
    ...bills.map((bill) => ({ name: bill.shortTitle ?? bill.billId, href: `/bill/${bill.billId}`,
      label: `Legislation · ${bill.congress}th Congress`, aliases: bill.billId })),
  ], [politicians, orgs, bills]);
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = words.length ? entries.filter((entry) => words.every((word) =>
    `${entry.name} ${entry.label} ${entry.aliases}`.toLocaleLowerCase().includes(word))) : [];

  return (
    <section aria-labelledby={`${inputId}-heading`} className="border-y border-(--border) py-6 mb-7">
      <h2 id={`${inputId}-heading`} className="font-heading text-[23px] font-semibold mb-2">Find the context you need</h2>
      <label htmlFor={inputId} className="block font-body text-[14px] text-(--text-secondary) mb-3">
        Look up a person, organization or bill in this directory.
      </label>
      <div className="flex items-center gap-3">
        <input id={inputId} type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Try FDA, a senator’s name or a bill"
          className="w-full min-w-0 rounded-[6px] border border-(--border) bg-(--surface-raised) px-3 py-3 font-body text-[15px] text-(--text-primary) placeholder:text-(--text-secondary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)" />
        {query && <button type="button" onClick={() => { setQuery(""); document.getElementById(inputId)?.focus(); }}
          className="shrink-0 font-body text-[14px] text-(--accent) underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--accent)">Clear</button>}
      </div>
      <div aria-live="polite" aria-atomic="true" className="font-body text-[13px] text-(--text-secondary) mt-3">
        {words.length > 0 && (matches.length === 0 ? "No matching entries. Try another name or browse a section below."
          : `${matches.length} ${matches.length === 1 ? "match" : "matches"}${matches.length > 12 ? "; showing the first 12. Add another word to narrow the list." : "."}`)}
      </div>
      {matches.length > 0 && <ul aria-label="Directory search results" className="mt-2 divide-y divide-(--border-subtle)">
        {matches.slice(0, 12).map((entry) => <li key={entry.href}>
          <Link href={entry.href} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-4 gap-y-1 py-3 text-(--text-primary) no-underline hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)">
            <span className="font-body text-[15px] font-semibold">{entry.name}</span>
            <span className="font-body text-[13px] text-(--text-secondary)">{entry.label}</span>
          </Link>
        </li>)}
      </ul>}
    </section>
  );
}
