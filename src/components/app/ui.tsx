import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";

/** Icon tile used to toggle an option. */
export function Tile({
  icon,
  label,
  onClick,
  selected,
  className,
  iconNode,
}: {
  icon?: string;
  iconNode?: ReactNode;
  label: string;
  onClick: () => void;
  selected?: boolean;
  className?: string;
}) {
  return (
    <Button variant="ghost"
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "tap h-auto min-h-24 flex w-full flex-col items-center justify-center gap-2 whitespace-normal rounded-2xl border-2 bg-card p-3 text-center text-base font-bold shadow-soft transition-transform active:scale-[0.97] [&_svg]:size-10",
        selected ? "border-primary bg-primary-soft" : "border-transparent",
        className,
      )}
    >
      {iconNode ?? (icon && <Icon name={icon} className="h-10 w-10 text-foreground" />)}
      <span className="leading-tight">{label}</span>
    </Button>
  );
}

export function BigButton({
  icon,
  label,
  onClick,
  variant = "primary",
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: "primary" | "soft";
  disabled?: boolean;
}) {
  return (
    <Button variant="ghost"
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "tap h-auto flex w-full items-center justify-center gap-3 whitespace-normal rounded-full px-4 py-4 text-xl font-extrabold shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50 [&_svg]:size-8",
        variant === "primary" ? "bg-primary text-primary-foreground" : "bg-card text-foreground border-2 border-border",
      )}
    >
      <Icon name={icon} className="h-8 w-8" />
      {label}
    </Button>
  );
}

export function RoundAction({
  icon,
  label,
  onClick,
  variant = "primary",
}: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: "primary" | "soft";
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="ghost"
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
          "grid h-24 w-24 place-items-center rounded-full shadow-soft active:scale-95",
          variant === "primary" ? "bg-primary text-primary-foreground" : "bg-card text-foreground border-2 border-border",
        )}
      >
        <Icon name={icon} className="h-12 w-12" />
      </Button>
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}
