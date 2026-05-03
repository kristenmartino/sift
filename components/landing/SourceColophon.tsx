"use client";

import { COPY } from "@/lib/copy";

// Curated source list for the colophon. Two columns on desktop, one on mobile.
// Order roughly matches reader prominence (wires & broadsheets first, then
// trade press by category). Drop or reorder as the source set changes.
const SOURCES: string[] = [
  "Reuters", "Associated Press", "BBC", "NPR",
  "The New York Times", "The Washington Post", "The Guardian",
  "Bloomberg", "Financial Times", "The Economist", "Wall Street Journal",
  "Axios", "Politico", "The Atlantic", "PBS NewsHour",
  "TechCrunch", "Ars Technica", "The Verge", "Wired", "MIT Tech Review",
  "Hacker News", "TechMeme",
  "CNBC", "MarketWatch", "Fortune", "Forbes",
  "Nature", "Science", "Phys.org", "Scientific American", "NASA",
  "Quanta Magazine",
  "CleanTechnica", "Electrek", "Canary Media", "Carbon Brief",
  "Grist", "Inside Climate News",
  "Al Jazeera", "DW News", "France 24", "South China Morning Post",
  "Foreign Policy",
  "STAT News", "WHO", "The BMJ", "NIH", "The Lancet", "Medscape",
  "The Hill", "FiveThirtyEight", "RealClearPolitics",
  "ESPN", "BBC Sport", "The Athletic", "Sports Illustrated",
  "Variety", "Hollywood Reporter", "Deadline", "Rolling Stone",
  "Pitchfork", "IGN",
  "Vox", "ProPublica", "Rest of World",
];

export default function SourceColophon() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 pb-20">
      <div className="border-t border-b border-[var(--border)] py-9">
        <p className="font-body text-kicker uppercase text-[var(--text-muted)] mb-5 flex items-center">
          <span aria-hidden className="inline-block w-7 h-px bg-[var(--border)] mr-3" />
          {COPY.landing.colophonHeading}
        </p>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 mb-6">
          {SOURCES.map((s) => (
            <li
              key={s}
              className="font-body text-[13px] text-[var(--text-secondary)] tracking-tight"
            >
              {s}
            </li>
          ))}
          <li className="font-body text-[13px] italic text-[var(--text-muted)]">
            … and others
          </li>
        </ul>
        <p className="font-body text-outlet uppercase tracking-wider text-[var(--text-muted)] pt-5 border-t border-[var(--border-subtle)]">
          {COPY.landing.colophonSummary}
        </p>
      </div>
    </section>
  );
}
