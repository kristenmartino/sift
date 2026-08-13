/**
 * @jest-environment node
 *
 * The dossier `opengraph-image` factory (lib/ogImage.tsx).
 *
 * Every dossier route delegates its unfurl card to this one handler, so the
 * contract worth pinning is the fallback: a 404'd entity still has to produce a
 * valid card (a bare "Sift" one) rather than throwing inside an image route,
 * which renders in someone else's Slack as a broken thumbnail.
 *
 * `next/og` is mocked — ImageResponse rasterizes with satori/resvg, which is
 * both slow and beside the point here. The fonts are the real vendored TTFs.
 */
const imageResponseCalls: Array<{ element: unknown; options: unknown }> = [];

jest.mock("next/og", () => ({
  ImageResponse: class {
    constructor(element: unknown, options: unknown) {
      imageResponseCalls.push({ element, options });
    }
  },
}));

import { createDossierOgImage } from "@/lib/ogImage";
import { OG_SIZE } from "@/lib/og";

interface Org {
  name: string;
}

const flatten = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join(" ");
  const el = node as { props?: { children?: unknown } };
  return el.props ? flatten(el.props.children) : "";
};

function handler(load: (params: { slug: string }) => Promise<Org | null>) {
  return createDossierOgImage<{ slug: string }, Org>({
    eyebrow: "Org dossier",
    load,
    card: (org) => ({ title: org.name, meta: "Nonprofit" }),
  });
}

beforeEach(() => {
  imageResponseCalls.length = 0;
});

describe("createDossierOgImage", () => {
  it("renders the entity card at the OG size, with the loaded fonts", async () => {
    const Image = handler(async ({ slug }) => ({ name: `Org ${slug}` }));
    await Image({ params: Promise.resolve({ slug: "brookings" }) });

    expect(imageResponseCalls).toHaveLength(1);
    const { element, options } = imageResponseCalls[0];
    const text = flatten(element);
    expect(text).toContain("Org dossier");
    expect(text).toContain("Org brookings");
    expect(text).toContain("Nonprofit");
    expect(options).toMatchObject(OG_SIZE);
    expect((options as { fonts: unknown[] }).fonts).toHaveLength(3);
  });

  it("falls back to a bare Sift card when the entity is missing", async () => {
    const Image = handler(async () => null);
    await Image({ params: Promise.resolve({ slug: "nope" }) });

    const text = flatten(imageResponseCalls[0].element);
    expect(text).toContain("Org dossier");
    expect(text).toContain("Sift");
    expect(text).not.toContain("Nonprofit");
  });

  it("passes the awaited route params to the loader", async () => {
    const load = jest.fn<Promise<Org | null>, [{ slug: string }]>().mockResolvedValue(null);
    await handler(load)({ params: Promise.resolve({ slug: "cato-institute" }) });
    expect(load).toHaveBeenCalledWith({ slug: "cato-institute" });
  });
});
