export type Breast = "left" | "right";
export type Zone =
  | "upper_outer"
  | "upper_inner"
  | "lower_outer"
  | "lower_inner"
  | "nipple"
  | "armpit"
  | "whole_breast";
export type Pain = "yes" | "no" | "not_sure" | null;

export type ChangeType =
  | "lump"
  | "bump"
  | "hardening"
  | "dimpling"
  | "indentation"
  | "redness"
  | "skin_peeling"
  | "skin_erosion"
  | "growing_veins"
  | "discharge"
  | "retraction"
  | "change_in_size";

export type Change = { type: ChangeType; since_when: string | null };

export type Entry = {
  breast: Breast;
  zone: Zone;
  pain: Pain;
  no_changes: boolean;
  changes: Change[];
  note: string;
  transcript: string;
  confirmed: boolean;
  region_number: number | null;
  mentioned: boolean;
  location_unclear: boolean;
  source: "voice" | "edited" | "default";
  since_when: string | null;
};

export type Session = {
  id: string;
  check_date: string;
  cycle_day: number | null;
  language: string;
  entries: Entry[];
  confirmed: boolean;
  general_note: string;
};

export const BREASTS: Breast[] = ["left", "right"];
export const ZONES_ORDER: Zone[] = [
  "whole_breast",
  "upper_outer",
  "upper_inner",
  "lower_outer",
  "lower_inner",
  "nipple",
  "armpit",
];

const QUADRANT: ChangeType[] = [
  "lump",
  "bump",
  "hardening",
  "dimpling",
  "indentation",
  "redness",
  "skin_peeling",
  "skin_erosion",
  "growing_veins",
];

export const ALLOWED_CHANGES: Record<Zone, ChangeType[]> = {
  upper_outer: QUADRANT,
  upper_inner: QUADRANT,
  lower_outer: QUADRANT,
  lower_inner: QUADRANT,
  nipple: ["discharge", "redness", "skin_peeling", "skin_erosion", "retraction"],
  armpit: ["lump", "bump", "hardening", "redness"],
  whole_breast: ["change_in_size"],
};

const PAINS = ["yes", "no", "not_sure"];

function appendNote(note: string, extra: string): string {
  const e = extra.trim();
  if (!e) return note;
  return note ? `${note} ${e}` : e;
}

/**
 * Coerce any raw (AI or keyword) output into a valid Entry for this zone.
 * Values not allowed for the zone are moved into the note in the original words.
 */
export function validateEntry(raw: unknown, ctx: { breast: Breast; zone: Zone }): Entry {
  const r = (raw && typeof raw === "object" ? raw : {}) as {
    note?: unknown; transcript?: unknown; breast?: unknown; pain?: unknown; changes?: unknown; no_changes?: unknown; confirmed?: unknown; mentioned?: unknown; location_unclear?: unknown; source?: unknown; since_when?: unknown;
  };
  let note = typeof r.note === "string" ? r.note : "";
  const transcript = typeof r.transcript === "string" ? r.transcript : "";

  let breast: Breast = ctx.breast;
  if (r.breast === "left" || r.breast === "right") breast = r.breast;
  else if (r.breast != null && r.breast !== "") note = appendNote(note, String(r.breast));

  const zone = ctx.zone;

  let pain: Pain = null;
  if (typeof r.pain === "string" && PAINS.includes(r.pain)) pain = r.pain as Pain;
  else if (r.pain != null && r.pain !== "") note = appendNote(note, String(r.pain));

  const allowed = ALLOWED_CHANGES[zone];
  const changes: Change[] = [];
  const rawChanges = Array.isArray(r.changes) ? r.changes : [];
  for (const c of rawChanges) {
    const cc = (c && typeof c === "object" ? c : { type: c }) as { type?: unknown; since_when?: unknown };
    const type = String(cc.type ?? "");
    const since = typeof cc.since_when === "string" && cc.since_when.trim() ? cc.since_when : null;
    if (type === "no_changes") continue;
    if ((allowed as string[]).includes(type) && !changes.some((x) => x.type === type)) {
      changes.push({ type: type as ChangeType, since_when: since });
    } else if (type) {
      note = appendNote(note, since ? `${type} (${since})` : type);
    }
  }

  const noChangesFlag =
    r.no_changes === true || rawChanges.some((c) => c === "no_changes" || (c as { type?: string })?.type === "no_changes");
  const no_changes = noChangesFlag && changes.length === 0;

  return {
    breast,
    zone,
    pain,
    no_changes,
    changes,
    note: note.trim(),
    transcript,
    confirmed: r.confirmed === true,
    region_number: regionNumber(breast, zone),
    mentioned: r.mentioned !== false,
    location_unclear: r.location_unclear === true,
    source: r.source === "edited" || r.source === "default" ? r.source : "voice",
    since_when: typeof r.since_when === "string" ? r.since_when : null,
  };
}

export function canConfirm(e: Entry): boolean {
  return !e.location_unclear;
}

export const NUMBERED_ZONES: Zone[] = ["upper_outer", "upper_inner", "lower_outer", "lower_inner", "nipple", "armpit"];

export function regionNumber(breast: Breast, zone: Zone): number | null {
  const i = NUMBERED_ZONES.indexOf(zone);
  return i < 0 ? null : i + 1 + (breast === "right" ? 6 : 0);
}

export function regionFromNumber(n: number): { breast: Breast; zone: Zone } | null {
  if (!Number.isInteger(n) || n < 1 || n > 12) return null;
  const zone = NUMBERED_ZONES[(n - 1) % 6];
  return zone ? { breast: n <= 6 ? "left" : "right", zone } : null;
}

export function completeExam(entries: Entry[]): Entry[] {
  const mentioned = entries.filter((e) => e.mentioned && !e.location_unclear);
  return BREASTS.flatMap((breast) => ZONES_ORDER.map((zone) => {
    const matches = mentioned.filter((e) => e.breast === breast && e.zone === zone);
    if (matches.length) {
      const first = matches[0];
      return validateEntry({ ...first, pain: [...matches].reverse().find(e => e.pain !== null)?.pain ?? null, changes: matches.flatMap((e) => e.changes), note: matches.map((e) => e.note).filter(Boolean).join("\n") }, { breast, zone });
    }
    return validateEntry({ pain: "no", no_changes: true, mentioned: false, source: "default" }, { breast, zone });
  }));
}

export function entryKey(e: { breast: Breast; zone: Zone }): string {
  return `${e.breast}:${e.zone}`;
}
