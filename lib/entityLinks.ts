// Entity-link helpers — civic-literacy MVP Phase 3.H.
//
// Validates the JSONB shape produced by the sift-api Phase 3.G
// entity_linker pipeline node and turns it into typed `EntityLink[]`.
// Pure-function only.

import type { EntityLink, EntityLinkType } from "./types";

const VALID_TYPES: ReadonlySet<string> = new Set([
  "outlet",
  "politician",
  "org",
  "bill",
]);

/**
 * Parse + validate an `articles.entity_links` JSONB blob into typed
 * `EntityLink[]`. Returns `[]` for null / non-array / malformed inputs;
 * the UI renders nothing in those cases (graceful degradation).
 *
 * Drops any individual entry that's missing required fields or has an
 * unknown type, so a partial corruption doesn't break the whole list.
 *
 * Maps DB snake_case fields to the typed camelCase shape inline.
 */
export function parseEntityLinks(value: unknown): EntityLink[] {
  if (!Array.isArray(value)) return [];
  const out: EntityLink[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;

    const type = typeof e.type === "string" ? e.type : null;
    const canonicalId = typeof e.canonical_id === "string"
      ? e.canonical_id.trim()
      : null;
    const surfaceForm = typeof e.surface_form === "string"
      ? e.surface_form.trim()
      : null;

    if (!type || !canonicalId || !surfaceForm) continue;
    if (!VALID_TYPES.has(type)) continue;

    out.push({
      type: type as EntityLinkType,
      canonicalId,
      surfaceForm,
    });
  }
  return out;
}

/**
 * Map an entity link to its dossier route href. Centralized so the
 * component layer doesn't sprinkle path templates around.
 */
export function entityHref(link: EntityLink): string {
  switch (link.type) {
    case "outlet":
      return `/outlet/${link.canonicalId}`;
    case "politician":
      return `/politician/${link.canonicalId}`;
    case "org":
      return `/org/${link.canonicalId}`;
    case "bill":
      return `/bill/${link.canonicalId}`;
  }
}

const TYPE_LABELS: Record<EntityLinkType, string> = {
  outlet: "Outlet",
  politician: "Politician",
  org: "Organization",
  bill: "Bill",
};

/** Human label for an entity link type, used as a small subtitle in the list. */
export function entityTypeLabel(type: EntityLinkType): string {
  return TYPE_LABELS[type];
}
