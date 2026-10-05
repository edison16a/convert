import { dedupeNames } from "./names";
import { writeZip, zipToBlob, type ZipEntry } from "./zip";

/** Hands a blob to the browser's download flow through a temporary link. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking right away can cancel the download in some browsers, so wait a little.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

interface SaveFilePicker {
  showSaveFilePicker?: (options: unknown) => Promise<FileSystemFileHandle>;
}

/**
 * Bundles every result into one zip. Where the File System Access API exists
 * the archive streams straight to the chosen file, so even gigabytes of
 * output never pile up in memory. Everywhere else it is built as a blob.
 * Returns false when the user dismissed the save dialog.
 */
export async function saveAsZip(results: readonly ZipEntry[], archiveName = "converted.zip"): Promise<boolean> {
  const names = dedupeNames(results.map((entry) => entry.name));
  const entries = results.map((entry, index) => ({ name: names[index], blob: entry.blob }));
  const picker = (window as unknown as SaveFilePicker).showSaveFilePicker;

  if (picker) {
    try {
      const handle = await picker.call(window, {
        suggestedName: archiveName,
        types: [{ description: "Zip archive", accept: { "application/zip": [".zip"] } }],
      });
      const writable = await handle.createWritable();
      await writeZip(entries, (chunk) => writable.write(chunk as unknown as FileSystemWriteChunkType));
      await writable.close();
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return false;
      // Anything else (a blocked picker, say) falls through to the in-memory path.
    }
  }
  saveBlob(await zipToBlob(entries), archiveName);
  return true;
}
