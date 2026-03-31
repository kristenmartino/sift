"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CATEGORIES, COMPARE_SOURCES, CATEGORY_COMPARE_DEFAULTS, DEFAULT_COMPARE_SOURCES, CUSTOM_TOPIC_COLORS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/utils";
import { useNewsLoader, useBookmarks, useTheme, useTopicSearch, useCompare, useCustomTopics } from "@/lib/hooks";
import ArticleCard from "./ArticleCard";
import StoryCard from "./StoryCard";
import SkeletonCard from "./SkeletonCard";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import TopicSearch from "./TopicSearch";
import TopicModal from "./TopicModal";
import CompareView from "./CompareView";
import SiftLogo from "./SiftLogo";
import AuthButtons, { clerkEnabled } from "./AuthButtons";
import type { Article, CustomTopic, FeedItem, CategoryId } from "@/lib/types";

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

  const [activeCustomTopic, setActiveCustomTopic] = useState<CustomTopic | null>(null);
  const [showTopicModal, setShowTopicModal] = useState(false);

  const [categoryFading, setCategoryFading] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const pillContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const userId = useClerkUserId();

  const { articles, stories, loading, error, slow, lastUpdated, loadCategory } = useNewsLoader();
  const { bookmarks, toggle: toggleBookmark, count: bookmarkCount } = useBookmarks(userId);
  const { topics: customTopics, add: addCustomTopic, remove: removeCustomTopic, canAdd: canAddTopic } = useCustomTopics(userId);
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

  // Category switch with fade-out/fade-in
  const switchCategory = useCallback((catId: CategoryId) => {
    if (catId === activeCategory && !activeCustomTopic) return;
    setCategoryFading(true);
    setTimeout(() => {
      setActiveCategory(catId);
      setActiveCustomTopic(null);
      clearTopicSearch();
      setCategoryFading(false);
    }, 120);
  }, [activeCategory, activeCustomTopic, clearTopicSearch]);

  // Switch to a custom topic
  const switchToCustomTopic = useCallback((topic: CustomTopic) => {
    if (activeCustomTopic?.id === topic.id) return;
    setCategoryFading(true);
    setTimeout(() => {
      setActiveCustomTopic(topic);
      setCategoryFading(false);
      // Search using the first query (most specific)
      searchTopic(topic.searchQueries[0]);
    }, 120);
  }, [activeCustomTopic, searchTopic]);

  // Position the sliding indicator under the active pill
  const updateIndicator = useCallback(() => {
    const container = pillContainerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>("[data-active='true']");
    if (!activeBtn) { setIndicatorStyle(null); return; }
    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setIndicatorStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, []);

  useEffect(() => {
    updateIndicator();
  }, [activeCategory, activeCustomTopic, showBookmarks, searchMode, compareMode, updateIndicator]);

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
    if (activeCustomTopic) {
      searchTopic(activeCustomTopic.searchQueries[0]);
    } else {
      await loadCategory(activeCategory, true);
    }
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

  const startCompare = (topic: string, sources: string[]) => {
    setCompareMode(true);
    setShowBookmarks(false);
    setSearchMode(false);
    clearTopicSearch();
    runCompare(topic, sources);
  };

  const handleCompareFromArticle = (topic: string, sourceName?: string) => {
    // Start with category-aware defaults
    const categoryDefaults = CATEGORY_COMPARE_DEFAULTS[activeCategory] || DEFAULT_COMPARE_SOURCES;
    let sources = [...categoryDefaults];

    // Ensure the article's own source is included
    if (sourceName) {
      const nameLower = sourceName.toLowerCase();
      const alreadyIncluded = sources.some((key) => {
        const cs = COMPARE_SOURCES.find((s) => s.key === key);
        if (cs) return nameLower.includes(cs.key) || cs.key.includes(nameLower) || nameLower === cs.label.toLowerCase();
        return key === nameLower;
      });
      if (!alreadyIncluded) {
        const match = COMPARE_SOURCES.find(
          (s) => nameLower.includes(s.key) || s.key.includes(nameLower) || nameLower === s.label.toLowerCase()
        );
        sources = [match?.key || nameLower, ...sources].slice(0, 5);
      }
    }

    setSelectedSources(sources);
    startCompare(topic, sources);
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareInputValue("");
    clearCompare();
  };

  const customTopicMode = !!activeCustomTopic;

  const currentArticles = useMemo((): Article[] => {
    if (searchMode || customTopicMode) {
      return topicArticles;
    }
    if (showBookmarks) {
      if (userId && bookmarkedArticles.length > 0) {
        return bookmarkedArticles;
      }
      return Object.values(articles).flat().filter((a) => bookmarks.has(a.id));
    }
    return articles[activeCategory] || [];
  }, [articles, activeCategory, showBookmarks, bookmarks, userId, bookmarkedArticles, searchMode, customTopicMode, topicArticles]);

  // Build feed items: stories + standalone articles, sorted by date
  const feedItems = useMemo((): FeedItem[] => {
    // Stories only apply to category view (not bookmarks/search/custom topics)
    if (searchMode || showBookmarks || customTopicMode) {
      return currentArticles.map((a) => ({ type: "article" as const, data: a }));
    }

    const categoryStories = stories[activeCategory] || [];
    const items: FeedItem[] = [
      ...categoryStories.map((s) => ({ type: "story" as const, data: s })),
      ...currentArticles.map((a) => ({ type: "article" as const, data: a })),
    ];

    // Sort by published date descending
    items.sort((a, b) => {
      const dateA = a.type === "story" ? a.data.publishedDate : a.data.publishedDate;
      const dateB = b.type === "story" ? b.data.publishedDate : b.data.publishedDate;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return items;
  }, [currentArticles, stories, activeCategory, searchMode, showBookmarks, customTopicMode]);

  const hasData = feedItems.length > 0;
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
            onClick={() => { setShowBookmarks(false); setSearchMode(false); clearTopicSearch(); exitCompareMode(); setActiveCustomTopic(null); setActiveCategory("top"); }}
          >
            <SiftLogo variant="full" size={28} />
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--accent)] opacity-80">
              {COPY.header.tagline}
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
                  setSelectedSources([...(CATEGORY_COMPARE_DEFAULTS[activeCategory] || DEFAULT_COMPARE_SOURCES)]);
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
              <span className={loading ? "animate-sift-refresh inline-block" : "inline-block"}>
                {refreshed ? "✓" : loading ? "◆" : "↻"}
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

        {/* Category pills with sliding indicator */}
        {!showBookmarks && !searchMode && !compareMode && (
          <div ref={pillContainerRef} className="max-w-[1200px] mx-auto px-6 pb-3 flex gap-1.5 overflow-x-auto relative">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id && !activeCustomTopic;
              return (
                <button
                  key={cat.id}
                  data-active={active}
                  onClick={() => switchCategory(cat.id)}
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

            {/* Custom topic pills */}
            {customTopics.map((topic) => {
              const active = activeCustomTopic?.id === topic.id;
              const color = CUSTOM_TOPIC_COLORS[topic.colorIndex % CUSTOM_TOPIC_COLORS.length];
              return (
                <button
                  key={`custom-${topic.id}`}
                  data-active={active}
                  onClick={() => switchToCustomTopic(topic)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap cursor-pointer transition-all duration-200 font-body group relative"
                  style={{
                    background: active ? color.hex : "transparent",
                    color: active ? "#fff" : "var(--text-muted)",
                    border: active ? `1px solid ${color.hex}` : `1px solid rgba(${color.rgb}, 0.25)`,
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span className="text-[10px]">{topic.icon}</span>
                  {topic.shortLabel}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeCustomTopic?.id === topic.id) {
                        setActiveCustomTopic(null);
                        clearTopicSearch();
                      }
                      removeCustomTopic(topic.id);
                    }}
                    className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity duration-150 ml-0.5 cursor-pointer"
                    style={{ color: active ? "#fff" : "var(--text-muted)" }}
                  >
                    &times;
                  </span>
                </button>
              );
            })}

            {/* Add topic button */}
            {canAddTopic && (
              <button
                onClick={() => setShowTopicModal(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full text-sm cursor-pointer transition-all duration-200 shrink-0"
                style={{
                  background: "transparent",
                  border: "1px dashed var(--border)",
                  color: "var(--text-muted)",
                }}
                aria-label="Add custom topic"
              >
                +
              </button>
            )}

            {/* Sliding indicator under active pill */}
            {indicatorStyle && (
              <div
                className="absolute bottom-0 h-[2px] rounded-full"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  background: activeCustomTopic
                    ? CUSTOM_TOPIC_COLORS[activeCustomTopic.colorIndex % CUSTOM_TOPIC_COLORS.length].hex
                    : "var(--accent)",
                  transition: "left 0.3s cubic-bezier(0.16,1,0.3,1), width 0.3s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            )}
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
                if (trimmed.length >= 3 && selectedSources.length >= 2) startCompare(trimmed, selectedSources);
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
                  placeholder={COPY.compare.placeholder}
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
                <div className="text-4xl mb-5 animate-sift-refresh inline-block text-[var(--accent)]">◆</div>
                <p className="text-base font-semibold text-[var(--text-secondary)]">
                  {COPY.compare.loading}
                </p>
                {compareSlow && (
                  <p className="text-sm mt-3 text-[var(--text-muted)] animate-fade-slide-in">
                    {COPY.compare.slow}
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
                onCompareAnother={startCompare}
                onClose={exitCompareMode}
                selectedSources={selectedSources}
                onToggleSource={toggleSource}
              />
            )}

            {/* Compare empty state (input shown, no results yet) */}
            {!compareLoading && !compareError && !compareComparison && (
              <EmptyState
                title={COPY.compare.emptyTitle}
                body={COPY.compare.emptyBody}
              />
            )}
          </>
        ) : (
          <>
            {/* Section header */}
            <div className="flex justify-between items-baseline mb-7">
              <div>
                <h2 className="font-heading text-[22px] font-bold text-[var(--text)] tracking-tight">
                  {searchMode
                    ? (topicQuery ? COPY.search.resultsFor(topicQuery) : COPY.articles.searchTopics)
                    : showBookmarks
                      ? COPY.bookmarks.title
                      : activeCustomTopic
                        ? `${activeCustomTopic.icon} ${activeCustomTopic.shortLabel}`
                        : activeCatLabel}
                </h2>
                {activeCustomTopic && (
                  <p className="text-xs mt-1 text-[var(--text-muted)]">
                    {activeCustomTopic.description}
                  </p>
                )}
                {lastUpdated && !showBookmarks && !searchMode && !customTopicMode && (
                  <p className="text-xs mt-1" style={{ color: refreshed ? "var(--accent)" : "var(--text-muted)" }}>
                    {refreshed ? COPY.articles.updated : `Updated ${timeAgo(lastUpdated.toISOString())}`}
                  </p>
                )}
              </div>
              {hasData && (
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {feedItems.length} item{feedItems.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Loading skeleton */}
            {(((searchMode || customTopicMode) ? topicLoading : loading) && !hasData && !((searchMode || customTopicMode) ? topicError : error)) && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
                  <SkeletonCard featured />
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
                {((searchMode || customTopicMode) ? topicSlow : slow) && (
                  <p className="text-center mt-6 text-sm text-[var(--text-muted)] animate-fade-slide-in">
                    {(searchMode || customTopicMode)
                      ? COPY.loading.slowTopic
                      : COPY.loading.slow}
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {((searchMode || customTopicMode) ? topicError : error) && !((searchMode || customTopicMode) ? topicLoading : loading) && !hasData && (
              <ErrorState
                message={((searchMode || customTopicMode) ? topicError : error) || COPY.error.body}
                onRetry={() =>
                  activeCustomTopic
                    ? searchTopic(activeCustomTopic.searchQueries[0])
                    : searchMode && topicQuery
                      ? searchTopic(topicQuery)
                      : loadCategory(activeCategory, true)
                }
              />
            )}

            {/* Empty bookmarks */}
            {showBookmarks && !hasData && !loading && !loadingBookmarks && (
              <EmptyState
                title={COPY.bookmarks.emptyTitle}
                body={COPY.bookmarks.emptyBody}
              />
            )}

            {/* Empty custom topic results */}
            {customTopicMode && !topicLoading && !topicError && !hasData && (
              <EmptyState
                title={COPY.articles.emptyTitle}
                body={COPY.articles.emptyBody}
              />
            )}

            {/* Empty search results */}
            {searchMode && !customTopicMode && !topicLoading && !topicError && !hasData && topicQuery && (
              <EmptyState
                title={COPY.searchEmpty.title}
                body={COPY.searchEmpty.body}
                action={{ label: COPY.searchEmpty.button, onClick: () => { setSearchMode(false); clearTopicSearch(); } }}
              />
            )}

            {/* Feed grid — fades on category switch */}
            {hasData && (
              <div
                className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5"
                style={{
                  transition: "opacity 0.12s ease-out, transform 0.12s ease-out",
                  opacity: categoryFading ? 0 : 1,
                  transform: categoryFading ? "translateY(4px)" : "translateY(0)",
                }}
              >
                {feedItems.map((item, i) =>
                  item.type === "story" ? (
                    <StoryCard
                      key={`story-${item.data.id}`}
                      story={item.data}
                      featured={i === 0 && !showBookmarks && !searchMode && !customTopicMode}
                      onBookmark={toggleBookmark}
                      bookmarks={bookmarks}
                      index={i}
                      onCompare={handleCompareFromArticle}
                    />
                  ) : (
                    <ArticleCard
                      key={item.data.id}
                      article={item.data}
                      featured={i === 0 && !showBookmarks && !searchMode && !customTopicMode}
                      onBookmark={toggleBookmark}
                      isBookmarked={bookmarks.has(item.data.id)}
                      index={i}
                      onCompare={handleCompareFromArticle}
                    />
                  )
                )}
              </div>
            )}

            {/* Loading toast for refresh */}
            {loading && hasData && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--border)] rounded-full px-6 py-2.5 text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2.5 shadow-lg z-50 animate-fade-slide-in">
                <span className="animate-sift-refresh inline-block text-[var(--accent)]">◆</span>
                {COPY.loading.refresh}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Topic Modal ─────────────────────────────── */}
      {showTopicModal && (
        <TopicModal
          onClose={() => setShowTopicModal(false)}
          onAdd={(topic) => {
            addCustomTopic(topic);
            setShowTopicModal(false);
            // Switch to the new topic immediately
            setTimeout(() => switchToCustomTopic(topic), 150);
          }}
          existingTopics={customTopics}
          colorIndex={customTopics.length}
        />
      )}

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-6 px-6 text-center text-xs text-[var(--text-muted)] max-w-[1200px] mx-auto">
        <SiftLogo variant="full" size={14} />
        {" \u2014 "}{COPY.footer.main}
      </footer>
    </div>
  );
}
