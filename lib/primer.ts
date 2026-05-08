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

/**
 * Phase 3.G.4 — link primer terms to dossiers via the article's existing
 * entity_links surface forms.
 *
 * The primer LLM picks domain-jargon (filibuster, chilling effect, basis
 * points). The entity-linker (separate Phase 3.G pipeline node) picks
 * proper-noun mentions of curated entities (FCC, Reuters, Schumer, IRA).
 * Many primer terms contain or equal an entity surface form: "FCC
 * petition" contains "FCC"; "FOMC dissenters" contains nothing curated.
 *
 * For each primer term, scan the article's entity_links. If the term
 * contains an entity's surfaceForm (case-insensitive, word-boundary), tag
 * the term with that entity's `{type, canonicalId}` so the UI can render
 * a click-through to the dossier. Mutates a shallow copy — the input
 * primer is not modified.
 *
 * Why post-process rather than ask the LLM:
 * - Reuses the entity-linker work we already paid for.
 * - Zero additional LLM cost.
 * - The LLM stays focused on its core job (picking jargon for definition);
 *   the linking is mechanical lookup.
 *
 * Limits: misses nicknames the LLM didn't use ("the Speaker" → Mike
 * Johnson) and partial mentions the entity-linker missed. Acceptable
 * MVP trade-off — the entity-linker pass already handles those cases
 * downstream as separate chips.
 */
export function attachPrimerTermLinks(
  primer: ContextPrimer | null,
  entityLinks: import("./types").EntityLink[],
): ContextPrimer | null {
  if (!primer || entityLinks.length === 0) return primer;

  // De-dupe surface forms by their entity ref so we don't waste regex passes
  // on multiple chips that resolve to the same dossier.
  const refs: Array<{
    surfaceForm: string;
    type: import("./types").EntityLinkType;
    canonicalId: string;
  }> = [];
  const seen = new Set<string>();
  for (const link of entityLinks) {
    const surface = link.surfaceForm.trim();
    if (!surface) continue;
    const key = `${link.type}:${link.canonicalId}:${surface.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({
      surfaceForm: surface,
      type: link.type,
      canonicalId: link.canonicalId,
    });
  }
  // Longer surfaces first so "Federal Reserve" wins over "Reserve" when both
  // are in the catalog.
  refs.sort((a, b) => b.surfaceForm.length - a.surfaceForm.length);

  const linkedTerms = primer.terms.map((t) => {
    const match = findFirstSurfaceMatch(t.term, refs);
    if (!match) return t;
    return {
      ...t,
      link: { type: match.type, canonicalId: match.canonicalId },
    };
  });

  return { ...primer, terms: linkedTerms };
}

/**
 * Word-boundary, case-insensitive substring match. Returns the first
 * matching ref or null.
 *
 * The regex escapes special chars in the surface form so a name with a
 * period or hyphen ("J.D. Vance", "Cory Booker") matches literally rather
 * than as regex metacharacters.
 */
function findFirstSurfaceMatch<
  R extends { surfaceForm: string },
>(term: string, refs: readonly R[]): R | null {
  const haystack = term.toLowerCase();
  for (const ref of refs) {
    const needle = ref.surfaceForm.toLowerCase();
    // Word-boundary on at least one side so "abc" doesn't match "abcd".
    // We lean on simple boundary chars rather than \b so single-letter
    // surfaces (e.g. "S" → bioguide) can't false-match — but the catalog
    // doesn't have single-character surface forms in practice anyway.
    if (needle.length < 2) continue;
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    if (re.test(haystack)) return ref;
  }
  return null;
}
