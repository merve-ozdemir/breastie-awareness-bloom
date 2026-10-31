import { describe, expect, it } from "vitest";
import { validateEntry } from "./schema";
import { matchKeywords } from "./matcher";

describe("validateEntry", () => {
  it("moves a change not allowed for the zone into the note", () => {
    const e = validateEntry({ changes: [{ type: "discharge", since_when: null }] }, { breast: "left", zone: "armpit" });
    expect(e.changes).toEqual([]);
    expect(e.note).toContain("discharge");
  });
  it("keeps only change_in_size for whole breast", () => {
    const e = validateEntry(
      { changes: [{ type: "change_in_size", since_when: "since last month" }, { type: "lump" }] },
      { breast: "right", zone: "whole_breast" },
    );
    expect(e.changes).toEqual([{ type: "change_in_size", since_when: "since last month" }]);
  });
  it("rejects invalid pain values without requiring a pain follow-up", () => {
    const e = validateEntry({ pain: "a bit", confirmed: true }, { breast: "left", zone: "nipple" });
    expect(e.pain).toBeNull();
    expect(e.confirmed).toBe(true);
    expect(e.note).toContain("a bit");
  });
});

describe("keyword matcher", () => {
  it("maps 'a small hard ball' to lump, not hardening", () => {
    const r = matchKeywords("A small hard ball since last week, no pain", { breast: "left", zone: "upper_outer", lang: "en" });
    const e = validateEntry(r.entry, { breast: "left", zone: "upper_outer" });
    expect(e.changes.map((c) => c.type)).toEqual(["lump"]);
    expect(e.changes[0]?.since_when).toBe("since last week");
    expect(e.pain).toBe("no");
  });
  it("flags questions", () => {
    const r = matchKeywords("Es peligroso? Tengo un bulto", { breast: "right", zone: "upper_inner", lang: "es" });
    expect(r.asked_a_question).toBe(true);
  });
  it("works in German", () => {
    const r = matchKeywords("Rötung seit zwei Wochen, tut weh", { breast: "right", zone: "nipple", lang: "de" });
    const e = validateEntry(r.entry, { breast: "right", zone: "nipple" });
    expect(e.changes[0]?.type).toBe("redness");
    expect(e.pain).toBe("yes");
  });
});
