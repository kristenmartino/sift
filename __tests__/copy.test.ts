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

  describe("stories.framing", () => {
    it("returns singular phrasing for 1 outlet", () => {
      expect(COPY.stories.framing(1)).toBe("How one outlet framed it");
    });

    it("uses 'framed it' phrasing for small groups (≤3)", () => {
      expect(COPY.stories.framing(2)).toBe("How 2 outlets framed it");
      expect(COPY.stories.framing(3)).toBe("How 3 outlets framed it");
    });

    it("uses 'covered this' phrasing for larger groups (>3)", () => {
      expect(COPY.stories.framing(4)).toBe("How 4 outlets covered this");
      expect(COPY.stories.framing(14)).toBe("How 14 outlets covered this");
    });
  });

  describe("stories.expandedMeta", () => {
    it("returns singular for 1 source", () => {
      expect(COPY.stories.expandedMeta("12 min ago", 1)).toBe(
        "Updated 12 min ago · 1 source"
      );
    });

    it("returns plural for multiple sources", () => {
      expect(COPY.stories.expandedMeta("just now", 14)).toBe(
        "Updated just now · 14 sources"
      );
    });
  });

  describe("stories.toneLabels", () => {
    it("provides editorial labels for every framing tone", () => {
      expect(COPY.stories.toneLabels.neutral).toBe("Straight");
      expect(COPY.stories.toneLabels.urgent).toBe("Pressing");
      expect(COPY.stories.toneLabels.analytical).toBe("Deep read");
      expect(COPY.stories.toneLabels.critical).toBe("Skeptical");
      expect(COPY.stories.toneLabels.optimistic).toBe("Hopeful");
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
