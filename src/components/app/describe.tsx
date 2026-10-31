import type { Entry } from "@/lib/schema";
import { Icon } from "@/components/icons";
import { useApp } from "./context";

export function EntryChips({ e }: { e: Entry }) {
  const { tt } = useApp();
  return (
    <div className="flex flex-wrap gap-2">
      <Chip label={`${e.region_number ? tt("number", { n: e.region_number }) + ": " : ""}${tt(e.breast)} · ${tt(`zone_${e.zone}`)}`} icon={e.zone === "whole_breast" ? "whole_breast" : undefined} />
      {!e.pain && <Chip label={tt("pain_unmentioned")} />}
      {e.pain && <Chip icon={`pain_${e.pain}`} label={tt(`pain_${e.pain}`)} />}
      {e.no_changes && <Chip icon="no_changes" label={tt("change_no_changes")} />}
      {e.changes.map((c) => (
        <Chip key={c.type} icon={c.type} label={tt(`change_${c.type}`) + (c.since_when ? ` · ${c.since_when}` : "")} />
      ))}
      {e.note && <p className="w-full rounded-xl bg-muted px-3 py-2 text-base italic">“{e.note}”</p>}
    </div>
  );
}

function Chip({ icon, label }: { icon?: string | undefined; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-2 text-base font-bold">
      {icon && <Icon name={icon} className="h-7 w-7" />}
      {label}
    </span>
  );
}
