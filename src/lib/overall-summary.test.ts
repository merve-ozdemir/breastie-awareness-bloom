import { describe, expect, it } from "vitest";
import { t } from "@/i18n";
import { overallSummary } from "@/components/app/Profile";
import { validateEntry, type Session } from "@/lib/schema";

const tt = (id: string, p?: Record<string, string | number>) => t("en", id, p);
const s = (date: string, entries: Session["entries"], note = ""): Session => ({ id: date, check_date: date, cycle_day: null, language: "en", entries, confirmed: true, general_note: note });

describe("overall self-check summary", () => {
  it("is a single paragraph, not a list", () => {
    const lump = validateEntry({ mentioned: true, changes: [{ type: "lump", since_when: null }] }, { breast: "left", zone: "upper_outer" });
    const text = overallSummary([s("2026-01-05", [lump]), s("2026-02-05", [])], tt, "en");
    expect(text).not.toContain("\n");
    expect(text).toContain("2 self-checks");
    expect(text).toContain("showed no findings");
  });
  it("says nothing was reported when all checks are clear", () => {
    expect(overallSummary([s("2026-01-05", [])], tt, "en")).toContain("No changes or pain were reported.");
  });
});
