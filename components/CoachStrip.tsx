"use client";

import { useEffect, useState } from "react";

import { STORAGE_KEYS } from "@/lib/constants";
import { COPY } from "@/lib/copy";
import { reportError } from "@/lib/observability";

/**
 * First-run coaching: one dismissible sentence above the feed pointing at
 * the two features visitors don't find on their own (primers, compare).
 * Renders nothing after dismissal or on any later visit — the note is a
 * pointer, not a tour, and it never comes back on its own.
 *
 * Starts hidden and flips visible in an effect so SSR/hydration match; the
 * strip fading in a beat after first paint reads as intentional.
 */
export default function CoachStrip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.seenIntro)) setVisible(true);
    } catch {
      // Storage unavailable (private mode) — skip the strip rather than
      // show one that would reappear every visit.
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEYS.seenIntro, "1");
    } catch (err) {
      // The strip stays dismissed for this session but returns next visit.
      reportError("CoachStrip.dismiss", err, { level: "warning" });
    }
  };

  if (!visible) return null;

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
