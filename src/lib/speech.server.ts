import { z } from 'zod';
import { dictionaries } from '@/i18n';
import { requestSpeech } from './gateway/speech-request.server';
import { accessState, failureResponse, GatewayError, limitedBody, preserveFailure, sameOrigin } from './gateway/access.server';
const schema=z.object({lang:z.enum(['en','fr','de','it','es']),text:z.string().min(1).max(4000)});
// Kore is the fixed female voice for each language; keep per-language mapping explicit.
const FEMALE_VOICES={en:'Kore',fr:'Kore',de:'Kore',it:'Kore',es:'Kore'};
export async function handleSpeak(request:Request){
 let lang='en';try{sameOrigin(request);let input:unknown;try{input=JSON.parse(await(await limitedBody(request,20000)).text());}catch(error){if(error instanceof GatewayError)throw error;throw new GatewayError(400,'Invalid speech request.');}const parsed=schema.safeParse(input);if(!parsed.success)throw new GatewayError(400,'Invalid speech request.');const data=parsed.data;lang=data.lang;
 const key=process.env['LOVABLE_API_KEY'];if(!key)throw new GatewayError(401,'Speech service is not configured.');
 await accessState('speech');
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${data.lang}:${FEMALE_VOICES[data.lang]}:${data.text}`));const cacheKey=Array.from(new Uint8Array(hash)).map(v=>v.toString(16).padStart(2,'0')).join('');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data:cached,error:readError}=await supabaseAdmin.from('speech_cache').select('state,audio_base64,content_type').eq('cache_key',cacheKey).maybeSingle();if(readError)throw new GatewayError(503,'Speech cache is unavailable.');
 if(cached?.state==='complete'&&cached.audio_base64)return audioResponse(cached.audio_base64,cached.content_type??'audio/wav');
 if(cached)throw new GatewayError(409,'This spoken phrase is not ready. The text is still available.');
 const {error:claimError}=await supabaseAdmin.from('speech_cache').insert({cache_key:cacheKey,state:'pending'});if(claimError)throw new GatewayError(409,'This spoken phrase is already being prepared.');
 try{
 const response=await requestSpeech({baseURL:'https://ai.gateway.lovable.dev',apiKey:key,model:'google/gemini-3.1-flash-tts-preview',format:'gemini',voice:FEMALE_VOICES[data.lang]},data.text,true);
 if(!response.ok)await preserveFailure('speech',response,lang);
 const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length<44||!(response.headers.get('content-type')??'').includes('audio'))throw new GatewayError(502,'The speech service returned no usable audio.');
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));const base64=btoa(binary),type=response.headers.get('content-type')??'audio/wav';
 const {error}=await supabaseAdmin.from('speech_cache').update({state:'complete',audio_base64:base64,content_type:type}).eq('cache_key',cacheKey);if(error)throw new GatewayError(503,'The spoken audio could not be cached.');return audioResponse(base64,type);
 }catch(e){await supabaseAdmin.from('speech_cache').update({state:'failed'}).eq('cache_key',cacheKey);throw e;}
 }catch(error){return failureResponse(error,lang);}
}
function audioResponse(base64:string,type:string){const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));return new Response(bytes,{headers:{'Content-Type':type,'Cache-Control':'private, no-store'}});}
