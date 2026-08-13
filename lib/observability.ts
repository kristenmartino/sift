/**
 * One entry point for "this failed, we handled it, but someone should know".
 *
 * Sentry was wired up (`sentry.*.config.ts`) but only ever received errors that
 * reached `app/global-error.tsx` — i.e. crashes. Every deliberate degrade path
 * (landing lead story missing, outlet map empty, analytics insert dropped)
 * logged to the console at best, so the difference between "prod is fine" and
 * "prod has served an empty homepage for an hour" was invisible.
 *
 * `reportError` keeps the degrade behavior and makes it observable: a structured
 * console line plus a Sentry event tagged with the call site. Sentry stays inert
 * without NEXT_PUBLIC_SENTRY_DSN, and reporting never throws — telemetry must
 * not become the failure it is reporting.
 */
import * as Sentry from "@sentry/nextjs";

export interface ReportErrorOptions {
  /** "error" (default) pages someone; "warning" is best-effort telemetry. */
  level?: "error" | "warning";
  /** Structured context attached to the log line and the Sentry event. */
  extra?: Record<string, unknown>;
}

/**
 * Log a handled error and forward it to Sentry.
 *
 * @param scope Stable identifier for the call site, e.g.
 *              "db.getTopStoryForLanding". Used as the Sentry `scope` tag so
 *              degrade paths can be alerted on individually.
 */
export function reportError(
  scope: string,
  err: unknown,
  options: ReportErrorOptions = {},
): void {
  const { level = "error", extra } = options;

  const log = level === "warning" ? console.warn : console.error;
  if (extra && Object.keys(extra).length > 0) {
    log(`[${scope}]`, err, extra);
  } else {
    log(`[${scope}]`, err);
  }

  try {
    Sentry.captureException(err, {
      level,
      tags: { scope },
      ...(extra ? { extra } : {}),
    });
  } catch {
    // A broken/uninitialized transport must not escalate a handled error into
    // an unhandled one. The console line above is already the durable record.
  }
}
