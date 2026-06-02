"use client";

import Link from "next/link";
import { useEffect } from "react";

import { COPY } from "@/lib/copy";

/**
 * Global error boundary — catches uncaught throws below the root layout.
 *
 * Next.js App Router requires this be a Client Component because the runtime
 * passes the caught error into a React state hook (`reset`). We use it as a
 * graceful fallback for the dossier routes (politicians/orgs/bills/civic):
 * if a downstream component or DB read panics, the user sees this card
 * instead of Next.js's stock dev/prod error UI.
 *
 * Visual register matches `app/not-found.tsx` for consistency. Speed Insights
 * + Vercel Analytics in `layout.tsx` will still log the navigation; no
 * additional client-side event reporting here (Vercel reports unhandled
 * errors automatically in the runtime telemetry).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console for dev visibility. In prod this is a
    // best-effort log — Vercel's runtime telemetry already captured it
    // server-side with full stack + digest.
    console.error("sift error boundary:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}
    >
      <div className="text-center max-w-[400px]">
        <div
          className="text-[80px] leading-none mb-6 text-(--accent)"
          style={{ opacity: 0.15 }}
          aria-hidden
        >
          &#x25C6;
        </div>
        <p className="font-heading text-xl font-bold text-(--text-secondary) mb-2">
          {COPY.errorBoundary.title}
        </p>
        <p className="text-sm text-(--text-tertiary) leading-relaxed mb-6">
          {COPY.errorBoundary.body}
        </p>
        {error.digest && (
          <p className="font-mono text-[11px] text-(--text-tertiary) mb-6">
            id: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="inline-block bg-(--accent) text-white px-7 py-2.5 rounded-full text-sm font-semibold font-body hover:opacity-90 transition-opacity"
          >
            {COPY.errorBoundary.retry}
          </button>
          <Link
            href="/"
            className="inline-block px-7 py-2.5 rounded-full text-sm font-semibold font-body border border-(--border) text-(--text-secondary) hover:text-(--accent) hover:border-(--accent) transition-colors no-underline"
          >
            {COPY.errorBoundary.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
