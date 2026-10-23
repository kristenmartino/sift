/** Versioned first-party usage events. No search text, URLs, IPs or auth IDs. */

export const PRODUCT_EVENTS = [
  "session_started", "feed_viewed", "search_submitted", "search_completed",
  "comparison_requested", "comparison_completed", "comparison_viewed",
  "explainer_expanded", "source_opened",
] as const;
export type ProductEventName = typeof PRODUCT_EVENTS[number];
export const ENTRY_PATHS = ["home", "news", "context", "other"] as const;
export interface ProductProperties {
  contentId?: string; requestId?: string;
  surface?: "feed" | "bookmarks" | "search" | "custom_topic" | "live_compare" | "daily_compare" | "landing";
  resultCount?: number; latencyMs?: number;
  status?: "success" | "error" | "cancelled" | "timeout" | "incomplete";
}
export interface ProductEvent {
  eventId: string; schemaVersion: 1; occurredAt: string; browserId: string; sessionId: string;
  eventName: ProductEventName; entryPath: typeof ENTRY_PATHS[number]; internal: boolean;
  properties: ProductProperties;
}
export type AnalyticsContext = Pick<ProductEvent, "browserId" | "sessionId" | "entryPath" | "internal">;
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const BROWSER_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;
