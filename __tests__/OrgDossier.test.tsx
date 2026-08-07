import { render, screen } from "@testing-library/react";

import OrgDossier from "@/components/org/OrgDossier";
import type { OrgProfile } from "@/lib/types";

/**
 * The budget line on an org dossier names a figure AND the record it came
 * from, and until 2026-08-07 it named the wrong one for a third of the rows.
 *
 * `copy.ts` hardcoded "Per the Form 990 on ProPublica Nonprofit Explorer"
 * alongside "Total expenses". That is right for a nonprofit and wrong for a
 * federal agency: the 23 agency rows are cited to OMB Historical Tables — no
 * Form 990 exists for the EPA — and the figure is *net outlays*, not expenses.
 * Net of offsetting receipts, which is why GSA's FY2025 figure is legitimately
 * −$379M and read as a bug under the word "expenses".
 *
 * These render the component rather than the copy helper, because the defect
 * was in the wiring: the label was correct in isolation and attached to the
 * wrong source on the page.
 */

const baseOrg: OrgProfile = {
  slug: "example",
  name: "Example",
  type: "think-tank",
  selfDescription: null,
  selfDescriptionSource: null,
  selfDescriptionChecked: null,
  governanceStructure: null,
  governanceSource: null,
  foundedYear: null,
  annualBudgetUsd: null,
  annualBudgetFy: null,
  annualBudgetSource: null,
  annualBudgetKind: null,
  majorFunders: [],
  faraRegistered: false,
  faraCountries: [],
  externalLinks: {},
  notes: null,
};

const nonprofit: OrgProfile = {
  ...baseOrg,
  slug: "brookings-institution",
  name: "Brookings Institution",
  annualBudgetUsd: 107_734_507,
  annualBudgetFy: "FY ending June 2025",
  annualBudgetSource:
    "https://projects.propublica.org/nonprofits/organizations/530196577",
  annualBudgetKind: "form990",
};

const agency: OrgProfile = {
  ...baseOrg,
  slug: "environmental-protection-agency",
  name: "Environmental Protection Agency",
  type: "agency",
  annualBudgetUsd: 36_973_000_000,
  annualBudgetFy: "FY2025",
  annualBudgetSource:
    "https://www.whitehouse.gov/wp-content/uploads/2026/04/hist04z1_fy2027.xlsx",
  annualBudgetKind: "ombOutlays",
};

describe("OrgDossier budget line", () => {
  it("calls a 990-sourced figure total expenses", () => {
    render(<OrgDossier org={nonprofit} />);
    expect(screen.getByText(/Total expenses/)).toBeInTheDocument();
    expect(screen.getByText(/Form 990/)).toBeInTheDocument();
  });

  it("calls an OMB-sourced figure net outlays", () => {
    render(<OrgDossier org={agency} />);
    expect(screen.getByText(/Net outlays/)).toBeInTheDocument();
    expect(screen.getByText(/OMB Historical Tables/)).toBeInTheDocument();
  });

  it("never labels an agency's OMB figure as a Form 990", () => {
    render(<OrgDossier org={agency} />);
    expect(screen.queryByText(/Form 990/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ProPublica/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Total expenses/)).not.toBeInTheDocument();
  });

  it("points the source link at the record it names", () => {
    render(<OrgDossier org={agency} />);
    const link = screen.getByRole("link", { name: /OMB Historical Tables/ });
    expect(link).toHaveAttribute("href", agency.annualBudgetSource);
  });

  it("renders a negative net outlay without calling it an expense (GSA)", () => {
    render(
      <OrgDossier
        org={{
          ...agency,
          slug: "general-services-administration",
          name: "General Services Administration",
          annualBudgetUsd: -379_000_000,
        }}
      />,
    );
    expect(screen.getByText(/Net outlays/)).toBeInTheDocument();
    expect(screen.queryByText(/expenses/i)).not.toBeInTheDocument();
  });

  it("names neither record when the source is unrecognised", () => {
    render(
      <OrgDossier
        org={{
          ...agency,
          annualBudgetSource: "https://example.org/budget.pdf",
          annualBudgetKind: null,
        }}
      />,
    );
    expect(screen.getByText(/Per the cited source/)).toBeInTheDocument();
    expect(screen.queryByText(/Form 990/)).not.toBeInTheDocument();
    expect(screen.queryByText(/OMB/)).not.toBeInTheDocument();
  });
});
