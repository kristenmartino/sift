import * as Sentry from "@sentry/nextjs";

// Error monitoring is OPT-IN: inert unless NEXT_PUBLIC_SENTRY_DSN is set, so
// local dev and unconfigured environments send nothing. The DSN is public
// (safe to expose), so the same value drives client + server + edge.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // No PII: don't attach request bodies, headers, cookies, or IPs.
    sendDefaultPii: false,
    // Conservative tracing: light sampling in prod, full in dev.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}
