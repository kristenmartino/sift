"use client";

import { useId, useState } from "react";
import { summaryPreview } from "@/lib/articlePresentation";

interface ReadingSummaryProps {
  summary: string;
  previewChars?: number;
  featured?: boolean;
  className?: string;
}

/** The complete stored summary remains available independently of sources. */
export default function ReadingSummary({ summary, previewChars = 220, featured = false, className = "" }: ReadingSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const full = summary.trim();
  const preview = summaryPreview(full, previewChars);
  const canExpand = preview !== full;
  if (!full) return null;

  return <div className={`relative z-2 ${className}`}>
    <p className="text-[11px] font-mono uppercase tracking-wide text-(--text-secondary)">
      Sift summary{!expanded && preview.endsWith("…") ? " · excerpt" : ""}
    </p>
    <p id={id} className={`text-(--text-secondary) mt-1 leading-relaxed whitespace-pre-line ${featured ? "text-[15px]" : "text-[14px]"}`}>
      {expanded ? full : preview}
    </p>
    {canExpand && <button type="button" aria-expanded={expanded} aria-controls={id}
      onClick={(event) => { event.stopPropagation(); setExpanded(!expanded); }}
      className="mt-2 py-1 bg-transparent border-none text-sm font-semibold text-(--accent) cursor-pointer hover:underline">
      {expanded ? "Show less" : "Read full summary"}<span aria-hidden className="ml-1">{expanded ? "−" : "+"}</span>
    </button>}
  </div>;
}
