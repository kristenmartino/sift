"use client";

import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from "react";
import { STORAGE_KEYS, SLOW_THRESHOLD_MS, API_TIMEOUT_MS, MAX_CUSTOM_TOPICS } from "./constants";
import type { Article, ArticleCache, StoryCache, CategoryId, CustomTopic, NewsApiResponse, CompareResponse, CompareClaim, CompareSourceDone, SSEResultsEvent, SSEDoneEvent, SSEErrorEvent } from "./types";
import { reportError } from "./observability";
import { readSSE } from "./sse";

// ─── useLocalStorage ────────────────────────────────────

// localStorage is an external store, so the hook is built on
// useSyncExternalStore: the server snapshot is the caller's default (matching
// the SSR markup), and the first client snapshot after hydration reads the
// real value. The cache keyed on the raw string keeps snapshots referentially
// stable, which useSyncExternalStore's tear check requires.
const lsListeners = new Set<() => void>();
const lsCache = new Map<string, { raw: string | null; value: unknown }>();

// Storage failures were swallowed entirely. They are not cosmetic: for a
// signed-out reader, bookmarks and custom topics live only in localStorage, so
// a rejected write (Safari private mode, quota exhausted) loses data the UI has
// already told them was saved. Reported once per key + operation, because the
// failing conditions repeat on every access and a per-keystroke event stream is
// worse than no signal at all.
const reportedStorageFailures = new Set<string>();

function reportStorageFailure(
  operation: "read" | "write" | "parse",
  key: string,
  err: unknown,
): void {
  const dedupeKey = `${operation}:${key}`;
  if (reportedStorageFailures.has(dedupeKey)) return;
  reportedStorageFailures.add(dedupeKey);
  reportError(`hooks.localStorage.${operation}`, err, {
    level: "warning",
    extra: { key },
  });
}

function subscribeLocalStorage(cb: () => void) {
  lsListeners.add(cb);
  return () => {
    lsListeners.delete(cb);
  };
}

function readLocalStorage<T>(key: string, initialValue: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch (err) {
    reportStorageFailure("read", key, err);
  }
  const cached = lsCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T = initialValue;
  if (raw !== null) {
    try {
      value = JSON.parse(raw);
    } catch (err) {
      // Corrupt entry: the caller silently gets the default, which for
      // bookmarks reads as "all your bookmarks vanished". Worth knowing about.
      reportStorageFailure("parse", key, err);
    }
  }
  lsCache.set(key, { raw, value });
  return value;
}

// Stable defaults for the call sites below — getServerSnapshot must return
// one identity, not a fresh literal per render.
const EMPTY_IDS: string[] = [];
const EMPTY_TOPICS: CustomTopic[] = [];

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const stored = useSyncExternalStore(
    subscribeLocalStorage,
    () => readLocalStorage(key, initialValue),
    () => initialValue
  );

  // Custom setter that also persists to localStorage
  const setValue = useCallback(
    (val: T | ((prev: T) => T)) => {
      const prev = readLocalStorage(key, initialValue);
      const next = val instanceof Function ? val(prev) : val;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        reportStorageFailure("write", key, err);
      }
      // Cache against what storage actually holds, so a failed write still
      // keeps `next` in memory for this session.
      let raw: string | null = null;
      try {
        raw = localStorage.getItem(key);
      } catch (err) {
        reportStorageFailure("read", key, err);
      }
      lsCache.set(key, { raw, value: next });
      lsListeners.forEach((l) => l());
    },
    [key, initialValue]
  );

  return [stored, setValue];
}

// ─── useCopyToClipboard ─────────────────────────────────

/**
 * Clipboard write plus a self-clearing "copied" flag for button label swaps.
 * `copy` resolves false when the Clipboard API is unavailable (plain http,
 * old WebViews) so callers can leave their label alone rather than claim a
 * copy that didn't happen.
 */
export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false;
      }
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
      return true;
    },
    [resetMs]
  );

  return { copied, copy };
}

// ─── useBookmarks ───────────────────────────────────────

