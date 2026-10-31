// Offline keyword matcher used in Demo mode when no AI service is connected.
// Keyword lists live in each language file under "_keywords".
import { keywords } from "@/i18n";
import { ALLOWED_CHANGES, type Breast, type Zone } from "./schema";

export type ProcessResult = {
  transcript: string;
  entry: Record<string, unknown>;
  missing_fields: string[];
  mentions_other_zone: Zone | null;
  asked_a_question: boolean;
  understood: boolean;
};

function norm(s: string) {
  return s.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
}

function findAll(text: string, kw: string): number[] {
  const out: number[] = [];
  const esc = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}])(${esc})(?=[^\\p{L}]|$)`, "gu");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m.index + (m[1]?.length ?? 0));
  return out;
}

function negated(text: string, idx: number, negators: string[]): boolean {
  const before = text.slice(0, idx).split(/[^\p{L}']+/u).filter(Boolean).slice(-2);
  return before.some((w) => negators.includes(w));
}

function hasAny(text: string, list: string[] = [], negators: string[] = []): boolean {
  return list.some((kw) => findAll(text, kw).some((i) => !negated(text, i, negators)));
}

function captureSince(original: string, text: string, list: string[] = []): string | null {
  let best: number | null = null;
  for (const kw of list) {
    for (const i of findAll(text, kw)) if (best === null || i < best) best = i;
  }
  if (best === null) return null;
  const rest = original.slice(best);
  const end = rest.search(/[.,;!?]/);
  return (end === -1 ? rest : rest.slice(0, end)).trim() || null;
}

export function matchKeywords(
  input: string,
  ctx: { breast: Breast; zone: Zone; lang: string },
): ProcessResult {
  const transcript = input.trim();
  const text = norm(transcript);
  const kw = keywords(ctx.lang);
  const neg = kw.negators ?? [];

  const types = new Set<string>();
  for (const type of ALLOWED_CHANGES[ctx.zone]) {
    if (hasAny(text, kw[type], neg)) types.add(type);
  }
  if (types.has("lump")) types.delete("hardening"); // "a small hard ball" -> lump

  const since = captureSince(transcript, text, kw.since);
  const changes = [...types].map((type) => ({ type, since_when: since }));

  let pain: string | null = null;
  const painWords = [...(kw.pain_yes ?? []), ...(kw.pain_no ?? [])];
  if (hasAny(text, kw.pain_no)) pain = "no";
  else if (hasAny(text, kw.pain_not_sure) && hasAny(text, painWords)) pain = "not_sure";
  else if (hasAny(text, kw.pain_yes, neg)) pain = "yes";

  const no_changes = changes.length === 0 && hasAny(text, kw.no_changes);
  const both = hasAny(text, kw.both);

  let mentions_other_zone: Zone | null = null;
  if (ctx.zone !== "nipple" && hasAny(text, kw.zone_nipple)) mentions_other_zone = "nipple";
  else if (ctx.zone !== "armpit" && hasAny(text, kw.zone_armpit)) mentions_other_zone = "armpit";

  const asked_a_question = transcript.includes("?") || hasAny(text, kw.question);

  const understood = changes.length > 0 || pain !== null || no_changes;
  const note = changes.length === 0 && !no_changes && transcript && !asked_a_question ? transcript : "";

  const missing_fields: string[] = [];
  if (pain === null) missing_fields.push("pain");

  return {
    transcript,
    entry: {
      breast: ctx.breast,
      zone: ctx.zone,
      pain,
      no_changes,
      changes,
      note,
      transcript,
      confirmed: false,
    },
    missing_fields,
    mentions_other_zone,
    asked_a_question,
    understood: understood || mentions_other_zone !== null,
  };
}

/** Single seam for the future "process-zone" server function. */
export async function processZone(
  input: string,
  ctx: { breast: Breast; zone: Zone; lang: string },
): Promise<ProcessResult> {
  await new Promise((r) => setTimeout(r, 500));
  return matchKeywords(input, ctx);
}


/** The full-exam seam: local Demo text or transient Cloud audio upload. */
export async function processExam(input: string | File | null, ctx: { lang: string; demo: boolean }): Promise<import('./exam').ExamResult> {
  const { matchExam } = await import('./exam');
  if (ctx.demo) return matchExam(typeof input === 'string' ? input : '', ctx.lang);
  if (!(input instanceof File)) throw new Error('empty');
  const body = new FormData(); body.append('file', input); body.append('lang', ctx.lang);
  const res = await fetch('/api/process-exam', { method: 'POST', body });
  if (!res.ok) { const error = await res.json(); throw new Error(error.message); }
  const { readEvents } = await import('./sse');
  let result: import('./exam').ExamResult | null = null;
  await readEvents(res, (event) => { if (event['type'] === 'result') result = event['result'] as import('./exam').ExamResult; if (event['type'] === 'error') throw new Error(String(event['message'])); });
  if (!result) throw new Error('empty');
  return result;
}
