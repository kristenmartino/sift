"use client";

import { useState, useRef, useEffect } from "react";
import { ShareButton } from "@/components/ShareActions";
import { COMPARE_SOURCES } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import type { CompareClaim } from "@/lib/types";

const MAX_SOURCES = 5;
const MIN_SOURCES = 2;

interface CompareViewProps {
  topic: string;
  comparison: string;
  sourcesChecked: string[];
  claims: CompareClaim[];
  durationMs: number;
  onCompareAnother: (topic: string, sources: string[]) => void;
  onClose: () => void;
  selectedSources: string[];
  onToggleSource: (key: string) => void;
}

// Agreement chips ride the status tokens (globals.css) so both themes hold \u2014
// claim agreement is a different axis from political lean, so color is fine
// here. For/Against below stays neutral ink: coloring outlets green/red on a
// disputed claim would visually score them right/wrong, the exact move the
// no-hue-coding rule exists to prevent.
const AGREEMENT_STYLES: Record<string, { label: string; color: string; dot: string }> = {
  unanimous: {
    label: COPY.compare.agreement.unanimous,
    color: "var(--success)",
    dot: "\u25CF",
  },
  majority: {
    label: COPY.compare.agreement.majority,
    color: "var(--info)",
    dot: "\u25D2",
  },
  disputed: {
    label: COPY.compare.agreement.disputed,
    color: "var(--warning)",
    dot: "\u25C6",
  },
  unique: {
    label: COPY.compare.agreement.unique,
    color: "var(--text-tertiary)",
    dot: "\u25CB",
  },
};

// Disputed first \u2014 the cross-spectrum disagreement is the whole point of the
// feature, so it leads. The backend sorts the same way; this is the defensive
// mirror for cached or older responses.
const AGREEMENT_ORDER: Record<string, number> = {
  disputed: 0,
  majority: 1,
  unanimous: 2,
  unique: 3,
};

