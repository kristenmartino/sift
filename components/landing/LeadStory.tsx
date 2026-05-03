"use client";

import Link from "next/link";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/utils";
import CardImage from "@/components/CardImage";
import type { Article } from "@/lib/types";

interface LeadStoryProps {
  article: Article | null;
}

export default function LeadStory({ article }: LeadStoryProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-6 pt-12 pb-10">
      {article ? <LeadFromDb article={article} /> : <LeadFallback />}

      {/* Editorial explainer paragraph */}
      <p className="mt-12 max-w-[60ch] mx-auto text-center font-body text-[16px] leading-[1.65] text-[var(--text-secondary)]">
        {COPY.landing.explainer}
      </p>
    </section>
  );
}

function LeadFromDb({ article }: { article: Article }) {
  const cat = CATEGORIES.find((c) => c.id === article.category) || CATEGORIES[0];
  const color = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.top;

  return (
    <a
      href={article.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-x-10 gap-y-6 group cursor-pointer no-underline pb-10 border-b border-[var(--border)]"
    >
      {/* Image */}
      <div>
        <CardImage
          src={article.imageUrl}
          alt={article.title}
          featured
          category={article.category}
        />
        <p className="mt-2.5 pt-2 border-t border-[var(--border)] font-body text-outlet uppercase text-[var(--text-muted)] truncate">
          Photograph · {article.sourceName}
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-col">
        <p className="font-body text-kicker uppercase text-[var(--text-secondary)] flex items-center mb-4">
          <span
            aria-hidden
            className="inline-block w-1.5 h-1.5 rounded-full mr-2.5"
            style={{ background: color.hex }}
          />
          <span className="text-[var(--accent)] font-semibold">
            {COPY.landing.leadEyebrow}
          </span>
          <span className="mx-2 text-[var(--text-muted)]">·</span>
          <span>{cat.label}</span>
        </p>

        <h2
          className="font-heading text-[28px] sm:text-[34px] md:text-[40px] font-bold leading-[1.08] tracking-tight text-[var(--text)] transition-colors duration-200 group-hover:text-[var(--accent)]"
        >
          {article.title}
        </h2>

        <p className="font-body text-outlet uppercase text-[var(--text-muted)] mt-4 flex flex-wrap items-center gap-x-2">
          <span className="text-[var(--text-secondary)] font-semibold normal-case tracking-normal text-[12px]">
            {article.sourceName}
          </span>
          <span>·</span>
          <span>{timeAgo(article.publishedDate)}</span>
          <span>·</span>
          <span>{article.readTime} min read</span>
        </p>

        <p
          data-dropcap
          className="font-body text-[16px] text-[var(--text-secondary)] mt-6 leading-[1.65] max-w-[60ch]"
        >
          {article.summary}
        </p>

        <p className="mt-6 font-body text-outlet uppercase text-[var(--text-muted)] inline-flex items-center gap-1.5 transition-colors group-hover:text-[var(--accent)]">
          {COPY.landing.leadCta} <span aria-hidden>→</span>
        </p>
      </div>
    </a>
  );
}

function LeadFallback() {
  return (
    <div className="max-w-[640px] mx-auto text-center pt-8 pb-12 border-b border-[var(--border)]">
      <p className="font-body text-kicker uppercase text-[var(--accent)] mb-4">
        {COPY.landing.leadEyebrow}
      </p>
      <h2 className="font-heading text-[clamp(28px,5vw,40px)] font-bold leading-[1.1] tracking-tight text-[var(--text)] mb-5">
        {COPY.landing.leadFallbackTitle}
      </h2>
      <p className="font-body text-[16px] leading-relaxed text-[var(--text-secondary)] mb-7">
        {COPY.landing.leadFallbackBody}
      </p>
      <Link
        href="/news"
        className="font-body text-outlet uppercase tracking-wider text-[var(--accent)] hover:opacity-80 transition-opacity no-underline inline-flex items-center gap-1.5"
      >
        {COPY.landing.feedCta} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

/* ─── CSS for drop cap ──────────────────────────────────
   We rely on globals.css [data-dropcap]::first-letter — but that lives
   in the-digest's globals. Sift's globals.css doesn't have it yet.
   We inline the rule via a <style jsx global> in LandingPage instead,
   so it's scoped to landing and doesn't affect the rest of Sift. */
