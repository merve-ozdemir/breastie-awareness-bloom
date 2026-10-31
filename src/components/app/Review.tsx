import { Mascot } from "./Mascot";
import { DoctorSummary } from "./DoctorSummary";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { ALLOWED_CHANGES, BREASTS, ZONES_ORDER, completeExam, entryKey, validateEntry, type Breast, type Entry, type Pain, type Zone } from "@/lib/schema";
import type { ExamResult } from "@/lib/exam";
import { useApp } from "./context";
import { EntryChips } from "./describe";
import { ExamDiagram } from "./ExamDiagram";
import { BigButton, RoundAction, Tile } from "./ui";

export function EntryCard({
  e,
  onEdit,
  onDelete,
}: {
  e: Entry;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}) {
  const { tt } = useApp();
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <EntryChips e={e} />
      {(onEdit || onDelete) && (
        <div className="mt-3 flex gap-2">
          {onEdit && <CardBtn icon="edit" label={tt("edit")} onClick={onEdit} />}
          {onDelete && <DeleteButton onDelete={onDelete} />}
        </div>
      )}
    </div>
  );
}

function CardBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className="tap h-auto min-h-16 whitespace-normal [&_svg]:size-7 flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-muted text-sm font-bold active:scale-95">
      <Icon name={icon} className="h-7 w-7" />
      {label}
    </Button>
  );
}

/** Remove button with a yes/no check. */
function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const { tt } = useApp();
  const [asking, setAsking] = useState(false);
  if (!asking) return <CardBtn icon="trash" label={tt("remove_finding")} onClick={() => setAsking(true)} />;
  return (
    <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl bg-muted p-4">
      <span className="text-lg font-extrabold">{tt("delete_confirm")}</span>
      <div className="flex gap-8">
        <RoundAction icon="check" label={tt("yes")} onClick={onDelete} />
        <RoundAction icon="cross" label={tt("no")} variant="soft" onClick={() => setAsking(false)} />
      </div>
    </div>
  );
}

