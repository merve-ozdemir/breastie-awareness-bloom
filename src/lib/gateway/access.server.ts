import { t } from '@/i18n';
export class GatewayError extends Error {constructor(public status:number,message:string){super(message);}}
export async function accessState(service:string){
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data,error}=await supabaseAdmin.from('ai_access_state').select('status,message').eq('service',service).maybeSingle();
 if(error)throw new GatewayError(503,'Voice service configuration could not be checked.');
 if(data)throw new GatewayError(data['status'],data['message']);
}
export async function preserveFailure(service:string,response:Response,lang='en'){
 let data:Record<string,unknown>={};try{data=await response.json();}catch{}
 const nested=data['error']&&typeof data['error']==='object'?data['error'] as Record<string,unknown>:{};
 const message=typeof data['message']==='string'?data['message']:typeof nested['message']==='string'?nested['message']:t(lang,'processing_error');
 const type=String(data['type']??nested['type']??'');
 if(response.status===403&& !['provider_not_available_in_region','model_requires_retention_consent','model_vendor_not_enabled'].includes(type)){
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {error}=await supabaseAdmin.from('ai_access_state').upsert({service,status:403,message});
  if(error)throw new GatewayError(503,'Voice service access could not be recorded.');
 }
 throw new GatewayError(response.status,message);
}
export function sameOrigin(request:Request){
 const origin=request.headers.get('origin');
 const site=request.headers.get('sec-fetch-site');
 if(site==='cross-site')throw new GatewayError(403,'Forbidden');
 const allowed=new Set([new URL(request.url).origin]);
 const forwarded=request.headers.get('x-forwarded-host');if(forwarded)allowed.add(`https://${forwarded}`);
 if(origin&&!allowed.has(origin))throw new GatewayError(403,'Forbidden');
 if(!origin&&site!=='same-origin'&&site!=='none')throw new GatewayError(403,'Forbidden');
}
export async function limitedBody(request:Request,max:number){
 if(Number(request.headers.get('content-length')??0)>max)throw new GatewayError(413,'Recording is too large.');
 if(!request.body)throw new GatewayError(400,'Empty request.');
 const reader=request.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new GatewayError(413,'Recording is too large.');}chunks.push(value);}
 return new Blob(chunks as BlobPart[]);
}
export function failureResponse(error:unknown,lang='en'){return Response.json({message:error instanceof GatewayError?error.message:t(lang,'processing_error')},{status:error instanceof GatewayError?error.status:500,headers:{'Cache-Control':'no-store'}});}
