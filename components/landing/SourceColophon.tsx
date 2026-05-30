"use client";

import { COPY } from "@/lib/copy";

export interface SourceColophonOutlet {
  slug: string;
  name: string;
  /**
   * AllSides lean if available — threaded through for an optional future
   * Left / Center / Right grouping. Not rendered yet: this list is alphabetical.
   */
  allSidesRating?: string | null;
}

interface SourceColophonProps {
  /**
   * Curated outlets from `outlet_profiles` (alphabetized, server-fetched in
   * app/page.tsx). Driving this from the database — not a hardcoded array — is
   * the point: the public list can no longer drift from the curated data. Empty
   * on a DB miss/empty table, in which case we degrade to the prose (no grid) so
   * the landing never breaks and never shows a stale source list.
   */
  outlets: SourceColophonOutlet[];
}

export default function SourceColophon({ outlets }: SourceColophonProps) {
  return (
    <section className="max-w-[1100px] mx-auto px-6 pb-20">
      <div className="border-t border-b border-[var(--border)] py-9">
        <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-4 flex items-center">
          <span aria-hidden className="inline-block w-7 h-px bg-[var(--border)] mr-3" />
          {COPY.landing.colophonHeading}
        </p>
        <p className="font-body text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-[680px] mb-6">
          {COPY.landing.colophonDescription}
        </p>
        {outlets.length > 0 && (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 mb-6">
            {outlets.map((outlet) => (
              <li
                key={outlet.slug}
                className="font-body text-[13px] text-[var(--text-secondary)] tracking-tight"
              >
                {outlet.name}
              </li>
            ))}
          </ul>
        )}
        <p className="font-body text-outlet uppercase tracking-wider text-[var(--text-muted)] pt-5 border-t border-[var(--border-subtle)]">
          {COPY.landing.colophonSummary}
        </p>
      </div>
    </section>
  );
}
