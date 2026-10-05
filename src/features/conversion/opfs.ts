/**
 * Results bigger than this go to disk instead of staying in memory. The
 * default is 256 MB. NEXT_PUBLIC_SPILL_THRESHOLD_MB lets a deployment tune it,
 * and lets tests exercise the disk path with a tiny file.
 */
export const SPILL_THRESHOLD = Number(process.env.NEXT_PUBLIC_SPILL_THRESHOLD_MB ?? 256) * 1024 * 1024;

const DIR = "results";

async function resultsDir(create: boolean): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(DIR, { create });
}

/**
 * Writes a large result into the Origin Private File System and returns a
 * File backed by that disk copy, so a 2 GB video does not sit in the tab's
 * memory. Runs in a worker because only workers have synchronous OPFS access
 * (which Safari needs). Returns null when OPFS is unavailable, and the caller
 * keeps the in-memory blob.
 */
export async function spillToOpfs(blob: Blob, fileName: string): Promise<File | null> {
  try {
    const handle = await (await resultsDir(true)).getFileHandle(fileName, { create: true });
    const access = await handle.createSyncAccessHandle();
    try {
      access.truncate(0);
      const reader = blob.stream().getReader();
      let at = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        access.write(value, { at });
        at += value.byteLength;
      }
      access.flush();
    } finally {
      access.close();
    }
    return await handle.getFile();
  } catch {
    return null;
  }
}

/** Deletes one spilled result. Safe to call when it does not exist. */
export async function removeFromOpfs(fileName: string): Promise<void> {
  try {
    await (await resultsDir(false)).removeEntry(fileName);
  } catch {
    // Already gone, or OPFS is unavailable. Either way there is nothing to clean up.
  }
}

/** Deletes everything left over from earlier sessions, for example after a crashed tab. */
export async function clearOpfsResults(): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(DIR, { recursive: true });
  } catch {
    // Nothing to clear.
  }
}
