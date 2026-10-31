import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { listSessions } from "@/lib/db";
import { type Entry, type Session } from "@/lib/schema";
import { useApp } from "./context";
import { EntryGroups } from "./Review";
import { DoctorSummary } from "./DoctorSummary";

function fmt(d: string, lang: string) {
  return new Date(d).toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" });
}

const hasSomething = (e: Entry) => e.changes.length > 0 || e.pain === "yes" || e.pain === "not_sure" || !!e.note;

export function History() {
  const { tt, lang } = useApp();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [open, setOpen] = useState<Session | null>(null);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    listSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  if (open) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <button onClick={() => setOpen(null)} className="tap flex items-center gap-2 self-start rounded-full bg-card px-4 font-bold shadow-soft">
          <Icon name="back" className="h-6 w-6" /> {tt("back")}
        </button>
        <h2 className="text-2xl font-extrabold">
          {fmt(open.check_date, lang)}
          {open.cycle_day != null && <span className="ml-2 text-base font-semibold text-muted-foreground">{tt("cycle_day", { n: open.cycle_day })}</span>}
        </h2>
        <EntryGroups entries={open.entries} showUnchecked={false} />
        {open.general_note && <section className="rounded-2xl bg-card p-4 shadow-soft"><h3 className="text-xl font-extrabold">{tt("notes_title")}</h3><p className="mt-2 whitespace-pre-wrap text-lg">{open.general_note}</p></section>}
        <DoctorSummary checkDate={open.check_date} cycleDay={open.cycle_day} entries={open.entries} note={open.general_note} />
      </div>
    );
  }

  if (!sessions) return null;
  if (!sessions.length)
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-lg font-bold text-muted-foreground">
        {tt("history_empty")}
      </div>
    );

  const years = [...new Set(sessions.map((s) => new Date(s.check_date).getFullYear()))].sort((x, y) => x - y);
  const yearIdx = Math.max(0, years.indexOf(year ?? years[years.length - 1]!));
  const shownYear = years[yearIdx]!;
  const months = Array.from({ length: 12 }, (_, m) => ({
    m,
    label: new Date(shownYear, m, 1).toLocaleDateString(lang, { month: "short" }),
    done: sessions.some((s) => { const d = new Date(s.check_date); return d.getFullYear() === shownYear && d.getMonth() === m; }),
  }));

  return (
    <div className="flex flex-col gap-6 pb-8">
      <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <button aria-label={tt("back")} disabled={yearIdx === 0} onClick={() => setYear(years[yearIdx - 1]!)} className="tap grid h-12 w-12 place-items-center rounded-full disabled:opacity-30">
            <Icon name="back" className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-extrabold">{shownYear}</h2>
          <button aria-label={String(years[yearIdx + 1] ?? "")} disabled={yearIdx >= years.length - 1} onClick={() => setYear(years[yearIdx + 1]!)} className="tap grid h-12 w-12 rotate-180 place-items-center rounded-full disabled:opacity-30">
            <Icon name="back" className="h-6 w-6" />
          </button>
        </div>
        <p className="text-sm font-semibold text-muted-foreground">{tt("timeline_year")}</p>
        <ol className="relative grid grid-cols-6 gap-y-4">
          {months.map(({ m, label, done }) => (
            <li key={m} className="flex flex-col items-center gap-1">
              <span className={`grid h-10 w-10 place-items-center rounded-full border-2 ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                {done && <Icon name="check" className="h-6 w-6" />}
              </span>
              <span className="text-xs font-bold capitalize">{label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">{tt("records")}</h2>
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => {
            const n = s.entries.filter((e) => e.mentioned !== false && hasSomething(e)).length;
            return (
              <li key={s.id}>
                <button onClick={() => setOpen(s)} className="tap flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-soft">
                  <Icon name="calendar" className="h-10 w-10 shrink-0 text-primary" />
                  <span className="flex flex-1 flex-col">
                    <span className="text-lg font-extrabold">{fmt(s.check_date, lang)}</span>
                    <span className="text-sm text-muted-foreground">
                      {n ? tt("findings_count", { n }) : tt("no_findings")}
                      {s.cycle_day != null && ` · ${tt("cycle_day", { n: s.cycle_day })}`}
                    </span>
                  </span>
                  <Icon name="back" className="h-6 w-6 rotate-180 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
