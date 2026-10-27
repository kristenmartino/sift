import { render, screen } from "@testing-library/react";
import CompareView from "@/components/CompareView";
import { comparisonProvenance, normalizeCompareClaim } from "@/lib/comparison";
import type { CompareProvenance } from "@/lib/types";

jest.mock("@/components/CompareOutletRatings", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/analytics/UsageView", () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => children }));
jest.mock("@/components/ShareActions", () => ({ ShareButton: () => <button>Share</button> }));
const record: CompareProvenance = {
  source_provenance_version: 1, sources_requested: ["Reuters", "Associated Press", "Fox News"],
  sources_retrieved: ["Associated Press", "Fox News"], sources_analyzed: ["Associated Press", "Fox News"],
  sources_unavailable: ["Reuters"],
};
const props = {
  topic: "Example topic", comparison: "All three sources confirm an unsupported summary.",
  sourcesChecked: record.sources_requested, claims: [
    { claim: "A sourced claim", agreement: "unanimous" as const, sources: ["Associated Press", "Fox News", "Invented Outlet"] },
  ], durationMs: 13700, onCompareAnother: jest.fn(), onClose: jest.fn(), selectedSources: ["reuters", "bbc"], onToggleSource: jest.fn(),
};

beforeEach(() => { window.scrollTo = jest.fn(); });

it("does not turn an old saved source list into verified availability or agreement", () => {
  render(<CompareView {...props} generatedAt="2026-08-11T00:30:00Z" />);
  expect(screen.getByText(/Source availability was not recorded/)).toBeInTheDocument();
  expect(screen.queryByText(props.comparison)).not.toBeInTheDocument();
  expect(screen.getByText(/Agreement unverified/)).toBeInTheDocument();
  expect(screen.getByText(/Saved example generated August 11, 2026 \(UTC\)/)).toBeInTheDocument();
  expect(screen.queryByText(/Generated live/)).not.toBeInTheDocument();
  expect(screen.queryByText(/3 sources checked|claims analyzed/)).not.toBeInTheDocument();
});

it("shows requested, found, analyzed and unavailable sources separately", () => {
  render(<CompareView {...props} comparison="Two sources were compared." provenance={record} />);
  for (const label of ["Requested (3)", "Coverage found (2)", "Analyzed (2)", "Unavailable (1)"])
    expect(screen.getByText(label)).toBeInTheDocument();
  expect(screen.getByText(/Reported by 2 of 2 analyzed sources/)).toBeInTheDocument();
  expect(screen.queryByText(/Invented Outlet/)).not.toBeInTheDocument();
  expect(screen.getByText(/Generated live/)).toBeInTheDocument();
});

it("does not call minority or single-source coverage unanimous", () => {
  const allFive = { ...record, sources_requested: ["A", "B", "C", "D", "E"],
    sources_retrieved: ["A", "B", "C", "D", "E"], sources_analyzed: ["A", "B", "C", "D", "E"], sources_unavailable: [] };
  expect(normalizeCompareClaim({ claim: "Example", agreement: "unanimous", sources: ["A", "B", "A", "X"] }, allFive))
    .toMatchObject({ agreement: "partial", sources: ["A", "B"] });
  expect(normalizeCompareClaim({ claim: "Example", agreement: "unanimous", sources: ["A"] }, allFive))
    .toMatchObject({ agreement: "unique" });
  expect(normalizeCompareClaim({ claim: "Example", agreement: "disputed", sources_for: ["A"], sources_against: ["A", "X"] }, allFive)).toBeNull();
});

it("fails closed for missing, contradictory or malformed provenance", () => {
  expect(comparisonProvenance({})).toBeNull();
  expect(comparisonProvenance({ ...record, sources_unavailable: [] })).toBeNull();
  expect(comparisonProvenance({ ...record, sources_analyzed: ["Reuters"] })).toBeNull();
  expect(comparisonProvenance({ ...record, sources_retrieved: ["Associated Press", "associated press"] })).toBeNull();
});
