"use client";
import { useEffect, useRef } from "react";
import { trackProductView } from "@/lib/productAnalyticsClient";
import type { ProductProperties } from "@/lib/productAnalytics";

/** A view requires actual viewport exposure in a visible tab, not an API prefetch. */
export default function UsageView({ name, viewKey, properties, children }: {
  name: "feed_viewed" | "comparison_viewed"; viewKey: string;
  properties: ProductProperties; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Primitive dependencies avoid observers resetting on every parent render.
  const { contentId, requestId, surface } = properties;
  useEffect(() => {
    const node = ref.current;
    if (!node || !window.IntersectionObserver) return;
    let exposed = false;
    const record = () => { if (exposed) trackProductView(name, viewKey, { contentId, requestId, surface }); };
    const observer = new IntersectionObserver(([entry]) => {
      exposed = entry.isIntersecting;
      record();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", record);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", record); };
  }, [name, viewKey, contentId, requestId, surface]);
  return <div ref={ref} data-sift-reading-surface={surface}>{children}</div>;
}
