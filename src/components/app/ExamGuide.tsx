import { Icon } from "@/components/icons";
import { useApp } from "./context";
import { GuideSignArt } from "./illustrations";
import { Mascot } from "./Mascot";

/** Picture slot. Swap the placeholder for a real image (src) once pictures are provided. */
export function GuideImage({ src, alt }: { src?: string; alt: string }) {
  const { tt } = useApp();
  if (src) return <img src={src} alt={alt} className="aspect-[4/3] w-full rounded-2xl object-cover" />;
  return (
    <div role="img" aria-label={alt} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-muted text-muted-foreground">
      <Icon name="image" className="h-12 w-12" />
      <span className="text-sm font-semibold">{tt("image_placeholder")}</span>
    </div>
  );
}

const SIGNS = [1, 2, 3, 4, 5];

export function ExamGuide() {
  const { tt, skin } = useApp();
  return (
    <div className="flex flex-col gap-6 pb-8">
      <h1 className="text-3xl font-extrabold">{tt("guide_title")}</h1>
      <Mascot message={tt("guide_mascot")} />
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold">{tt("guide_how")}</h2>
        <a href="https://www.washingtonradiology.com/insights/how-do-breast-self-exam-infographic" target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-primary bg-card px-4 py-3 text-lg font-bold shadow-soft">
          <Icon name="help" className="h-8 w-8 shrink-0 text-primary" />{tt("guide_link")}
        </a>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold">{tt("guide_look")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {SIGNS.map((n) => (
            <div key={n} className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-soft">
              <GuideSignArt n={n} skin={skin} label={tt(`guide_sign_${n}`)} />
              <p className="font-bold leading-snug">{tt(`guide_sign_${n}`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
