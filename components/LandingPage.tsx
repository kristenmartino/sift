"use client";

import Link from "next/link";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { useTheme } from "@/lib/hooks";
import type { CategoryId } from "@/lib/types";

// ─── Feature cards data ─────────────────────────────────

const FEATURES = [
  {
    icon: "✦",
    title: "AI-Written Summaries",
    description:
      "Every article distilled into a concise summary by Claude. Get the key points without clicking through.",
    accent: "#818cf8",
  },
  {
    icon: "◆",
    title: "10 Categories",
    description:
      "Technology, business, science, energy, world news, health, politics, sports, entertainment — plus curated top stories.",
    accent: "#dc2626",
  },
  {
    icon: "⬡",
    title: "Custom Topic Search",
    description:
      "Search any topic. Sift finds relevant articles from its database or searches the web in real time.",
    accent: "#2563eb",
  },
  {
    icon: "⇌",
    title: "Multi-Source Comparison",
    description:
      "Compare how different outlets cover the same story. See where they agree, disagree, and what's unique.",
    accent: "#7c3aed",
  },
  {
    icon: "★",
    title: "Synced Bookmarks",
    description:
      "Save articles to read later. Sign in to sync bookmarks across devices, or use local storage.",
    accent: "#d97706",
  },
  {
    icon: "↻",
    title: "Always Fresh",
    description:
      "Articles sourced from 100+ outlets and refreshed every 10 minutes. Never stale, always relevant.",
    accent: "#059669",
  },
];

// ─── How It Works steps ─────────────────────────────────

const STEPS = [
  {
    number: "01",
    title: "Open Sift",
    description: "See top stories with AI-written summaries. Browse by category.",
  },
  {
    number: "02",
    title: "Go deeper",
    description: "Search topics, compare sources, save articles for later.",
  },
  {
    number: "03",
    title: "Close it",
    description: "60 seconds. You're caught up. Back to your day.",
  },
];

// ─── Tech stack ─────────────────────────────────────────

const TECH_STACK = [
  { name: "Next.js", detail: "App Router, RSC" },
  { name: "FastAPI + LangGraph", detail: "Pipeline orchestration" },
  { name: "Postgres + pgvector", detail: "Storage & semantic search" },
  { name: "Claude AI", detail: "Summarization & analysis" },
  { name: "Voyage AI", detail: "Embedding generation" },
  { name: "Clerk", detail: "Auth & user management" },
];

const ARCHITECTURE_POINTS = [
  "AI runs in the background pipeline, not in the request path — reads are < 50ms",
  "Cost scales with content volume, not user count",
  "Graceful degradation: every feature works without auth, without AI, without search",
  "56+ sources ingested, deduplicated, and ranked before you open the app",
];

// ─── Component ──────────────────────────────────────────

