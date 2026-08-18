import { render, screen, within } from "@testing-library/react";

import PoliticianDossier from "@/components/politician/PoliticianDossier";
import type { PoliticianProfile } from "@/lib/types";

/**
 * The executive dossiers are the reason migration 015 exists. All 102 rows with
 * `chamber IN ('executive','foreign-executive')` rendered a freeform `notes`
 * blob of uncited claims about living people — "First African-American
 * Secretary of Defense", "Former hedge-fund executive (Key Square Group)" —
 * which `docs/OPERATING_CONTEXT.md` §5 forbids outright.
 *
 * Since only `/outlet/*` renders an article list, these pages are profile-only:
 * that prose WAS the page. So these tests check two things that matter more
 * than layout — that no fact renders without a link to the record behind it,
 * and that the page is not empty once the prose is gone.
 */

const emptyRole: PoliticianProfile["role"] = {
  idSource: null,
  roleTitle: null,
  roleTitleSource: null,
  roleStartDate: null,
  roleEndDate: null,
  roleDatesSource: null,
  nominationDate: null,
  nominationUrl: null,
  confirmationDate: null,
  confirmationVoteUrl: null,
  confirmationVoteResult: null,
  predecessorName: null,
  predecessorSource: null,
  roleVerifiedAt: null,
};

const austin: PoliticianProfile = {
  bioguideId: "EXEC-AUSTIN-L",
  name: "Lloyd Austin",
  party: "D",
  state: "US",
  chamber: "executive",
  committees: [],
  topIndustriesCurrentCycle: [],
  interestGroupRatings: [],
  externalLinks: { official: "https://www.defense.gov" },
  notes: null,
  role: {
    idSource: "executive",
    roleTitle: "Secretary of Defense",
    roleTitleSource:
      "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section113",
    roleStartDate: null,
    roleEndDate: "2025-01-24",
    roleDatesSource:
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00011.htm",
    nominationDate: "2021-01-20",
    nominationUrl: "https://www.congress.gov/nomination/117th-congress/78",
    confirmationDate: "2021-01-22",
    confirmationVoteUrl:
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1171/vote_117_1_00005.htm",
    confirmationVoteResult: "Confirmed 93-2",
    predecessorName: "Mark T. Esper",
    predecessorSource: "https://www.congress.gov/nomination/117th-congress/78",
    roleVerifiedAt: "2026-08-07",
  },
};

function officeSection(): HTMLElement {
  return screen.getByText(/Office of record/i).closest("section")!;
}

