/**
 * Parse the JSONB context_primer column from Postgres into the canonical
 * ContextPrimer shape, with defensive validation. Returns null for any row
 * whose primer is missing, malformed, or fully empty (so the UI's "no
 * primer data" branch fires).
 *
 * The pipeline (sift-api/services/primer_generator.py) writes:
 *   { background: string, terms: [{ term, definition }], generated_at: ISO }
 *
 * Empty primers (background: "" + terms: []) are NOT persisted — see the
 * primer_generator's _parse_primers and process_primer_batch_results, which
 * skip writes for those. So a non-null primer here always has *something*
 * worth rendering, but we still defend against bad shapes.
 */
import { stripHtml } from "./sanitize";
import type { ContextPrimer, ContextPrimerTerm } from "./types";

export function parseContextPrimer(raw: unknown): ContextPrimer | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const background =
    typeof obj.background === "string" ? stripHtml(obj.background).trim() : "";

  const rawTerms = Array.isArray(obj.terms) ? obj.terms : [];
  const terms: ContextPrimerTerm[] = rawTerms
    .filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null)
    .map((t) => {
      const term = typeof t.term === "string" ? stripHtml(t.term).trim() : "";
      // Tolerate both `definition` (canonical) and `def` (LLM short-key form
      // that occasionally leaks past the parse step in primer_generator).
      const def =
        typeof t.definition === "string"
          ? stripHtml(t.definition).trim()
          : typeof t.def === "string"
            ? stripHtml(t.def).trim()
            : "";
      const source = typeof t.source === "string" ? stripHtml(t.source).trim() : undefined;
      return { term, definition: def, ...(source ? { source } : {}) };
    })
    .filter((t) => t.term && t.definition);

  // If the primer is structurally present but holds nothing renderable,
  // treat as null so the UI hides the affordance entirely.
  if (!background && terms.length === 0) return null;

  const generated_at =
    typeof obj.generated_at === "string" ? obj.generated_at : undefined;

  return {
    background,
    terms,
    ...(generated_at ? { generated_at } : {}),
  };
}
