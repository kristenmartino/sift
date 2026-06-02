"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { timeAgo, truncateToSentence } from "@/lib/utils";
import CardImage from "./CardImage";
import SourceRow from "./SourceRow";
import {
  buildSourceUnits,
  summarizeLeanSpread,
  type SourceUnit,
} from "@/lib/storySources";
import { bucketize, type CrossSpectrumBucket } from "@/lib/crossSpectrum";
import { LeanSpread } from "./primitives";
import type { StoryCardProps } from "@/lib/types";

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className="story-chevron"
      data-expanded={expanded}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 3.5 L5 6.5 L8 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Sort order for the per-outlet list so it reads Left → Center → Right →
// unrated — the "spectrum" without needing literal columns.
const BUCKET_ORDER: Record<CrossSpectrumBucket, number> = {
  left: 0,
  center: 1,
  right: 2,
};
function leanRank(unit: SourceUnit): number {
  const b = bucketize(unit.outlet?.allSidesRating);
  return b ? BUCKET_ORDER[b] : 3;
}

export default function StoryCard({
  story,
  featured,
  index,
  onCompare,
}: StoryCardProps) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === story.category) || CATEGORIES[0];
  const color = CATEGORY_COLORS[story.category] || CATEGORY_COLORS.top;
  const hasImage = !!story.imageUrl;

  // Collect unique entity tags across all entity sets
  const entityTags: string[] = [];
  const seen = new Set<string>();
  for (const ent of story.entities) {
    for (const person of ent.people) {
      if (!seen.has(person)) { seen.add(person); entityTags.push(person); }
    }
    for (const org of ent.organizations) {
      if (!seen.has(org)) { seen.add(org); entityTags.push(org); }
    }
    for (const loc of ent.locations) {
      if (!seen.has(loc)) { seen.add(loc); entityTags.push(loc); }
    }
  }
  const visibleTags = entityTags.slice(0, 6);

  // One unit per outlet: provenance + how it framed the story + its article(s).
  const sourceUnits = buildSourceUnits(story.framings, story.articles);
  const framedUnits = sourceUnits.filter((u) => u.framing);
  const unframedUnits = sourceUnits.filter((u) => !u.framing);
  const uniqueSourceCount = framedUnits.length;
  // Multi-source affordances only when 2+ distinct outlets framed the story.
  const isMultiSource = uniqueSourceCount >= 2;
  // Spread across every outlet on the story (single-source shows one cell).
  const spread = summarizeLeanSpread(sourceUnits);
  // Framed units sorted L→C→R→unrated so the list reads as a spectrum.
  const sortedFramed = isMultiSource
    ? [...framedUnits].sort((a, b) => leanRank(a) - leanRank(b))
    : framedUnits;

  const isFeaturedGrid = featured && hasImage;
  const pad = featured ? "p-7 md:p-8" : "p-5";
  const padX = featured ? "px-7 md:px-8" : "px-5";

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        bg-(--surface-raised) rounded-[14px] overflow-hidden
        border border-(--border)
        ${isFeaturedGrid ? "col-span-full" : ""}
      `}
      style={{
        position: "relative",
        transition:
          "transform var(--dur-slow) var(--ease-out-expo), box-shadow var(--dur-slow) var(--ease-out-expo)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 60px var(--shadow-hover)"
          : "0 2px 16px var(--shadow)",
        borderTop: !hasImage ? `3px solid ${color.hex}` : undefined,
        animation: index <= 2 ? `card-enter-left 0.5s ease-out both` : undefined,
        animationDelay: index <= 2 ? `${index * 60}ms` : undefined,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 pointer-events-none z-1"
        style={{ background: color.hex, opacity: hovered ? 0.6 : 0 }}
      />

      {/* Hero: image + body. Featured-with-image is a 2-col grid where the
          image fills the (stable) body height. The body never grows on expand —
          the only disclosure (single-source) renders full-width BELOW this grid —
          so the image never re-crops/"zooms". */}
      <div className={isFeaturedGrid ? "grid grid-cols-1 md:grid-cols-2" : ""}>
        {hasImage && (
          <CardImage
            src={story.imageUrl}
            alt={story.headline}
            featured={featured}
            category={story.category}
          />
        )}

        <div className={`flex flex-col gap-3 ${pad}`}>
          {/* Category badge + sources badge + coverage-spread cue */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
              style={{
                background: `rgba(${color.rgb}, 0.08)`,
                color: color.hex,
                border: `1px solid rgba(${color.rgb}, 0.15)`,
              }}
            >
              {cat.icon} {cat.label}
            </span>
            {isMultiSource && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {COPY.stories.sourcesBadge(uniqueSourceCount)}
              </span>
            )}
            {spread.bucketsCovered > 0 && <LeanSpread spread={spread} />}
          </div>

          {/* Headline */}
          <h3
            className={`font-heading font-bold text-(--text-primary) ${
              featured ? "text-headline-lg" : "text-headline"
            }`}
          >
            {story.headline}
          </h3>

          {/* Summary — tightened so the per-outlet framing comparison is the
              card's center of gravity, not the restated-headline blurb. */}
          <p
            className={`text-(--text-secondary) ${featured ? "text-body-lg" : "text-body"}`}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: featured ? 5 : 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {truncateToSentence(story.summary, featured ? 220 : 150)}
          </p>

          {/* Entity tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: "var(--surface-base)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {tag}
                </span>
              ))}
              {entityTags.length > 6 && (
                <span className="text-[10px] text-(--text-tertiary) self-center">
                  +{entityTags.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Multi-source: per-outlet framing comparison, always visible. Each
              row carries provenance (lean + factual, cited), how the outlet
              framed the story, and a link to its actual headline + any
              same-outlet extras. Sorted L→C→R so it reads as a spectrum;
              unframed sources (rare) follow as "also covered" rows. */}
          {isMultiSource && (
            <div className="mt-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-kicker font-bold uppercase text-(--text-tertiary) shrink-0">
                  {COPY.stories.framing(uniqueSourceCount)}
                </p>
                <span
                  aria-hidden
                  className="flex-1 h-px bg-linear-to-r from-(--border) to-transparent"
                />
              </div>
              <div className="flex flex-col">
                {sortedFramed.map((u) => (
                  <SourceRow key={u.sourceName} unit={u} onCompare={onCompare} />
                ))}
                {unframedUnits.map((u) => (
                  <SourceRow key={u.sourceName} unit={u} onCompare={onCompare} />
                ))}
              </div>
            </div>
          )}

          {/* Single-source disclosure trigger (the tray itself is full-width
              below the hero grid, so opening it can't stretch the image). */}
          {!isMultiSource && story.articles.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="story-expand-btn self-start bg-transparent border-none p-0 cursor-pointer text-xs font-semibold transition-colors duration-200 mt-1 inline-flex items-center gap-1.5"
              style={{ color: "var(--accent)" }}
              aria-expanded={expanded}
            >
              {expanded
                ? COPY.stories.collapse
                : COPY.stories.expand(story.articles.length)}
              <Chevron expanded={expanded} />
            </button>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-(--text-tertiary) font-medium">
            <span>{timeAgo(story.publishedDate)}</span>
            <span className="opacity-30">&middot;</span>
            <span>
              {story.articleCount} article{story.articleCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Single-source "read the originals" tray — full-width below the hero so
          expanding never resizes the image column. grid-template-rows disclosure. */}
      {!isMultiSource && story.articles.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transition: "grid-template-rows var(--dur-base) var(--ease-out-expo)",
          }}
        >
          <div style={{ overflow: "hidden", minHeight: 0 }}>
            <div className={`${padX} pb-6 pt-1 border-t border-(--border)`}>
              <p className="text-meta text-(--text-tertiary) my-3">
                {COPY.stories.expandedMeta(
                  timeAgo(story.publishedDate),
                  story.articleCount,
                )}
              </p>
              <div
                className="rounded-[10px] px-3"
                style={{
                  background: "var(--well-bg)",
                  boxShadow: "inset 0 1px 0 var(--border)",
                }}
              >
                {sourceUnits.map((u) => (
                  <SourceRow key={u.sourceName} unit={u} onCompare={onCompare} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
