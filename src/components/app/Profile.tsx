import { useEffect, useState } from "react";
import { listSessions } from "@/lib/db";
import { type Entry, type Session } from "@/lib/schema";
import { useApp } from "./context";
import { Mascot } from "./Mascot";

type T = (id: string, p?: Record<string, string | number>) => string;
const found = (e: Entry) => e.mentioned && (e.changes.length > 0 || e.pain === "yes");

function joinList(items: string[], and: string) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

/** One plain paragraph summarising all saved checks, for showing a doctor. */
export function overallSummary(sessions: Session[], tt: T, lang: string): string {
  if (!sessions.length) return tt("overall_empty");
  const sorted = [...sessions].sort((a, b) => a.check_date.localeCompare(b.check_date));
  const d = (s: Session) => new Date(s.check_date).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });
  const zone = (z: string) => (tt(`region_${z}`) === `region_${z}` ? tt(`zone_${z}`) : tt(`region_${z}`)).toLowerCase();
  const where = (e: Entry) => `${tt(`side_${e.breast}`)} ${zone(e.zone)}`;
  const and = tt("and");
  const out = [tt("overall_count", { n: sorted.length, from: d(sorted[0]!), to: d(sorted[sorted.length - 1]!) })];

  const counts = new Map<string, number>();
  for (const s of sorted) for (const e of s.entries) if (e.mentioned) for (const c of e.changes) {
    const k = `${tt(`change_${c.type}`).toLowerCase()} (${where(e)})`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const painChecks = sorted.filter((s) => s.entries.some((e) => e.mentioned && e.pain === "yes")).length;
  if (!counts.size && !painChecks) out.push(tt("overall_clear"));
  if (counts.size) out.push(tt("overall_changes", { list: joinList([...counts].map(([k, n]) => (n > 1 ? `${k} ${tt("times", { n })}` : k)), and) }));
  if (painChecks) out.push(tt("overall_pain", { k: painChecks, n: sorted.length }));
  const notes = sorted.filter((s) => s.general_note?.trim()).length;
  if (notes) out.push(tt("overall_notes", { k: notes }));

  const last = sorted[sorted.length - 1]!;
  const lastFound = last.entries.filter(found).map((e) => `${joinList(e.changes.map((c) => tt(`change_${c.type}`).toLowerCase()).concat(e.pain === "yes" ? [tt("pain_label").toLowerCase()] : []), and)} (${where(e)})`);
  out.push(tt("overall_latest", { date: d(last), state: lastFound.length ? tt("overall_latest_found", { list: joinList(lastFound, and) }) : tt("overall_latest_clear") }));
  return out.join(" ");
}

export function Profile() {
  const { tt, lang, settings, update } = useApp();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  useEffect(() => { listSessions().then(setSessions).catch(() => setSessions([])); }, []);
  const name = (settings.name ?? "").trim();

  return (
    <div className="flex flex-col gap-5 pb-8">
      <Mascot message={tt("profile_hello", { name: name ? `, ${name}` : "" })} />
      <label className="flex flex-col gap-2 font-bold">
        {tt("profile_name")}
        <input value={settings.name ?? ""} maxLength={40} onChange={(e) => update({ name: e.target.value })} placeholder={tt("profile_name_hint")} className="min-h-14 rounded-xl border-2 bg-card px-4 text-lg font-normal" />
      </label>
      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="text-xl font-extrabold">{tt("overall_title")}</h2>
        <p className="mt-2 text-lg leading-relaxed">{sessions ? overallSummary(sessions, tt, lang) : "…"}</p>
      </section>
    </div>
  );
}
