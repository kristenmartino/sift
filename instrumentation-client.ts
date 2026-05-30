import * as Sentry from "@sentry/nextjs";

// Browser-side Sentry init. Inert unless NEXT_PUBLIC_SENTRY_DSN is set. No PII,
// no Session Replay, no User Feedback, no profiling/logs — error monitoring
// only, with conservative performance sampling.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

// Instrument App Router client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
