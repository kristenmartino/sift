"use client";

import Link from "next/link";
import { COPY } from "@/lib/copy";
import type { StoryFraming } from "@/lib/types";

// Tone → display label is the canonical map already used by StoryCard.
// Tone color matches StoryCard.tsx exactly; if that file changes, update here.
const TONE_COLORS: Record<StoryFraming["tone"], string> = {
  neutral: "#6b7280",
  urgent: "#dc2626",
  analytical: "#2563eb",
  critical: "#d97706",
  optimistic: "#059669",
};

// Hardcoded for the landing — this is the publication picking what goes on
// the front page, not a live feed. Upgrade to a "featured comparison of the
// day" DB row if/when that becomes a real concept (see plan).
const DEMO: {
  outlet: string;
  tone: StoryFraming["tone"];
  framing: string;
}[] = [
  {
    outlet: "Reuters",
    tone: "neutral",
    framing:
      "Powell signals patience as inflation stays sticky; Fed leaves rates unchanged.",
  },
  {
    outlet: "Wall Street Journal",
    tone: "critical",
    framing:
      "Markets read between the lines: rate cuts unlikely before the fall.",
  },
  {
    outlet: "Bloomberg",
    tone: "urgent",
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

      {/* Three-row comparison */}
      <div className="border-t border-b border-[var(--border)]">
        {DEMO.map((row, i) => (
          <div
            key={row.outlet}
            className={`story-row flex flex-col md:grid md:grid-cols-[140px_120px_1fr] md:items-baseline gap-x-5 gap-y-1 py-5 ${
              i < DEMO.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
            }`}
          >
            <span aria-hidden className="story-row__rail" />
            {/* Outlet name */}
            <span className="story-row__source font-body text-outlet uppercase tracking-wider text-[var(--text)] font-semibold shrink-0">
              {row.outlet}
            </span>
            {/* Tone badge */}
            <span
              className="font-body text-kicker uppercase tracking-wider font-semibold inline-flex items-center gap-1.5 shrink-0"
              style={{ color: TONE_COLORS[row.tone] }}
            >
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: TONE_COLORS[row.tone] }}
              />
              {COPY.stories.toneLabels[row.tone]}
            </span>
            {/* Framing line */}
            <span className="font-heading italic text-[17px] md:text-[18px] leading-snug text-[var(--text-secondary)]">
              &ldquo;{row.framing}&rdquo;
            </span>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
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