export function useBookmarks(userId?: string | null) {
  // localStorage fallback for signed-out users
  const [localIds, setLocalIds] = useLocalStorage<string[]>(STORAGE_KEYS.bookmarks, EMPTY_IDS);

  // Server truth, keyed by the user it was fetched for — sign-out (or a user
  // switch) makes it derive as unsynced instead of resetting state in an effect.
  const [serverState, setServerState] = useState<{ userId: string; ids: string[] } | null>(null);

  const isSignedIn = !!userId;

  // Fetch bookmarks from API on mount when signed in
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch("/api/bookmarks")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { ids: string[] }) => {
        if (!cancelled) setServerState({ userId, ids: data.ids });
      })
      .catch((err) => reportError("hooks.useBookmarks.fetch", err));
    return () => { cancelled = true; };
  }, [userId]);

  const server = userId && serverState !== null && serverState.userId === userId ? serverState : null;
  const ids = server ? server.ids : localIds;
  const bookmarkSet = useMemo(() => new Set(ids), [ids]);

  const pendingRef = useRef<Set<string>>(new Set());

  const toggle = useCallback(
    (id: string) => {
      if (isSignedIn) {
        // Prevent concurrent operations on the same bookmark
        if (pendingRef.current.has(id)) return;
        pendingRef.current.add(id);

        const wasBookmarked = bookmarkSet.has(id);
        const applyToServer = (add: boolean) =>
          setServerState((prev) => {
            if (!prev) return prev;
            const set = new Set(prev.ids);
            if (add) {
              set.add(id);
            } else {
              set.delete(id);
            }
            return { ...prev, ids: [...set] };
          });

        // Optimistic update
        applyToServer(!wasBookmarked);
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
            reportError("hooks.useBookmarks.sync", err);
            // Revert optimistic update
            applyToServer(wasBookmarked);
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

// The theme lives outside React: the blocking script in <head> stamps
// data-theme on <html> before first paint, and toggling rewrites that
// attribute plus localStorage. useSyncExternalStore reads that external
// state; the server snapshot stays dark to match the server render.
const themeListeners = new Set<() => void>();

function subscribeTheme(cb: () => void) {
  themeListeners.add(cb);
  return () => {
    themeListeners.delete(cb);
  };
}

function readDarkFromDom(): boolean {
  return document.documentElement.dataset.theme !== "light";
}

// Never fires — `mounted` only distinguishes server (false) from client (true).
const subscribeMounted = () => () => {};

export function useTheme() {
  const dark = useSyncExternalStore(subscribeTheme, readDarkFromDom, () => true);
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);

  const toggle = useCallback(() => {
    const next = document.documentElement.dataset.theme === "light";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(next));
    } catch (err) {
      reportStorageFailure("write", STORAGE_KEYS.theme, err);
    }
    themeListeners.forEach((l) => l());
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

  const loadCategory = useCallback(async (category: CategoryId, force = false) => {
    // Ensure refs are the correct type (HMR can preserve stale values)
    if (!(fetchedRef.current instanceof Set)) fetchedRef.current = new Set();
    if (!(inflightRef.current instanceof Map)) inflightRef.current = new Map();

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
    EMPTY_TOPICS
  );
  // Server truth, keyed by user — same derived-sync shape as useBookmarks.
  const [serverState, setServerState] = useState<{ userId: string; topics: CustomTopic[] } | null>(null);

  const isSignedIn = !!userId;

  // Fetch from server on mount when signed in
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch("/api/topics")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { topics: CustomTopic[] }) => {
        if (!cancelled) setServerState({ userId, topics: data.topics });
      })
      .catch((err) => reportError("hooks.useCustomTopics.fetch", err));
    return () => { cancelled = true; };
  }, [userId]);

  const server = userId && serverState !== null && serverState.userId === userId ? serverState : null;
  const topics = server ? server.topics : localTopics;

  const add = useCallback(
    (topic: CustomTopic) => {
      if (topics.length >= MAX_CUSTOM_TOPICS) return;

      if (isSignedIn) {
        setServerState((prev) => (prev ? { ...prev, topics: [...prev.topics, topic] } : prev));
        // A non-2xx response resolves the promise, so `.catch` alone let every
        // rejected save (over-limit, invalid, 500) look like a success until the
        // next page load dropped the topic. Check the status and roll back.
        fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
          })
          .catch((err) => {
            reportError("hooks.useCustomTopics.add", err);
            setServerState((prev) =>
              prev
                ? { ...prev, topics: prev.topics.filter((t) => t.id !== topic.id) }
                : prev
            );
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
        const removed = topics.find((t) => t.id === id);
        setServerState((prev) => (prev ? { ...prev, topics: prev.topics.filter((t) => t.id !== id) } : prev));
        fetch("/api/topics", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
          })
          .catch((err) => {
            reportError("hooks.useCustomTopics.remove", err);
            // Put it back: the row still exists server-side, and hiding it
            // means the topic reappears unexplained on the next load.
            if (removed) {
              setServerState((prev) =>
                prev && !prev.topics.some((t) => t.id === id)
                  ? { ...prev, topics: [...prev.topics, removed] }
                  : prev
              );
            }
          });
      } else {
        setLocalTopics((prev) => prev.filter((t) => t.id !== id));
      }
    },
    [isSignedIn, setLocalTopics, topics]
  );

  return {
    topics,
    add,
    remove,
    canAdd: topics.length < MAX_CUSTOM_TOPICS,
  };
}

