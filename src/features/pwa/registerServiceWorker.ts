/**
 * Registers the service worker that makes the app work offline. It only runs
 * in production builds, because a caching worker during development leads to
 * confusing stale pages.
 */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // Offline support is a bonus. If registration fails, the app still works online.
  });
}

/**
 * Resolves once the service worker is in control of this page, or false if it
 * never will be. Requests only go through the service worker (and so only get
 * cached) after that point. A worker started earlier would fetch its files
 * straight from the network and leave nothing in the cache, which is how a
 * slow first visit used to end up with an incomplete offline copy.
 */
export async function whenServiceWorkerControls(timeoutMs = 15_000): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) return true;
  return new Promise((resolve) => {
    const done = (controlled: boolean) => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      clearTimeout(timer);
      resolve(controlled);
    };
    const onChange = () => done(true);
    const timer = setTimeout(() => done(false), timeoutMs);
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
  });
}
