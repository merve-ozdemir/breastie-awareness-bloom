import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import { languages } from "@/i18n";
import { saveSession } from "@/lib/db";
import { completeExam, entryKey } from "@/lib/schema";
import { type ExamResult } from "@/lib/exam";
import { cn } from "@/lib/utils";
import { AppCtx, DEFAULT_SETTINGS, useApp, type Settings } from "./context";
import { History } from "./History";
import { ExamGuide } from "./ExamGuide";
import { SkinSwatch } from "./illustrations";
import { ExamRecorder } from "./ExamRecorder";
import { ReviewStepper } from "./Review";
import { BigButton } from "./ui";
import { Mascot } from "./Mascot";
import { ExamDiagram } from "./ExamDiagram";
import { Profile } from "./Profile";

type Screen = "welcome" | "skin" | "exam" | "review" | "saved" | "history" | "settings" | "guide" | "profile";
const KEY="bse-settings-v2";
const EMPTY:ExamResult={entries:[],unresolved:[],general_note:'',asked_a_question:false};
export function App() {
 const [settings,setSettings]=useState<Settings|null>(null);
 useEffect(()=>{let s=DEFAULT_SETTINGS;try{const raw=localStorage.getItem(KEY);if(raw)s={...s,...JSON.parse(raw)};}catch{}setSettings(s);},[]);
 useEffect(()=>{if(settings)localStorage.setItem(KEY,JSON.stringify(settings));},[settings]);
 if(!settings)return <div className="min-h-screen bg-background"/>;
 return <AppCtx.Provider value={{settings,update:p=>setSettings(s=>({...s??DEFAULT_SETTINGS,...p}))}}><Flow/></AppCtx.Provider>;
}
function Flow() {
 const {settings,update,tt,lang}=useApp();
 const [screen,setScreen]=useState<Screen>('welcome');
 const [result,setResult]=useState<ExamResult>(EMPTY);
 const [confirmed,setConfirmed]=useState<string[]>([]);
 // "Record more" reuses the exam screen and merges into the current result.
 const [more,setMore]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [langOpen,setLangOpen]=useState(false);
 function go(s:Screen){setError('');setScreen(s);window.scrollTo({top:0});}
 function newCheck(){setResult(EMPTY);setConfirmed([]);setMore(false);go('exam');}
 function onRecorded(r:ExamResult){
  if(!more){setResult(r);setConfirmed([]);go('review');return;}
  const added=r.entries.filter(e=>e.mentioned);
  setResult(old=>({entries:completeExam([...old.entries.filter(e=>e.mentioned),...added]),unresolved:[...old.unresolved,...r.unresolved],general_note:[old.general_note,r.general_note].filter(Boolean).join('\n'),asked_a_question:old.asked_a_question||r.asked_a_question}));
  const keys=new Set(added.map(entryKey));setConfirmed(c=>c.filter(k=>!keys.has(k)));setMore(false);go('review');
 }
 async function save(){if(saving||result.unresolved.length)return;setSaving(true);try{await saveSession({id:crypto.randomUUID(),check_date:new Date().toISOString(),cycle_day:settings.cycleDay,language:lang,entries:completeExam(result.entries).map(e=>({...e,confirmed:true})),general_note:result.general_note,confirmed:true});go('saved');}catch{setError(tt('save_error'));}finally{setSaving(false);}}
 const action=(icon:string,label:string,onClick:()=>void)=><Button variant="ghost" aria-label={label} title={label} onClick={onClick} className="h-11 w-11 shrink-0 rounded-full bg-card p-0 shadow-soft"><Icon name={icon} className="h-5 w-5"/></Button>;
 const backTo:Screen=screen==='guide'?'exam':screen==='review'?'exam':screen==='exam'&&more?'review':'exam';
 let body:React.ReactNode;
 if(screen==='welcome')body=<Button variant="ghost" onClick={()=>go(settings.onboarded?'exam':'skin')} className="flex min-h-[calc(100svh-84px)] w-full flex-col items-center justify-center gap-6 whitespace-normal bg-background px-2 text-foreground hover:bg-background"><Mascot size="lg" message={tt('welcome_message')}/><span className="animate-pulse text-lg font-semibold text-muted-foreground">{tt('welcome_tap')}</span></Button>;
 else if(screen==='settings')body=<div className="flex flex-col gap-4"><h1 className="text-3xl font-extrabold">{tt('settings')}</h1>{<><SkinPicker/><label className="flex items-center gap-3 py-4 text-lg font-bold"><input type="checkbox" checked={settings.demo} onChange={e=>update({demo:e.target.checked})} className="h-8 w-8 accent-primary"/>{tt('demo_mode')}</label><label className="flex flex-col gap-2 font-bold">{tt('cycle_day_setting')}<input type="number" min="1" max="60" value={settings.cycleDay} onChange={e=>update({cycleDay:Math.max(1,Math.min(60,Number(e.target.value)))})} className="min-h-16 rounded-xl border-2 bg-card px-4 text-xl"/></label></>}</div>;
 else if(screen==='skin')body=<div className="flex flex-col gap-6"><h1 className="text-2xl font-extrabold">{tt('skin_tone_question')}</h1><SkinPicker onPick={()=>{update({onboarded:true});go('exam');}}/></div>;
 else if(screen==='exam')body=<div className="flex flex-col gap-4"><h1 className="sr-only">{tt(more?'record_more':'exam_title')}</h1><Mascot message={tt(more?'record_more_instruction':'exam_instruction')}/><ExamDiagram/><p className="text-center text-base font-semibold text-muted-foreground">{tt('diagram_caption')}</p><ExamRecorder key={more?'more':'exam'} onResult={onRecorded}/><p className="text-sm leading-relaxed text-muted-foreground">{tt('privacy_note')}</p></div>;
 else if(screen==='review')body=<ReviewStepper result={result} setResult={setResult} confirmed={confirmed} setConfirmed={setConfirmed} onRecordMore={()=>{setMore(true);go('exam');}} onSave={save} saving={saving}/>;
 else if(screen==='saved')body=<div className="flex flex-col items-center gap-8 pt-8"><Icon name="check" className="h-24 w-24 text-primary"/><p className="text-center text-2xl font-bold">{tt('saved_message')}</p><BigButton icon="history" label={tt('history')} variant="soft" onClick={()=>go('history')}/><BigButton icon="play" label={tt('new_check')} onClick={newCheck}/></div>;
 else if(screen==='guide')body=<ExamGuide/>;
 else if(screen==='profile')body=<Profile/>;
 else body=<History/>;
 return <div className="mx-auto min-h-screen max-w-md bg-background"><header className="sticky top-0 z-20 flex items-center gap-1 bg-background/95 px-2 py-2 backdrop-blur">{action('home',tt('home'),()=>{setMore(false);setLangOpen(false);go('welcome');})}{action('help',tt('exam_help'),()=>go('guide'))}{screen!=='welcome'&&!(screen==='exam'&&!more)&&screen!=='skin'&&action('back',tt('back'),()=>{if(screen==='exam'&&more)setMore(false);go(backTo);})}<div className="min-w-0 flex-1"/>{action('profile',tt('profile'),()=>go('profile'))}{action('globe',tt('language'),()=>setLangOpen(true))}{settings.onboarded&&<>{action('history',tt('history'),()=>go('history'))}{action('settings',tt('settings'),()=>go('settings'))}</>}</header>{langOpen&&<div role="dialog" aria-modal="true" aria-label={tt('choose_language')} className="fixed inset-0 z-30 flex items-start justify-center bg-foreground/40 px-4 pt-20" onClick={()=>setLangOpen(false)}><div className="flex w-full max-w-sm flex-col gap-3 rounded-3xl bg-background p-5 shadow-soft" onClick={e=>e.stopPropagation()}><h2 className="text-2xl font-extrabold">{tt('choose_language')}</h2>{languages.map(l=><Button key={l.code} variant="outline" className={cn('min-h-16 justify-between whitespace-normal rounded-2xl px-5 text-xl font-extrabold',lang===l.code&&'border-primary bg-primary-soft')} onClick={()=>{update({lang:l.code});setLangOpen(false);}}>{l.name}{lang===l.code&&<Icon name="check" className="h-6 w-6 text-primary"/>}</Button>)}</div></div>}<main className="px-4 pb-6">{error&&<p role="status" className="mb-4 break-words border-y py-3 text-sm">{error}</p>}{body}</main></div>;
}
function SkinPicker({onPick}:{onPick?:()=>void}){const{settings,update}=useApp();return <div className="flex flex-wrap justify-center gap-3">{[1,2,3,4,5].map(n=><Button key={n} variant="outline" aria-label={`${n}`} className={cn('h-20 w-20 rounded-full border-4 p-0 shadow-soft',settings.skinTone===n?'border-primary':'border-transparent')} onClick={()=>{update({skinTone:n});onPick?.();}}><SkinSwatch tone={n}/></Button>)}</div>;}
