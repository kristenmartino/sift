import { ImageResponse } from "next/og";

import {
  dossierOgCard,
  loadOgFonts,
  OG_SIZE,
  type DossierOgCardProps,
} from "./og";

interface DossierOgImageConfig<Params, Entity> {
  /** Mono uppercase kicker, e.g. "Politician dossier". */
  eyebrow: string;
  /** Loads the entity the card describes; null renders the fallback card. */
  load: (params: Params) => Promise<Entity | null>;
  /** Card content for a found entity — everything but the eyebrow. */
  card: (entity: Entity) => Omit<DossierOgCardProps, "eyebrow">;
}

/**
 * Builds a dossier route's `opengraph-image` handler: awaits the route params,
 * loads the entity and the fonts in parallel, and falls back to a bare Sift
 * card when the entity is missing (a 404 page still gets a valid unfurl).
 *
 * The route keeps its own `size` / `contentType` / `alt` / `revalidate`
 * exports — Next reads those statically.
 */
export function createDossierOgImage<Params, Entity>({
  eyebrow,
  load,
  card,
}: DossierOgImageConfig<Params, Entity>) {
  return async function Image({ params }: { params: Promise<Params> }) {
    const [entity, fonts] = await Promise.all([
      params.then(load),
      loadOgFonts(),
    ]);
    const content = entity
      ? { eyebrow, ...card(entity) }
      : { eyebrow, title: "Sift" };
    return new ImageResponse(dossierOgCard(content), { ...OG_SIZE, fonts });
  };
}
