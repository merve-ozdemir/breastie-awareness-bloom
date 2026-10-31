export const MAX_EXAM_SECONDS=300;
export function encodeWav(chunks:readonly Float32Array[],sampleRate:number):Blob {
 const length=chunks.reduce((sum,c)=>sum+c.length,0),view=new DataView(new ArrayBuffer(44+length*2));
 const tag=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
 tag(0,'RIFF');view.setUint32(4,36+length*2,true);tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);tag(36,'data');view.setUint32(40,length*2,true);
 let offset=44;for(const chunk of chunks)for(const value of chunk){const sample=Math.max(-1,Math.min(1,value));view.setInt16(offset,sample*(sample<0?32768:32767),true);offset+=2;}
 return new Blob([view.buffer],{type:'audio/wav'});
}
export async function recordExam(onLevel:(n:number)=>void):Promise<{stop:()=>Promise<File>;cancel:()=>Promise<void>}> {
 const stream=await navigator.mediaDevices.getUserMedia({audio:true});let context:AudioContext|undefined;
 try{context=new AudioContext({sampleRate:24000});await context.resume();const ctx=context,source=ctx.createMediaStreamSource(stream),node=ctx.createScriptProcessor(4096,1,1),chunks:Float32Array[]=[];let stopped=false;
 node.onaudioprocess=e=>{const c=new Float32Array(e.inputBuffer.getChannelData(0));chunks.push(c);onLevel(Math.min(1,Math.sqrt(c.reduce((sum,v)=>sum+v*v,0)/c.length)*8));};source.connect(node);node.connect(ctx.destination);
 const cleanup=async()=>{stream.getTracks().forEach(t=>t.stop());node.disconnect();source.disconnect();node.onaudioprocess=null;await ctx.close();onLevel(0);};
 return {async stop(){if(stopped)throw new Error('empty');stopped=true;await cleanup();const blob=encodeWav(chunks,ctx.sampleRate);chunks.length=0;if(blob.size<2048)throw new Error('empty');return new File([blob],'exam.wav',{type:'audio/wav'});},async cancel(){if(stopped)return;stopped=true;chunks.length=0;await cleanup();}};
 }catch(e){stream.getTracks().forEach(t=>t.stop());await context?.close();throw e;}
}
