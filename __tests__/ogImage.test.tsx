/**
 * @jest-environment node
 *
 * The dossier `opengraph-image` factory. Every dossier route delegates its
 * handler here, so the fallback branch — entity missing, card must still be a
 * valid unfurl rather than a thrown 500 — is worth pinning once centrally.
 *
 * `ImageResponse` is mocked: it rasterizes with Satori, which is slow and
 * beside the point. What matters is the props the card was built from.
 */
import { createDossierOgImage } from "@/lib/ogImage";

const mockImageResponse = jest.fn();

jest.mock("next/og", () => ({
  ImageResponse: function (element: unknown, options: unknown) {
    mockImageResponse(element, options);
    return { element, options };
  },
}));

interface Outlet {
  name: string;
}

function handler(entity: Outlet | null) {
  return createDossierOgImage<{ slug: string }, Outlet>({
    eyebrow: "Outlet dossier",
    load: async ({ slug }) => (slug === "reuters" ? entity : null),
    card: (outlet) => ({ title: outlet.name, subtitle: "Wire service" }),
  });
}

function cardProps(): Record<string, unknown> {
  const element = mockImageResponse.mock.calls[0][0] as {
    props: Record<string, unknown>;
  };
  return element.props;
}

beforeEach(() => {
  mockImageResponse.mockClear();
});

describe("createDossierOgImage", () => {
  it("renders the entity card with the route's eyebrow and the loaded fonts", async () => {
    const Image = handler({ name: "Reuters" });
    await Image({ params: Promise.resolve({ slug: "reuters" }) });

    const [, options] = mockImageResponse.mock.calls[0];
    expect(options).toMatchObject({ width: 1200, height: 630 });
    expect((options as { fonts: unknown[] }).fonts).toHaveLength(3);
    expect(JSON.stringify(cardProps())).toContain("Reuters");
  });

  it("falls back to a bare Sift card when the entity is missing", async () => {
    const Image = handler(null);
    await Image({ params: Promise.resolve({ slug: "unknown" }) });

    const serialized = JSON.stringify(cardProps());
    expect(serialized).toContain("Sift");
    expect(serialized).toContain("Outlet dossier");
  });
});
