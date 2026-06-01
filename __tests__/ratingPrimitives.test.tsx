import { render, within } from "@testing-library/react";
import {
  LeanGlyph,
  FactualChip,
  PartyTag,
  OutletChip,
} from "@/components/primitives";
import type { OutletProfile } from "@/lib/types";

// Any partisan color (tailwind red/blue or the old indigo/category hexes) is a
// §3 violation on a lean/party/factual primitive. These primitives must use
// only neutral tokens.
const PARTISAN =
  /\bred-\d|\bblue-\d|#dc2626|#2563eb|#818cf8|#4338ca|#1d4ed8|#b91c1c|\bbg-red|\bbg-blue|\btext-red|\btext-blue/i;

function filledTickIndex(container: HTMLElement): number {
  const ticks = Array.from(
    container.querySelectorAll<HTMLElement>('[role="img"] > span'),
  );
  return ticks.findIndex((t) => t.style.background === "var(--text-secondary)");
}

const REUTERS = {
  slug: "reuters",
  name: "Reuters",
  parentCompany: null,
  parentCompanyUrl: null,
  foundedYear: null,
  fundingModel: null,
  allSidesRating: "center",
  allSidesUrl: "https://www.allsides.com/news-source/reuters",
  allSidesLastChecked: "2026-01-01",
  mbfcFactual: "high",
  mbfcUrl: "https://mediabiasfactcheck.com/reuters/",
  mbfcLastChecked: "2026-01-01",
  majorFunders: [],
  externalLinks: {},
  notes: null,
} as OutletProfile;

describe("rating primitives — §3 neutrality", () => {
  it("LeanGlyph encodes lean by POSITION, not color (Left vs Right differ only in which tick fills)", () => {
    const { container: left } = render(<LeanGlyph rating="left" />);
    const { container: right } = render(<LeanGlyph rating="right" />);
    expect(filledTickIndex(left)).toBe(0);
    expect(filledTickIndex(right)).toBe(4);
    expect(left.innerHTML).not.toMatch(PARTISAN);
    expect(right.innerHTML).not.toMatch(PARTISAN);
  });

  it("LeanGlyph labels every AllSides bucket and never hue-codes", () => {
    for (const r of [
      "left",
      "lean-left",
      "center",
      "lean-right",
      "right",
      "mixed",
    ] as const) {
      const { container } = render(<LeanGlyph rating={r} />);
      const img = container.querySelector('[role="img"]');
      expect(img?.getAttribute("aria-label")).toMatch(/AllSides lean/);
      expect(container.innerHTML).not.toMatch(PARTISAN);
    }
  });

  it("FactualChip is a neutral, cited meter (label + MBFC link, no green/red)", () => {
    const { container } = render(
      <FactualChip
        rating="high"
        url="https://mediabiasfactcheck.com/x"
        lastChecked="2026-01-01"
      />,
    );
    expect(within(container).getByText(/MBFC: High/)).toBeInTheDocument();
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "https://mediabiasfactcheck.com/x",
    );
    expect(container.innerHTML).not.toMatch(PARTISAN);
  });

  it("FactualChip meterOnly shows the neutral meter alone — no MBFC text, no link, still neutral", () => {
    const { container } = render(<FactualChip rating="high" meterOnly />);
    expect(within(container).queryByText(/MBFC:/)).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    const img = container.querySelector('[role="img"]');
    expect(img?.getAttribute("aria-label")).toMatch(/MBFC factual reporting/i);
    expect(container.innerHTML).not.toMatch(PARTISAN);
  });

  it("PartyTag renders a neutral letter + full label, never red/blue", () => {
    const { container: r } = render(<PartyTag party="Republican" />);
    const { container: d } = render(<PartyTag party="Democrat" />);
    expect(r.querySelector("[aria-label='Republican']")?.textContent).toBe("R");
    expect(d.querySelector("[aria-label='Democrat']")?.textContent).toBe("D");
    expect(r.innerHTML).not.toMatch(PARTISAN);
    expect(d.innerHTML).not.toMatch(PARTISAN);
  });

  it("OutletChip renders name + neutral lean + factual, and degrades to fallback", () => {
    const { container } = render(
      <OutletChip outlet={REUTERS} fallback="Reuters" />,
    );
    expect(within(container).getByText("Reuters")).toBeInTheDocument();
    expect(within(container).getByText(/MBFC: High/)).toBeInTheDocument();
    expect(container.querySelector('[role="img"]')).toBeTruthy(); // LeanGlyph
    expect(container.innerHTML).not.toMatch(PARTISAN);

    const { container: fb } = render(
      <OutletChip outlet={null} fallback="Some Blog" />,
    );
    expect(fb.textContent).toContain("Some Blog");
  });
});
