import { agencyPurpose, organizationLinkLabel } from "@/lib/agencyPurpose";

it("keeps the FDA overview paired with its specific official record and check date", () => {
  expect(agencyPurpose("food-and-drug-administration")).toMatchObject({
    source: "https://www.fda.gov/about-fda/what-we-do", checked: "2026-10-26", label: "FDA: What we do",
  });
  expect(agencyPurpose("food-and-drug-administration")?.summary).toMatch(/human and veterinary medicines/);
  expect(agencyPurpose("uncurated-agency")).toBeNull();
  expect(agencyPurpose("constructor")).toBeNull();
});

it("formats record labels without leaking raw keys", () => {
  expect(organizationLinkLabel("budget_source")).toBe("Budget and financial data");
  expect(organizationLinkLabel("annual_report-url")).toBe("Annual report url");
  expect(organizationLinkLabel("sourceRecord")).toBe("Source Record");
  expect(organizationLinkLabel("")).toBe("Source");
});
