"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { STORAGE_KEYS, SLOW_THRESHOLD_MS, API_TIMEOUT_MS } from "./constants";
import type { Article, ArticleCache, CategoryId, NewsApiResponse, TopicSearchResponse } from "./types";

// ─── useLocalStorage ────────────────────────────────────

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {}
  }, [key, stored]);

  return [stored, setStored];
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

  const toggle = useCallback(
    (id: string) => {
      if (isSignedIn) {
        // Optimistic update
        setServerIds((prev) => {
          const set = new Set(prev);
          const removing = set.has(id);
          if (removing) {
            set.delete(id);
          } else {
            set.add(id);
          }
          // Fire API call in background
          fetch("/api/bookmarks", {
            method: removing ? "DELETE" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ articleId: id }),
          }).catch((err) => console.error("Bookmark sync error:", err));
          return [...set];
        });
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
    [isSignedIn, setLocalIds]
  );

  return { bookmarks: bookmarkSet, toggle, count: ids.length };
}

// ─── useTheme ───────────────────────────────────────────

export function useTheme() {
  const [dark, setDark] = useLocalStorage(STORAGE_KEYS.theme, true);
  const toggle = useCallback(() => setDark((d) => !d), [setDark]);
  return { dark, toggle };
}

// ─── useNewsLoader ──────────────────────────────────────

interface NewsLoaderState {
  articles: ArticleCache;
  loading: boolean;
  error: string | null;
  slow: boolean;
  lastUpdated: Date | null;
}

export function useNewsLoader() {
  const [state, setState] = useState<NewsLoaderState>({
    articles: {},
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

      if (data.articles.length === 0) {
        throw new Error("No articles returned");
      }

      setState((s) => ({
        ...s,
        articles: { ...s.articles, [category]: data.articles },
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

// ─── useTopicSearch ──────────────────────────────────────

const TOPIC_TIMEOUT_MS = 30_000;

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

    const slowTimer = setTimeout(
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

      const data: TopicSearchResponse = await res.json();

      if (data.articles.length === 0) {
        throw new Error("No articles found for this topic");
      }

      setState({
        articles: data.articles,
        loading: false,
        error: null,
        slow: false,
        matchQuality: data.matchQuality,
        fallbackUsed: data.fallbackUsed,
        query,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Search timed out. Try a simpler query.",
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
