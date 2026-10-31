import mascot from "@/assets/mascot-wave.webm.asset.json";
import { cn } from "@/lib/utils";

/** Waving mascot, optionally with a speech bubble. */
export function Mascot({ message, size = "md", className }: { message?: string; size?: "md" | "lg"; className?: string }) {
  const video = (
    <video src={mascot.url} autoPlay muted loop playsInline aria-hidden
      className={cn("shrink-0 object-contain", size === "lg" ? "h-64 w-64" : "h-28 w-28")} />
  );
  if (!message) return <div className={cn("flex justify-center", className)}>{video}</div>;
  if (size === "lg") return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative rounded-3xl border-2 border-primary bg-primary-soft px-5 py-4 text-center text-xl font-normal leading-snug shadow-soft">
        {message}
        <span aria-hidden className="absolute -bottom-2.5 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-primary bg-primary-soft" />
      </div>
      {video}
    </div>
  );
  return (
    <div className={cn("flex items-end gap-1", className)}>
      {video}
      <div className="relative mb-6 flex-1 rounded-3xl border-2 border-primary bg-card px-4 py-3 text-base font-semibold leading-snug shadow-soft">
        {message}
        <span aria-hidden className="absolute -left-2 bottom-5 h-4 w-4 rotate-45 border-b-2 border-l-2 border-primary bg-card" />
      </div>
    </div>
  );
}