export function EntryGroups({ entries, showUnchecked = true }: { entries: Entry[]; showUnchecked?: boolean }) {
  const { tt } = useApp();
  const map = new Map(entries.map((e) => [entryKey(e), e]));
  return (
    <div className="flex flex-col gap-6">
      {BREASTS.map((b) => (
        <section key={b} className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">{tt(b)}</h2>
          {ZONES_ORDER.map((z) => {
            const e = map.get(`${b}:${z}`);
            if (e && e.mentioned !== false) return <EntryCard key={z} e={e} />;
            if (!showUnchecked && !e) return null;
            return (
              <div key={z} className="flex items-center justify-between rounded-2xl border-2 border-dashed px-4 py-3 text-muted-foreground">
                <span className="font-bold">{tt(`zone_${z}`)}</span>
                <span className="text-sm">{tt("nothing_recorded")}</span>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

const SINCE = ["days", "weeks", "months", "longer", "unknown"];

/** Tap-to-change options for one finding; every change passes validateEntry. */
function FindingEditor({ e, onChange }: { e: Entry; onChange: (e: Entry) => void }) {
  const { tt } = useApp();
  const set = (patch: Partial<Entry>) => onChange(validateEntry({ ...e, ...patch, mentioned: true, source: "edited" }, { breast: e.breast, zone: e.zone }));
  const since = e.since_when ?? e.changes.find((c) => c.since_when)?.since_when ?? null;
  const sinceOptions = SINCE.map((s) => tt(`since_${s}`));
  if (since && !sinceOptions.includes(since)) sinceOptions.unshift(since);
  const setSince = (v: string) => {
    const next = since === v ? null : v;
    set({ since_when: next, changes: e.changes.map((c) => ({ ...c, since_when: next })) });
  };
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-extrabold">{tt("pain_label")}</h3>
      <div className="grid grid-cols-3 gap-2">
        {(["yes", "no", "not_sure"] as const).map((p) => (
          <Tile key={p} icon={`pain_${p}`} label={tt(`pain_${p}`)} selected={e.pain === p} onClick={() => set({ pain: (e.pain === p ? null : p) as Pain })} />
        ))}
      </div>
      <h3 className="text-xl font-extrabold">{tt("changes_heading")}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Tile icon="no_changes" label={tt("change_no_changes")} selected={e.no_changes} onClick={() => set({ no_changes: !e.no_changes, changes: [] })} />
        {ALLOWED_CHANGES[e.zone].map((c) => {
          const on = e.changes.some((x) => x.type === c);
          return (
            <Tile key={c} icon={c} label={tt(`change_${c}`)} selected={on}
              onClick={() => set({ no_changes: false, changes: on ? e.changes.filter((x) => x.type !== c) : [...e.changes, { type: c, since_when: since }] })} />
          );
        })}
      </div>
      <h3 className="text-xl font-extrabold">{tt("since_when")}</h3>
      <div className="grid grid-cols-2 gap-2">
        {sinceOptions.map((s) => (
          <Button key={s} variant="outline" aria-pressed={since === s} onClick={() => setSince(s)}
            className={`min-h-16 whitespace-normal rounded-xl font-bold ${since === s ? "border-primary bg-primary-soft" : ""}`}>
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}

const order = (e: Entry) => BREASTS.indexOf(e.breast) * 10 + ZONES_ORDER.indexOf(e.zone);
const placeName = (tt: (id: string, p?: Record<string, string | number>) => string, e: { breast: Breast; zone: Zone; region_number: number | null }) =>
  `${e.region_number ? `${tt("number", { n: e.region_number })}: ` : ""}${tt(e.breast)} · ${tt(`zone_${e.zone}`)}`;

/**
 * One step per unclear finding, then per region not yet confirmed, then a summary.
 * The current step is always the first unfinished one; Back un-confirms the last region.
 */
export function ReviewStepper({
  result,
  setResult,
  confirmed,
  setConfirmed,
  onRecordMore,
  onSave,
  saving,
}: {
  result: ExamResult;
  setResult: (f: (r: ExamResult) => ExamResult) => void;
  confirmed: string[];
  setConfirmed: (f: (c: string[]) => string[]) => void;
  onRecordMore: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { tt } = useApp();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const mentioned = result.entries.filter((e) => e.mentioned);
  const pending = mentioned.filter((e) => !confirmed.includes(entryKey(e))).sort((a, b) => order(a) - order(b));
  const total = confirmed.length + result.unresolved.length + pending.length + 1;
  const unconfirm = (key: string) => setConfirmed((c) => c.filter((k) => k !== key));
  const back = () => { setEditing(false); setConfirmed((c) => c.slice(0, -1)); };
  const putEntry = (e: Entry) => setResult((r) => ({ ...r, entries: completeExam([...r.entries.filter((x) => x.mentioned && entryKey(x) !== entryKey(e)), e]) }));
  const removeEntry = (e: Entry) => {
    setResult((r) => ({ ...r, entries: completeExam(r.entries.filter((x) => x.mentioned && entryKey(x) !== entryKey(e))) }));
    unconfirm(entryKey(e));
  };

  const header = (
    <>
      {result.asked_a_question && <p className="text-lg font-semibold">{tt("cannot_advise")}</p>}
      <p className="text-sm font-bold text-muted-foreground">{tt("step_of", { n: confirmed.length + 1, total })}</p>
    </>
  );
  const backButton = confirmed.length > 0 && <BigButton icon="back" label={tt("back")} variant="soft" onClick={back} />;

  const unclear = result.unresolved[0];
  if (unclear) {
    const assign = (breast: Breast, zone: Zone) => {
      const entry = validateEntry({ ...unclear, location_unclear: false, mentioned: true, source: "edited" }, { breast, zone });
      setResult((r) => ({ ...r, entries: completeExam([...r.entries.filter((e) => e.mentioned), entry]), unresolved: r.unresolved.slice(1) }));
      unconfirm(entryKey(entry));
    };
    return (
      <div className="flex flex-col gap-5 pb-8">
        {header}
        <h1 className="text-3xl font-extrabold">{tt("where_is_this")}</h1>
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          {(unclear.note || unclear.transcript) && <p className="mb-3 italic">“{unclear.note || unclear.transcript}”</p>}
          <div className="flex flex-wrap gap-3">
            {unclear.changes.map((c) => (
              <span key={c.type} className="flex items-center gap-2 font-bold"><Icon name={c.type} className="h-7 w-7" />{tt(`change_${c.type}`)}</span>
            ))}
          </div>
        </section>
        <p className="text-center text-xl font-extrabold">{tt("choose_location")}</p>
        <ExamDiagram entries={result.entries} onPick={assign} whole />
        <div className="flex gap-2">
          <DeleteButton onDelete={() => setResult((r) => ({ ...r, unresolved: r.unresolved.slice(1) }))} />
        </div>
      </div>
    );
  }

  const current = pending[0];
  if (current) {
    const key = entryKey(current);
    return (
      <div key={key} className="flex flex-col gap-5 pb-28">
        {header}
        {confirmed.length === 0 && <Mascot message={tt("review_mascot")} />}
        <h1 className="text-2xl font-extrabold">{placeName(tt, current)}</h1>
        <ExamDiagram entries={result.entries} highlight={current} />
        {editing ? (
          <>
            <FindingEditor e={current} onChange={putEntry} />
            <BigButton icon="check" label={tt("done")} variant="soft" onClick={() => setEditing(false)} />
          </>
        ) : (
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <EntryChips e={current} />
            <div className="mt-3 flex gap-2">
              <CardBtn icon="edit" label={tt("edit")} onClick={() => setEditing(true)} />
              <CardBtn icon="mic" label={tt("record_more")} onClick={onRecordMore} />
            </div>
          </div>
        )}
        <div className="flex gap-2"><DeleteButton onDelete={() => removeEntry(current)} /></div>
        {backButton}
        <div className="sticky bottom-3 bg-background py-3">
          <BigButton icon="check" label={tt("confirm")} onClick={() => { setEditing(false); setConfirmed((c) => [...c, key]); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-28">
      {header}
      <Mascot message={tt("review_mascot")} />
      <h1 className="text-3xl font-extrabold">{tt("review_summary_title")}</h1>
      {adding && <p className="text-center text-xl font-extrabold">{tt("choose_location")}</p>}
      <ExamDiagram
        entries={result.entries}
        whole={adding}
        onPick={adding ? (breast, zone) => {
          const existing = mentioned.find((e) => e.breast === breast && e.zone === zone);
          if (existing) unconfirm(entryKey(existing));
          else putEntry(validateEntry({ mentioned: true, source: "edited" }, { breast, zone }));
          setAdding(false);
        } : undefined}
      />
      {adding ? (
        <BigButton icon="cross" label={tt("cancel")} variant="soft" onClick={() => setAdding(false)} />
      ) : (
        <>
          {[...mentioned].sort((a, b) => order(a) - order(b)).map((e) => (
            <EntryCard key={entryKey(e)} e={e} onEdit={() => unconfirm(entryKey(e))} onDelete={() => removeEntry(e)} />
          ))}
          <section className="rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="flex items-center gap-2 text-xl font-extrabold"><Icon name="edit" className="h-6 w-6 text-primary" />{tt("notes_title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tt("notes_hint")}</p>
            <textarea aria-label={tt("notes_title")} value={result.general_note} onChange={(ev) => { const v = ev.target.value; setResult((r) => ({ ...r, general_note: v })); }} placeholder={tt("note_placeholder")} rows={4} className="mt-3 w-full rounded-xl border-2 bg-background p-3 text-lg" />
          </section>
          <DoctorSummary checkDate={new Date().toISOString()} cycleDay={null} entries={result.entries} note={result.general_note} />
          {!mentioned.length && <p className="text-center text-muted-foreground">{tt("nothing_recorded")}</p>}
          <BigButton icon="plus" label={tt("add_finding")} variant="soft" onClick={() => { setAdding(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          <BigButton icon="mic" label={tt("record_more")} variant="soft" onClick={onRecordMore} />
          {backButton}
          <div className="sticky bottom-3 bg-background py-3">
            <BigButton icon="check" label={saving ? tt("mic_processing") : tt("confirm_save")} disabled={saving} onClick={onSave} />
          </div>
        </>
      )}
    </div>
  );
}
