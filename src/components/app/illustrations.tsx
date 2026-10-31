// Flat, respectful, poster-style illustrations. First-person (looking down) view:
// her LEFT breast is on the LEFT of the screen.
import type React from "react";
import type { Breast, Zone } from "@/lib/schema";
import { cn } from "@/lib/utils";

const QUADS: { zone: Zone; outer: boolean; up: boolean }[] = [
  { zone: "upper_outer", outer: true, up: true },
  { zone: "upper_inner", outer: false, up: true },
  { zone: "lower_outer", outer: true, up: false },
  { zone: "lower_inner", outer: false, up: false },
];
export const ZONE_NUMBER: Record<Zone, string> = {
  upper_outer: "1",
  upper_inner: "2",
  lower_outer: "3",
  lower_inner: "4",
  nipple: "5",
  armpit: "6",
  whole_breast: "",
};

/** Screen direction of "outer" for a breast in first-person view. */
export const outerSign = (b: Breast) => (b === "left" ? -1 : 1);

/** Offset of a zone marker from breast center, in units of radius. */
export function zoneOffset(b: Breast, z: Zone): [number, number] {
  const sx = outerSign(b);
  switch (z) {
    case "upper_outer": return [sx * 0.5, -0.5];
    case "upper_inner": return [-sx * 0.5, -0.5];
    case "lower_outer": return [sx * 0.5, 0.5];
    case "lower_inner": return [-sx * 0.5, 0.5];
    case "nipple": return [0, 0];
    case "armpit": return [sx * 1.05, -1.05];
    default: return [0, 1.15];
  }
}