// ─── useCompare ─────────────────────────────────────────

// ≥ the /api/compare proxy's maxDuration (60s); the proxy returns a clean 504
// by ~55s. Compare runs ~20–30s, up to ~55s before the proxy gives up.
const COMPARE_TIMEOUT_MS = 65_000;
const COMPARE_SLOW_MS = 8_000;
// Elapsed-time stage cuts matched to the workflow's typical shape: per-source
// search fans out first (~20s), claim extraction next, response formatting
// last. The lines describe what the pipeline does at that point — they never
// claim a specific outlet finished, which the client can't know pre-SSE.
const COMPARE_STAGE_CLAIMS_MS = 22_000;
const COMPARE_STAGE_SUMMARY_MS = 38_000;

interface CompareState {
  topic: string | null;
  comparison: string | null;
  sourcesChecked: string[];
  claims: CompareClaim[];
  durationMs: number | null;
  loading: boolean;
  error: string | null;
  slow: boolean;
  /** 0 = searching sources, 1 = extracting claims, 2 = writing the summary. */
  stage: 0 | 1 | 2;
  /** Real per-source completions from the SSE stream; empty on the JSON path. */
  sourcesDone: CompareSourceDone[];
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
    stage: 0,
    sourcesDone: [],
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
      stage: 0,
      sourcesDone: [],
    });

    // Once real SSE events arrive, the timed stage estimates stand down —
    // the stream knows what the pipeline is actually doing.
    const streamed = { current: false };

    const slowTimer = setTimeout(
      () => setState((s) => ({ ...s, slow: true })),
      COMPARE_SLOW_MS
    );
    const stageClaimsTimer = setTimeout(
      () =>
        setState((s) => (s.loading && !streamed.current ? { ...s, stage: 1 } : s)),
      COMPARE_STAGE_CLAIMS_MS
    );
    const stageSummaryTimer = setTimeout(
      () =>
        setState((s) => (s.loading && !streamed.current ? { ...s, stage: 2 } : s)),
      COMPARE_STAGE_SUMMARY_MS
    );
    const timeoutTimer = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);

    const applyResults = (data: CompareResponse) => {
      setState({
        topic: data.topic,
        comparison: data.comparison,
        sourcesChecked: data.sources_checked,
        claims: data.claims,
        durationMs: data.duration_ms,
        loading: false,
        error: null,
        slow: false,
        stage: 0,
        sourcesDone: [],
      });
    };

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ topic, sources }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream") && res.body) {
        // Streaming path: stage + per-source events are real, so the loading
        // screen can show outlets finishing one by one.
        let gotResults = false;
        for await (const { event, data } of readSSE<Record<string, unknown>>(res)) {
          streamed.current = true;
          if (event === "stage") {
            const stage = (data as { stage?: string }).stage;
            setState((s) => ({
              ...s,
              stage: stage === "summary" ? 2 : stage === "claims" ? 1 : s.stage,
            }));
          } else if (event === "source-done") {
            const done = data as unknown as CompareSourceDone;
            setState((s) => ({ ...s, sourcesDone: [...s.sourcesDone, done] }));
          } else if (event === "results") {
            gotResults = true;
            applyResults(data as unknown as CompareResponse);
          } else if (event === "error") {
            throw new Error(
              String((data as { message?: string }).message || "Comparison failed")
            );
          }
        }
        if (!gotResults) {
          throw new Error("Comparison failed");
        }
      } else {
        // JSON fallback (older deploys, or the proxy declined to stream).
        const data: CompareResponse = await res.json();
        applyResults(data);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // clear() nulls the ref and a rerun replaces it, both before this
        // rejection lands; the timeout abort leaves it in place. A user
        // exiting compare mode or starting over is not an error.
        if (controllerRef.current !== controller) return;
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
      clearTimeout(stageClaimsTimer);
      clearTimeout(stageSummaryTimer);
      clearTimeout(timeoutTimer);
      // Only release the ref if this invocation still owns it — a superseding
      // run's controller must not be nulled by the run it replaced.
      if (controllerRef.current === controller) controllerRef.current = null;
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
      stage: 0,
      sourcesDone: [],
    });
  }, []);

  return { ...state, compare, clear };
}
