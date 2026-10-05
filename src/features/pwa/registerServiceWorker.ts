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
