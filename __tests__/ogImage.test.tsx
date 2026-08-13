/**
 * The dossier `opengraph-image` handler factory.
 *
 * Every dossier route's unfurl goes through here, so the load-fails path
 * matters as much as the happy one: a 404 or a pruned entity must still
 * produce a valid card rather than an exception in someone else's Slack.
 */
import { createDossierOgImage } from "@/lib/ogImage";
import { OG_SIZE } from "@/lib/og";

const constructed: { element: unknown; options: Record<string, unknown> }[] = [];

jest.mock("next/og", () => ({
  ImageResponse: class {
    constructor(element: unknown, options: Record<string, unknown>) {
      constructed.push({ element, options });
    }
  },
}));

const flatten = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join(" ");
  const el = node as { props?: { children?: unknown } };
  return el.props ? flatten(el.props.children) : "";
};

interface Params {
  slug: string;
}

interface Org {
  name: string;
}

function buildHandler(load: (params: Params) => Promise<Org | null>) {
  return createDossierOgImage<Params, Org>({
    eyebrow: "Org dossier",
    load,
    card: (org) => ({ title: org.name, meta: "Think tank" }),
  });
}

beforeEach(() => {
  constructed.length = 0;
});

describe("createDossierOgImage", () => {
  it("renders the entity card and the vendored fonts", async () => {
    const load = jest.fn(async ({ slug }: Params) => ({ name: `Org ${slug}` }));
    await buildHandler(load)({ params: Promise.resolve({ slug: "cato" }) });

    expect(load).toHaveBeenCalledWith({ slug: "cato" });
    expect(constructed).toHaveLength(1);
    const text = flatten(constructed[0].element);
    expect(text).toContain("Org dossier");
    expect(text).toContain("Org cato");
    expect(text).toContain("Think tank");
    expect(constructed[0].options).toMatchObject(OG_SIZE);
    expect(
      (constructed[0].options.fonts as { name: string }[]).map((f) => f.name).sort(),
    ).toEqual(["DM Mono", "Fraunces", "Fraunces"]);
  });

  it("falls back to a bare Sift card when the entity is missing", async () => {
    await buildHandler(async () => null)({
      params: Promise.resolve({ slug: "not-curated" }),
    });

    const text = flatten(constructed[0].element);
    expect(text).toContain("Org dossier");
    expect(text).toContain("Sift");
    expect(text).not.toContain("Think tank");
  });
});
