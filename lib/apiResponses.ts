/**
 * Shared JSON responses for the route handlers under app/api.
 *
 * Every route hand-rolled the same four or five `NextResponse.json` shapes —
 * the 401 body, the 429 with its Retry-After arithmetic, the 500 that hides
 * the underlying error. Keeping them here means the wire contract the client
 * parses (`{ error }`, `Retry-After` in whole seconds) is defined once.
 */
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 });
}

export function internalError(error = "Internal server error"): NextResponse {
  return NextResponse.json({ error }, { status: 500 });
}

/** 429 with Retry-After in whole seconds, rounded up. */
export function tooManyRequests(retryAfterMs: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
    }
  );
}

/**
 * Parse and validate a JSON request body, returning either the parsed value or
 * the 400 to send back. Both a malformed body and a schema miss collapse to the
 * same `error` message — routes never leak zod's issue list to the client.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  error: string
): Promise<{ data: T; response?: undefined } | { data?: undefined; response: NextResponse }> {
  try {
    return { data: schema.parse(await request.json()) };
  } catch {
    return { response: badRequest(error) };
  }
}
