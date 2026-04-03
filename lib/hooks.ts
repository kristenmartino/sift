"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { STORAGE_KEYS, SLOW_THRESHOLD_MS, API_TIMEOUT_MS, MAX_CUSTOM_TOPICS } from "./constants";
import type { Article, Story, ArticleCache, StoryCache, CategoryId, CustomTopic, NewsApiResponse, CompareResponse, CompareClaim, SSEResultsEvent, SSEDoneEvent, SSEErrorEvent } from "./types";
import { readSSE } from "./sse";

// ─── useLocalStorage ────────────────────────────────────

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  // Always initialize with default to avoid SSR/client hydration mismatch.
  // localStorage is read in useEffect after hydration.
  const [stored, setStored] = useState<T>(initialValue);

  // Sync from localStorage after hydration (client-only)
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) setStored(JSON.parse(item));
    } catch {}
  }, [key]);

  // Custom setter that also persists to localStorage
  const setValue = useCallback(
    (val: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = val instanceof Function ? val(prev) : val;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}

// ─── useBookmarks ───────────────────────────────────────

export function useBookmarks(userId?: string | null) {
  // localStorage fallback for signed-out users
  const [localIds, setLocalIds] = useLocalStorage<string[]>(STORAGE_KEYS.bookmarks, []);

  // Server-synced state for signed-in users
  const [serverIds, setServerIds] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);

  const isSignedIn = !!userId;

  // Fetch bookmarks from API on mount when signed in
  useEffect(() => {
    if (!isSignedIn) {
      setSynced(false);
      return;
    }
    let cancelled = false;
    fetch("/api/bookmarks")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { ids: string[] }) => {
        if (!cancelled) {
          setServerIds(data.ids);
          setSynced(true);
        }
      })
      .catch((err) => console.error("Failed to fetch bookmarks:", err));
    return () => { cancelled = true; };
  }, [isSignedIn]);

  const ids = isSignedIn && synced ? serverIds : localIds;
  const bookmarkSet = useMemo(() => new Set(ids), [ids]);

  const pendingRef = useRef<Set<string>>(new Set());

  const toggle = useCallback(
    (id: string) => {
      if (isSignedIn) {
        // Prevent concurrent operations on the same bookmark
        if (pendingRef.current.has(id)) return;
        pendingRef.current.add(id);

        // Optimistic update
        const wasBookmarked = bookmarkSet.has(id);
        setServerIds((prev) => {
          const set = new Set(prev);
          if (wasBookmarked) {
            set.delete(id);
          } else {
            set.add(id);
          }
          return [...set];
        });
        // Fire API call in background — revert on failure
        fetch("/api/bookmarks", {
          method: wasBookmarked ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId: id }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
          })
          .catch((err) => {
            console.error("Bookmark sync error:", err);
            // Revert optimistic update
            setServerIds((prev) => {
              const set = new Set(prev);
              if (wasBookmarked) {
                set.add(id);
              } else {
                set.delete(id);
              }
              return [...set];
            });
          })
          .finally(() => pendingRef.current.delete(id));
      } else {
        setLocalIds((prev) => {
          const set = new Set(prev);
          if (set.has(id)) {
            set.delete(id);
          } else {
            set.add(id);
          }
          return [...set];
        });
      }
    },
    [isSignedIn, setLocalIds, bookmarkSet]
  );

  return { bookmarks: bookmarkSet, toggle, count: ids.length };
}

// ─── useTheme ───────────────────────────────────────────

