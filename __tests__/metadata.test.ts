/**
 * Shared dossier metadata (lib/metadata.ts). The robots key must be absent —
 * not undefined — for indexable dossiers, or it overrides the root config and
 * drops max-image-preview (see lib/publishFloor.ts).
 */

import { dossierMetadata } from "@/lib/metadata";

const base = {
  title: "Reuters — Outlet dossier",
  description: "Ownership, funding, bias.",
  indexable: true,
  ogType: "profile" as const,
};

describe("dossierMetadata", () => {
  it("suffixes the unfurl title with the site name by default", () => {
    const meta = dossierMetadata(base);
    expect(meta.openGraph?.title).toBe("Reuters — Outlet dossier | Sift");
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Reuters — Outlet dossier | Sift",
      description: base.description,
    });
    expect(meta.title).toBe(base.title);
  });

  it("uses an explicit unfurl title when given", () => {
    const meta = dossierMetadata({
      ...base,
      title: "H.R. 1 — Bill dossier",
      unfurlTitle: "H.R. 1 (For the People Act) — Sift",
      ogType: "article",
    });
    expect(meta.openGraph?.title).toBe("H.R. 1 (For the People Act) — Sift");
    expect(meta.openGraph).toMatchObject({ type: "article" });
  });

  it("omits robots entirely for an indexable dossier", () => {
    expect("robots" in dossierMetadata(base)).toBe(false);
  });

  it("marks a below-floor dossier noindex, still followable", () => {
    expect(dossierMetadata({ ...base, indexable: false }).robots).toEqual({
      index: false,
      follow: true,
    });
  });
});
