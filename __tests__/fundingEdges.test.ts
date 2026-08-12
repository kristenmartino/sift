/**
 * EIN resolution for the funding-edge join.
 *
 * `org_profiles` carries no EIN column, so the join key is parsed out of the
 * curated ProPublica link. That makes the parse a trust boundary: matching a
 * bare substring would let any URL containing "propublica.org" supply an EIN
 * and attach another organization's filed grants to this dossier.
 */
import { einFromOrgLinks } from "@/lib/org";

describe("einFromOrgLinks", () => {
  it("reads the EIN from a Nonprofit Explorer URL", () => {
    expect(
      einFromOrgLinks({
        propublica: "https://projects.propublica.org/nonprofits/organizations/530196577",
      }),
    ).toBe("530196577");
  });

  it("tolerates a trailing path segment", () => {
    expect(
      einFromOrgLinks({
        propublica:
          "https://projects.propublica.org/nonprofits/organizations/237327730/202523199349302027/IRS990",
      }),
    ).toBe("237327730");
  });

  it("returns null when the org has no ProPublica link", () => {
    // Agencies and IGOs file no 990 — they simply have no edges.
    expect(einFromOrgLinks({})).toBeNull();
    expect(einFromOrgLinks(undefined)).toBeNull();
    expect(einFromOrgLinks(null)).toBeNull();
  });

  it("rejects a lookalike host", () => {
    expect(
      einFromOrgLinks({
        propublica: "https://evil.com/?u=projects.propublica.org/nonprofits/organizations/530196577",
      }),
    ).toBeNull();
  });

  it("rejects a host that merely contains the string", () => {
    expect(
      einFromOrgLinks({
        propublica: "https://propublica.org.attacker.test/nonprofits/organizations/530196577",
      }),
    ).toBeNull();
  });

  it("rejects malformed URLs and non-nine-digit ids", () => {
    expect(einFromOrgLinks({ propublica: "not a url" })).toBeNull();
    expect(
      einFromOrgLinks({
        propublica: "https://projects.propublica.org/nonprofits/organizations/12345",
      }),
    ).toBeNull();
  });
});
