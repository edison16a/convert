import { useEffect } from "react";
import { warmEngines } from "@/features/conversion/controller";
import { clearOpfsResults } from "@/features/conversion/opfs";
import { useCapabilities } from "@/features/formats/capabilities";
import { registerServiceWorker } from "@/features/pwa/registerServiceWorker";

/**
 * Everything the page does once, right after it first renders: probe the
 * browser, clear files a crashed tab left on disk, register the offline
 * worker, and warm the light engines when the browser has nothing better to do.
 */
export function useBoot(): void {
  useEffect(() => {
    useCapabilities.getState().detect();
    void clearOpfsResults();
    registerServiceWorker();

    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 2000));
    const handle = idle(() => {
      if (navigator.onLine && process.env.NODE_ENV === "production") warmEngines();
    });
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(handle as number);
  }, []);
}
