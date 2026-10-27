import { act, render, screen, waitFor, within } from "@testing-library/react";
import CompareOutletRatings from "@/components/CompareOutletRatings";
import CompareView from "@/components/CompareView";
import type { OutletProfile, CompareProvenance } from "@/lib/types";

jest.mock("@/components/analytics/UsageView", () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => children }));
jest.mock("@/components/ShareActions", () => ({ ShareButton: () => <button>Share</button> }));
const AXIOS = { slug: "axios", name: "Axios", allSidesRating: "center", allSidesUrl: "https://www.allsides.com/news-source/axios", mbfcFactual: "high", mbfcUrl: "https://mediabiasfactcheck.com/axios/" } as OutletProfile;
const HILL = { ...AXIOS, slug: "the-hill", name: "The Hill", mbfcFactual: "mostly-factual", mbfcUrl: "https://mediabiasfactcheck.com/the-hill/" } as OutletProfile;
const mockFetch = jest.fn();
const response = (outlets: Record<string, OutletProfile | null>) => ({ ok: true, json: async () => ({ outlets }) });
beforeEach(() => { mockFetch.mockReset(); global.fetch = mockFetch; window.scrollTo = jest.fn(); });

it("loads curated ratings once per outlet, visibly with citations and methodology", async () => {
  mockFetch.mockResolvedValue(response({ axios: AXIOS, "the hill": HILL }));
  render(<CompareOutletRatings sources={["axios", "Axios", "the hill"]} />);
  expect(screen.getAllByText("Loading ratings…")).toHaveLength(2);
  expect(screen.queryByText("Bias rating: Unavailable")).not.toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Outlet dossier for Axios" })).toBeVisible();
  const region = screen.getByRole("region", { name: "Compared outlet ratings" });
  expect(within(region).getAllByRole("listitem")).toHaveLength(2);
  expect(within(region).getAllByRole("link", { name: /AllSides bias rating: Center/ })).toHaveLength(2);
  expect(within(region).getByRole("link", { name: /MBFC factual reporting: Mostly Factual/ })).toBeVisible();
  expect(within(region).getByRole("link", { name: /MBFC factual reporting: High/ })).toHaveAttribute("href", AXIOS.mbfcUrl);
  expect(within(region).getAllByRole("link", { name: "About these ratings →" })).toHaveLength(2);
  expect(region.querySelector("details")).toBeNull();
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it.each([null, "failure"])("keeps missing ratings explicit without inventing a score: %s", async (result) => {
  if (result === "failure") mockFetch.mockResolvedValue({ ok: false });
  else mockFetch.mockResolvedValue(response({ unknown: null }));
  render(<CompareOutletRatings sources={["unknown"]} />);
  expect(await screen.findByText("Bias rating: Unavailable")).toBeVisible();
  expect(screen.getByText("Factual Reporting: Unavailable")).toBeVisible();
  expect(screen.queryByRole("link", { name: /AllSides bias rating:|MBFC factual reporting:/ })).not.toBeInTheDocument();
});

it("does not reuse an earlier comparison's rating response after sources change", async () => {
  let resolveFirst!: (value: unknown) => void;
  mockFetch.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
  mockFetch.mockResolvedValueOnce(response({ "the hill": HILL }));
  const { rerender } = render(<CompareOutletRatings sources={["axios"]} />);
  rerender(<CompareOutletRatings sources={["the hill"]} />);
  await screen.findByRole("link", { name: "Outlet dossier for The Hill" });
  await act(async () => { resolveFirst(response({ axios: AXIOS })); });
  expect(screen.queryByRole("link", { name: "Outlet dossier for Axios" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Mostly Factual/ })).toBeVisible();
});

it.each([undefined, "2026-10-26T00:00:00Z"])("includes outlet ratings in a live or saved Compare result: %s", async (generatedAt) => {
  mockFetch.mockResolvedValue(response({ axios: AXIOS, "the hill": HILL }));
  const provenance: CompareProvenance = { source_provenance_version: 1, sources_requested: ["axios", "the hill"], sources_retrieved: ["axios"], sources_analyzed: ["axios"], sources_unavailable: ["the hill"] };
  render(<CompareView topic="Example topic" comparison="One outlet was analyzed." sourcesChecked={["axios"]} provenance={provenance} generatedAt={generatedAt} claims={[]} durationMs={1000} selectedSources={["axios", "the hill"]} onToggleSource={jest.fn()} onCompareAnother={jest.fn()} onClose={jest.fn()} />);
  await waitFor(() => expect(screen.getAllByRole("link", { name: /MBFC factual reporting:/ })).toHaveLength(2));
  expect(screen.getByText("Unavailable (1)")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Outlet dossier for The Hill" })).toBeVisible();
});

it("adds ratings to a legacy saved example without inventing source availability", async () => {
  mockFetch.mockResolvedValue(response({ axios: AXIOS }));
  render(<CompareView topic="Saved example" comparison="Earlier comparison." sourcesChecked={["Axios"]} generatedAt="2026-08-11T00:30:00Z" claims={[]} durationMs={1000} selectedSources={["axios", "the hill"]} onToggleSource={jest.fn()} onCompareAnother={jest.fn()} onClose={jest.fn()} />);
  expect(await screen.findByRole("link", { name: /MBFC factual reporting: High/ })).toBeVisible();
  expect(screen.getByText(/Source availability was not recorded/)).toBeVisible();
  expect(screen.queryByText(/Coverage found/)).not.toBeInTheDocument();
});
