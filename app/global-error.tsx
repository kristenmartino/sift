"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Catches errors that escape the root layout, where app/error.tsx can't reach.
// When Sentry is configured (NEXT_PUBLIC_SENTRY_DSN set) the error is reported;
// otherwise this is just a minimal fallback. Kept dependency-free since the
// root layout / theme may itself have failed.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h2>Something went wrong</h2>
        <p>Please reload the page. If it keeps happening, try again shortly.</p>
      </body>
    </html>
  );
}
