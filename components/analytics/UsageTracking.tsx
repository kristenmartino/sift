"use client";
import { useEffect } from "react";
import type { ProductProperties } from "@/lib/productAnalytics";
import { captureAnalyticsContext, trackProductEvent } from "@/lib/productAnalyticsClient";

/** Starts visits on every route. All readers use pseudonymous browser IDs, never Clerk IDs. */
export default function UsageTracking() {
  useEffect(() => {
    let lastActivityWrite = 0;
    const activity = () => {
      if (document.visibilityState === "visible" && Date.now() - lastActivityWrite >= 1000) {
        captureAnalyticsContext();
        lastActivityWrite = Date.now();
      }
    };
    const click = (event: MouseEvent) => {
      if ((event.type === "click" && event.button !== 0) || (event.type === "auxclick" && event.button !== 1)) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-sift-source-id]") : null;
      if (target?.href && /^https?:/.test(target.href)) {
        const surface = target.dataset.siftSourceSurface ?? target.closest<HTMLElement>("[data-sift-reading-surface]")?.dataset.siftReadingSurface;
        const valid = ["landing", "feed", "bookmarks", "search", "custom_topic"].includes(surface ?? "");
        trackProductEvent("source_opened", { contentId: target.dataset.siftSourceId,
          surface: valid ? surface as ProductProperties["surface"] : "feed" });
      }
    };
    activity();
    document.addEventListener("visibilitychange", activity);
    document.addEventListener("pointerdown", activity, { passive: true });
    document.addEventListener("keydown", activity);
    document.addEventListener("scroll", activity, { passive: true });
    document.addEventListener("click", click, true);
    document.addEventListener("auxclick", click, true);
    return () => {
      document.removeEventListener("visibilitychange", activity);
      document.removeEventListener("pointerdown", activity);
      document.removeEventListener("keydown", activity);
      document.removeEventListener("scroll", activity);
      document.removeEventListener("click", click, true);
      document.removeEventListener("auxclick", click, true);
    };
  }, []);
  return null;
}
