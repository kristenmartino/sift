/**
 * The shared OG card factory.
 *
 * These render on every shared dossier link, so a break here is invisible
 * locally and very visible in someone else's Slack. The font loader reads the
 * vendored TTFs from disk — that assertion is the thing that fails loudly if
 * public/og-fonts is ever pruned, which would otherwise surface as unstyled
 * or blank cards in production only.
 */
import {
  clampOgTitle,
  dossierOgCard,
  loadOgFonts,
  OG,
  OG_SIZE,
  siftIconCard,
} from "@/lib/og";

describe("clampOgTitle", () => {
  it("leaves a short title untouched", () => {
    expect(clampOgTitle("Cato Institute")).toBe("Cato Institute");
  });

  it("truncates a long bill title at a word boundary", () => {
    const long =
      "An Act to provide for reconciliation pursuant to title II of the concurrent resolution on the budget for fiscal year 2026";
    const out = clampOgTitle(long);
    expect(out.length).toBeLessThanOrEqual(91); // 90 + the ellipsis
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/); // no dangling space before the ellipsis
  });

  it("honours an explicit max", () => {
    expect(clampOgTitle("abcdefghij", 4)).toBe("abcd…");
  });

  it("does not truncate at exactly the limit", () => {
    const exact = "x".repeat(90);
    expect(clampOgTitle(exact)).toBe(exact);
  });
});

describe("dossierOgCard", () => {
  const flatten = (node: unknown): string => {
    if (node === null || node === undefined || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(flatten).join(" ");
    const el = node as { props?: { children?: unknown } };
    return el.props ? flatten(el.props.children) : "";
  };

  it("renders the eyebrow, title and tagline", () => {
    const text = flatten(
      dossierOgCard({ eyebrow: "Politician dossier", title: "Chuck Schumer" }),
    );
    expect(text).toContain("Politician dossier");
    expect(text).toContain("Chuck Schumer");
    expect(text).toContain("The news, with footnotes.");
    expect(text).toContain("Sift");
  });

  it("includes meta and chips when supplied", () => {
    const text = flatten(
      dossierOgCard({
        eyebrow: "Outlet dossier",
        title: "Reuters",
        meta: "Subscription · Parent: Thomson Reuters",
        chips: ["AllSides: Center", null, "MBFC factual: Very High"],
      }),
    );
    expect(text).toContain("Parent: Thomson Reuters");
    expect(text).toContain("AllSides: Center");
    expect(text).toContain("MBFC factual: Very High");
  });

  it("omits nullish chips rather than rendering blanks", () => {
    const text = flatten(
      dossierOgCard({ eyebrow: "Org dossier", title: "Cato", chips: [null, null] }),
    );
    expect(text).not.toContain("null");
  });

  it("uses the warm dark palette, not the retired indigo", () => {
    expect(OG.bg).toBe("#15120C");
    expect(OG.accent).toBe("#ec5b39");
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });
});

describe("loadOgFonts", () => {
  it("loads the vendored Fraunces and DM Mono cuts", async () => {
    const fonts = await loadOgFonts();
    expect(fonts.map((f) => `${f.name}:${f.weight}:${f.style}`).sort()).toEqual([
      "DM Mono:400:normal",
      "Fraunces:500:italic",
      "Fraunces:600:normal",
    ]);
    // Non-trivial buffers — a truncated or LFS-pointer file would pass a
    // mere existence check and fail at render time in production.
    for (const font of fonts) expect(font.data.length).toBeGreaterThan(10_000);
  });

  it("memoizes so repeat renders do not re-read the files", async () => {
    expect(await loadOgFonts()).toBe(await loadOgFonts());
  });
});

describe("siftIconCard", () => {
  it("scales the corner radius and the mark it is given", () => {
    const card = siftIconCard({ radius: 36, mark: 96 }) as {
      props: { style: { borderRadius: number }; children: { props: { width: number } } };
    };
    expect(card.props.style.borderRadius).toBe(36);
    expect(card.props.children.props.width).toBe(96);
  });
});