export function useTheme() {
  // Always initialize as dark to match server render — prevents hydration mismatch.
  // The blocking script in <head> already set the correct data-theme on <html>,
  // so CSS variables are correct from first paint. This state only drives the toggle icon.
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  // After hydration, read actual theme from the DOM (set by blocking script)
  useEffect(() => {
    setDark(document.documentElement.dataset.theme !== "light");
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { dark, toggle, mounted };
}

// ─── useNewsLoader ──────────────────────────────────────

interface NewsLoaderState {
  articles: ArticleCache;
  stories: StoryCache;
  loading: boolean;
  error: string | null;
  slow: boolean;
  lastUpdated: Date | null;
}

export function useNewsLoader() {
  const [state, setState] = useState<NewsLoaderState>({
    articles: {},
    stories: {},
    loading: false,
    error: null,
    slow: false,
    lastUpdated: null,
  });
  const fetchedRef = useRef(new Set<string>());
  const inflightRef = useRef(new Map<string, AbortController>());

  // Ensure refs are the correct type (HMR can preserve stale values)
  if (!(fetchedRef.current instanceof Set)) fetchedRef.current = new Set();
  if (!(inflightRef.current instanceof Map)) inflightRef.current = new Map();

  const loadCategory = useCallback(async (category: CategoryId, force = false) => {
    if (!force && fetchedRef.current.has(category)) return;

    const existingController = inflightRef.current.get(category);
    if (existingController) {
      if (force) {
        existingController.abort();
        inflightRef.current.delete(category);
      } else {
        // If already fetching this category and not forced, don't duplicate
        return;
      }
    }

    const controller = new AbortController();
    inflightRef.current.set(category, controller);

    setState((s) => ({ ...s, loading: true, error: null, slow: false }));

    const slowTimer = setTimeout(
      () => setState((s) => ({ ...s, slow: true })),
      SLOW_THRESHOLD_MS
    );
    const timeoutTimer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await fetch(`/api/news?category=${category}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data: NewsApiResponse = await res.json();

      if (data.articles.length === 0 && (!data.stories || data.stories.length === 0)) {
        throw new Error("No articles returned");
      }

      setState((s) => ({
        ...s,
        articles: { ...s.articles, [category]: data.articles },
        stories: { ...s.stories, [category]: data.stories || [] },
        lastUpdated: new Date(data.fetchedAt),
      }));
      fetchedRef.current.add(category);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setState((s) => ({
          ...s,
          error: "Request timed out. Please try again.",
        }));
        return; // Aborted by timeout
      }
      const message = err instanceof Error ? err.message : "Failed to load articles";
      setState((s) => ({ ...s, error: message }));
    } finally {
      inflightRef.current.delete(category);
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
      setState((s) => ({
        ...s,
        loading: inflightRef.current.size > 0,
        slow: inflightRef.current.size > 0 ? s.slow : false,
      }));
    }
  }, []);

  return { ...state, loadCategory };
}

// ─── useTopicSearch (SSE streaming) ─────────────────────

const TOPIC_TIMEOUT_MS = 45_000; // Longer — Claude web search fallback can take 15-20s

interface TopicSearchState {
  articles: Article[];
  loading: boolean;
  error: string | null;
  slow: boolean;
  matchQuality: "strong" | "weak" | null;
  fallbackUsed: boolean;
  query: string | null;
}

export function useTopicSearch() {
  const [state, setState] = useState<TopicSearchState>({
    articles: [],
    loading: false,
    error: null,
    slow: false,
    matchQuality: null,
    fallbackUsed: false,
    query: null,
  });
  const controllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setState({
      articles: [],
      loading: true,
      error: null,
      slow: false,
      matchQuality: null,
      fallbackUsed: false,
      query,
    });

    let slowTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => setState((s) => ({ ...s, slow: true })),
      SLOW_THRESHOLD_MS
    );
    const timeoutTimer = setTimeout(() => controller.abort(), TOPIC_TIMEOUT_MS);

    try {
      const res = await fetch(
        `/api/news/topic?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      // Consume SSE stream — articles arrive incrementally
      let receivedAny = false;
      for await (const { event, data } of readSSE(res)) {
        if (controller.signal.aborted) break;

        switch (event) {
          case "results": {
            const d = data as SSEResultsEvent;
            receivedAny = receivedAny || d.articles.length > 0;
            setState((s) => ({
              ...s,
              articles: [...s.articles, ...d.articles],
              slow: false, // Got results, clear slow indicator
            }));
            break;
          }
          case "fallback-start":
            // Keep loading, reset slow timer for fallback phase
            setState((s) => ({ ...s, slow: false }));
            clearTimeout(slowTimer);
            slowTimer = setTimeout(
              () => setState((s) => (s.loading ? { ...s, slow: true } : s)),
              SLOW_THRESHOLD_MS
            );
            break;
          case "done": {
            const d = data as SSEDoneEvent;
            setState((s) => ({
              ...s,
              loading: false,
              slow: false,
              matchQuality: d.matchQuality,
              fallbackUsed: d.fallbackUsed,
            }));
            break;
          }
          case "error": {
            const d = data as SSEErrorEvent;
            setState((s) => ({
              ...s,
              loading: false,
              slow: false,
              error: d.message,
            }));
            break;
          }
        }
      }

      // If stream ended without any articles
      if (!receivedAny) {
        setState((s) =>
          s.loading
            ? {
                ...s,
                loading: false,
                slow: false,
                error: "No articles found for this topic. Try a different search.",
              }
            : s
        );
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setState((s) => ({
          ...s,
          loading: false,
          error: s.articles.length > 0 ? null : "Search timed out. Try a simpler query.",
          slow: false,
        }));
        return;
      }
      const message = err instanceof Error ? err.message : "Search failed";
      setState((s) => ({ ...s, loading: false, error: message, slow: false }));
    } finally {
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
      controllerRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({
      articles: [],
      loading: false,
      error: null,
      slow: false,
      matchQuality: null,
      fallbackUsed: false,
      query: null,
    });
  }, []);

  return { ...state, search, clear };
}

// ─── useCustomTopics ────────────────────────────────────

export function useCustomTopics(userId?: string | null) {
  const [localTopics, setLocalTopics] = useLocalStorage<CustomTopic[]>(
    STORAGE_KEYS.customTopics,
    []
  );
  const [serverTopics, setServerTopics] = useState<CustomTopic[]>([]);
  const [synced, setSynced] = useState(false);

  const isSignedIn = !!userId;

  // Fetch from server on mount when signed in
  useEffect(() => {
    if (!isSignedIn) {
      setSynced(false);
      return;
    }
    let cancelled = false;
    fetch("/api/topics")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { topics: CustomTopic[] }) => {
        if (!cancelled) {
          setServerTopics(data.topics);
          setSynced(true);
        }
      })
      .catch((err) => console.error("Failed to fetch custom topics:", err));
    return () => { cancelled = true; };
  }, [isSignedIn]);

  const topics = isSignedIn && synced ? serverTopics : localTopics;

  const add = useCallback(
    (topic: CustomTopic) => {
      if (topics.length >= MAX_CUSTOM_TOPICS) return;

      if (isSignedIn) {
        setServerTopics((prev) => [...prev, topic]);
        fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        }).then((res) => {
          if (!res.ok) {
            // Rollback optimistic update on failure
            setServerTopics((prev) => prev.filter((t) => t.id !== topic.id));
            console.error("Topic save failed:", res.status);
          }
        }).catch((err) => {
          setServerTopics((prev) => prev.filter((t) => t.id !== topic.id));
          console.error("Topic save error:", err);
        });
      } else {
        setLocalTopics((prev) => [...prev, topic]);
      }
    },
    [isSignedIn, topics.length, setLocalTopics]
  );

  const remove = useCallback(
    (id: string) => {
      if (isSignedIn) {
        const snapshot = serverTopics;
        setServerTopics((prev) => prev.filter((t) => t.id !== id));
        fetch("/api/topics", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }).then((res) => {
          if (!res.ok) {
            // Rollback: restore the removed topic
            setServerTopics(snapshot);
            console.error("Topic delete failed:", res.status);
          }
        }).catch((err) => {
          setServerTopics(snapshot);
          console.error("Topic delete error:", err);
        });
      } else {
        setLocalTopics((prev) => prev.filter((t) => t.id !== id));
      }
    },
    [isSignedIn, serverTopics, setLocalTopics]
  );

  return {
    topics,
    add,
    remove,
    canAdd: topics.length < MAX_CUSTOM_TOPICS,
  };
}

