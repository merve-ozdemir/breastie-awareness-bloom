import { useState } from "react";
import { Icon } from "@/components/icons";
import { type Entry } from "@/lib/schema";
import { useApp } from "./context";

type Props = { checkDate: string; cycleDay: number | null; entries: Entry[]; note: string };

const relevant = (e: Entry) => e.mentioned && (e.changes.length > 0 || e.pain === "yes" || e.pain === "not_sure" || !!e.note);

/** Plain-text clinical summary of one record, shown as a card with a copy button. Lists only reported findings. */
export function DoctorSummary({ checkDate, cycleDay, entries, note }: Props) {
  const { tt, lang } = useApp();
  const [copied, setCopied] = useState(false);
  const zoneName = (z: string) => (tt(`region_${z}`) === `region_${z}` ? tt(`zone_${z}`) : tt(`region_${z}`));

  const lines: string[] = [tt("doctor_heading"), `${tt("doctor_date")}: ${new Date(checkDate).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" })}`];
  if (cycleDay != null) lines.push(tt("cycle_day", { n: cycleDay }));
  lines.push("", `${tt("doctor_findings")}:`);
  const found = entries.filter(relevant);
  if (!found.length) lines.push(`- ${tt("doctor_none")}`);
  for (const e of found) {
    const parts = e.changes.map((c) => tt(`change_${c.type}`) + (c.since_when ? ` (${tt("doctor_since")}: ${c.since_when})` : ""));
    if (e.pain === "yes" || e.pain === "not_sure") parts.push(`${tt("pain_label")}: ${tt(`pain_${e.pain}`)}`);
    if (e.since_when) parts.push(`${tt("doctor_since")}: ${e.since_when}`);
    if (e.note) parts.push(e.note);
    const reg = e.region_number != null ? ` (${tt("doctor_region")} ${e.region_number})` : "";
    lines.push(`- ${tt(e.breast)} – ${zoneName(e.zone)}${reg}: ${parts.join("; ")}`);
  }
  if (note.trim()) lines.push("", `${tt("notes_title")}:`, note.trim());
  const text = lines.join("\n");

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <h3 className="text-xl font-extrabold">{tt("doctor_title")}</h3>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-muted p-3 font-sans text-base">{text}</pre>
      <button onClick={copy} className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 font-bold text-primary-foreground">
        <Icon name={copied ? "check" : "edit"} className="h-5 w-5" /> {copied ? tt("doctor_copied") : tt("doctor_copy")}
      </button>
    </section>
  );
}
