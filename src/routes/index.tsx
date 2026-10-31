import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/components/app/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyCheck — record your breast self-exam" },
      { name: "description", content: "Record breast self-exam findings in five languages, review them, and confirm to save records on your phone. MyCheck never diagnoses." },
      { property: "og:title", content: "MyCheck — record your breast self-exam" },
      { property: "og:description", content: "Record and review breast self-exam findings in five languages. Confirmed records stay on your phone; MyCheck never diagnoses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});
