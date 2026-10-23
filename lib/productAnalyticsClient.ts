"use client";

import { BROWSER_LIFETIME_MS, SESSION_IDLE_MS, type AnalyticsContext, type ProductEvent,
  type ProductEventName, type ProductProperties } from "./productAnalytics";

export const ANALYTICS_STORAGE_KEY = "sift-usage-v1";
export const ANALYTICS_OPTOUT_KEY = "sift-usage-opt-out";
const INTERNAL_KEY = "sift-usage-internal";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
interface Identity {
  browserId: string; createdAt: number; sessionId: string; sessionStartedAt: number;
  lastActivityAt: number; entryPath: AnalyticsContext["entryPath"]; internal: boolean;
}
const seenViews = new Set<string>();

export function usageOptedOut(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true ||
      localStorage.getItem(ANALYTICS_OPTOUT_KEY) === "1";
  } catch { return true; }
}

function allowed(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED !== "true" || usageOptedOut()) {
    try { localStorage.removeItem(ANALYTICS_STORAGE_KEY); } catch { /* unavailable */ }
    return false;
  }
  return true;
}

export function setUsageOptOut(value: boolean): void {
  try {
    localStorage.setItem(ANALYTICS_OPTOUT_KEY, value ? "1" : "0");
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    seenViews.clear();
    window.dispatchEvent(new Event("sift-usage-preference"));
  } catch { /* No writable storage means measurement stays disabled. */ }
}

function entryPath(): AnalyticsContext["entryPath"] {
  const p = window.location.pathname;
  if (p === "/") return "home";
  if (p === "/news") return "news";
  if (/^\/(agencies|bills|orgs|outlets|politicians|terms|think-tanks)(\/|$)/.test(p)) return "context";
  return "other";
}

function send(event: ProductEvent, attempt = 0): void {
  if (!allowed()) return;
  try {
    void fetch("/api/analytics/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event), keepalive: true, credentials: "same-origin",
    }).then((res) => {
      if (res.status >= 500 && attempt === 0) retry(event);
    }).catch(() => { if (attempt === 0) retry(event); });
  } catch { /* Instrumentation must never interrupt reading or navigation. */ }
}
function retry(event: ProductEvent): void {
  // Keep the exact event ID/time/payload so retries cannot inflate counts.
  window.setTimeout(() => send(event, 1), 1000);
}

export function captureAnalyticsContext(): AnalyticsContext | null {
  if (!allowed() || typeof window.crypto?.randomUUID !== "function") return null;
  try {
    const now = Date.now();
    let identity: Identity | null = null;
    try { identity = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) ?? "null"); } catch { /* reset corrupt state */ }
    const valid = identity && UUID.test(identity.browserId) && UUID.test(identity.sessionId) &&
      Number.isFinite(identity.createdAt) && Number.isFinite(identity.lastActivityAt) &&
      Number.isFinite(identity.sessionStartedAt) && identity.createdAt <= now && identity.lastActivityAt <= now &&
      identity.sessionStartedAt <= identity.lastActivityAt && identity.createdAt <= identity.sessionStartedAt &&
      ["home", "news", "context", "other"].includes(identity.entryPath);
    const expiredBrowser = !valid || now - identity!.createdAt >= BROWSER_LIFETIME_MS;
    const internal = localStorage.getItem(INTERNAL_KEY) === "1";
    const newSession = expiredBrowser || now - identity!.lastActivityAt >= SESSION_IDLE_MS || identity!.internal !== internal;
    if (newSession) {
      identity = {
        browserId: expiredBrowser ? crypto.randomUUID() : identity!.browserId,
        createdAt: expiredBrowser ? now : identity!.createdAt,
        sessionId: crypto.randomUUID(), sessionStartedAt: now, lastActivityAt: now,
        entryPath: entryPath(), internal,
      };
    } else { identity!.lastActivityAt = now; }
    // If storage is blocked, emit nothing rather than manufacture a new browser per action.
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(identity));
    const context: AnalyticsContext = {
      browserId: identity!.browserId, sessionId: identity!.sessionId,
      entryPath: identity!.entryPath, internal,
    };
    if (newSession) send({ ...context, eventId: identity!.sessionId,
      eventName: "session_started", schemaVersion: 1,
      occurredAt: new Date(identity!.sessionStartedAt).toISOString(), properties: {} });
    return context;
  } catch { return null; }
}

export function analyticsHeaders(context: AnalyticsContext | null): Record<string, string> {
  return context ? { "x-sift-session-id": context.sessionId } : {};
}

export function trackProductEvent(name: ProductEventName, properties: ProductProperties = {},
  context?: AnalyticsContext | null): void {
  if (!allowed()) return;
  const identity = context === undefined ? captureAnalyticsContext() : context;
  if (!identity) return;
  try { send({ ...identity, eventName: name, eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(), schemaVersion: 1, properties }); } catch { /* best effort */ }
}

export function trackProductView(name: "feed_viewed" | "comparison_viewed", key: string, properties: ProductProperties): void {
  if (document.visibilityState !== "visible") return;
  const context = captureAnalyticsContext();
  if (!context) return;
  const id = `${context.sessionId}:${name}:${key}`;
  if (seenViews.has(id)) return;
  if (seenViews.size > 1000) seenViews.clear();
  seenViews.add(id);
  trackProductEvent(name, properties, context);
}
