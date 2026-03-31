"use client";

import { useState, useRef, useEffect } from "react";
import { COPY } from "@/lib/copy";

interface TopicSearchProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  loading: boolean;
  matchQuality: "strong" | "weak" | null;
  fallbackUsed: boolean;
  resultCount: number;
}

export default function TopicSearch({
  onSearch,
  onClose,
  loading,
  matchQuality,
  fallbackUsed,
  resultCount,
}: TopicSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length >= 2) {
      onSearch(trimmed);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit search"
          className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border)] bg-transparent text-[var(--text-secondary)] text-base cursor-pointer transition-all duration-200 shrink-0"
        >
          ←
        </button>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={COPY.search.placeholder}
            maxLength={200}
            className="w-full px-4 py-2 pr-12 rounded-full text-sm font-body transition-all duration-200 outline-none"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            type="submit"
            disabled={loading || inputValue.trim().length < 2}
            aria-label="Search"
            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full text-sm cursor-pointer transition-all duration-200"
            style={{
              background:
                inputValue.trim().length >= 2 ? "var(--accent)" : "transparent",
              color:
                inputValue.trim().length >= 2 ? "#fff" : "var(--text-muted)",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? (
              <span className="animate-spin-slow inline-block">↻</span>
            ) : (
              "→"
            )}
          </button>
        </div>
      </form>

      {matchQuality && (
        <div className="flex items-center gap-3 mt-2 ml-11 text-xs text-[var(--text-muted)] animate-fade-slide-in">
          {resultCount > 0 ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
              style={{
                fontSize: "10px",
                background:
                  matchQuality === "strong"
                    ? "rgba(5,150,105,0.1)"
                    : "rgba(217,119,6,0.1)",
                color: matchQuality === "strong" ? "#059669" : "#d97706",
                border: `1px solid ${
                  matchQuality === "strong"
                    ? "rgba(5,150,105,0.2)"
                    : "rgba(217,119,6,0.2)"
                }`,
              }}
            >
              {matchQuality === "strong" ? "●" : "○"} {matchQuality} match
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">
              {COPY.search.noResults}
            </span>
          )}
          {fallbackUsed && (
            <span className="text-[var(--text-muted)] italic">
              {resultCount === 0
                ? COPY.search.fallbackSearching
                : COPY.search.fallbackUsed}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