// ─── useCompare ─────────────────────────────────────────

const COMPARE_TIMEOUT_MS = 65_000; // Multi-source search can take 20-30s
const COMPARE_SLOW_MS = 8_000;

interface CompareState {
  topic: string | null;
  comparison: string | null;
  sourcesChecked: string[];
  claims: CompareClaim[];
  durationMs: number | null;
  loading: boolean;
  error: string | null;
  slow: boolean;
}

export function useCompare() {
  const [state, setState] = useState<CompareState>({
    topic: null,
    comparison: null,
    sourcesChecked: [],
    claims: [],
    durationMs: null,
    loading: false,
    error: null,
    slow: false,
  });
  const controllerRef = useRef<AbortController | null>(null);

  const compare = useCallback(async (topic: string, sources?: string[]) => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setState({
      topic,
      comparison: null,
      sourcesChecked: [],
      claims: [],
      durationMs: null,
      loading: true,
      error: null,
      slow: false,
    });

    const slowTimer = setTimeout(
      () => setState((s) => ({ ...s, slow: true })),
      COMPARE_SLOW_MS
    );
    const timeoutTimer = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, sources }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data: CompareResponse = await res.json();

      setState({
        topic: data.topic,
        comparison: data.comparison,
        sourcesChecked: data.sources_checked,
        claims: data.claims,
        durationMs: data.duration_ms,
        loading: false,
        error: null,
        slow: false,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Comparison timed out. Try a more specific topic.",
          slow: false,
        }));
        return;
      }
      const message = err instanceof Error ? err.message : "Comparison failed";
      setState((s) => ({ ...s, loading: false, error: message, slow: false }));
    } finally {
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
      controllerRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({
      topic: null,
      comparison: null,
      sourcesChecked: [],
      claims: [],
      durationMs: null,
      loading: false,
      error: null,
      slow: false,
    });
  }, []);

  return { ...state, compare, clear };
}
