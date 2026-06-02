"use client";

import { useState, useRef, useEffect } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/utils";
import CardImage from "./CardImage";
import BackgroundPrimer from "./primer/BackgroundPrimer";
import { OutletChip } from "./primitives";
import EntityLinksList from "./glossary/EntityLinksList";
import type { ArticleCardProps } from "@/lib/types";

// Fan-out stagger: even-indexed cards drift from left, odd from right
function getEntranceStyle(index: number): React.CSSProperties {
  if (index === 0) return {}; // first card: center (default fade-slide-in)
  const direction = index % 2 === 0 ? "card-enter-left" : "card-enter-right";
  return {
    animation: `${direction} 0.5s ease-out both`,
    animationDelay: `${index * 60}ms`,
  };
}

export default function ArticleCard({
  article,
  featured,
  onBookmark,
  isBookmarked,
  index,
  onCompare,
}: ArticleCardProps) {
  const [hovered, setHovered] = useState(false);
  const [bookmarkAnimating, setBookmarkAnimating] = useState(false);
  const prevBookmarked = useRef(isBookmarked);
  const cat = CATEGORIES.find((c) => c.id === article.category) || CATEGORIES[0];
  const color = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.top;
  const hasImage = !!article.imageUrl;

  // Trigger pop animation when bookmark state changes to true
  useEffect(() => {
    if (isBookmarked && !prevBookmarked.current) {
      setBookmarkAnimating(true);
      const timer = setTimeout(() => setBookmarkAnimating(false), 400);
      return () => clearTimeout(timer);
    }
    prevBookmarked.current = isBookmarked;
  }, [isBookmarked]);

  const entranceStyle = index === 0
    ? { animationDelay: "0ms" }
    : getEntranceStyle(index);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        bg-(--surface-raised) rounded-[14px] overflow-hidden
        border border-(--border) ${index === 0 ? "animate-fade-slide-in" : ""}
        ${featured && hasImage ? "col-span-full grid grid-cols-1 md:grid-cols-2" : ""}
      `}
      style={{
        position: "relative",
        transition:
          "transform var(--dur-slow) var(--ease-out-expo), box-shadow var(--dur-slow) var(--ease-out-expo), background-color 0.3s ease, border-color 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 60px var(--shadow-hover)"
          : "0 2px 16px var(--shadow)",
        // Text-first card: thin accent bar at top when no image
        borderTop: !hasImage ? `3px solid ${color.hex}` : undefined,
        ...entranceStyle,
      }}
    >
      {/* Hover glow — accent-colored bar at top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 pointer-events-none"
        style={{
          background: color.hex,
          opacity: hovered ? 0.6 : 0,
          zIndex: 1,
        }}
      />

      {/* Image area — only rendered if article has an image */}
      {hasImage && (
        <CardImage
          src={article.imageUrl}
          alt={article.title}
          featured={featured}
          category={article.category}
        />
      )}

      <div
        className={`flex flex-col gap-3 ${
          featured ? "p-7 md:p-8" : "p-5"
        }`}
        style={{ minHeight: featured ? undefined : 160 }}
      >
        {/* Category badge + bookmark */}
        <div className="flex justify-between items-center">
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(article.id);
            }}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            className={`bg-transparent border-none cursor-pointer text-lg p-1 relative z-2 ${
              bookmarkAnimating ? "animate-bookmark-pop" : "transition-all duration-200"
            }`}
            style={{
              color: isBookmarked ? "#f59e0b" : "var(--text-tertiary)",
              transform: !bookmarkAnimating && isBookmarked ? "scale(1.15)" : !bookmarkAnimating ? "scale(1)" : undefined,
            }}
          >
            {isBookmarked ? "\u2605" : "\u2606"}
            {/* Particle burst ring */}
            {bookmarkAnimating && (
              <span
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  border: "2px solid #f59e0b",
                  animation: "bookmark-burst 0.4s ease-out forwards",
                }}
              />
            )}
          </button>
        </div>

        {/* Title — serves as the card's primary link */}
        <h3
          className="font-heading font-bold leading-snug tracking-tight"
          style={{
            fontSize: featured ? 24 : 17,
            display: "-webkit-box",
            WebkitLineClamp: featured ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {article.sourceUrl ? (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--text-primary) no-underline hover:underline"
              style={{
                // Stretch link to cover entire card
                position: "static",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pseudo-element stretches to cover the card */}
              <span
                className="absolute inset-0 z-1"
                aria-hidden="true"
                style={{ position: "absolute" }}
              />
              {article.title}
            </a>
          ) : (
            <span className="text-(--text-primary)">{article.title}</span>
          )}
        </h3>

        {/* Summary — clamp to fixed line count so card heights converge across
            the auto-fill grid (StoryCard.tsx already does the same). */}
        <p
          className="text-(--text-secondary) leading-relaxed"
          style={{
            fontSize: featured ? 15 : 13.5,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: featured ? 5 : 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {article.summary}
        </p>

        {/* Why it matters */}
        {article.whyItMatters && (
          <p
            className="text-[13px] italic leading-snug"
            style={{ color: color.hex, opacity: 0.75 }}
          >
            {article.whyItMatters}
          </p>
        )}

        {/* Background primer ("What you should know first") — civic-literacy
            MVP Phase 1C. Renders nothing when contextPrimer is absent.
            Featured cards default expanded so the primer is visible without a
            click; standard cards default collapsed to keep feed scannable. */}
        {article.contextPrimer && (
          <BackgroundPrimer
            primer={article.contextPrimer}
            defaultExpanded={!!featured}
            articleId={article.id}
            surface="feed"
          />
        )}

        {/* Entity links ("Mentioned in this story") — civic-literacy MVP
            Phase 3.H. Renders nothing when entityLinks is empty/undefined,
            so articles predating the entity-linker pipeline degrade
            cleanly. */}
        <EntityLinksList links={article.entityLinks} />

        {/* Meta */}
        <div className="flex flex-col gap-1.5 mt-auto pt-2">
          <OutletChip outlet={article.outlet} fallback={article.sourceName} />
          <div className="flex items-center gap-3 text-xs text-(--text-tertiary) font-medium flex-wrap">
            <span>{timeAgo(article.publishedDate)}</span>
            <span className="opacity-30">&middot;</span>
            <span>{article.readTime} min read</span>
            {onCompare && (
              <>
                <span className="opacity-30">&middot;</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompare(article.title, article.sourceName);
                  }}
                  className="bg-transparent border-none p-0 cursor-pointer text-xs font-medium transition-colors duration-200 relative z-2"
                  style={{ color: "var(--accent)" }}
                >
                  {COPY.compare.button}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
