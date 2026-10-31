import { keywords } from '@/i18n';
import { ALLOWED_CHANGES, completeExam, regionFromNumber, validateEntry, type Breast, type Change, type Entry, type Pain, type Zone } from './schema';

type Dictionary = Record<string, string[]>;
const files = import.meta.glob<{ default: Dictionary }>('../data/synonyms/*.json', { eager: true });
export function synonyms(lang: string): Dictionary {
  return files[`../data/synonyms/${lang}.json`]?.default ?? files['../data/synonyms/en.json']?.default ?? {};
}
export type UnlocatedFinding = {
  breast: Breast | null; zone: Zone | null; pain: Pain; changes: Change[]; no_changes: boolean;
  note: string; since_when: string | null; transcript: string; location_unclear: true;
};
export type ExamResult = { entries: Entry[]; unresolved: UnlocatedFinding[]; general_note: string; asked_a_question: boolean };
const normalize = (s: string) => s.toLocaleLowerCase().replace(/[’`]/g, "'");
function positions(text: string, words: string[] = []): { index: number; word: string }[] {
  return words.flatMap((word) => {
    const escaped = normalize(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return [...normalize(text).matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'gu'))].map((m) => ({ index: m.index, word }));
  });
}
const has = (text: string, words?: string[]) => positions(text, words).length > 0;
function positive(text: string, words: string[] | undefined, neg: string[]) {
  return positions(text, words).some(({ index }) => !text.slice(0, index).split(/[^\p{L}']+/u).filter(Boolean).slice(-2).some((w) => neg.includes(normalize(w))));
}
function location(text: string, d: Dictionary): { breast: Breast | null; zone: Zone | null; both: boolean } {
  const markers = [...positions(text, d['number'])].sort((a,b) => a.index-b.index);
  for (const m of markers) {
    const rest = text.slice(m.index + m.word.length).trim();
    const digit = rest.match(/^([1-9]|1[0-2])(?!\d)/)?.[0];
    const wordIndex = (d['number_words'] ?? []).findIndex((word) => positions(rest, [word]).some((p) => p.index === 0));
    const found = regionFromNumber(digit ? Number(digit) : wordIndex + 1);
    if (found) return { ...found, both: false };
  }
  const both = has(text, d['both']);
  const { breast, relative } = sides(text, d);
  let zone: Zone | null = null;
  if (has(text, d['zone_nipple'])) zone = 'nipple';
  else if (has(text, d['zone_armpit'])) zone = 'armpit';
  else if (has(text, d['whole'])) zone = 'whole_breast';
  else {
    const up = has(text, d['upper']), down = has(text, d['lower']);
    let outer = has(text, d['outer']), inner = has(text, d['inner']);
    // "left/right side" of a known breast, seen looking down: same side as the breast = outer.
    if (outer === inner && breast && relative) { outer = relative === breast; inner = !outer; }
    if (up !== down && outer !== inner) zone = `${up ? 'upper' : 'lower'}_${outer ? 'outer' : 'inner'}`;
  }
  return { breast, zone, both };
}

type Side = { index: number; word: string; side: Breast };
function sideWords(text: string, d: Dictionary): Side[] {
  return [...positions(text, d['left']).map((p) => ({ ...p, side: 'left' as Breast })), ...positions(text, d['right']).map((p) => ({ ...p, side: 'right' as Breast }))]
    // drop shorter matches nested inside longer ones ("linke" inside "linken" never matches, but keep this safe)
    .sort((a, b) => a.index - b.index);
}
/** Side words directly next to a breast word name the breast; the rest describe a side within it. */
export function sides(text: string, d: Dictionary): { breast: Breast | null; relative: Breast | null } {
  const all = sideWords(text, d);
  const breastWords = positions(text, d['breast']);
  const marks = all.filter((s) => breastWords.some((b) => {
    const gap = b.index > s.index ? text.slice(s.index + s.word.length, b.index) : text.slice(b.index + b.word.length, s.index);
    return gap.length <= 3 && !/[\p{L}]{3,}/u.test(gap);
  }));
  const named = new Set(marks.map((m) => m.side));
  if (named.size === 1) {
    const rest = new Set(all.filter((s) => !marks.includes(s)).map((s) => s.side));
    return { breast: [...named][0]!, relative: rest.size === 1 ? [...rest][0]! : null };
  }
  if (named.size > 1) return { breast: null, relative: null };
  const unique = new Set(all.map((s) => s.side));
  return { breast: unique.size === 1 ? [...unique][0]! : null, relative: null };
}
/** Split points: only side words that name a breast (not "left side of…"). */
function breastStarts(input: string, d: Dictionary) {
  const all = sideWords(input, d);
  if (!positions(input, d['breast']).length) return all;
  const breastWords = positions(input, d['breast']);
  return all.filter((s) => breastWords.some((b) => {
    const gap = b.index > s.index ? input.slice(s.index + s.word.length, b.index) : input.slice(b.index + b.word.length, s.index);
    return gap.length <= 3 && !/[\p{L}]{3,}/u.test(gap);
  }));
}

/** Local Demo extraction is conservative: no inferred side, location or pain. */
export function matchExam(input: string, lang: string): ExamResult {
  const d = synonyms(lang), legacy = keywords(lang);
  const entries: Entry[] = [], unresolved: UnlocatedFinding[] = [], general: string[] = [];
  const asked_a_question = input.includes('?') || has(input, legacy.question);
  // Split at named/numbered new locations, not at ordinary conjunctions inside a finding.
  const starts = [...positions(input, d['number']), ...positions(input, d['left']), ...positions(input, d['right']), ...positions(input, d['both'])].sort((a,b) => a.index-b.index);
  const breaks = new Set<number>([0]);
  for (const match of input.matchAll(/[.;!\n]+\s*/g)) breaks.add(match.index + match[0].length);
  for (const p of starts) {
    if (p.index === 0) continue;
    const prefix = input.slice(0, p.index);
    const lastBreak = Math.max(...[...breaks].filter(b => b < p.index));
    const segment = input.slice(lastBreak, p.index);
    if (/[.;!\n]\s*$/.test(prefix) || (segment.length > 10 && Object.keys(ALLOWED_CHANGES).some((z) => ALLOWED_CHANGES[z as Zone].some((c) => has(segment,d[c]))))) breaks.add(p.index);
  }
  const boundaries = [...breaks, input.length].sort((a,b)=>a-b);
  for (let i=0;i<boundaries.length-1;i++) {
    const original = input.slice(boundaries[i],boundaries[i+1]).trim().replace(/^[,;]+/, '').trim();
    if (!original) continue;
    const loc = location(original,d);
    const text=normalize(original), neg=d['negators'] ?? [];
    const all = [...new Set(Object.values(ALLOWED_CHANGES).flat())];
    const types=all.filter((type)=>positive(text,d[type],neg));
    // A sore on the skin is erosion, not the adjective "sore" indicating pain.
    const erosion=has(text,d['sore_skin']);
    let pain: Pain=null;
    if (has(text,d['pain_no'])) pain='no';
    else if (has(text,d['pain_not_sure']) && has(text,d['pain_yes'])) pain='not_sure';
    else if (positive(text,erosion ? (d['pain_yes'] ?? []).filter((w)=>w!=='sore') : d['pain_yes'],neg)) pain='yes';
    // "pulled in" is nipple retraction or skin indentation, depending on explicit region.
    const contextual=types.filter((c)=> c==='retraction' ? loc.zone==='nipple' : c==='indentation' ? loc.zone!=='nipple' : true);
    const sincePos=positions(original,d['since']).sort((a,b)=>a.index-b.index)[0];
    const since=sincePos ? original.slice(sincePos.index).split(/[.,;!?\n]/)[0]?.trim() ?? null : null;
    const no_changes=has(text,d['no_changes']) && contextual.length===0;
    const changes=contextual.map((type)=>({type,since_when:since}));
    if (!changes.length && pain===null && !no_changes) { general.push(original); continue; }
    const raw={pain,changes,no_changes,since_when:since,note:original,transcript:original,mentioned:true,source:'voice'};
    if (loc.zone && (loc.breast || loc.both)) {
      const breasts: Breast[]=loc.both ? ['left','right'] : loc.breast ? [loc.breast] : [];
      for (const breast of breasts) entries.push(validateEntry(raw,{breast,zone:loc.zone}));
    } else unresolved.push({...raw,breast:loc.breast,zone:loc.zone,location_unclear:true});
  }
  return {entries:completeExam(entries),unresolved,general_note:general.join('\n'),asked_a_question};
}

/** Shared validation for Cloud extraction. Unlocated findings are validated on assignment. */
export function normalizeExam(raw: { findings: unknown[]; general_note: string; asked_a_question: boolean }, transcript: string): ExamResult {
  const entries: Entry[]=[], unresolved: UnlocatedFinding[]=[];
  for (const item of raw.findings) {
    if (!item || typeof item !== 'object') continue;
    const r=item as Record<string,unknown>;
    const breast=r['breast']==='left'||r['breast']==='right' ? r['breast'] : null;
    const zone=typeof r['region']==='string' && Object.keys(ALLOWED_CHANGES).includes(r['region']) ? r['region'] as Zone : null;
    const payload={...r,transcript,mentioned:true,source:'voice',changes:Array.isArray(r['changes'])?r['changes'].map((c)=>typeof c==='string'?{type:c,since_when:r['since_when']}:c):[]};
    if (breast && zone && r['location_unclear']!==true) entries.push(validateEntry(payload,{breast,zone}));
    else {
      const all=Object.values(ALLOWED_CHANGES).flat();
      const changes: Change[]=[];
      let note=typeof r['note']==='string'?r['note']:'';
      for(const c of payload.changes) {
        const value=c as Record<string,unknown>;
        if(typeof value['type']==='string' && all.includes(value['type'] as Change['type'])) changes.push({type:value['type'] as Change['type'],since_when:typeof value['since_when']==='string'?value['since_when']:null});
        else note += ` ${String(value['type']??'')}`;
      }
      unresolved.push({breast,zone,changes,pain:r['pain']==='yes'||r['pain']==='no'||r['pain']==='not_sure'?r['pain']:null,no_changes:r['no_changes']===true,note:note.trim(),since_when:typeof r['since_when']==='string'?r['since_when']:null,transcript,location_unclear:true});
    }
  }
  return {entries:completeExam(entries),unresolved,general_note:raw.general_note,asked_a_question:raw.asked_a_question};
}
