import { createContext, useContext } from "react";
import { t } from "@/i18n";

export type Settings = {
  lang: string;
  skinTone: number;
  onboarded: boolean;
  demo: boolean;
  cycleDay: number;
  name: string;
};

export const DEFAULT_SETTINGS: Settings = {
  lang: "en",
  skinTone: 3,
  onboarded: false,
  demo: false,
  cycleDay: 9,
  name: "",
};

type Ctx = {
  settings: Settings;
  update: (p: Partial<Settings>) => void;
};

export const AppCtx = createContext<Ctx>({ settings: DEFAULT_SETTINGS, update: () => {} });

export function useApp() {
  const ctx = useContext(AppCtx);
  const lang = ctx.settings.lang;
  return {
    ...ctx,
    lang,
    tt: (id: string, params?: Record<string, string | number>) => t(lang, id, params),
    skin: `var(--skin-${ctx.settings.skinTone})`,
  };
}
