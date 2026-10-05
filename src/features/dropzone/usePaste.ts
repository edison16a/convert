import { useEffect } from "react";
import { useQueue } from "@/features/queue/store";

/** Lets people paste a copied file or screenshot straight into the queue. */
export function usePaste(): void {
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = [...(event.clipboardData?.files ?? [])];
      if (files.length === 0) return;
      event.preventDefault();
      void useQueue.getState().addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);
}
