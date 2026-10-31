// Placeholder icon map. Replace any entry with a tested illustration later; keys are stable.
import type { ReactNode } from "react";

type P = { className?: string | undefined };
const S = ({ children, className }: { children: ReactNode; className?: string | undefined }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);
const skin = <path d="M6 30c6-4 12 4 18 0s12-4 18 0v12H6z" fill="currentColor" opacity={0.12} stroke="none" />;

export const ICONS: Record<string, (p: P) => ReactNode> = {
  lump: (p) => (
    <S {...p}>
      {skin}
      <circle cx="24" cy="24" r="8" fill="currentColor" opacity={0.85} />
      <path d="M6 34h36" />
    </S>
  ),
  bump: (p) => (
    <S {...p}>
      <path d="M6 34h10c2-12 14-12 16 0h10" />
    </S>
  ),
  hardening: (p) => (
    <S {...p}>
      <rect x="14" y="14" width="20" height="20" rx="4" fill="currentColor" opacity={0.2} />
      <rect x="14" y="14" width="20" height="20" rx="4" />
      <path d="M19 24h10M24 19v10" />
    </S>
  ),
  dimpling: (p) => (
    <S {...p}>
      <path d="M6 20c4 3 8 3 12 0M22 20c4 3 8 3 12 0M14 32c4 3 8 3 12 0M30 32c4 3 8 3 10 0" />
    </S>
  ),
  indentation: (p) => (
    <S {...p}>
      <path d="M6 18h12c2 14 10 14 12 0h12" />
    </S>
  ),
  redness: (p) => (
    <S {...p}>
      <circle cx="24" cy="24" r="14" fill="currentColor" opacity={0.25} stroke="none" />
      <circle cx="24" cy="24" r="14" strokeDasharray="4 5" />
    </S>
  ),
  skin_peeling: (p) => (
    <S {...p}>
      <path d="M8 36h32" />
      <path d="M14 36c0-10 6-16 16-18-2 8-6 14-16 18z" fill="currentColor" opacity={0.2} />
    </S>
  ),
  skin_erosion: (p) => (
    <S {...p}>
      <path d="M8 24h32" />
      <path d="M16 24c2 6 14 6 16 0" fill="currentColor" opacity={0.3} />
    </S>
  ),
  growing_veins: (p) => (
    <S {...p}>
      <path d="M8 40c8-8 8-16 16-22M24 18c4-4 10-6 16-6M24 18c0 8 4 14 10 20" />
    </S>
  ),
  discharge: (p) => (
    <S {...p}>
      <circle cx="24" cy="14" r="6" />
      <path d="M24 26c-4 6-4 10 0 12 4-2 4-6 0-12z" fill="currentColor" opacity={0.5} />
    </S>
  ),
  retraction: (p) => (
    <S {...p}>
      <circle cx="24" cy="24" r="14" />
      <path d="M24 16v8M20 20l4 4 4-4" />
      <circle cx="24" cy="30" r="3" fill="currentColor" />
    </S>
  ),
  change_in_size: (p) => (
    <S {...p}>
      <circle cx="18" cy="28" r="8" />
      <circle cx="30" cy="22" r="14" strokeDasharray="4 4" />
    </S>
  ),
  no_changes: (p) => (
    <S {...p}>
      <circle cx="24" cy="24" r="16" />
      <path d="M16 24h16" />
    </S>
  ),
  pain_yes: (p) => (
    <S {...p}>
      <circle cx="24" cy="24" r="16" />
      <path d="M17 20l4 2M31 20l-4 2M17 32c4-4 10-4 14 0" />
    </S>
  ),
  pain_no: (p) => (
    <S {...p}>
      <circle cx="24" cy="24" r="16" />
      <circle cx="19" cy="21" r="1.5" fill="currentColor" />
      <circle cx="29" cy="21" r="1.5" fill="currentColor" />
      <path d="M18 29c4 4 8 4 12 0" />
    </S>
  ),
  pain_not_sure: (p) => (
    <S {...p}>
      <circle cx="24" cy="24" r="16" />
      <path d="M19 19c0-6 10-6 10 0 0 4-5 4-5 8" />
      <circle cx="24" cy="33" r="1.5" fill="currentColor" />
    </S>
  ),
  whole_breast: (p) => (
    <S {...p}>
      <path d="M8 14c0 18 6 26 16 26s16-8 16-26" />
      <circle cx="24" cy="30" r="3" fill="currentColor" />
    </S>
  ),
  mic: (p) => (
    <S {...p}>
      <rect x="18" y="6" width="12" height="22" rx="6" fill="currentColor" />
      <path d="M12 22c0 7 5 12 12 12s12-5 12-12M24 34v8M18 42h12" />
    </S>
  ),
  stop: (p) => (
    <S {...p}>
      <rect x="14" y="14" width="20" height="20" rx="4" fill="currentColor" />
    </S>
  ),
  check: (p) => (
    <S {...p}>
      <path d="M10 25l9 9 19-20" strokeWidth={5} />
    </S>
  ),
  cross: (p) => (
    <S {...p}>
      <path d="M14 14l20 20M34 14L14 34" strokeWidth={5} />
    </S>
  ),
  hand: (p) => (
    <S {...p}>
      <path d="M18 26V10a3 3 0 0 1 6 0v12M24 20v-2a3 3 0 0 1 6 0v4M30 22a3 3 0 0 1 6 0v6c0 8-5 14-12 14s-10-4-13-9l-3-6a3 3 0 0 1 5-3l3 4" />
    </S>
  ),
  edit: (p) => (
    <S {...p}>
      <path d="M10 38l4-12 18-18 8 8-18 18z" />
      <path d="M28 12l8 8" />
    </S>
  ),
  trash: (p) => (
    <S {...p}>
      <path d="M10 14h28M18 14V9h12v5M14 14l2 26h16l2-26" />
    </S>
  ),
  play: (p) => (
    <S {...p}>
      <path d="M16 10l22 14-22 14z" fill="currentColor" />
    </S>
  ),
  home: (p) => (
    <S {...p}>
      <path d="M7 22L24 8l17 14" />
      <path d="M12 19v20h9V29h6v10h9V19" />
    </S>
  ),
  profile: (p) => (
    <S {...p}>
      <circle cx="24" cy="17" r="8" />
      <path d="M9 41c2-9 8-13 15-13s13 4 15 13" />
    </S>
  ),
  globe: (p) => (
    <S {...p}>
      <circle cx="24" cy="24" r="17" />
      <path d="M7 24h34M24 7c-9 9-9 25 0 34M24 7c9 9 9 25 0 34" />
    </S>
  ),
  back: (p) => (
    <S {...p}>
      <path d="M30 10L16 24l14 14" strokeWidth={4} />
    </S>
  ),
  calendar: (p) => (
    <S {...p}>
      <rect x="8" y="10" width="32" height="30" rx="4" />
      <path d="M8 18h32M16 6v8M32 6v8" />
    </S>
  ),
  history: (p) => (
    <S {...p}>
      <path d="M8 24a16 16 0 1 0 4.7-11.3L8 17.4" />
      <path d="M8 8v9.4h9.4" />
      <path d="M24 15v9l6 4" />
    </S>
  ),
  settings: (p) => (
    <S {...p}>
      <path d="M20.5 5h7l1.2 5.2 3.4 2 5.1-1.6 3.5 6-3.9 3.7v3.9l3.9 3.7-3.5 6-5.1-1.6-3.4 2L27.5 43h-7l-1.2-5.2-3.4-2-5.1 1.6-3.5-6 3.9-3.7v-3.9L7.3 20.6l3.5-6 5.1 1.6 3.4-2z" />
      <circle cx="24" cy="24" r="6" />
    </S>
  ),
  help: (p) => (
    <S {...p}>
      <circle cx="24" cy="24" r="17" />
      <path d="M19 19c0-6.5 10-6.5 10 0 0 4.5-5 4.5-5 9" />
      <circle cx="24" cy="34" r="1.5" fill="currentColor" />
    </S>
  ),
  image: (p) => (
    <S {...p}>
      <rect x="6" y="9" width="36" height="30" rx="4" />
      <circle cx="17" cy="19" r="3.5" />
      <path d="M6 34l11-10 8 7 6-5 11 9" />
    </S>
  ),
  finished: (p) => (
    <S {...p}>
      <path d="M12 42V8M12 10h22l-5 7 5 7H12" fill="currentColor" fillOpacity={0.2} />
    </S>
  ),
  save: (p) => (
    <S {...p}>
      <path d="M10 8h22l6 6v26H10z" />
      <path d="M16 8v10h14V8M16 40V28h16v12" />
    </S>
  ),
  keyboard: (p) => (
    <S {...p}>
      <rect x="6" y="14" width="36" height="22" rx="4" />
      <path d="M12 21h2M19 21h2M26 21h2M33 21h2M14 29h20" />
    </S>
  ),
  plus: (p) => (
    <S {...p}>
      <path d="M24 12v24M12 24h24" strokeWidth={4} />
    </S>
  ),
  minus: (p) => (
    <S {...p}>
      <path d="M12 24h24" strokeWidth={4} />
    </S>
  ),
  shield: (p) => (
    <S {...p}>
      <path d="M24 6l14 6v10c0 10-6 17-14 20-8-3-14-10-14-20V12z" />
      <path d="M17 24l5 5 9-10" />
    </S>
  ),
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? ICONS["no_changes"];
  return <>{C?.({ className })}</>;
}
