"use client";

import { useId, useState } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/utils";
import { articleContentLabel, isEarlierPublication } from "@/lib/articlePresentation";
import ReadingSummary from "./ReadingSummary";
import { buildSourceUnits, summarizeLeanSpread, type SourceUnit } from "@/lib/storySources";
import { bucketize, type CrossSpectrumBucket } from "@/lib/crossSpectrum";
import { LeanSpread } from "./primitives";
import CardImage from "./CardImage";
import SourceRow from "./SourceRow";
import type { StoryCardProps } from "@/lib/types";

const BUCKET_ORDER: Record<CrossSpectrumBucket, number> = { left: 0, center: 1, right: 2 };
function leanRank(unit: SourceUnit): number {
  const bucket = bucketize(unit.outlet?.allSidesRating);
  return bucket ? BUCKET_ORDER[bucket] : 3;
}

export default function StoryCard({ story, featured, index, onCompare }: StoryCardProps) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const coverageId = useId();
  const cat = CATEGORIES.find((c) => c.id === story.category) || CATEGORIES[0];
  const color = CATEGORY_COLORS[story.category] || CATEGORY_COLORS.top;
  const sourceUnits = buildSourceUnits(story.framings, story.articles);
  const sortedSources = [...sourceUnits].sort((a, b) => leanRank(a) - leanRank(b));
  const count = sourceUnits.length;
  const spread = summarizeLeanSpread(sourceUnits);
  const hasImage = !!story.imageUrl;
  const includesOpinion = story.isOpinion || story.articles.some((article) => articleContentLabel(article) === "Opinion");

  return (
    <article className={`bg-(--surface-raised) rounded-[14px] overflow-hidden border border-(--border) ${featured && hasImage ? "col-span-full" : ""}`}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", transition: "transform var(--dur-slow) var(--ease-out-expo), box-shadow var(--dur-slow) var(--ease-out-expo)", transform: hovered ? "translateY(-2px)" : undefined, boxShadow: hovered ? "0 12px 36px var(--shadow-hover)" : "0 2px 16px var(--shadow)", borderTop: !hasImage ? `3px solid ${color.hex}` : undefined, animation: index <= 2 ? "card-enter-left 0.5s ease-out both" : undefined, animationDelay: index <= 2 ? `${index * 60}ms` : undefined }}>
      <div className={featured && hasImage ? "feed-featured-card grid grid-cols-1 lg:grid-cols-2" : ""}>
        {hasImage && <CardImage src={story.imageUrl} alt={story.headline} featured={featured} category={story.category} />}
        <div className={`flex flex-col gap-3 ${featured ? "p-5 md:p-6" : "p-5"}`}>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: color.hex }}>{cat.icon} {cat.label}</span>
            <span className="text-xs font-semibold text-(--text-secondary)">{count} outlet{count !== 1 ? "s" : ""}</span>
            {includesOpinion && <span className="text-[11px] text-(--text-secondary)">Includes opinion</span>}
            {spread.bucketsCovered > 0 && <LeanSpread spread={spread} />}
          </div>
          <h3 className={`font-heading font-bold text-(--text-primary) ${featured ? "text-headline-lg" : "text-headline"}`}>{story.headline}</h3>
          <ReadingSummary summary={story.summary} previewChars={featured ? 240 : 180} featured={featured} />
          {(story.articles.length > 0 || onCompare) && <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {story.articles.length > 0 && <button type="button" aria-expanded={expanded} aria-controls={coverageId}
              onClick={() => setExpanded(!expanded)} className="text-sm text-(--accent) font-semibold cursor-pointer bg-transparent border-none p-0 py-1 hover:underline">
              {expanded ? "Hide source coverage" : `View coverage from ${count} outlet${count !== 1 ? "s" : ""}`} <span aria-hidden>{expanded ? "−" : "+"}</span>
            </button>}
            {onCompare && <button type="button"
              onClick={() => onCompare(story.headline, sourceUnits.map((unit) => unit.outlet?.name ?? unit.sourceName), story.category)}
              className="text-sm text-(--accent) font-semibold cursor-pointer bg-transparent border-none p-0 py-1 hover:underline">
              {COPY.compare.button} <span aria-hidden>→</span>
            </button>}
          </div>}
          <p className="text-xs text-(--text-secondary) mt-auto pt-1" title={story.publishedDate ? new Date(story.publishedDate).toUTCString() : undefined}>
            {isEarlierPublication(story.publishedDate) && <span className="block mb-1 text-(--text-secondary)">Earlier publication</span>}
            Latest source published {timeAgo(story.publishedDate)} · {story.articleCount} article{story.articleCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      {/* Ratings stay visible; only framing and original reporting expand. */}
      {count > 0 && <section aria-label="Source coverage" className="px-5 md:px-6 py-4 border-t border-(--border)">
        <p className="text-sm font-semibold text-(--text-primary)">Outlet ratings</p>
        <div id={coverageId}>
          {expanded && <p className="text-sm font-semibold text-(--text-primary) mt-2">{COPY.stories.framing(count)}</p>}
          {sortedSources.map((unit) => <SourceRow key={unit.sourceName} unit={unit} showCoverage={expanded} />)}
        </div>
      </section>}
    </article>
  );
}
