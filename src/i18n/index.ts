// Phrase dictionary. Each language is one JSON file in this folder; adding a file adds a language.
type Meta = { code: string; name: string; bcp47: string; order: number };
export type Keywords = Partial<Record<
  | "negators" | "since" | "question" | "both" | "zone_nipple" | "zone_armpit" | "no_changes"
  | "pain_yes" | "pain_no" | "pain_not_sure" | (string & {}),
  string[]
>> & { negators?: string[]; since?: string[]; question?: string[]; both?: string[]; zone_nipple?: string[]; zone_armpit?: string[]; no_changes?: string[]; pain_yes?: string[]; pain_no?: string[]; pain_not_sure?: string[] };
export type LangFile = { _meta: Meta; _keywords: Keywords } & Record<string, unknown>;

const files = import.meta.glob<{ default: LangFile }>("./*.json", { eager: true });

export const dictionaries: Record<string, LangFile> = {};
for (const mod of Object.values(files)) {
  const d = mod.default;
  dictionaries[d._meta.code] = d;
}

const fallback = (): LangFile => dictionaries["en"] ?? (Object.values(dictionaries)[0] as LangFile);

export const languages: Meta[] = Object.values(dictionaries)
  .map((d) => d._meta)
  .sort((a, b) => a.order - b.order);

export function t(lang: string, id: string, params?: Record<string, string | number>): string {
  const d = dictionaries[lang] ?? fallback();
  let s = (d[id] as string | undefined) ?? (fallback()[id] as string | undefined) ?? id;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function keywords(lang: string): Keywords {
  return (dictionaries[lang] ?? fallback())._keywords;
}

export function bcp47(lang: string): string {
  return (dictionaries[lang] ?? fallback())._meta.bcp47;
}