export default function CompareView({
  topic,
  comparison,
  sourcesChecked,
  claims,
  durationMs,
  onCompareAnother,
  onClose,
  selectedSources,
  onToggleSource,
}: CompareViewProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const selectedLabels = selectedSources
    .map((key) => COMPARE_SOURCES.find((s) => s.key === key)?.label ?? key)
    .join(", ");

  const sortedClaims = [...claims].sort(
    (a, b) => (AGREEMENT_ORDER[a.agreement] ?? 4) - (AGREEMENT_ORDER[b.agreement] ?? 4)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length >= 3 && selectedSources.length >= MIN_SOURCES) {
      onCompareAnother(trimmed, selectedSources);
      setInputValue("");
    }
  };

  return (
    <div className="animate-fade-slide-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {/* bookmark-pop is the completion moment — the user just waited
                ~20 seconds; the badge landing with a spring is the "done". */}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide animate-bookmark-pop"
              style={{
                background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                color: "var(--accent)",
                border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
              }}
            >
              {COPY.compare.badge}
            </span>
          </div>
          <h2 className="font-heading text-[22px] font-bold text-(--text-primary) tracking-tight">
            {topic}
          </h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-(--text-tertiary)">
            <span>{COPY.compare.metaSources(sourcesChecked.length)}</span>
            <span className="opacity-30">&middot;</span>
            <span>{(durationMs / 1000).toFixed(1)}s</span>
            <span className="opacity-30">&middot;</span>
            <span>{COPY.compare.metaClaims(claims.length)}</span>
          </div>
          <p className="text-[11px] text-(--text-tertiary) mt-1.5 italic">
            {COPY.compare.liveNote}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <ShareButton title={topic} />
          <button
            onClick={onClose}
            aria-label="Close comparison"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-(--border) bg-transparent text-(--text-secondary) text-base cursor-pointer transition-all duration-200 shrink-0"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Sources */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {sourcesChecked.map((source) => (
          <span
            key={source}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {source}
          </span>
        ))}
      </div>

      {/* Summary card */}
      <div
        className="rounded-[14px] p-6 mb-6"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
        }}
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-(--text-tertiary) mb-3">
          {COPY.compare.summary}
        </h3>
        <p className="text-[15px] leading-relaxed text-(--text-secondary)">
          {comparison}
        </p>
      </div>

      {/* Claims */}
      <div className="space-y-3 mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-(--text-tertiary) mb-1">
          {COPY.compare.keyClaims}
        </h3>
        {sortedClaims.map((claim, i) => {
          const style = AGREEMENT_STYLES[claim.agreement] || AGREEMENT_STYLES.unique;
          const isDisputed = claim.agreement === "disputed";
          const isExpanded = expandedClaim === i;
          const hasDetails = isDisputed && (claim.sources_for?.length || claim.sources_against?.length);

          return (
            <div
              key={i}
              className="rounded-[12px] p-4 transition-all duration-200"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                cursor: hasDetails ? "pointer" : "default",
                // Staggered entrance — the claims land one after another,
                // the earned payoff after a 20-second wait.
                animation: "fade-slide-in 0.5s var(--ease-out-expo) both",
                animationDelay: `${i * 60}ms`,
              }}
              onClick={() => hasDetails && setExpandedClaim(isExpanded ? null : i)}
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0 mt-0.5"
                  style={{
                    fontSize: "10px",
                    background: `color-mix(in srgb, ${style.color} 10%, transparent)`,
                    color: style.color,
                    border: `1px solid color-mix(in srgb, ${style.color} 22%, transparent)`,
                  }}
                >
                  {style.dot} {style.label}
                </span>
                <p className="text-sm text-(--text-primary) leading-relaxed flex-1">
                  {claim.claim}
                </p>
                {hasDetails && (
                  <span
                    className="text-xs text-(--text-tertiary) shrink-0 mt-0.5 transition-transform duration-200"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    ▸
                  </span>
                )}
              </div>

              {/* Disputed details */}
              {isExpanded && isDisputed && (
                <div
                  className="mt-3 pt-3 border-t border-(--border) text-xs space-y-1.5"
                  style={{
                    animation: "story-expand 0.3s ease-out both",
                    overflow: "hidden",
                  }}
                >
                  {/* Neutral ink on both labels — green-For/red-Against
                      visually scored outlets right/wrong on a disputed
                      claim. Label + position carry the difference, same
                      rule as LeanGlyph. */}
                  {claim.sources_for && claim.sources_for.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-(--text-primary)">
                        {COPY.compare.for}
                      </span>
                      <span className="text-(--text-secondary)">
                        {claim.sources_for.join(", ")}
                      </span>
                    </div>
                  )}
                  {claim.sources_against && claim.sources_against.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-(--text-primary)">
                        {COPY.compare.against}
                      </span>
                      <span className="text-(--text-secondary)">
                        {claim.sources_against.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Non-disputed source list */}
              {!isDisputed && claim.sources && claim.sources.length > 0 && (
                <div className="mt-2 ml-[calc(--spacing(2)+(--spacing(0))+1px)] text-[11px] text-(--text-tertiary)">
                  {claim.sources.join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compare another topic */}
      <div
        className="rounded-[14px] p-5"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
        }}
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-(--text-tertiary) mb-3">
          {COPY.compare.another}
        </h3>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={COPY.compare.anotherPlaceholder}
            maxLength={200}
            className="flex-1 px-4 py-2 rounded-full text-sm font-body transition-all duration-200 outline-hidden"
            style={{
              background: "var(--surface-base)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={inputValue.trim().length < 3 || selectedSources.length < MIN_SOURCES}
            aria-label="Compare"
            className="flex items-center justify-center w-9 h-9 rounded-full text-sm cursor-pointer transition-all duration-200 shrink-0"
            style={{
              background: inputValue.trim().length >= 3 && selectedSources.length >= MIN_SOURCES ? "var(--accent)" : "transparent",
              color: inputValue.trim().length >= 3 && selectedSources.length >= MIN_SOURCES ? "#fff" : "var(--text-tertiary)",
              border: `1px solid ${inputValue.trim().length >= 3 && selectedSources.length >= MIN_SOURCES ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            &rarr;
          </button>
        </form>

        {/* Source picker */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
            className="text-xs text-(--text-tertiary) cursor-pointer bg-transparent border-none p-0 transition-colors duration-200"
            style={{ color: sourcesExpanded ? "var(--accent)" : undefined }}
          >
            Comparing: {selectedLabels} {sourcesExpanded ? "▴" : "▾"}
          </button>
          {sourcesExpanded && (
            <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-slide-in">
              {COMPARE_SOURCES.map((source) => {
                const isSelected = selectedSources.includes(source.key);
                const atMax = selectedSources.length >= MAX_SOURCES;
                const disabled = !isSelected && atMax;
                return (
                  <button
                    key={source.key}
                    type="button"
                    onClick={() => !disabled && onToggleSource(source.key)}
                    aria-disabled={disabled || undefined}
                    tabIndex={disabled ? -1 : undefined}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-200 border"
                    style={{
                      background: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected ? "#fff" : disabled ? "var(--text-tertiary)" : "var(--text-secondary)",
                      borderColor: isSelected ? "var(--accent)" : "var(--border)",
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {source.label}
                  </button>
                );
              })}
              <span className="text-[10px] text-(--text-tertiary) self-center ml-1">
                {selectedSources.length}/{MAX_SOURCES} selected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
