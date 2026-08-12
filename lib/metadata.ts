import type { Metadata } from "next";

import { dossierRobotsMeta } from "./publishFloor";

interface DossierMetadataOptions {
  /** Page title, e.g. "Reuters — Outlet dossier". */
  title: string;
  description: string;
  /** Whether the dossier clears the publish floor (lib/publishFloor.ts). */
  indexable: boolean;
  /** og:type — "profile" for entities, "article" for bills. */
  ogType: "profile" | "article";
  /** Unfurl-card title. Defaults to `${title} | Sift`. */
  unfurlTitle?: string;
}

/**
 * The per-dossier metadata block, shared by the four dossier route families
 * (outlet / org / politician / bill). Each one had the same openGraph +
 * twitter + robots trio inline, which is how they drifted apart.
 *
 * og:image is not set here — it comes from each route's sibling
 * opengraph-image.tsx (shared card factory in lib/og.tsx).
 */
export function dossierMetadata({
  title,
  description,
  indexable,
  ogType,
  unfurlTitle,
}: DossierMetadataOptions): Metadata {
  const fullTitle = unfurlTitle ?? `${title} | Sift`;
  return {
    title,
    description,
    // Below-floor dossiers are not advertised. Spread, not assign: a
    // `robots` key present here would override the root config even when
    // undefined, dropping max-image-preview. See lib/publishFloor.ts.
    ...dossierRobotsMeta(indexable),
    openGraph: {
      title: fullTitle,
      description,
      type: ogType,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
