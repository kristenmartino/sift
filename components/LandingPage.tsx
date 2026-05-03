"use client";

import Link from "next/link";
import { COPY } from "@/lib/copy";
import SiftLogo from "./SiftLogo";
import LandingMasthead from "./landing/LandingMasthead";
import LeadStory from "./landing/LeadStory";
import ComparisonDemo from "./landing/ComparisonDemo";
import SourceColophon from "./landing/SourceColophon";
import type { Article } from "@/lib/types";

interface LandingPageProps {
  /** Server-fetched lead story (ISR @ 600s in app/page.tsx). Null = DB miss. */
  leadStory: Article | null;
}

export default function LandingPage({ leadStory }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Drop-cap rule, scoped to landing only — Sift's globals.css doesn't
          have an equivalent yet, so we inline it here rather than touching
          the system-wide stylesheet during a Phase A pass. */}
      <style jsx global>{`
        @media (min-width: 768px) {
          [data-dropcap]::first-letter {
            font-family: var(--font-heading), Georgia, serif;
            font-weight: 800;
            font-size: 4em;
            line-height: 0.85;
            float: left;
            padding: 0.08em 0.12em 0 0;
            margin-top: 0.05em;
            color: var(--text);
          }
        }
      `}</style>

      <LandingMasthead />

      <main id="main-content">
        <LeadStory article={leadStory} />
        <ComparisonDemo />
        <SourceColophon />
      </main>

      {/* ── Colophon Footer ──────────────────────────── */}
      <footer className="border-t border-[var(--border)] mt-8">
        <div className="max-w-[1200px] mx-auto px-6 py-9 grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-y-3">
          <div className="md:order-1 flex flex-col gap-3 md:items-start items-center text-center md:text-left">
            <SiftLogo variant="full" size={20} />
            <p className="font-body text-[13px] text-[var(--text-muted)] max-w-[320px] leading-relaxed">
              {COPY.footer.main}
            </p>
          </div>

          <div className="md:order-2 flex flex-col gap-2 md:items-center items-center text-center font-body text-outlet uppercase tracking-wider">
            <Link
              href="/news"
              className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline"
            >
              News
            </Link>
            <Link
              href="/colophon"
              className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline"
            >
              {COPY.landing.colophonLink}
            </Link>
            <Link
              href="/privacy"
              className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline"
            >
              Terms
            </Link>
          </div>

          <p className="md:order-3 md:text-right text-center font-body text-outlet uppercase tracking-wider text-[var(--text-muted)]">
            © {new Date().getFullYear()} Sift · Every story links to the original.
          </p>
        </div>
      </footer>
    </div>
  );
}
