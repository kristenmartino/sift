import type { Metadata } from "next";
import Link from "next/link";
import LandingMasthead from "@/components/landing/LandingMasthead";
import SiftLogo from "@/components/SiftLogo";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "How Sift is built. Stack, architecture, and credits for the AI-curated news aggregator.",
};

const STACK = [
  { name: "Next.js 15", role: "Frontend & App Router on Vercel" },
  { name: "FastAPI + LangGraph", role: "Pipeline & comparison workflow on Railway" },
  { name: "Postgres + pgvector", role: "Articles, stories, embeddings, bookmarks" },
  { name: "Claude (Anthropic)", role: "Summarization, story synthesis, comparison" },
  { name: "Voyage AI", role: "Embeddings for semantic topic search" },
  { name: "Clerk", role: "Auth & user management" },
  { name: "Tailwind CSS", role: "Design system & theming" },
  { name: "next/font", role: "Self-hosted Fraunces, Hanken Grotesk & DM Mono" },
];

const ARCHITECTURE = [
  "Articles load in under 50ms — AI processing happens in the background, not when you read.",
  "Works without an account — sign in only if you want bookmarks synced across devices.",
  "Graceful degradation: every feature works independently, so one slow service never blocks the page.",
  "~50 vetted sources are ingested, deduplicated, and ranked every 30 minutes before you open the app.",
];

export default function ColophonPage() {
  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <LandingMasthead />

      <main id="main-content" className="max-w-[800px] mx-auto px-6 pt-12 pb-24">
        {/* Section eyebrow + title */}
        <header className="mb-9">
          <p className="font-body text-kicker uppercase text-(--text-muted) mb-3 flex items-center">
            <span aria-hidden className="inline-block w-7 h-px bg-(--border) mr-3" />
            Behind the masthead
          </p>
          <h1 className="font-heading text-[36px] md:text-[44px] font-bold leading-[1.05] tracking-tight text-(--text)">
            Colophon
          </h1>
          <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
            A note on how Sift is built — the stack, the people, the principles.
          </p>
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Masthead-style credit */}
        <section className="mb-12">
          <p className="font-body text-kicker uppercase text-(--text-muted) mb-4">
            Masthead
          </p>
          <p className="font-heading text-[20px] leading-relaxed text-(--text) max-w-[60ch]">
            Edited by <span className="italic">Claude</span>. Built by{" "}
            <a
              href="https://github.com/kristenmartino"
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--accent) no-underline hover:underline"
            >
              Kristen Martino
            </a>
            .
          </p>
        </section>

        {/* Stack */}
        <section className="mb-12">
          <p className="font-body text-kicker uppercase text-(--text-muted) mb-4">
            Set in
          </p>
          <p className="font-body text-[16px] text-(--text-secondary) leading-[1.7] max-w-[60ch] mb-7">
            Sift is set in <strong className="text-(--text) font-semibold">Fraunces</strong>{" "}
            and <strong className="text-(--text) font-semibold">Hanken Grotesk</strong>, with{" "}
            <strong className="text-(--text) font-semibold">DM Mono</strong> for labels and
            captions, served from same-origin via{" "}
            <code className="font-body text-[14px]">next/font</code>. The cover star{" "}
            <SiftLogo variant="mark" size={16} className="inline-block align-[-3px]" />{" "}
            is a vector diamond, sized to scale across PWA icons, OG cards, and tab favicons.
          </p>
          <ul className="space-y-3">
            {STACK.map((s) => (
              <li
                key={s.name}
                className="grid grid-cols-[180px_1fr] gap-x-6 items-baseline border-b border-(--border-subtle) pb-3"
              >
                <span className="font-body text-outlet uppercase tracking-wider text-(--text) font-semibold">
                  {s.name}
                </span>
                <span className="font-body text-[14px] text-(--text-secondary)">
                  {s.role}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Architecture diagram */}
        <section className="mb-12">
          <p className="font-body text-kicker uppercase text-(--text-muted) mb-4">
            Architecture
          </p>
          <pre className="font-body text-[12px] leading-relaxed text-(--text-secondary) bg-(--card-bg) border border-(--border) rounded-md p-5 overflow-x-auto whitespace-pre">
{`Browser  →  Vercel (Next.js)  →  Neon Postgres (pgvector)
                  ↑
                  +— /api/compare ————→  Railway (FastAPI + LangGraph)
                  ↑
                  +— cron / 10 min ———→  Railway → writes to Postgres`}
          </pre>
        </section>

        {/* Principles */}
        <section className="mb-12">
          <p className="font-body text-kicker uppercase text-(--text-muted) mb-4">
            Principles
          </p>
          <ul className="space-y-4 max-w-[60ch]">
            {ARCHITECTURE.map((point) => (
              <li
                key={point}
                className="font-body text-[15px] leading-relaxed text-(--text-secondary) flex items-baseline gap-3"
              >
                <span aria-hidden className="text-(--accent) shrink-0">
                  ◆
                </span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Back link */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="font-body text-outlet uppercase tracking-wider text-(--text-secondary) hover:text-(--accent) transition-colors no-underline inline-flex items-center gap-1.5"
          >
            <span aria-hidden>←</span> Back to Sift
          </Link>
          <a
            href="https://github.com/kristenmartino/sift"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-outlet uppercase tracking-wider text-(--text-secondary) hover:text-(--accent) transition-colors no-underline inline-flex items-center gap-1.5"
          >
            View source on GitHub <span aria-hidden>→</span>
          </a>
        </div>
      </main>
    </div>
  );
}
