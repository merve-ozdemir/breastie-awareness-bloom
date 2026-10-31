// Every spoken output passes this seam; browser voices are exact allowlist matches only.
import { bcp47, dictionaries, t } from '@/i18n';
export type SpeakItem=string|{text:string};
let currentLang='en',muted=false,demo=true,token=0;
let currentAudio:HTMLAudioElement|null=null;
let currentFinish:(()=>void)|null=null;
const clipExists=new Map<string,boolean>();
export function setAudioLang(lang:string){currentLang=lang;}
export function setAudioDemo(value:boolean){demo=value;}
export function setMuted(value:boolean){muted=value;if(value)stopSpeaking();}
export function isMuted(){return muted;}
export function stopSpeaking(){token++;currentAudio?.pause();currentAudio=null;currentFinish?.();currentFinish=null;if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();}
async function hasClip(url:string){const known=clipExists.get(url);if(known!==undefined)return known;let ok=false;try{const res=await fetch(url,{method:'HEAD'});ok=res.ok&&(res.headers.get('content-type')??'').includes('audio');}catch{}clipExists.set(url,ok);return ok;}
function playClip(url:string,my:number):Promise<boolean>{return new Promise(resolve=>{if(my!==token){resolve(false);return;}const audio=new Audio(url);currentAudio=audio;let ended=false;const finish=(ok:boolean)=>{if(ended)return;ended=true;currentFinish=null;resolve(ok);};currentFinish=()=>finish(false);audio.onended=()=>finish(true);audio.onerror=()=>finish(false);void audio.play().catch(()=>finish(false));});}
export function selectFemaleVoice(voices:readonly Pick<SpeechSynthesisVoice,'name'|'lang'>[],lang:string){const names=dictionaries[lang]?.['_female_voices'];const allowlist=Array.isArray(names)?names:[];return voices.find(v=>v.lang.toLowerCase().split('-')[0]===lang&&allowlist.includes(v.name))??null;}
async function browserSpeech(text:string,lang:string,my:number){
 if(my!==token||!('speechSynthesis'in window))return;
 // Do not ask the browser to pick its default voice, even if voices have not loaded.
 const voice=selectFemaleVoice(window.speechSynthesis.getVoices(),lang);if(!voice)return;
 await new Promise<void>(resolve=>{const utterance=new SpeechSynthesisUtterance(text);utterance.lang=bcp47(lang);utterance.voice=voice as SpeechSynthesisVoice;utterance.rate=0.92;let done=false;const finish=()=>{if(done)return;done=true;currentFinish=null;resolve();};currentFinish=finish;utterance.onend=finish;utterance.onerror=finish;window.speechSynthesis.speak(utterance);});
}
async function playItem(item:SpeakItem,lang:string,my:number){
 if(my!==token)return;
 if(typeof item==='string'){const url=`/audio/${lang}/${item}.mp3`;if(await hasClip(url)){const ok=await playClip(url,my);if(ok||my!==token)return;}}
 const text=typeof item==='string'?t(lang,item):item.text;
 if(demo){await browserSpeech(text,lang,my);return;}
 const res=await fetch('/api/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang,text})});
 if(!res.ok){const error=await res.json();throw new Error(error.message);}
 const blob=await res.blob();if(my!==token)return;const url=URL.createObjectURL(blob);try{if(!await playClip(url,my)&&my===token)throw new Error(t(lang,'audio_error'));}finally{URL.revokeObjectURL(url);}
}
export async function speakSequence(items:SpeakItem[],opts:{lang?:string;force?:boolean}={}){
 if(typeof window==='undefined'||(muted&&!opts.force))return;stopSpeaking();const my=token,lang=opts.lang??currentLang;
 try{for(const item of items){if(my!==token)return;await playItem(item,lang,my);}}catch(error){if(my===token)window.dispatchEvent(new CustomEvent('speech-error',{detail:error instanceof Error?error.message:t(lang,'audio_error')}));}
}
export function speak(item:SpeakItem,opts:{lang?:string;force?:boolean}={}){return speakSequence([item],opts);}
export function softCue(freq=520){if(typeof window==='undefined'||muted)return;try{const ctx=new AudioContext(),o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.06,ctx.currentTime+0.03);g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.25);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.3);setTimeout(()=>void ctx.close(),400);}catch{}}
