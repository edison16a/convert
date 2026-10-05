/**
 * pdf.js loads its 1 MB worker script the first time a PDF opens. Fetching it
 * early lets the service worker cache it, so PDF conversions work offline.
 */
export async function warmPdfWorker(): Promise<void> {
  await fetch(new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url)).catch(() => {});
}
