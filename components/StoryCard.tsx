"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/utils";
import CardImage from "./CardImage";
import type { StoryCardProps, StoryFraming } from "@/lib/types";

const TONE_COLORS: Record<StoryFraming["tone"], string> = {
  neutral: "#6b7280",
  urgent: "#dc2626",
  analytical: "#2563eb",
  critical: "#d97706",
  optimistic: "#059669",
};

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

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        bg-[var(--card-bg)] rounded-[14px] overflow-hidden
        border border-[var(--border)]
        ${featured && hasImage ? "col-span-full grid grid-cols-1 md:grid-cols-2" : "col-span-full"}
      `}
      style={{
        position: "relative",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)",
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
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 pointer-events-none"
        style={{ background: color.hex, opacity: hovered ? 0.6 : 0, zIndex: 1 }}
      />

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
        {/* Category badge + sources badge */}
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
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide"
            style={{
              background: "var(--accent)",
              color: "#fff",
            }}
          >
            {COPY.stories.sourcesBadge(story.articleCount)}
          </span>
        </div>

        {/* Headline */}
        <h3
          className="font-heading font-bold leading-snug text-[var(--text)] tracking-tight"
          style={{ fontSize: featured ? 24 : 19 }}
        >
          {story.headline}
        </h3>

        {/* Summary */}
        <p
          className="text-[var(--text-secondary)] leading-relaxed"
          style={{
            fontSize: featured ? 15 : 14,
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

        {/* Framings section */}
        {story.framings.length > 0 && (
          <div className="mt-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              {COPY.stories.framing}
            </p>
            <div className="flex flex-col gap-1.5">
              {story.framings.map((f) => (
                <div key={f.sourceName} className="flex items-start gap-2 text-xs">
                  <span className="font-bold text-[var(--text-secondary)] shrink-0 min-w-[80px]">
                    {f.sourceName}
                  </span>
                  <span className="text-[var(--text-muted)] flex-1">{f.framing}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0"
                    style={{
                      color: TONE_COLORS[f.tone] || TONE_COLORS.neutral,
                      background: `${TONE_COLORS[f.tone] || TONE_COLORS.neutral}15`,
                    }}
                  >
                    {f.tone}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="self-start bg-transparent border-none p-0 cursor-pointer text-xs font-semibold transition-colors duration-200 mt-1"
          style={{ color: "var(--accent)" }}
        >
          {expanded ? COPY.stories.collapse : COPY.stories.expand(story.articles.length)}
        </button>

        {/* Expanded child articles */}
        {expanded && (
          <div
            className="flex flex-col gap-2 mt-1 pt-3 border-t border-[var(--border)]"
            style={{ animation: "story-expand 0.35s ease-out both" }}
          >
            {story.articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200"
                style={{ background: "var(--bg)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(article.sourceUrl, "_blank", "noopener,noreferrer");
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--card-bg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg)";
                }}
              >
                <span className="text-xs font-bold text-[var(--text-secondary)] min-w-[70px] shrink-0">
                  {article.sourceName}
                </span>
                <span
                  className="text-xs text-[var(--text)] flex-1"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {article.title}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                  {timeAgo(article.publishedDate)}
                </span>
                {onCompare && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompare(article.title, article.sourceName);
                    }}
                    className="bg-transparent border-none p-0 cursor-pointer text-[10px] font-medium shrink-0 transition-colors duration-200"
                    style={{ color: "var(--accent)" }}
                  >
                    Compare
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

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
