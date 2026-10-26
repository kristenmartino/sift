import { fireEvent, render, screen, within } from "@testing-library/react";
import CivicLookup from "@/components/civic/CivicLookup";

const politicians = [
  { bioguideId: "S001", name: "Ava Senator", chamber: "senate" as const, state: "CA", party: "D" },
  { bioguideId: "FOREIGN-CA", name: "Alex Minister", chamber: "foreign-executive" as const, state: "CA", party: null },
];
const orgs = [{ slug: "food-and-drug-administration", name: "Food and Drug Administration", type: "agency" as const }];
const bills = [{ billId: "hr1-119", shortTitle: "Example Act", congress: 119, status: null }];

function lookup(query: string) {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: query } });
  return within(screen.getByRole("list", { name: "Directory search results" }));
}

it("finds an agency by acronym and links to the canonical dossier", () => {
  render(<CivicLookup politicians={politicians} orgs={orgs} bills={bills} />);
  expect(screen.queryByRole("list", { name: "Directory search results" })).not.toBeInTheDocument();
  const results = lookup("FDA");
  expect(results.getByRole("link", { name: /Food and Drug Administration/ })).toHaveAttribute("href", "/org/food-and-drug-administration");
  expect(results.getByText("Federal agencies")).toBeInTheDocument();
});

it("matches multiple words and keeps international country names distinct from states", () => {
  render(<CivicLookup politicians={politicians} orgs={orgs} bills={bills} />);
  const results = lookup("Alex Canada");
  expect(results.getByRole("link", { name: /Alex Minister/ })).toHaveAttribute("href", "/politician/FOREIGN-CA");
  expect(results.queryByText("Ava Senator")).not.toBeInTheDocument();
  expect(lookup("Ava California").getByText("Senator · California")).toBeInTheDocument();
});

it("finds bills by their record id and offers a clear no-match state", () => {
  render(<CivicLookup politicians={[]} orgs={[]} bills={bills} />);
  expect(lookup("hr1-119").getByRole("link", { name: /Example Act/ })).toHaveAttribute("href", "/bill/hr1-119");
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "not a record" } });
  expect(screen.getByText(/No matching entries/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(screen.getByRole("searchbox")).toHaveValue("");
  expect(screen.getByRole("searchbox")).toHaveFocus();
  expect(screen.queryByText(/No matching entries/)).not.toBeInTheDocument();
});

it("bounds a broad result list and tells the reader how to narrow it", () => {
  render(<CivicLookup politicians={[]} orgs={Array.from({ length: 15 }, (_, i) => ({ slug: `office-${i}`, name: `Office ${i}`, type: null }))} bills={[]} />);
  expect(lookup("office").getAllByRole("link")).toHaveLength(12);
  expect(screen.getByText(/15 matches; showing the first 12/)).toBeInTheDocument();
});
