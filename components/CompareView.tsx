"use client";

import { useState, useRef, useEffect } from "react";
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

const AGREEMENT_STYLES: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
  unanimous: {
    label: "All agree",
    bg: "rgba(5,150,105,0.1)",
    color: "#059669",
    border: "rgba(5,150,105,0.2)",
    dot: "\u25CF",
  },
  majority: {
    label: "Mostly agree",
    bg: "rgba(37,99,235,0.1)",
    color: "#2563eb",
    border: "rgba(37,99,235,0.2)",
    dot: "\u25D2",
  },
  disputed: {
    label: "Disputed",
    bg: "rgba(217,119,6,0.1)",
    color: "#d97706",
    border: "rgba(217,119,6,0.2)",
    dot: "\u25C6",
  },
  unique: {
    label: "Unique angle",
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.2)",
    dot: "\u25CB",
  },
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
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
              style={{
                background: "rgba(99,102,241,0.1)",
                color: "var(--accent)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              {COPY.compare.emptyTitle}
            </span>
          </div>
          <h2 className="font-heading text-[22px] font-bold text-[var(--text)] tracking-tight">
            {topic}
          </h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
            <span>{sourcesChecked.length} sources checked</span>
            <span className="opacity-30">&middot;</span>
            <span>{(durationMs / 1000).toFixed(1)}s</span>
            <span className="opacity-30">&middot;</span>
            <span>{claims.length} claims analyzed</span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close comparison"
          className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border)] bg-transparent text-[var(--text-secondary)] text-base cursor-pointer transition-all duration-200 shrink-0 mt-1"
        >
          &times;
        </button>
      </div>

      {/* Sources */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {sourcesChecked.map((source) => (
          <span
            key={source}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              background: "var(--card-bg)",
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
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
        }}
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
          Summary
        </h3>
        <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {comparison}
        </p>
      </div>

      {/* Claims */}
      <div className="space-y-3 mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
          Key Claims
        </h3>
        {claims.map((claim, i) => {
          const style = AGREEMENT_STYLES[claim.agreement] || AGREEMENT_STYLES.unique;
          const isDisputed = claim.agreement === "disputed";
          const isExpanded = expandedClaim === i;
          const hasDetails = isDisputed && (claim.sources_for?.length || claim.sources_against?.length);

          return (
            <div
              key={i}
              className="rounded-[12px] p-4 transition-all duration-200"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                cursor: hasDetails ? "pointer" : "default",
              }}
              onClick={() => hasDetails && setExpandedClaim(isExpanded ? null : i)}
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0 mt-0.5"
                  style={{
                    fontSize: "10px",
                    background: style.bg,
                    color: style.color,
                    border: `1px solid ${style.border}`,
                  }}
                >
                  {style.dot} {style.label}
                </span>
                <p className="text-sm text-[var(--text)] leading-relaxed flex-1">
                  {claim.claim}
                </p>
                {hasDetails && (
                  <span
                    className="text-xs text-[var(--text-muted)] shrink-0 mt-0.5 transition-transform duration-200"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    ▸
                  </span>
                )}
              </div>

              {/* Disputed details */}
              {isExpanded && isDisputed && (
                <div
                  className="mt-3 pt-3 border-t border-[var(--border)] text-xs space-y-1.5"
                  style={{
                    animation: "story-expand 0.3s ease-out both",
                    overflow: "hidden",
                  }}
                >
                  {claim.sources_for && claim.sources_for.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold" style={{ color: "#059669" }}>For:</span>
                      <span className="text-[var(--text-secondary)]">
                        {claim.sources_for.join(", ")}
                      </span>
                    </div>
                  )}
                  {claim.sources_against && claim.sources_against.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold" style={{ color: "#dc2626" }}>Against:</span>
                      <span className="text-[var(--text-secondary)]">
                        {claim.sources_against.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Non-disputed source list */}
              {!isDisputed && claim.sources && claim.sources.length > 0 && (
                <div className="mt-2 ml-[calc(theme(spacing.2)+theme(spacing.0.5)+1px)] text-[11px] text-[var(--text-muted)]">
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
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
        }}
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
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
            className="flex-1 px-4 py-2 rounded-full text-sm font-body transition-all duration-200 outline-none"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            type="submit"
            disabled={inputValue.trim().length < 3 || selectedSources.length < MIN_SOURCES}
            aria-label="Compare"
            className="flex items-center justify-center w-9 h-9 rounded-full text-sm cursor-pointer transition-all duration-200 shrink-0"
            style={{
              background: inputValue.trim().length >= 3 && selectedSources.length >= MIN_SOURCES ? "var(--accent)" : "transparent",
              color: inputValue.trim().length >= 3 && selectedSources.length >= MIN_SOURCES ? "#fff" : "var(--text-muted)",
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
            className="text-xs text-[var(--text-muted)] cursor-pointer bg-transparent border-none p-0 transition-colors duration-200"
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
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-200 border"
                    style={{
                      background: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected ? "#fff" : disabled ? "var(--text-muted)" : "var(--text-secondary)",
                      borderColor: isSelected ? "var(--accent)" : "var(--border)",
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {source.label}
                  </button>
                );
              })}
              <span className="text-[10px] text-[var(--text-muted)] self-center ml-1">
                {selectedSources.length}/{MAX_SOURCES} selected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