export default function LandingPage() {
  const { dark: darkMode, toggle: toggleDark, mounted } = useTheme();

  return (
    <div
      id="main-content"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        minHeight: "100vh",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* ── Nav ───────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-[var(--border)]"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading text-xl font-bold tracking-tight text-[var(--text)]">
              Sift
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest"
              style={{
                background: "rgba(99,102,241,0.1)",
                color: "var(--accent)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              AI-Curated
            </span>
          </div>
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={toggleDark}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border)] bg-transparent text-[var(--text-secondary)] text-sm cursor-pointer transition-colors duration-200"
              >
                {darkMode ? "☀" : "☾"}
              </button>
            )}
            <Link
              href="/news"
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 no-underline"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              Try Sift &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="font-heading text-[clamp(36px,6vw,60px)] font-bold leading-[1.1] tracking-tight text-[var(--text)] mb-6">
          The news, already read
          <br />
          for you.
        </h1>
        <p className="max-w-[560px] mx-auto text-[clamp(16px,2vw,20px)] leading-relaxed text-[var(--text-secondary)] mb-8">
          Sift pulls from 100+ sources, summarizes every article with AI, and
          gives you the key points in 60 seconds. No ads, no fluff, no infinite scroll.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] mb-10">
          <span>2,000+ articles</span>
          <span className="opacity-30">&middot;</span>
          <span>Updated every 10 min</span>
          <span className="opacity-30">&middot;</span>
          <span>10 categories</span>
        </div>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-base font-semibold transition-all duration-200 no-underline"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          Start Reading &rarr;
        </Link>
        <div
          className="mt-20 mx-auto max-w-[800px] h-px"
          style={{ background: "var(--border)" }}
        />
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <h2 className="font-heading text-2xl font-bold text-center text-[var(--text)] mb-12">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="rounded-[14px] p-6 transition-all duration-200 animate-fade-slide-in"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderTop: `3px solid ${feature.accent}`,
                animationDelay: `${i * 80}ms`,
              }}
            >
              <div
                className="text-2xl mb-3"
                style={{ color: feature.accent }}
              >
                {feature.icon}
              </div>
              <h3 className="font-heading text-base font-bold text-[var(--text)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <h2 className="font-heading text-2xl font-bold text-center text-[var(--text)] mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <div
                className="font-heading text-[72px] font-bold leading-none mb-4"
                style={{ color: "var(--accent)", opacity: 0.12 }}
              >
                {step.number}
              </div>
              <h3 className="font-heading text-lg font-bold text-[var(--text)] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-[280px] mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category Showcase ─────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <h2 className="font-heading text-2xl font-bold text-center text-[var(--text)] mb-8">
          10 categories, 100+ sources
        </h2>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {CATEGORIES.map((cat) => {
            const color = CATEGORY_COLORS[cat.id as CategoryId];
            return (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: `rgba(${color.rgb},0.1)`,
                  color: color.hex,
                  border: `1px solid rgba(${color.rgb},0.2)`,
                }}
              >
                {cat.icon} {cat.label}
              </span>
            );
          })}
        </div>
        <p className="text-center text-xs text-[var(--text-muted)] max-w-[760px] mx-auto leading-relaxed">
          Reuters · AP · BBC · NPR · New York Times · Washington Post · Axios · Politico · PBS NewsHour
          · TechCrunch · Ars Technica · The Verge · Wired · MIT Tech Review · Hacker News · TechMeme
          · CNBC · Bloomberg · MarketWatch · Financial Times · The Economist · Fortune · Forbes
          · Nature · Science · Phys.org · Scientific American · NASA · Quanta Magazine
          · CleanTechnica · Electrek · Canary Media · Carbon Brief · Grist · Inside Climate News
          · Al Jazeera · The Guardian · DW News · France 24 · South China Morning Post · Foreign Policy
          · STAT News · WHO · The BMJ · NIH · The Lancet · Medscape
          · Politico · The Hill · FiveThirtyEight · RealClearPolitics
          · ESPN · BBC Sport · The Athletic · CBS Sports · Sports Illustrated
          · Variety · Hollywood Reporter · Deadline · Rolling Stone · Pitchfork · IGN
          · Vox · The Atlantic · ProPublica · Rest of World · and more
        </p>
      </section>

      {/* ── Built for Production ──────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <h2 className="font-heading text-2xl font-bold text-center text-[var(--text)] mb-4">
          Built for production
        </h2>
        <p className="text-center text-sm text-[var(--text-secondary)] mb-12 max-w-[500px] mx-auto">
          Not a demo. A real system designed for reliability, speed, and cost-efficiency.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10 max-w-[700px] mx-auto">
          {TECH_STACK.map((tech) => (
            <div
              key={tech.name}
              className="rounded-[12px] px-4 py-3 text-center"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-sm font-semibold text-[var(--text)]">{tech.name}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{tech.detail}</div>
            </div>
          ))}
        </div>
        <ul className="max-w-[600px] mx-auto space-y-2">
          {ARCHITECTURE_POINTS.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
            >
              <span className="text-[var(--accent)] mt-0.5 shrink-0">&#x2022;</span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Final CTA ─────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20 text-center">
        <div
          className="mx-auto max-w-[800px] h-px mb-16"
          style={{ background: "var(--border)" }}
        />
        <h2 className="font-heading text-[clamp(28px,4vw,40px)] font-bold text-[var(--text)] mb-6">
          Try Sift
        </h2>
        <p className="text-[var(--text-secondary)] mb-8 text-base">
          Free. No account required.
        </p>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-base font-semibold transition-all duration-200 no-underline"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          Start Reading &rarr;
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-6 px-6 text-center text-xs text-[var(--text-muted)] max-w-[1200px] mx-auto">
        <span className="font-heading font-semibold">Sift</span>
        {" — "}AI-curated news powered by Claude. Articles link to original sources.
      </footer>
    </div>
  );
}
