"use client";

import Link from "next/link";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { useTheme } from "@/lib/hooks";
import SiftLogo from "@/components/SiftLogo";
import type { CategoryId } from "@/lib/types";

export default function LandingMasthead() {
  const { dark: darkMode, toggle: toggleDark, mounted } = useTheme();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--nav-bg)]">
      {/* Dateline strip — intentionally NOT time-stamped. The issue number and
          date here were computed from `new Date()`, which froze stale into the
          ISR-prerendered HTML: a cold visitor saw the date from the last
          revalidation (weeks old), not today, until client hydration corrected
          it. The masthead now carries no freshness claim; real "last updated"
          state belongs with the feed (pipeline_state), not the marketing
          masthead. See sift#111. */}
      <div className="border-b border-[var(--border-subtle)]">
        <div className="max-w-[1200px] mx-auto px-6 h-9 flex items-center justify-between gap-4">
          <p className="font-body text-outlet uppercase text-[var(--text-secondary)] truncate">
            <span>{COPY.header.tagline}</span>
            <span className="mx-2 text-[var(--text-muted)] hidden sm:inline">·</span>
            <span className="hidden sm:inline">{COPY.header.dateline}</span>
          </p>

          <div className="flex items-center gap-3 shrink-0">
            {mounted && (
              <button
                onClick={toggleDark}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="font-body text-outlet uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                {darkMode ? "Newsprint" : "Late Edition"}
              </button>
            )}
            <span className="text-[var(--text-muted)] hidden sm:inline">·</span>
            <Link
              href="/civic"
              className="font-body text-outlet uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline hidden sm:inline"
            >
              Civic ↗
            </Link>
            <span className="text-[var(--text-muted)]">·</span>
            <Link
              href="/news"
              className="font-body text-outlet uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline"
            >
              Open Sift →
            </Link>
          </div>
        </div>
      </div>

      {/* Wordmark */}
      <div className="max-w-[1200px] mx-auto px-6 pt-7 pb-4 flex items-center justify-center">
        <Link href="/" className="no-underline" aria-label="Sift — home">
          <SiftLogo variant="full" size={56} />
        </Link>
      </div>

      {/* Category nav */}
      <nav aria-label="Sections" className="border-t border-[var(--border-subtle)]">
        <div className="max-w-[1200px] mx-auto px-6 h-11 flex items-center gap-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link
            href="/news"
            className="font-body text-outlet uppercase tracking-wider text-[var(--text)] hover:text-[var(--accent)] transition-colors no-underline shrink-0"
          >
            Today
          </Link>
          {CATEGORIES.filter((c) => c.id !== "top").map((cat) => {
            const color = CATEGORY_COLORS[cat.id as CategoryId];
            return (
              <Link
                key={cat.id}
                href={`/news?category=${cat.id}`}
                className="font-body text-outlet uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] transition-colors no-underline inline-flex items-center gap-2 shrink-0"
              >
                <span
                  aria-hidden
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: color.hex }}
                />
                {cat.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
