import { createParser } from 'eventsource-parser';
export async function readEvents(response:Response,onEvent:(data:Record<string,unknown>)=>void){
 if(!response.body)throw new Error('empty');const reader=response.body.getReader(),decoder=new TextDecoder();let problem:unknown;
 const parser=createParser({onEvent(event){if(event.data==='[DONE]')return;try{onEvent(JSON.parse(event.data));}catch(e){problem=e;}}});
 try{while(true){const chunk=await reader.read();if(chunk.done)break;parser.feed(decoder.decode(chunk.value,{stream:true}));if(problem)throw problem;}parser.feed(decoder.decode());if(problem)throw problem;}finally{reader.releaseLock();}
}