function CheckMark({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={r} fill="var(--mark)" />
      <path
        d={`M${x - r * 0.45} ${y}l${r * 0.32} ${r * 0.35} ${r * 0.6}-${r * 0.7}`}
        stroke="var(--mark-foreground)"
        strokeWidth={r * 0.28}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function Torso({
  skin,
  checked,
  onPick,
  labels,
}: {
  skin: string;
  checked: Set<string>;
  onPick: (b: Breast) => void;
  labels: { left: string; right: string };
}) {
  const B = { left: { x: 112, y: 250 }, right: { x: 248, y: 250 } } as const;
  const R = 74;
  return (
    <svg viewBox="0 0 360 400" className="w-full max-w-sm select-none" role="group">
      {/* upper arms at the edges */}
      <path d="M0 40 Q30 30 44 70 L54 400 H0 Z" fill={skin} stroke="var(--skin-line)" strokeWidth={2} />
      <path d="M360 40 Q330 30 316 70 L306 400 H360 Z" fill={skin} stroke="var(--skin-line)" strokeWidth={2} />
      {/* chest */}
      <path
        d="M30 46 Q80 10 180 18 Q280 10 330 46 L318 120 L314 400 H46 L42 120 Z"
        fill={skin}
        stroke="var(--skin-line)"
        strokeWidth={2}
      />
      {/* collarbones */}
      <path d="M70 58 Q120 74 168 62" stroke="var(--skin-line)" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M290 58 Q240 74 192 62" stroke="var(--skin-line)" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* breasts */}
      {(["left", "right"] as const).map((b) => {
        const { x, y } = B[b];
        return (
          <g key={b} onClick={() => onPick(b)} className="cursor-pointer" role="button" aria-label={labels[b]}>
            <circle cx={x} cy={y} r={R + 14} fill="transparent" />
            <path
              d={`M${x - R} ${y - 30} Q${x - R} ${y + R} ${x} ${y + R} Q${x + R} ${y + R} ${x + R} ${y - 30}`}
              fill={skin}
              stroke="var(--skin-line)"
              strokeWidth={3}
            />
            <circle cx={x} cy={y + 18} r={9} fill="var(--skin-line)" />
            {[...checked]
              .filter((k) => k.startsWith(b + ":"))
              .map((k) => {
                const z = k.split(":")[1] as Zone;
                const [dx, dy] = zoneOffset(b, z);
                const cy = z === "whole_breast" ? y + R + 18 : y + 10 + dy * R * 0.75;
                return <CheckMark key={k} x={x + dx * R * 0.75} y={cy} r={10} />;
              })}
          </g>
        );
      })}
    </svg>
  );
}

export function ZoneMap({
  breast,
  skin,
  selected,
  checked,
  onPick,
  small,
}: {
  breast: Breast;
  skin: string;
  selected?: Zone | null;
  checked: Set<Zone>;
  onPick: (z: Zone) => void;
  small?: boolean;
}) {
  const cx = 160;
  const cy = 190;
  const r = 112;
  const sx = outerSign(breast);
  const armX = cx + sx * 118;
  const wedge = (dx: number, dy: number) =>
    `M${cx} ${cy} L${cx + dx * r} ${cy} A${r} ${r} 0 0 ${dx * dy > 0 ? 1 : 0} ${cx} ${cy + dy * r} Z`;
  const fillFor = (z: Zone) => (selected === z ? "var(--primary-soft)" : skin);
  return (
    <svg viewBox="0 0 320 320" className={cn("w-full select-none zoom-in-soft", small ? "max-w-60" : "max-w-sm")}>
      {/* armpit */}
      <g onClick={() => onPick("armpit")} className="cursor-pointer" role="button" aria-label="armpit">
        <ellipse cx={armX} cy={48} rx={36} ry={26} fill={fillFor("armpit")} stroke={selected === "armpit" ? "var(--primary)" : "var(--skin-line)"} strokeWidth={3} strokeDasharray="6 5" />
        <text x={armX} y={56} textAnchor="middle" fontSize="22" fontWeight={800} fill="var(--foreground)">6</text>
        {checked.has("armpit") && <CheckMark x={armX + sx * 24} y={26} />}
      </g>
      {QUADS.map(({ zone, outer, up }) => {
        const dx = outer ? sx : -sx;
        const dy = up ? -1 : 1;
        return (
          <g key={zone} onClick={() => onPick(zone)} className="cursor-pointer" role="button" aria-label={zone}>
            <path d={wedge(dx, dy)} fill={fillFor(zone)} stroke={selected === zone ? "var(--primary)" : "none"} strokeWidth={4} />
            <text x={cx + dx * r * 0.55} y={cy + dy * r * 0.55 + 8} textAnchor="middle" fontSize="24" fontWeight={800} fill="var(--foreground)">
              {ZONE_NUMBER[zone]}
            </text>
            {checked.has(zone) && <CheckMark x={cx + dx * r * 0.55 + 22} y={cy + dy * r * 0.55 - 16} />}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--skin-line)" strokeWidth={3} pointerEvents="none" />
      <path d={`M${cx - r} ${cy}H${cx + r}M${cx} ${cy - r}V${cy + r}`} stroke="var(--foreground)" strokeOpacity={0.45} strokeWidth={2.5} strokeDasharray="8 7" pointerEvents="none" />
      {/* nipple: large tap target */}
      <g onClick={() => onPick("nipple")} className="cursor-pointer" role="button" aria-label="nipple">
        <circle cx={cx} cy={cy} r={32} fill={selected === "nipple" ? "var(--primary-soft)" : "var(--card)"} stroke={selected === "nipple" ? "var(--primary)" : "var(--skin-line)"} strokeWidth={3} />
        <circle cx={cx} cy={cy} r={11} fill="var(--skin-line)" />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="16" fontWeight={800} fill="var(--foreground)">5</text>
        {checked.has("nipple") && <CheckMark x={cx + 28} y={cy - 26} r={10} />}
      </g>
    </svg>
  );
}

export function CalendarArt() {
  return (
    <svg viewBox="0 0 200 170" className="w-48" aria-hidden>
      <rect x="20" y="24" width="160" height="136" rx="20" fill="var(--card)" stroke="var(--border)" strokeWidth={4} />
      <rect x="20" y="24" width="160" height="34" rx="16" fill="var(--primary)" />
      <rect x="54" y="12" width="12" height="28" rx="6" fill="var(--foreground)" />
      <rect x="134" y="12" width="12" height="28" rx="6" fill="var(--foreground)" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <circle key={`${r}${c}`} cx={44 + c * 28} cy={78 + r * 22} r={6} fill="var(--muted)" />
        )),
      )}
      <circle cx={128} cy={100} r={18} fill="var(--primary-soft)" />
      <path d="M119 100l7 7 12-14" stroke="var(--primary)" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SkinSwatch({ tone }: { tone: number }) {
  return (
    <svg viewBox="0 0 60 60" className="h-14 w-14" aria-hidden>
      <circle cx="30" cy="30" r="26" fill={`var(--skin-${tone})`} stroke="var(--skin-line)" strokeWidth={2} />
    </svg>
  );
}

/* ---------- Exam guide art (front view, theme-coloured) ---------- */
const LINE = "var(--skin-line)";
const ACCENT = "var(--primary)";
function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return <svg viewBox="0 0 240 180" role="img" aria-label={label} className="aspect-[4/3] w-full rounded-2xl bg-muted">{children}</svg>;
}
/** Upper-body line figure, front view (reference: clinical infographic line art). */
function Bust({ skin, x, pose }: { skin: string; x: number; pose: "hips" | "up" | "oneUp" }) {
  const arm = (d: string) => <><path d={d} stroke={LINE} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d={d} stroke={skin} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>;
  const L = pose === "hips" ? `M${x - 24} 70 L${x - 40} 104 L${x - 22} 132` : `M${x - 24} 70 L${x - 30} 40 L${x - 10} 20`;
  const R = pose === "oneUp" ? `M${x + 24} 70 L${x + 6} 100 L${x - 8} 92` : pose === "hips" ? `M${x + 24} 70 L${x + 40} 104 L${x + 22} 132` : `M${x + 24} 70 L${x + 30} 40 L${x + 10} 20`;
  return <g>
    {arm(L)}{arm(R)}
    <rect x={x - 6} y="46" width="12" height="14" fill={skin} stroke={LINE} strokeWidth="2" />
    <path d={`M${x - 26} 66 Q${x} 56 ${x + 26} 66 L${x + 22} 112 Q${x + 18} 128 ${x + 22} 150 H${x - 22} Q${x - 18} 128 ${x - 22} 112 Z`} fill={skin} stroke={LINE} strokeWidth="2" />
    <path d={`M${x - 22} 86 Q${x - 12} 108 ${x - 1} 92 M${x + 22} 86 Q${x + 12} 108 ${x + 1} 92`} fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
    <circle cx={x - 11} cy="97" r="2" fill={LINE} /><circle cx={x + 11} cy="97" r="2" fill={LINE} />
    <ellipse cx={x} cy="34" rx="13" ry="15" fill={skin} stroke={LINE} strokeWidth="2" />
    <path d={`M${x - 14} 32 Q${x - 14} 14 ${x} 16 Q${x + 14} 14 ${x + 14} 32 Q${x + 8} 22 ${x} 22 Q${x - 8} 22 ${x - 14} 32`} fill={LINE} />
    {pose === "oneUp" && <g>{[0, 1, 2].map((i) => <rect key={i} x={x - 16 + i * 5} y={84 - i} width="4.5" height="12" rx="2.2" fill={skin} stroke={LINE} strokeWidth="1.2" />)}</g>}
  </g>;
}
function MirrorStep({ skin, label }: { skin: string; label: string }) {
  return <Frame label={label}>
    <rect x="10" y="10" width="220" height="160" rx="14" fill="var(--card)" stroke={LINE} strokeWidth="3" />
    <path d="M30 22 l18 -0 M30 30 l10 0" stroke={LINE} strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
    <Bust skin={skin} x={70} pose="hips" />
    <Bust skin={skin} x={170} pose="up" />
    <path d="M110 160 h20 m-6 -6 l6 6 -6 6" stroke={ACCENT} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>;
}
function LyingStep({ skin, label }: { skin: string; label: string }) {
  return <Frame label={label}>
    <rect x="10" y="124" width="220" height="16" rx="8" fill="var(--card)" stroke={LINE} strokeWidth="2" />
    <ellipse cx="34" cy="110" rx="16" ry="12" fill="var(--card)" stroke={LINE} strokeWidth="2" />
    <ellipse cx="46" cy="102" rx="14" ry="13" fill={skin} stroke={LINE} strokeWidth="2" />
    <path d="M44 90 Q30 76 26 92" stroke={LINE} strokeWidth="12" strokeLinecap="round" fill="none" /><path d="M44 90 Q30 76 26 92" stroke={skin} strokeWidth="8" strokeLinecap="round" fill="none" />
    <path d="M60 98 Q140 88 220 104 L220 124 H60 Z" fill={skin} stroke={LINE} strokeWidth="2" />
    <path d="M90 96 Q104 80 122 94" fill={skin} stroke={LINE} strokeWidth="2" />
    <circle cx="106" cy="88" r="2" fill={LINE} />
    <path d="M176 104 Q150 70 112 74" stroke={LINE} strokeWidth="13" strokeLinecap="round" fill="none" /><path d="M176 104 Q150 70 112 74" stroke={skin} strokeWidth="9" strokeLinecap="round" fill="none" />
    {[0, 1, 2].map((i) => <rect key={i} x={98 + i * 6} y="72" width="5" height="14" rx="2.5" fill={skin} stroke={LINE} strokeWidth="1.3" />)}
    <path d="M94 56 a12 8 0 1 1 24 0" stroke={ACCENT} strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M118 56 l-5 -3 M118 56 l2 -6" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
  </Frame>;
}
function PatternStep({ skin, label }: { skin: string; label: string }) {
  let spiral = "M60 95";
  for (let t = 0; t < 11.5; t += 0.2) { const r = 3 + t * 3.4; spiral += ` L${(60 + r * Math.cos(t)).toFixed(1)} ${(95 + r * Math.sin(t)).toFixed(1)}`; }
  const rows = [148, 160, 172, 184, 196, 208, 220];
  const lawn = rows.map((x, i) => `${i ? "L" : "M"}${x} ${i % 2 ? 136 : 56} L${x} ${i % 2 ? 56 : 136}`).join(" ");
  return <Frame label={label}>
    <circle cx="60" cy="95" r="48" fill={skin} stroke={LINE} strokeWidth="2" />
    <path d={spiral} stroke={ACCENT} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <circle cx="60" cy="95" r="5" fill={LINE} />
    <text x="120" y="100" textAnchor="middle" fontSize="13" fontWeight={800} fill="var(--muted-foreground)">/</text>
    <circle cx="184" cy="96" r="48" fill={skin} stroke={LINE} strokeWidth="2" />
    <clipPath id="lawn-clip"><circle cx="184" cy="96" r="45" /></clipPath>
    <path clipPath="url(#lawn-clip)" d={lawn} stroke={ACCENT} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="184" cy="96" r="5" fill={LINE} />
  </Frame>;
}
function ShowerStep({ skin, label }: { skin: string; label: string }) {
  return <Frame label={label}>
    <path d="M200 8 V30 Q200 38 190 38 H176" stroke={LINE} strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M162 34 h28 l-4 10 h-20z" fill="var(--card)" stroke={LINE} strokeWidth="2" />
    {[[166, 54], [174, 62], [182, 52], [170, 72], [186, 70], [178, 82]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l-3 7`} stroke={ACCENT} strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />)}
    <Bust skin={skin} x={108} pose="oneUp" />
    {[[86, 88, 5], [94, 104, 4], [80, 100, 3.5], [100, 80, 3]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="var(--card)" stroke={LINE} strokeWidth="1.3" />)}
  </Frame>;
}
function Breast({ skin, children, shape }: { skin: string; children?: React.ReactNode; shape?: string }) {
  return <>
    <path d={shape ?? "M60 40 Q120 20 180 40 Q206 110 170 150 Q120 176 70 150 Q34 110 60 40"} fill={skin} stroke={LINE} strokeWidth="2" />
    {children}
  </>;
}
function SignArt({ n, skin, label }: { n: number; skin: string; label: string }) {
  return <Frame label={label}>
    {n === 1 && <Breast skin={skin}><circle cx="120" cy="110" r="7" fill={LINE} /><circle cx="150" cy="78" r="13" fill={LINE} opacity="0.5" /><circle cx="150" cy="78" r="21" fill="none" stroke={ACCENT} strokeWidth="3" /></Breast>}
    {n === 2 && <Breast skin={skin}><circle cx="120" cy="110" r="7" fill={LINE} />{[[140, 70], [152, 78], [144, 86], [158, 66], [132, 80], [150, 94]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={LINE} />)}<circle cx="146" cy="80" r="24" fill="none" stroke={ACCENT} strokeWidth="3" /></Breast>}
    {n === 3 && <Breast skin={skin}><ellipse cx="140" cy="88" rx="34" ry="26" fill={ACCENT} opacity="0.4" /><circle cx="120" cy="110" r="7" fill={LINE} /></Breast>}
    {n === 4 && <Breast skin={skin}><circle cx="120" cy="110" r="16" fill={LINE} opacity="0.5" /><path d="M114 110 q6 6 12 0" stroke={LINE} strokeWidth="3" fill="none" /><path d="M120 120 q-5 10 0 14 q5 -4 0 -14" fill={ACCENT} /></Breast>}
    {n === 5 && <>
      <path d="M20 40 Q60 26 100 40 Q116 100 92 132 Q60 150 30 132 Q6 100 20 40" fill={skin} stroke={LINE} strokeWidth="2" />
      <path d="M134 40 Q180 24 226 40 Q242 112 214 150 Q180 170 146 150 Q118 112 134 40" fill={skin} stroke={LINE} strokeWidth="2" />
      <circle cx="60" cy="96" r="5" fill={LINE} /><circle cx="180" cy="104" r="5" fill={LINE} />
      <path d="M200 26 l10 -10 m0 0 l-10 0 m10 0 l0 10" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" fill="none" />
    </>}
  </Frame>;
}
export function GuideStepArt({ n, skin, label }: { n: number; skin: string; label: string }) {
  if (n === 1) return <MirrorStep skin={skin} label={label} />;
  if (n === 2) return <LyingStep skin={skin} label={label} />;
  if (n === 3) return <PatternStep skin={skin} label={label} />;
  return <ShowerStep skin={skin} label={label} />;
}
export function GuideSignArt(p: { n: number; skin: string; label: string }) { return <SignArt {...p} />; }
