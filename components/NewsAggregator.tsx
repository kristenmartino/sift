"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CATEGORIES, COMPARE_SOURCES, DEFAULT_COMPARE_SOURCES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { useNewsLoader, useBookmarks, useTheme, useTopicSearch, useCompare } from "@/lib/hooks";
import ArticleCard from "./ArticleCard";
import SkeletonCard from "./SkeletonCard";
import ErrorState from "./ErrorState";
import TopicSearch from "./TopicSearch";
import CompareView from "./CompareView";
import SiftLogo from "./SiftLogo";
import AuthButtons, { clerkEnabled } from "./AuthButtons";
import type { Article, CategoryId } from "@/lib/types";

// ─── Clerk user ID (safe when ClerkProvider absent) ─────

function useClerkUserId(): string | null {
  if (!clerkEnabled) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { userId } = useAuth();
  return userId ?? null;
}

// ─── Component ──────────────────────────────────────────

export default function NewsAggregator() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("top");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareInputValue, setCompareInputValue] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([...DEFAULT_COMPARE_SOURCES]);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  const [refreshed, setRefreshed] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const userId = useClerkUserId();

  const { articles, loading, error, slow, lastUpdated, loadCategory } = useNewsLoader();
  const { bookmarks, toggle: toggleBookmark, count: bookmarkCount } = useBookmarks(userId);
  const { dark: darkMode, toggle: toggleDark, mounted } = useTheme();
  const {
    articles: topicArticles,
    loading: topicLoading,
    error: topicError,
    slow: topicSlow,
    matchQuality,
    fallbackUsed,
    query: topicQuery,
    search: searchTopic,
    clear: clearTopicSearch,
  } = useTopicSearch();

  const {
    topic: compareTopic,
    comparison: compareComparison,
    sourcesChecked: compareSources,
    claims: compareClaims,
    durationMs: compareDuration,
    loading: compareLoading,
    error: compareError,
    slow: compareSlow,
    compare: runCompare,
    clear: clearCompare,
  } = useCompare();

  useEffect(() => {
    loadCategory(activeCategory);
  }, [activeCategory, loadCategory]);

  // Fetch full bookmarked articles from DB when viewing bookmarks (signed in)
  useEffect(() => {
    if (!showBookmarks || !userId) {
      setBookmarkedArticles([]);
      return;
    }
    let cancelled = false;
    setLoadingBookmarks(true);
    fetch("/api/bookmarks?full=1")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { articles: Article[] }) => {
        if (!cancelled) setBookmarkedArticles(data.articles);
      })
      .catch((err) => console.error("Failed to fetch bookmarked articles:", err))
      .finally(() => { if (!cancelled) setLoadingBookmarks(false); });
    return () => { cancelled = true; };
  }, [showBookmarks, userId, bookmarks]);

  const handleRefresh = async () => {
    await loadCategory(activeCategory, true);
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2000);
  };

  const toggleSource = (key: string) => {
    setSelectedSources((prev) => {
      if (prev.includes(key)) return prev.filter((s) => s !== key);
      if (prev.length >= 5) return prev;
      return [...prev, key];
    });
  };

  const selectedLabels = selectedSources
    .map((key) => COMPARE_SOURCES.find((s) => s.key === key)?.label ?? key)
    .join(", ");

  const handleCompare = (topic: string, sources?: string[]) => {
    setCompareMode(true);
    setShowBookmarks(false);
    setSearchMode(false);
    clearTopicSearch();
    runCompare(topic, sources || selectedSources);
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareInputValue("");
    clearCompare();
  };

  const currentArticles = useMemo(() => {
    if (searchMode) {
      return topicArticles;
    }
    if (showBookmarks) {
      // Signed in: use server-fetched articles; signed out: filter loaded ones
      if (userId && bookmarkedArticles.length > 0) {
        return bookmarkedArticles;
      }
      return Object.values(articles).flat().filter((a) => bookmarks.has(a.id));
    }
    return articles[activeCategory] || [];
  }, [articles, activeCategory, showBookmarks, bookmarks, userId, bookmarkedArticles, searchMode, topicArticles]);

  const hasData = currentArticles.length > 0;
  const activeCatLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label;

  return (
    <div
      className="min-h-screen font-body"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* ── Header ──────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-[var(--border)]"
        style={{
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div
            className="flex items-baseline gap-3 cursor-pointer"
            onClick={() => { setShowBookmarks(false); setSearchMode(false); clearTopicSearch(); exitCompareMode(); setActiveCategory("top"); }}
          >
            <SiftLogo variant="full" size={28} />
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--accent)] opacity-80">
              AI-Curated
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowBookmarks(!showBookmarks); setSearchMode(false); clearTopicSearch(); exitCompareMode(); }}
              aria-label="Bookmarks"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 font-body"
              style={{
                background: showBookmarks ? "var(--accent)" : "transparent",
                border: `1px solid ${showBookmarks ? "var(--accent)" : "var(--border)"}`,
                color: showBookmarks ? "#fff" : "var(--text-secondary)",
              }}
            >
              ★ {bookmarkCount}
            </button>

            <button
              onClick={() => {
                setSearchMode(!searchMode);
                setShowBookmarks(false);
                exitCompareMode();
                if (searchMode) clearTopicSearch();
              }}
              aria-label="Search topics"
              className="flex items-center justify-center w-9 h-9 rounded-full border text-base cursor-pointer transition-all duration-200"
              style={{
                background: searchMode ? "var(--accent)" : "transparent",
                color: searchMode ? "#fff" : "var(--text-secondary)",
                borderColor: searchMode ? "var(--accent)" : "var(--border)",
              }}
            >
              ⌕
            </button>

            <button
              onClick={() => {
                if (compareMode) {
                  exitCompareMode();
                } else {
                  setCompareMode(true);
                  setShowBookmarks(false);
                  setSearchMode(false);
                  clearTopicSearch();
                }
              }}
              aria-label="Compare coverage"
              className="flex items-center justify-center w-9 h-9 rounded-full border text-base cursor-pointer transition-all duration-200"
              style={{
                background: compareMode ? "var(--accent)" : "transparent",
                color: compareMode ? "#fff" : "var(--text-secondary)",
                borderColor: compareMode ? "var(--accent)" : "var(--border)",
              }}
            >
              ⇌
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border)] bg-transparent text-base transition-all duration-200"
              style={{
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.5 : 1,
                color: refreshed ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <span className={loading ? "animate-spin-slow inline-block" : "inline-block"}>
                {refreshed ? "✓" : "↻"}
              </span>
            </button>

            {mounted && (
              <button
                onClick={toggleDark}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border)] bg-transparent text-[var(--text-secondary)] text-base cursor-pointer transition-all duration-200"
              >
                {darkMode ? "☀" : "◑"}
              </button>
            )}

            <AuthButtons />
          </div>
        </div>

        {/* Category pills */}
        {!showBookmarks && !searchMode && !compareMode && (
          <div className="max-w-[1200px] mx-auto px-6 pb-3 flex gap-1.5 overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap cursor-pointer transition-all duration-200 font-body"
                  style={{
                    background: active ? "var(--pill-active)" : "transparent",
                    color: active ? "var(--pill-text)" : "var(--text-muted)",
                    border: "1px solid transparent",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span className="text-[10px]">{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Topic search input */}
        {searchMode && (
          <TopicSearch
            onSearch={searchTopic}
            onClose={() => { setSearchMode(false); clearTopicSearch(); }}
            loading={topicLoading}
            matchQuality={matchQuality}
            fallbackUsed={fallbackUsed}
            resultCount={topicArticles.length}
          />
        )}

        {/* Compare input bar */}
        {compareMode && !compareComparison && !compareLoading && (
          <div className="max-w-[1200px] mx-auto px-6 pb-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = compareInputValue.trim();
                if (trimmed.length >= 3 && selectedSources.length >= 2) handleCompare(trimmed, selectedSources);
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={exitCompareMode}
                aria-label="Exit compare"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border)] bg-transparent text-[var(--text-secondary)] text-base cursor-pointer transition-all duration-200 shrink-0"
              >
                &larr;
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={compareInputValue}
                  onChange={(e) => setCompareInputValue(e.target.value)}
                  placeholder={'Compare coverage across sources\u2026 e.g. "Federal Reserve rate decision"'}
                  maxLength={200}
                  autoFocus
                  className="w-full px-4 py-2 pr-12 rounded-full text-sm font-body transition-all duration-200 outline-none"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
                <button
                  type="submit"
                  disabled={compareInputValue.trim().length < 3}
                  aria-label="Compare"
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full text-sm cursor-pointer transition-all duration-200"
                  style={{
                    background: compareInputValue.trim().length >= 3 ? "var(--accent)" : "transparent",
                    color: compareInputValue.trim().length >= 3 ? "#fff" : "var(--text-muted)",
                  }}
                >
                  &rarr;
                </button>
              </div>
            </form>
            <div className="mt-2 ml-11">
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
                    const atMax = selectedSources.length >= 5;
                    const disabled = !isSelected && atMax;
                    return (
                      <button
                        key={source.key}
                        type="button"
                        onClick={() => !disabled && toggleSource(source.key)}
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
                    {selectedSources.length}/5
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="max-w-[1200px] mx-auto px-6 pt-7 pb-20">
        {/* Compare mode */}
        {compareMode ? (
          <>
            {/* Compare loading */}
            {compareLoading && (
              <div className="text-center py-20 px-5 animate-fade-slide-in">
                <div className="text-4xl mb-5 animate-spin-slow inline-block">⇌</div>
                <p className="text-base font-semibold text-[var(--text-secondary)]">
                  Comparing coverage across sources...
                </p>
                {compareSlow && (
                  <p className="text-sm mt-3 text-[var(--text-muted)] animate-fade-slide-in">
                    Searching multiple news outlets — this takes 10–20 seconds
                  </p>
                )}
              </div>
            )}

            {/* Compare error */}
            {compareError && !compareLoading && (
              <ErrorState
                message={compareError}
                onRetry={() => compareTopic && runCompare(compareTopic)}
              />
            )}

            {/* Compare results */}
            {compareComparison && !compareLoading && (
              <CompareView
                topic={compareTopic!}
                comparison={compareComparison}
                sourcesChecked={compareSources}
                claims={compareClaims}
                durationMs={compareDuration!}
                onCompareAnother={handleCompare}
                onClose={exitCompareMode}
                selectedSources={selectedSources}
                onToggleSource={toggleSource}
              />
            )}

            {/* Compare empty state (input shown, no results yet) */}
            {!compareLoading && !compareError && !compareComparison && (
              <div className="text-center py-20 px-5 text-[var(--text-muted)]">
                <div className="text-5xl mb-4 opacity-30">⇌</div>
                <p className="text-base font-semibold text-[var(--text-secondary)]">
                  Multi-Source Comparison
                </p>
                <p className="text-sm mt-2">
                  Enter a topic above to compare how different news outlets cover it
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Section header */}
            <div className="flex justify-between items-baseline mb-7">
              <div>
                <h2 className="font-heading text-[22px] font-bold text-[var(--text)] tracking-tight">
                  {searchMode
                    ? (topicQuery ? `Results for \u201c${topicQuery}\u201d` : "Search Topics")
                    : showBookmarks
                      ? "Saved Articles"
                      : activeCatLabel}
                </h2>
                {lastUpdated && !showBookmarks && !searchMode && (
                  <p className="text-xs mt-1" style={{ color: refreshed ? "var(--accent)" : "var(--text-muted)" }}>
                    {refreshed ? "Updated just now" : `Updated ${timeAgo(lastUpdated.toISOString())}`}
                  </p>
                )}
              </div>
              {hasData && (
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {currentArticles.length} article{currentArticles.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Loading skeleton */}
            {((searchMode ? topicLoading : loading) && !hasData && !(searchMode ? topicError : error)) && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
                  <SkeletonCard featured />
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
                {(searchMode ? topicSlow : slow) && (
                  <p className="text-center mt-6 text-sm text-[var(--text-muted)] animate-fade-slide-in">
                    {searchMode
                      ? "Searching articles\u2026 this may take a moment"
                      : "Still searching\u2026 this can take up to 30 seconds"}
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {(searchMode ? topicError : error) && !(searchMode ? topicLoading : loading) && !hasData && (
              <ErrorState
                message={(searchMode ? topicError : error) || "Something went wrong"}
                onRetry={() =>
                  searchMode && topicQuery
                    ? searchTopic(topicQuery)
                    : loadCategory(activeCategory, true)
                }
              />
            )}

            {/* Empty bookmarks */}
            {showBookmarks && !hasData && !loading && !loadingBookmarks && (
              <div className="text-center py-20 px-5 text-[var(--text-muted)]">
                <div className="text-5xl mb-4 opacity-30">☆</div>
                <p className="text-base font-semibold text-[var(--text-secondary)]">
                  No saved articles yet
                </p>
                <p className="text-sm mt-2">
                  Click the star on any article to save it for later
                </p>
              </div>
            )}

            {/* Articles grid */}
            {hasData && (
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
                {currentArticles.map((article, i) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    featured={i === 0 && !showBookmarks && !searchMode}
                    onBookmark={toggleBookmark}
                    isBookmarked={bookmarks.has(article.id)}
                    index={i}
                    onCompare={handleCompare}
                  />
                ))}
              </div>
            )}

            {/* Loading toast for refresh */}
            {loading && hasData && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--border)] rounded-full px-6 py-2.5 text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2.5 shadow-lg z-50 animate-fade-slide-in">
                <span className="animate-spin-slow inline-block">↻</span>
                Fetching latest stories…
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-6 px-6 text-center text-xs text-[var(--text-muted)] max-w-[1200px] mx-auto">
        <SiftLogo variant="full" size={14} />
        {" — "}AI-curated news powered by Claude. Articles link to original sources.
      </footer>
    </div>
  );
}
