/**
 * Model-JSON parsing (lib/modelJson.ts). Claude fences its JSON despite being
 * told not to, so both AI call sites have to tolerate it.
 */

import { parseJsonFromModel, stripJsonFences } from "@/lib/modelJson";

describe("stripJsonFences", () => {
  it("removes ```json fences and surrounding whitespace", () => {
    expect(stripJsonFences('\n```json\n{"a":1}\n```\n')).toBe('{"a":1}');
  });

  it("leaves unfenced payloads untouched", () => {
    expect(stripJsonFences('{"a":1}')).toBe('{"a":1}');
  });
});

describe("parseJsonFromModel", () => {
  it("parses a fenced payload", () => {
    expect(parseJsonFromModel('```json\n{"shortLabel":"AI"}\n```')).toEqual({
      shortLabel: "AI",
    });
  });

  it("returns null instead of throwing on invalid JSON", () => {
    expect(parseJsonFromModel("Sure! Here you go:")).toBeNull();
  });
});
