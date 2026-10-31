import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/icons';
import { softCue } from '@/lib/audio';
import { processExam } from '@/lib/matcher';
import { type ExamResult } from '@/lib/exam';
import { MAX_EXAM_SECONDS,recordExam } from '@/lib/record-exam';
import { useApp } from './context';
// Record → Finish → processing. Demo (developer setting) types instead of using the mic.
export function ExamRecorder({onResult}:{onResult:(r:ExamResult)=>void}){
 const {settings,lang,tt}=useApp();const[phase,setPhase]=useState<'ready'|'starting'|'recording'|'processing'>('ready');const[text,setText]=useState('');const[level,setLevel]=useState(0);const[seconds,setSeconds]=useState(0);const[error,setError]=useState('');
 const capture=useRef<Awaited<ReturnType<typeof recordExam>>|null>(null);const start=useRef(0);const mounted=useRef(true);const finishRef=useRef<()=>void>(()=>{});
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;void capture.current?.cancel();};},[]);
 useEffect(()=>{if(phase!=='recording')return;const timer=setInterval(()=>{const n=Math.floor((performance.now()-start.current)/1000);setSeconds(Math.min(n,MAX_EXAM_SECONDS));if(n>=MAX_EXAM_SECONDS)finishRef.current();},250);return()=>clearInterval(timer);},[phase]);
 async function finish(){if(phase==='processing')return;setPhase('processing');setError('');try{const cap=capture.current;capture.current=null;const file=cap?await cap.stop():null;softCue(440);const r=await processExam(settings.demo?text:file,{lang,demo:settings.demo});if(mounted.current)onResult(r);}catch(e){if(mounted.current){setError(e instanceof Error&&e.message!=='empty'?e.message:tt('processing_error'));setPhase('ready');}}}
 finishRef.current=()=>{void finish();};
 async function toggle(){if(phase==='recording'){void finish();return;}setError('');setSeconds(0);start.current=performance.now();if(settings.demo){setPhase('recording');return;}setPhase('starting');try{const cap=await recordExam(setLevel);if(!mounted.current){await cap.cancel();return;}capture.current=cap;start.current=performance.now();setPhase('recording');softCue(560);}catch{setError(tt('no_speech'));setPhase('ready');}}
 return <div className="flex flex-col gap-4">{settings.demo&&phase==='recording'&&<textarea autoFocus aria-label={tt('demo_placeholder')} value={text} onChange={e=>setText(e.target.value)} placeholder={tt('demo_placeholder')} rows={4} className="w-full rounded-2xl border-2 bg-card p-4 text-lg"/>}{error&&<p role="status" className="break-words text-sm">{error}</p>}<div>{phase==='recording'&&<div className="mb-2 flex h-7 items-center justify-center gap-1"><span aria-label={tt('elapsed')} className="mr-3 w-14 font-bold tabular-nums">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</span>{Array.from({length:12},(_,i)=><span key={i} className="w-2 rounded-full bg-primary" style={{height:`${4+level*20*(0.5+(i%3)/3)}px`}}/>)}</div>}<div className="relative">{phase==='recording'&&<span aria-hidden className="pulse-ring pointer-events-none absolute inset-0 rounded-full bg-primary"/>}<Button disabled={phase==='starting'||phase==='processing'} onClick={toggle} className="relative min-h-20 w-full whitespace-normal rounded-full text-2xl font-extrabold shadow-soft">{phase==='processing'?<span className="h-9 w-9 animate-spin rounded-full border-4 border-current border-t-transparent"/>:<Icon name={phase==='recording'?'stop':'mic'} className="h-10 w-10"/>}{phase==='processing'||phase==='starting'?tt('mic_processing'):phase==='recording'?tt('finish'):tt('record')}</Button></div></div></div>;
}
