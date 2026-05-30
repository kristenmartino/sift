import { render, screen } from "@testing-library/react";
import SourceColophon from "@/components/landing/SourceColophon";
import { COPY } from "@/lib/copy";

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
    // Heading + summary always render.
    expect(screen.getByText(COPY.landing.colophonHeading)).toBeInTheDocument();
    expect(screen.getByText(COPY.landing.colophonSummary)).toBeInTheDocument();
  });

  it("does not bake in a hardcoded source list — only renders provided outlets", () => {
    render(<SourceColophon outlets={[{ slug: "npr", name: "NPR" }]} />);
    expect(screen.getByText("NPR")).toBeInTheDocument();
    // "The Athletic" was in the old hardcoded array; it must not appear unless
    // it is present in the curated data passed in. Guards against list drift.
    expect(screen.queryByText("The Athletic")).not.toBeInTheDocument();
  });

  it("degrades gracefully when no outlets are available (DB miss/empty)", () => {
    const { container } = render(<SourceColophon outlets={[]} />);
    // Prose still renders so the landing never breaks or shows a stale list...
    expect(screen.getByText(COPY.landing.colophonHeading)).toBeInTheDocument();
    expect(screen.getByText(COPY.landing.colophonDescription)).toBeInTheDocument();
    expect(screen.getByText(COPY.landing.colophonSummary)).toBeInTheDocument();
    // ...and no outlet grid is rendered.
    expect(container.querySelector("ul")).toBeNull();
  });
});
