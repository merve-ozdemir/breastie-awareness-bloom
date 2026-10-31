import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/components/app/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyCheck — record your breast self-exam" },
      { name: "description", content: "A voice-first, picture-first diary for your own breast self-exam. Everything stays on your phone." },
      { property: "og:title", content: "MyCheck — record your breast self-exam" },
      { property: "og:description", content: "A voice-first, picture-first diary for your own breast self-exam." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});