describe("PoliticianDossier — executive office section", () => {
  it("renders the statutory office title instead of a chamber label", () => {
    render(<PoliticianDossier politician={austin} />);
    // "Executive branch official (D-US)" is what the old lede produced.
    expect(screen.queryByText(/Executive branch official/i)).toBeNull();
    expect(
      within(officeSection()).getByText("Secretary of Defense"),
    ).toBeInTheDocument();
  });

  it("prints the verbatim Senate tally, not a recomputed one", () => {
    render(<PoliticianDossier politician={austin} />);
    expect(
      within(officeSection()).getByText(/2021-01-22 · Confirmed 93-2/),
    ).toBeInTheDocument();
  });

  it("gives every fact in the section a link to its record", () => {
    render(<PoliticianDossier politician={austin} />);
    const rows = officeSection().querySelectorAll("dl > div");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of Array.from(rows)) {
      const link = row.querySelector("a");
      expect(link).not.toBeNull();
      expect(link!.getAttribute("href")).toMatch(/^https:\/\//);
    }
  });

  it("sources the predecessor to the nomination record that names them", () => {
    // The "vice <name>" clause on the PN record is the only primary-record
    // source for a predecessor; a Wikipedia succession box is not one.
    render(<PoliticianDossier politician={austin} />);
    const row = within(officeSection())
      .getByText("Mark T. Esper")
      .closest("div")!;
    expect(within(row).getByRole("link")).toHaveAttribute(
      "href",
      "https://www.congress.gov/nomination/117th-congress/78",
    );
  });

  it("labels a roll-call-sourced predecessor as the previous confirmed holder", () => {
    // A prior roll-call shows whom the Senate last confirmed to the office. It
    // is silent about acting officials, who are never confirmed — so this must
    // not read as a flat "Preceded by".
    render(
      <PoliticianDossier
        politician={{
          ...austin,
          role: {
            ...austin.role,
            predecessorSource:
              "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1161/vote_116_1_00229.htm",
          },
        }}
      />,
    );
    const section = officeSection();
    expect(
      within(section).getByText(/Previous Senate-confirmed holder/i),
    ).toBeInTheDocument();
    expect(within(section).queryByText(/^Preceded by$/i)).toBeNull();
  });

  it("annotates an end date derived from a successor's confirmation", () => {
    // The roll-call dates the successor's confirmation, not the incumbent's
    // last day. Printing it as a bare term would overstate the record.
    render(<PoliticianDossier politician={austin} />);
    expect(
      within(officeSection()).getByText(
        /until a Senate-confirmed successor took the office/i,
      ),
    ).toBeInTheDocument();
  });

  it("drops a fact whose source is missing rather than rendering it bare", () => {
    render(
      <PoliticianDossier
        politician={{
          ...austin,
          role: {
            ...austin.role,
            confirmationVoteUrl: null,
            predecessorName: "Mark T. Esper",
            predecessorSource: null,
          roleVerifiedAt: null,
            nominationUrl: null,
          },
        }}
      />,
    );
    const section = officeSection();
    expect(within(section).queryByText(/Confirmed 93-2/)).toBeNull();
    expect(within(section).queryByText("Mark T. Esper")).toBeNull();
    // The sourced title still renders — one missing record doesn't blank the page.
    expect(within(section).getByText("Secretary of Defense")).toBeInTheDocument();
  });

  it("omits the whole section when the office title has no source", () => {
    render(<PoliticianDossier politician={{ ...austin, role: emptyRole }} />);
    expect(screen.queryByText(/Office of record/i)).toBeNull();
  });

  it("does not show the Congress 'not yet enriched' caption on an executive", () => {
    // PAC industries and interest-group ratings are N/A for an executive
    // official; that caption would invent a gap that doesn't exist.
    render(<PoliticianDossier politician={austin} />);
    expect(screen.queryByText(/PAC contribution data isn't on file/i)).toBeNull();
  });

  // The caption used to be gated on `Boolean(role.roleTitle)` — whether the row
  // carried a *sourced* statutory title — as a proxy for "is a member of
  // Congress". Roughly 33 of the 46 foreign-executive rows are still unsourced,
  // so all of them failed that proxy and told a foreign head of state that PAC
  // data was missing "common for senators not on that year's ballot". The gate
  // is the chamber now; these two cases are the ones the proxy got wrong.
  it("does not show the caption on an unsourced foreign head of state", () => {
    render(
      <PoliticianDossier
        politician={{
          ...austin,
          name: "Kim Jong Un",
          chamber: "foreign-executive",
          party: "WPK",
          state: "KP",
          externalLinks: {},
          role: emptyRole,
        }}
      />,
    );
    expect(screen.queryByText(/PAC contribution data isn't on file/i)).toBeNull();
  });

  it("does not show the caption on an unsourced Justice", () => {
    render(
      <PoliticianDossier
        politician={{
          ...austin,
          chamber: "scotus",
          externalLinks: {},
          role: emptyRole,
        }}
      />,
    );
    expect(screen.queryByText(/PAC contribution data isn't on file/i)).toBeNull();
  });

  it("renders the caption with the ballot rationale for a senator", () => {
    render(
      <PoliticianDossier
        politician={{
          ...austin,
          chamber: "senate",
          externalLinks: {},
          role: emptyRole,
        }}
      />,
    );
    expect(
      screen.getByText(/PAC contribution data isn't on file/i),
    ).toBeInTheDocument();
    // Only a third of Senate seats are on any given ballot, so this explains
    // the absence truthfully here.
    expect(
      screen.getByText(/not on that year's ballot/i),
    ).toBeInTheDocument();
  });

  it("renders the caption without the ballot rationale for a House member", () => {
    render(
      <PoliticianDossier
        politician={{
          ...austin,
          chamber: "house",
          externalLinks: {},
          role: emptyRole,
        }}
      />,
    );
    expect(
      screen.getByText(/PAC contribution data isn't on file/i),
    ).toBeInTheDocument();
    // Every House seat is on every ballot — the senator rationale would be a
    // false explanation here, not merely an odd one.
    expect(screen.queryByText(/not on that year's ballot/i)).toBeNull();
  });

  // The heading names a year, but a year alone reads as "current" to a reader
  // who does not know the release cadence — and the column behind it is named
  // `top_industries_current_cycle`. Every published congressional row renders
  // this section, so the note is the common path, not an edge case (#251).
  it("states the cycle's provenance under a populated industries list", () => {
    render(
      <PoliticianDossier
        politician={{
          ...austin,
          chamber: "senate",
          role: emptyRole,
          topIndustriesCurrentCycle: [
            { industry: "Securities & Investment", amount_usd: 250000 },
          ],
        }}
      />,
    );
    expect(screen.getByText(/2022-cycle bulk release/i)).toBeInTheDocument();
    expect(
      screen.getByText(/not refreshed between cycle releases/i),
    ).toBeInTheDocument();
  });

  it("omits the cycle note when there are no industries to qualify", () => {
    render(
      <PoliticianDossier
        politician={{ ...austin, chamber: "senate", role: emptyRole }}
      />,
    );
    expect(screen.queryByText(/2022-cycle bulk release/i)).toBeNull();
  });

  it("surfaces the official .gov link in the citations list", () => {
    render(<PoliticianDossier politician={austin} />);
    expect(
      screen.getByRole("link", { name: /https:\/\/www\.defense\.gov/ }),
    ).toBeInTheDocument();
  });
});
