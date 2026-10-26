import { render, screen, within } from "@testing-library/react";
import CivicIndex from "@/components/civic/CivicIndex";
import { countryName, filterByChamber, groupByOffice } from "@/lib/civic";
import type { PoliticianListItem } from "@/lib/types";

jest.mock("@/components/landing/LandingMasthead", () => function MockMasthead() { return <header />; });

const person = (name: string, state: string | null, chamber: PoliticianListItem["chamber"], id = name): PoliticianListItem =>
  ({ name, state, chamber, bioguideId: id, party: null });
const roster = [
  person("Arkansas representative", "AR", "house"), person("Milei", "AR", "foreign-executive"),
  person("California senator", "CA", "senate"), person("Carney", "CA", "foreign-executive"),
  person("Delaware senator", "DE", "senate"), person("Merkel", "DE", "foreign-executive"),
  person("U.S. executive", null, "executive"), person("Justice", null, "scotus"),
  person("Former official", "TX", "former"),
];

it("keeps country-code collisions out of congressional state groups", () => {
  render(<CivicIndex politicians={roster} orgs={[]} bills={[]} chamberFilter={null} />);
  const congress = within(screen.getByRole("region", { name: "U.S. Congress" }));
  const international = within(screen.getByRole("region", { name: "International political figures" }));
  for (const state of ["Arkansas", "California", "Delaware"]) expect(congress.getByText(state)).toBeInTheDocument();
  for (const name of ["Milei", "Carney", "Merkel"]) expect(congress.queryByText(name)).not.toBeInTheDocument();
  for (const country of ["Argentina", "Canada", "Germany"]) expect(international.getByText(country)).toBeInTheDocument();
  expect(screen.queryByText("Sitting members of Congress")).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "U.S. executive officials" })).toHaveTextContent("U.S. executive");
  expect(screen.getByRole("region", { name: "U.S. Supreme Court" })).toHaveTextContent("Justice");
  expect(screen.getByRole("region", { name: "Other and former officials" })).toHaveTextContent("Former official");
});

it("filters office holders without leaking international records into Congress", () => {
  const foreignWithBadChamber = person("Foreign official", "CA", "house", "FOREIGN-EXAMPLE");
  const input = [...roster, foreignWithBadChamber];
  expect(filterByChamber(input, "house").map((p) => p.name)).toEqual(["Arkansas representative"]);
  expect(filterByChamber(input, "foreign-executive")).toContain(foreignWithBadChamber);
  expect(groupByOffice(input).find((g) => g.office === "congress")!.groups.flatMap(([, list]) => list))
    .not.toContain(foreignWithBadChamber);
  render(<CivicIndex politicians={input} orgs={[]} bills={[]} chamberFilter="senate" />);
  expect(screen.queryByText("Milei")).not.toBeInTheDocument();
  expect(screen.getByText("California senator")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "International" })).toHaveAttribute("href", "/civic?chamber=foreign-executive");
});

it("handles missing and unrecognized country codes without mapping them to states", () => {
  expect(countryName(null)).toBe("Unknown country");
  expect(countryName("ar")).toBe("Argentina");
  expect(countryName("not-a-code")).toBe("not-a-code");
  expect(groupByOffice([])).toEqual([]);
});

it("keeps long browse lists collapsed while revealing a selected office", () => {
  const { container, rerender } = render(<CivicIndex politicians={roster} orgs={[]} bills={[]} chamberFilter={null} />);
  expect(container.querySelector("#people details")).not.toHaveAttribute("open");
  expect(screen.getByRole("searchbox")).toBeVisible();
  rerender(<CivicIndex politicians={roster} orgs={[]} bills={[]} chamberFilter="senate" />);
  expect(container.querySelector("#people details")).toHaveAttribute("open");
  expect(screen.getByText("California senator")).toBeVisible();
});
