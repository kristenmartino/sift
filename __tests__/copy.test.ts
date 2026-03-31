import { COPY } from "@/lib/copy";

describe("COPY strings", () => {
  describe("search.resultsFor", () => {
    it("wraps query in curly quotes", () => {
      expect(COPY.search.resultsFor("AI")).toBe("Results for \u201cAI\u201d");
    });
  });

  describe("stories.sourcesBadge", () => {
    it("returns singular for 1 source", () => {
      expect(COPY.stories.sourcesBadge(1)).toBe("1 source");
    });

    it("returns plural for multiple sources", () => {
      expect(COPY.stories.sourcesBadge(3)).toBe("3 sources");
    });
  });

  describe("stories.expand", () => {
    it("returns singular for 1 article", () => {
      expect(COPY.stories.expand(1)).toBe("View 1 article");
    });

    it("returns plural for multiple articles", () => {
      expect(COPY.stories.expand(5)).toBe("View 5 articles");
    });
  });

  describe("static strings", () => {
    it("has header tagline", () => {
      expect(COPY.header.tagline).toBeTruthy();
    });

    it("has footer text", () => {
      expect(COPY.footer.main).toBeTruthy();
    });

    it("has error strings", () => {
      expect(COPY.error.title).toBeTruthy();
      expect(COPY.error.body).toBeTruthy();
      expect(COPY.error.button).toBeTruthy();
    });

    it("has loading strings", () => {
      expect(COPY.loading.slow).toBeTruthy();
      expect(COPY.loading.slowTopic).toBeTruthy();
      expect(COPY.loading.refresh).toBeTruthy();
    });

    it("has topic modal strings", () => {
      expect(COPY.topics.modalTitle).toBeTruthy();
      expect(COPY.topics.modalPlaceholder).toBeTruthy();
      expect(COPY.topics.generating).toBeTruthy();
      expect(COPY.topics.previewTitle).toBeTruthy();
      expect(COPY.topics.confirm).toBeTruthy();
      expect(COPY.topics.cancel).toBeTruthy();
      expect(COPY.topics.edit).toBeTruthy();
      expect(COPY.topics.maxReached).toBeTruthy();
    });

    it("has compare strings", () => {
      expect(COPY.compare.button).toBeTruthy();
      expect(COPY.compare.placeholder).toBeTruthy();
    });

    it("has bookmark strings", () => {
      expect(COPY.bookmarks.title).toBeTruthy();
      expect(COPY.bookmarks.emptyTitle).toBeTruthy();
    });
  });
});
