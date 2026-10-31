import { Button } from '@/components/ui/button';
import { NUMBERED_ZONES, regionNumber, type Breast, type Entry, type Zone } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { useApp } from './context';

const noted=(e:Entry)=>!!e.mentioned&&(e.changes.length>0||e.pain==='yes'||e.pain==='not_sure');

// Vector version of the user's numbered breast map (viewBox crop of the original 1440x810 design).
const VB={x:240,y:90,w:970,h:720}; // top cropped at the skin fill's upper edge (y=90)
const MIRROR=1450; // right-side x = MIRROR - left-side x
const NIP={x:472,y:572};
const R=168; // breast clip radius
const POS:Record<Zone,{x:number;y:number}>={upper_outer:{x:370,y:467},upper_inner:{x:558,y:467},lower_outer:{x:370,y:657},lower_inner:{x:558,y:657},nipple:{x:472,y:572},armpit:{x:428,y:262},whole_breast:{x:472,y:572}};
const at=(b:Breast,p:{x:number;y:number})=>({x:b==='left'?p.x:MIRROR-p.x,y:p.y});

const BODY='M250 90 C320 200 380 270 412 305 C398 430 330 520 330 600 C330 690 400 722 470 725 L480 810 L970 810 L980 725 C1050 722 1120 690 1120 600 C1120 520 1052 430 1038 305 C1070 270 1130 200 1200 90 Z';
const LEFT_LINE='M250 90 C320 200 380 270 412 305 C398 430 330 520 330 600 C330 690 400 722 470 725 C540 728 600 695 635 655';
const LEFT_COLLAR='M380 10 C470 50 520 70 560 140 C590 190 600 225 565 222 M640 75 C670 160 630 210 565 222';
const mirror=(d:string)=>d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,(_,x,y)=>`${MIRROR-Number(x)} ${y}`);

/** Labelled breast map in the user's skin tone. Regions are tappable only when onPick is given. */
export function ExamDiagram({entries=[],onPick,whole=false,highlight}:{entries?:Entry[];onPick?:((breast:Breast,zone:Zone)=>void)|undefined;whole?:boolean;highlight?:{breast:Breast;zone:Zone}|null}) {
  const {skin,tt}=useApp();
  const shade=(e:{breast:Breast;zone:Zone},k:string,op:number)=>{const n=at(e.breast,NIP);const fill='var(--primary)';
    if(e.zone==='armpit'){const a=at(e.breast,POS.armpit);return <ellipse key={k} cx={a.x} cy={a.y} rx="80" ry="72" fill={fill} opacity={op}/>;}
    if(e.zone==='nipple')return <circle key={k} cx={n.x} cy={n.y} r="58" fill={fill} opacity={op}/>;
    if(e.zone==='whole_breast')return <circle key={k} cx={n.x} cy={n.y} r={R} fill={fill} opacity={op}/>;
    const outer=e.breast==='left'?-1:1;const dir=e.zone.endsWith('outer')?outer:-outer;
    return <rect key={k} clipPath={`url(#dclip-${e.breast})`} x={dir<0?n.x-R:n.x} y={e.zone.startsWith('upper')?n.y-R:n.y} width={R} height={R} fill={fill} opacity={op}/>;};
  return <div className="w-full">
    <div className="relative w-full" style={{aspectRatio:`${VB.w}/${VB.h}`}} role="group" aria-label={tt('diagram_caption')}>
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>{(['left','right'] as const).map(b=>{const n=at(b,NIP);return <clipPath key={b} id={`dclip-${b}`}><circle cx={n.x} cy={n.y} r={R}/></clipPath>;})}</defs>
        <path d={BODY} fill={skin}/>
        {entries.filter(noted).map(e=>shade(e,`${e.breast}:${e.zone}`,0.45))}
        {highlight&&shade(highlight,'hl',0.3)}
        <g fill="none" stroke="var(--primary)" strokeWidth="22" strokeLinecap="round">
          <path d={LEFT_LINE}/><path d={mirror(LEFT_LINE)}/>
          <path d={LEFT_COLLAR}/><path d={mirror(LEFT_COLLAR)}/>
          <path d="M470 725 L480 810 M980 725 L970 810"/>
        </g>
        <g fill="none" stroke="var(--primary)" strokeOpacity="0.4" strokeWidth="10" strokeDasharray="22 22" strokeLinecap="round">
          {(['left','right'] as const).map(b=>{const n=at(b,NIP);return <path key={b} d={`M${n.x} 320 V790 M${n.x-210} ${n.y} H${n.x+210}`}/>;})}
        </g>
      </svg>
      {(['left','right'] as const).flatMap(breast=>NUMBERED_ZONES.map(zone=>{
        const p=at(breast,POS[zone]);
        const n=regionNumber(breast,zone);
        const lit=highlight?.breast===breast&&highlight.zone===zone;
        const label=tt('number_name',{n:n??'',side:tt(`side_${breast}`),region:tt(`region_${zone}`)==`region_${zone}`?tt(`zone_${zone}`):tt(`region_${zone}`)});
        const badge=<span className={cn('grid h-9 w-9 place-items-center rounded-full border-2 text-lg font-extrabold transition-transform',lit?'scale-125 border-primary bg-primary text-primary-foreground':zone==='nipple'?'border-primary-foreground bg-primary text-primary-foreground ring-2 ring-primary':'border-foreground bg-foreground text-background')}>{n}</span>;
        return <div key={`${breast}:${zone}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{left:`${(p.x-VB.x)/VB.w*100}%`,top:`${(p.y-VB.y)/VB.h*100}%`}}>
          {onPick
            ?<Button variant="ghost" aria-label={label} title={label} onClick={()=>onPick(breast,zone)} className="h-12 w-12 rounded-full p-0 hover:bg-transparent">{badge}</Button>
            :<div role="img" aria-label={label} title={label} className="grid h-12 w-12 place-items-center">{badge}</div>}
        </div>;
      }))}
    </div>
    <div className="mt-2 grid grid-cols-2 gap-3 text-center text-xl font-extrabold">{(['left','right'] as const).map(b=><div key={b}>{tt(b)}{whole&&onPick&&<Button variant="outline" onClick={()=>onPick(b,'whole_breast')} className="mt-3 min-h-16 w-full whitespace-normal rounded-2xl text-base font-bold">{tt('zone_whole_breast')}</Button>}</div>)}</div>
  </div>;
}
