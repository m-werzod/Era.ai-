import { useEffect } from "react";
import { GenerationQueue } from "@/widgets/generation-queue";

/** Thin page: sets the document title and renders the queue widget. */
export default function QueuePage() {
  useEffect(() => {
    document.title = "ERA2 — Очередь генераций";
  }, []);

  return (
    <div className="min-h-[calc(100dvh-var(--header-height,64px))]">
      <GenerationQueue />
    </div>
  );
}
