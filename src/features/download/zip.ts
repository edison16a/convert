import { AsyncZipDeflate, Zip, ZipPassThrough } from "fflate";

export interface ZipEntry {
  name: string;
  blob: Blob;
}

/** Text-like formats shrink well. Everything else (jpg, mp4, pdf) is already compressed. */
const COMPRESSIBLE = /\.(txt|csv|json|md|html|yaml|xml|svg|bmp|wav)$/i;

/**
 * Streams a zip archive to `write`, one chunk at a time. Entries are read as
 * streams, so a big video is never fully held in memory here. Already
 * compressed files are stored as is, and compressible ones are deflated on
 * fflate's own worker so the main thread stays free.
 */
export async function writeZip(entries: readonly ZipEntry[], write: (chunk: Uint8Array) => Promise<void>): Promise<void> {
  let writes = Promise.resolve();
  let failure: unknown = null;
  const finished = new Promise<void>((resolve, reject) => {
    const zip = new Zip((error, chunk, final) => {
      if (error) {
        failure = error;
        reject(error);
        return;
      }
      // Writes are chained so chunks reach the sink in order.
      writes = writes.then(() => write(chunk));
      if (final) resolve();
    });

    void (async () => {
      try {
        for (const entry of entries) {
          const file = COMPRESSIBLE.test(entry.name)
            ? new AsyncZipDeflate(entry.name, { level: 6 })
            : new ZipPassThrough(entry.name);
          zip.add(file);
          const reader = entry.blob.stream().getReader();
          for (;;) {
            const { done, value } = await reader.read();
            file.push(value ?? new Uint8Array(0), done);
            if (done) break;
          }
        }
        zip.end();
      } catch (error) {
        failure = error;
        reject(error);
      }
    })();
  });
  await finished;
  await writes;
  if (failure) throw failure;
}

/** Builds the whole archive in memory. Used when the browser cannot stream to disk. */
export async function zipToBlob(entries: readonly ZipEntry[]): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  await writeZip(entries, async (chunk) => {
    chunks.push(chunk);
  });
  return new Blob(chunks as BlobPart[], { type: "application/zip" });
}
