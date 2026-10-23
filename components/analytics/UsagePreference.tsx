"use client";
import { useSyncExternalStore } from "react";
import { setUsageOptOut, usageOptedOut } from "@/lib/productAnalyticsClient";
const subscribe = (cb: () => void) => {
  window.addEventListener("sift-usage-preference", cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener("sift-usage-preference", cb); window.removeEventListener("storage", cb); };
};
export default function UsagePreference() {
  const off = useSyncExternalStore(subscribe, usageOptedOut, () => true);
  return <button type="button" className="text-(--accent) underline cursor-pointer"
    onClick={() => setUsageOptOut(!off)}>
    {off ? "Allow usage measurement on this browser" : "Turn off usage measurement on this browser"}
  </button>;
}
