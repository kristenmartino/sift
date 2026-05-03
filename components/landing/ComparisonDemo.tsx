"use client";

import Link from "next/link";
import { COPY } from "@/lib/copy";

// Phase 0 stub: shows side-by-side outlet headlines without tone labels.
// Phase 2 will rebuild as <CrossSpectrumCompare> with AllSides political-lean
// ratings and outlet provenance. See plans/sift-civic-literacy.md.
const DEMO: { outlet: string; framing: string }[] = [
  {
    outlet: "Reuters",
    framing:
      "Powell signals patience as inflation stays sticky; Fed leaves rates unchanged.",
  },
  {
    outlet: "Wall Street Journal",
    framing:
      "Markets read between the lines: rate cuts unlikely before the fall.",
  },
  {
    outlet: "Bloomberg",
    framing:
      "Wall Street recalibrates as rate-cut bets fade and bond yields climb.",
  },
];

export default function ComparisonDemo() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 pb-20">
      {/* Section eyebrow + title */}
      <div className="mb-7">
        <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-3 flex items-center">
          <span aria-hidden className="inline-block w-7 h-px bg-[var(--border)] mr-3" />
          {COPY.landing.compareEyebrow}
        </p>
        <h2 className="font-heading text-[26px] md:text-[30px] font-bold leading-tight tracking-tight text-[var(--text)]">
          {COPY.landing.compareTitle}
        </h2>
        <p className="font-body text-[14px] text-[var(--text-secondary)] mt-2 max-w-[60ch]">
          {COPY.landing.compareSubtitle}
        </p>
      </div>

      {/* Outlet × headline rows. Phase 2 adds AllSides political-lean column. */}
      <div className="border-t border-b border-[var(--border)]">
        {DEMO.map((row, i) => (
          <div
            key={row.outlet}
            className={`story-row flex flex-col md:grid md:grid-cols-[160px_1fr] md:items-baseline gap-x-6 gap-y-1 py-5 ${
              i < DEMO.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
            }`}
          >
            <span aria-hidden className="story-row__rail" />
            <span className="story-row__source font-body text-outlet uppercase tracking-wider text-[var(--text)] font-semibold shrink-0">
              {row.outlet}
            </span>
            <span className="font-heading italic text-[17px] md:text-[18px] leading-snug text-[var(--text-secondary)]">
              &ldquo;{row.framing}&rdquo;
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <Link
          href="/news"
          className="font-body text-outlet uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline inline-flex items-center gap-1.5"
        >
          {COPY.landing.compareCta} <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
