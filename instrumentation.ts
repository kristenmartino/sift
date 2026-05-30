import * as Sentry from "@sentry/nextjs";

// Sentry server/edge initialization. The runtime-specific config (and its
// DSN gate) lives in sentry.server.config.ts / sentry.edge.config.ts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture errors thrown in nested React Server Components (Next.js 15 hook).
export const onRequestError = Sentry.captureRequestError;
