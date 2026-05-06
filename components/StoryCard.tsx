"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/utils";
import CardImage from "./CardImage";
import OutletBadge from "./outlet/OutletBadge";
import type { StoryCardProps } from "@/lib/types";

// Tone labels are no longer rendered (civic-literacy pivot, Phase 0).
// Schema fields + COPY.stories.toneLabels lookup remain for backward
// compatibility and possible future re-introduction. See plans/sift-civic-literacy.md.

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

export default function StoryCard({
  story,
  featured,
  onBookmark,
  bookmarks,
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

  // Dedupe framings by source so a story doesn't claim multi-outlet
  // coverage when one outlet just published several near-duplicate
  // articles. The clusterer can group same-outlet posts into a single
  // story; we should never render that as "How 4 outlets covered this".
  // Keeps first-seen framing per outlet (preserves the LLM's chosen
  // representative wording per source).
  const uniqueFramings = (() => {
    const sourcesSeen = new Set<string>();
    return story.framings.filter((f) => {
      if (sourcesSeen.has(f.sourceName)) return false;
      sourcesSeen.add(f.sourceName);
      return true;
    });
  })();
  const uniqueSourceCount = uniqueFramings.length;
  // Only show multi-source affordances (the "N sources" badge + the
  // framings section) when there are at least 2 distinct outlets.
  // Below threshold, the cluster reads as related coverage from one
  // outlet and the article-list expand still works as intended.
  const isMultiSource = uniqueSourceCount >= 2;

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        bg-[var(--card-bg)] rounded-[14px] overflow-hidden
        border border-[var(--border)]
        ${featured && hasImage ? "col-span-full grid grid-cols-1 md:grid-cols-2" : ""}
      `}
      style={{
        position: "relative",
        transition:
          "transform var(--dur-slow) var(--ease-out-expo), box-shadow var(--dur-slow) var(--ease-out-expo)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? featured && expanded
            ? "0 24px 80px var(--shadow-high)"
            : "0 20px 60px var(--shadow-hover)"
          : featured && expanded
            ? "0 4px 24px var(--shadow-mid)"
            : "0 2px 16px var(--shadow)",
        borderTop: !hasImage ? `3px solid ${color.hex}` : undefined,
        animation: index <= 2 ? `card-enter-left 0.5s ease-out both` : undefined,
        animationDelay: index <= 2 ? `${index * 60}ms` : undefined,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 pointer-events-none"
        style={{ background: color.hex, opacity: hovered ? 0.6 : 0, zIndex: 1 }}
      />

      {/* Light-source radial highlight — only on the signature expanded card */}
      {featured && expanded && (
        <div
          aria-hidden
          className="story-highlight absolute top-0 left-0 right-0 h-[120px] pointer-events-none"
        />
      )}

      {/* Image */}
      {hasImage && (
        <CardImage
          src={story.imageUrl}
          alt={story.headline}
          featured={featured}
          category={story.category}
        />
      )}

      <div className={`flex flex-col gap-3 ${featured ? "p-7 md:p-8" : "p-5"}`}>
        {/* Category badge + sources badge (only when multi-outlet) */}
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
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              {COPY.stories.sourcesBadge(uniqueSourceCount)}
            </span>
          )}
        </div>

        {/* Headline */}
        <h3
          className={`font-heading font-bold text-[var(--text)] ${
            featured ? "text-headline-lg" : "text-headline"
          }`}
        >
          {story.headline}
        </h3>

        {/* Summary */}
        <p
          className={`text-[var(--text-secondary)] ${featured ? "text-body-lg" : "text-body"}`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: featured ? 4 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {story.summary}
        </p>

        {/* Entity tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  background: "var(--bg)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {tag}
              </span>
            ))}
            {entityTags.length > 6 && (
              <span className="text-[10px] text-[var(--text-muted)] self-center">
                +{entityTags.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Framings section — only render when 2+ unique outlets disagree
            on framing. Single-outlet clusters (one outlet, multiple
            near-duplicate articles) skip this section entirely so the card
            never claims cross-outlet coverage that doesn't exist. */}
        {isMultiSource && (
          <div className="mt-1">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-kicker font-bold uppercase text-[var(--text-muted)] shrink-0">
                {COPY.stories.framing(uniqueSourceCount)}
              </p>
              <span
                aria-hidden
                className="flex-1 h-px bg-gradient-to-r from-[var(--border)] to-transparent"
              />
            </div>
            <div className="flex flex-col">
              {uniqueFramings.map((f) => (
                <div
                  key={f.sourceName}
                  className="story-row flex items-start gap-4 py-2.5 border-b border-[color:var(--border-subtle)] last:border-b-0"
                >
                  <span aria-hidden className="story-row__rail" />
                  <span className="story-row__source text-outlet font-semibold uppercase text-[var(--text)] shrink-0 min-w-[88px]">
                    {f.sourceName}
                  </span>
                  <span className="text-body text-[var(--text-secondary)] flex-1">
                    {f.framing}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty-framings fallback — articles exist but framings still pending.
            Only shown for multi-outlet clusters; single-outlet clusters render
            as a regular card (no synthesis pending state). */}
        {story.framings.length === 0 && story.articles.length > 0 && (() => {
          const uniqueSourcesInArticles = new Set(
            story.articles.map((a) => a.sourceName)
          ).size;
          if (uniqueSourcesInArticles < 2) return null;
          return (
            <p className="text-body text-[var(--text-muted)] italic">
              {COPY.stories.analyzingFallback}
            </p>
          );
        })()}

        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="story-expand-btn self-start bg-transparent border-none p-0 cursor-pointer text-xs font-semibold transition-colors duration-200 mt-1 inline-flex items-center gap-1.5"
          style={{ color: "var(--accent)" }}
          aria-expanded={expanded}
        >
          {expanded ? COPY.stories.collapse : COPY.stories.expand(story.articles.length)}
          <Chevron expanded={expanded} />
        </button>

        {/* Expanded child articles — grid-template-rows disclosure (no max-height) */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transition: "grid-template-rows var(--dur-base) var(--ease-out-expo)",
          }}
        >
          <div style={{ overflow: "hidden", minHeight: 0 }}>
            {expanded && (
              <div className="mt-3 pt-4 border-t border-[var(--border)]">
                <p className="text-meta text-[var(--text-muted)] mb-3">
                  {COPY.stories.expandedMeta(timeAgo(story.publishedDate), story.articles.length)}
                </p>
                <div
                  className="rounded-[10px] px-2"
                  style={{
                    background: "var(--well-bg)",
                    boxShadow: "inset 0 1px 0 var(--border)",
                  }}
                >
                  <div className="flex flex-col">
                    {story.articles.map((article, i) => (
                      <a
                        key={article.id}
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="story-row flex items-center gap-4 py-3 no-underline border-b border-[color:var(--border-subtle)] last:border-b-0"
                        style={{
                          animation: "row-reveal 320ms var(--ease-out-expo) both",
                          // Stagger after the framings rows when those render;
                          // otherwise start from zero so the article list
                          // doesn't pause for invisible framings.
                          animationDelay: `${((isMultiSource ? uniqueSourceCount : 0) + Math.min(i, 11)) * 24}ms`,
                        }}
                      >
                        <span aria-hidden className="story-row__rail" />
                        <OutletBadge
                          outlet={article.outlet}
                          fallback={article.sourceName}
                          variant="rail"
                          className="story-row__source shrink-0 min-w-[88px]"
                        />
                        <span
                          className="text-body text-[var(--text)] flex-1"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {article.title}
                        </span>
                        <span className="text-meta text-[var(--text-muted)] shrink-0">
                          {timeAgo(article.publishedDate)}
                        </span>
                        {onCompare && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onCompare(article.title, article.sourceName);
                            }}
                            className="story-row__cta bg-transparent border-none p-0 cursor-pointer text-meta font-medium shrink-0"
                            style={{ color: "var(--accent)" }}
                          >
                            {COPY.stories.compareRow}
                          </button>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-[var(--text-muted)] font-medium">
          <span>{timeAgo(story.publishedDate)}</span>
          <span className="opacity-30">&middot;</span>
          <span>{story.articleCount} article{story.articleCount !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </article>
  );
}
