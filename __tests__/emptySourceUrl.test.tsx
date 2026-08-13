import { render, screen } from "@testing-library/react";

import LeadStory from "@/components/landing/LeadStory";
import SourceRow from "@/components/SourceRow";
import OutletDossier from "@/components/outlet/OutletDossier";
import type { Article, OutletProfile } from "@/lib/types";

/**
 * `sanitizeLinkUrl` collapses a non-http(s) `source_url` to "" at the API and
 * page boundaries, so every component that renders an article headline has to
 * treat "" as "no link". `<a href="">` is a self-link: it looks live, and
 * clicking it reloads the current page instead of doing nothing.
 */

const article: Article = {
  id: "a1",
  title: "Sanitized headline",
  summary: "Summary.",
  sourceUrl: "",
  sourceName: "Reuters",
  publishedDate: "2026-08-10T12:00:00Z",
  imageUrl: null,
  category: "top",
  readTime: 3,
};

const outlet = {
  slug: "reuters",
  name: "Reuters",
  parentCompany: null,
  parentCompanyUrl: null,
  foundedYear: null,
  fundingModel: null,
  allSidesRating: "center",
  allSidesUrl: null,
  allSidesLastChecked: null,
  mbfcFactual: "high",
  mbfcUrl: null,
  mbfcLastChecked: null,
  majorFunders: [],
  externalLinks: {},
  notes: null,
} as OutletProfile;

function headlineAnchor(title: string): HTMLAnchorElement | null {
  return screen.getByText(title).closest("a");
}

describe("empty sourceUrl renders no anchor", () => {
  it("LeadStory shows the headline as plain text", () => {
    render(<LeadStory article={article} />);
    expect(headlineAnchor(article.title)).toBeNull();
  });

  it("SourceRow shows the lead and extra headlines as plain text", () => {
    render(
      <SourceRow
        unit={{
          sourceName: "Reuters",
          outlet,
          framing: null,
          articles: [
            article,
            { ...article, id: "a2", title: "Second sanitized headline" },
          ],
        }}
      />,
    );
    expect(headlineAnchor(article.title)).toBeNull();
    expect(headlineAnchor("Second sanitized headline")).toBeNull();
  });

  it("OutletDossier shows the recent-article headline as plain text", () => {
    render(<OutletDossier outlet={outlet} recentArticles={[article]} />);
    expect(headlineAnchor(article.title)).toBeNull();
  });
});

describe("safe sourceUrl still links out", () => {
  const linked: Article = { ...article, sourceUrl: "https://example.com/x?a=1" };

  it.each([
    ["LeadStory", <LeadStory key="l" article={linked} />],
    [
      "SourceRow",
      <SourceRow
        key="s"
        unit={{
          sourceName: "Reuters",
          outlet,
          framing: null,
          articles: [linked],
        }}
      />,
    ],
    [
      "OutletDossier",
      <OutletDossier key="o" outlet={outlet} recentArticles={[linked]} />,
    ],
  ])("%s keeps the href intact", (_name, element) => {
    render(element);
    expect(headlineAnchor(linked.title)).toHaveAttribute(
      "href",
      "https://example.com/x?a=1",
    );
  });
});
