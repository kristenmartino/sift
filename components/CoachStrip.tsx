"use client";

import { useState, useSyncExternalStore } from "react";

import { STORAGE_KEYS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { reportError } from "@/lib/observability";

/**
 * First-run coaching: one dismissible sentence above the feed pointing at
 * the two features visitors don't find on their own (primers, compare).
 * Renders nothing after dismissal or on any later visit — the note is a
 * pointer, not a tour, and it never comes back on its own.
 *
 * Renders nothing on the server and on the hydrating render, then appears a
 * beat after first paint — reading it any earlier would need localStorage
 * during SSR. localStorage is an external store, so that is
 * `useSyncExternalStore` rather than a setState in an effect: the server
 * snapshot says "seen" (render nothing, matching the SSR markup) and the
 * first client snapshot after hydration reads the real value. Same shape as
 * `useTheme` in lib/hooks.ts.
 */

// Never fires: the flag cannot change under us within a session — a dismissal
// goes through `dismissed` below, which is ordinary React state.
const subscribeSeenIntro = () => () => {};

function readSeenIntro(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.seenIntro) !== null;
  } catch {
    // Storage unavailable (private mode) — report it as seen, so we skip the
    // strip rather than show one that would reappear every single visit.
    return true;
  }
}

export default function CoachStrip() {
  const seenIntro = useSyncExternalStore(
    subscribeSeenIntro,
    readSeenIntro,
    () => true,
  );
  const [dismissed, setDismissed] = useState(false);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEYS.seenIntro, "1");
    } catch (err) {
      // The strip stays dismissed for this session but returns next visit.
      reportError("CoachStrip.dismiss", err, { level: "warning" });
    }
  };

  if (seenIntro || dismissed) return null;

  return (
    <div className="animate-fade-slide-in mb-5 flex items-center justify-between gap-3 rounded-[12px] border border-(--border) bg-(--surface-raised) px-4 py-3">
      <p className="text-sm text-(--text-secondary) leading-relaxed">
        <span className="text-(--accent) mr-2" aria-hidden>
          ◆
        </span>
        {COPY.coach.body}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={COPY.coach.dismissAria}
        className="shrink-0 px-3 py-1 rounded-full border border-(--border) bg-transparent font-body text-[12px] text-(--text-secondary) cursor-pointer transition-colors duration-200 hover:border-(--accent) hover:text-(--accent)"
      >
        {COPY.coach.dismiss}
      </button>
    </div>
  );
}
