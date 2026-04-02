import { stripHtml, sanitizeUrl } from "@/lib/sanitize";

describe("stripHtml", () => {
  it("removes basic HTML tags", () => {
    expect(stripHtml("<b>bold</b>")).toBe("bold");
    expect(stripHtml("<p>paragraph</p>")).toBe("paragraph");
  });

  it("removes script tags", () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it("removes nested tags", () => {
    expect(stripHtml("<div><p><b>nested</b></p></div>")).toBe("nested");
  });

  it("handles self-closing tags", () => {
    expect(stripHtml('text<br/>more<img src="x"/>')).toBe("textmore");
  });

  it("decodes HTML entities before stripping", () => {
    // This is the critical XSS fix — entities must be decoded BEFORE tag removal
    expect(stripHtml("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe("alert(1)");
    expect(stripHtml("&lt;img src=x onerror=alert(1)&gt;")).toBe("");
  });

  it("decodes common HTML entities", () => {
    expect(stripHtml("&amp; &quot; &#x27; &#x2F;")).toBe('& " \' /');
  });

  it("decodes numeric decimal entities", () => {
    expect(stripHtml("&#60;b&#62;test&#60;/b&#62;")).toBe("test");
  });

  it("decodes numeric hex entities", () => {
    expect(stripHtml("&#x3C;b&#x3E;test&#x3C;/b&#x3E;")).toBe("test");
  });

  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("trims whitespace", () => {
    expect(stripHtml("  hello  ")).toBe("hello");
  });

  it("handles plain text without tags", () => {
    expect(stripHtml("no tags here")).toBe("no tags here");
  });
});

describe("sanitizeUrl", () => {
  it("accepts https URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
  });

  it("accepts http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects vbscript: URLs", () => {
    expect(sanitizeUrl("vbscript:msgbox")).toBeNull();
  });

  it("rejects invalid URLs", () => {
    expect(sanitizeUrl("not a url")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(sanitizeUrl("")).toBeNull();
  });
});
