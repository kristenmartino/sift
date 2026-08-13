import { render, screen } from "@testing-library/react";

import OrgDossier from "@/components/org/OrgDossier";
import type { FundingEdge, OrgFundingEdges, OrgProfile } from "@/lib/types";

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

/**
 * The funding sections carry the site's only all-filings figures, so what they
 * say about their own gaps is part of the claim. Each case here is a way the
 * page previously overstated what it showed.
 */
const edge = (over: Partial<FundingEdge> = {}): FundingEdge => ({
  targetEin: "111111111",
  targetNameAsFiled: "Recipient Org",
  targetNameIrs: "RECIPIENT ORG",
  amountUsd: 25_000,
  purpose: "General support",
  exemptCode: "501(c)(3)",
  fiscalPeriod: "202412",
  form: "990",
  filingUrl: "https://projects.propublica.org/nonprofits/full_text_search/1",
  ...over,
});

const funding = (over: Partial<OrgFundingEdges> = {}): OrgFundingEdges => ({
  grants: [],
  related: [],
  heldForReview: 0,
  heldEinAbsent: 0,
  heldOther: 0,
  fiscalPeriods: [],
  ...over,
});

describe("OrgDossier funding edges", () => {
  it("discloses withheld rows even when nothing is publishable", () => {
    // The all-withheld org is the case the disclosure matters most for, and
    // the guard used to require a published row before saying anything — so
    // that org showed nothing and said nothing.
    render(
      <OrgDossier
        org={nonprofit}
        funding={funding({ heldForReview: 2, heldEinAbsent: 3 })}
      />,
    );
    expect(screen.getByText(/2 further entries are withheld/)).toBeInTheDocument();
    expect(screen.getByText(/3 more recipients are not shown/)).toBeInTheDocument();
  });

  it("counts a verdict it has no wording for instead of dropping it", () => {
    // sift-api owns the verdict vocabulary and can add to it without this repo
    // shipping. An unrecognized verdict must still withhold out loud.
    render(<OrgDossier org={nonprofit} funding={funding({ heldOther: 1 })} />);
    expect(screen.getByText(/1 further entry is withheld pending a check/)).toBeInTheDocument();
  });

  it("labels a multi-period total with the span it actually covers", () => {
    // The total sums every filing on file; naming only the newest period
    // reported three years of giving as one year's.
    render(
      <OrgDossier
        org={nonprofit}
        funding={funding({
          grants: [
            edge({ amountUsd: 10_000, fiscalPeriod: "202412" }),
            edge({ amountUsd: 5_000, fiscalPeriod: "202212", filingUrl: "https://example.org/990-2022" }),
          ],
          fiscalPeriods: ["202412", "202212"],
        })}
      />,
    );
    expect(
      screen.getByText(/Forms 990 for the years ending December 2022 through December 2024/),
    ).toBeInTheDocument();
  });

  it("keeps the single-period wording when only one filing is on file", () => {
    render(
      <OrgDossier
        org={nonprofit}
        funding={funding({ grants: [edge()], fiscalPeriods: ["202412"] })}
      />,
    );
    expect(
      screen.getByText(/Form 990 for the year ending December 2024/),
    ).toBeInTheDocument();
  });

  it("says when grants are excluded from the total for want of an amount", () => {
    // Otherwise a reader can divide the total by the count and find it wrong.
    render(
      <OrgDossier
        org={nonprofit}
        funding={funding({
          grants: [edge(), edge({ amountUsd: null, targetNameAsFiled: "Unstated Org" })],
          fiscalPeriods: ["202412"],
        })}
      />,
    );
    expect(screen.getByText(/Amount not stated/)).toBeInTheDocument();
    expect(
      screen.getByText(/1 of these grants doesn't state an amount/),
    ).toBeInTheDocument();
  });

  it("cites each filing once, linked, however many edges came from it", () => {
    render(
      <OrgDossier
        org={nonprofit}
        funding={funding({
          grants: [edge(), edge({ targetEin: "222222222" })],
          related: [
            edge({
              targetNameAsFiled: "Affiliated Action Fund",
              fiscalPeriod: "202312",
              filingUrl: "https://example.org/990-2023",
            }),
          ],
          fiscalPeriods: ["202412", "202312"],
        })}
      />,
    );
    const links = screen.getAllByRole("link", { name: /Source: Form 990, tax period/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", edge().filingUrl);
    expect(links[0]).toHaveTextContent("December 2024");
    expect(links[1]).toHaveTextContent("December 2023");
  });

  it("renders repeated identical grants rather than collapsing them", () => {
    // Two filings can report the same recipient, amount and purpose. The old
    // key was built from exactly those three fields.
    render(
      <OrgDossier
        org={nonprofit}
        funding={funding({
          grants: [edge({ fiscalPeriod: "202412" }), edge({ fiscalPeriod: "202312" })],
          fiscalPeriods: ["202412", "202312"],
        })}
      />,
    );
    expect(screen.getAllByText("Recipient Org")).toHaveLength(2);
  });
});
