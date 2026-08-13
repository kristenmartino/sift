/**
 * Helpers for reading JSON back out of Claude text blocks.
 *
 * Models fence their JSON in ```json blocks despite being told not to, so
 * every call site that asks for JSON has to strip the fence before parsing.
 * Doing it in one place keeps the tolerance identical across routes.
 */

/** Strips ```json / ``` fences and surrounding whitespace. */
export function stripJsonFences(text: string): string {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

/** Parses a fenced-or-bare JSON payload; null when it isn't valid JSON. */
export function parseJsonFromModel<T>(text: string): T | null {
  try {
    return JSON.parse(stripJsonFences(text)) as T;
  } catch {
    return null;
  }
}
