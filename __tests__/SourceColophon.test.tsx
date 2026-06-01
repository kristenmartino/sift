import { render, screen } from "@testing-library/react";
import SourceColophon from "@/components/landing/SourceColophon";
import { COPY } from "@/lib/copy";

const S = COPY.landingReskin.sources;

describe("SourceColophon", () => {
  it("renders the curated outlet names it is given", () => {
    render(
      <SourceColophon
        outlets={[
          { slug: "reuters", name: "Reuters" },
          { slug: "politico", name: "Politico" },
          { slug: "wired", name: "Wired" },
        ]}
      />,
    );
    expect(screen.getByText("Reuters")).toBeInTheDocument();
    expect(screen.getByText("Politico")).toBeInTheDocument();
    expect(screen.getByText("Wired")).toBeInTheDocument();
    // Section eyebrow + exclusions list always render.
    expect(screen.getByText(S.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(S.exclusionsLabel)).toBeInTheDocument();
  });

  it("does not bake in a hardcoded source list — only renders provided outlets", () => {
    const { container } = render(
      <SourceColophon outlets={[{ slug: "npr", name: "NPR" }]} />,
    );
    expect(screen.getByText("NPR")).toBeInTheDocument();
    // "The Athletic" was in an old hardcoded array; it must not appear unless
    // it is present in the curated data passed in. Guards against list drift.
    expect(screen.queryByText("The Athletic")).not.toBeInTheDocument();
    // The live outlet list is the only place outlet names are rendered.
    expect(container.querySelector("ul.sl-outlets")).not.toBeNull();
  });

  it("degrades gracefully when no outlets are available (DB miss/empty)", () => {
    const { container } = render(<SourceColophon outlets={[]} />);
    // The section still renders (eyebrow, exclusions, methodology link) so the
    // landing never breaks or shows a stale list...
    expect(screen.getByText(S.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(S.exclusionsLabel)).toBeInTheDocument();
    expect(screen.getByText(S.methodologyCta)).toBeInTheDocument();
    // ...and the live outlet list is omitted entirely (no stale names).
    expect(container.querySelector("ul.sl-outlets")).toBeNull();
  });
});
