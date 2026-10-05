/** Operating systems drop these into folders. Nobody wants them converted. */
const JUNK = /^(\.DS_Store|Thumbs\.db|desktop\.ini)$/i;

const keep = (file: File) => !JUNK.test(file.name);

function readFile(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => entry.file(resolve, () => resolve(null)));
}

/** A directory reader hands back results in batches, so keep asking until it is empty. */
async function readAll(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const all: FileSystemEntry[] = [];
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve, () => resolve([])));
    if (batch.length === 0) return all;
    all.push(...batch);
  }
}

async function walk(entry: FileSystemEntry, out: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await readFile(entry as FileSystemFileEntry);
    if (file && keep(file)) out.push(file);
    return;
  }
  if (entry.isDirectory) {
    for (const child of await readAll((entry as FileSystemDirectoryEntry).createReader())) {
      await walk(child, out);
    }
  }
}

/**
 * Collects every file from a drop, flattening folders into one list. The
 * entries must be read before the first await: browsers clear a drop's data
 * as soon as the event handler returns.
 */
export async function filesFromDataTransfer(data: DataTransfer): Promise<File[]> {
  const entries = [...data.items]
    .filter((item) => item.kind === "file")
    .map((item) => item.webkitGetAsEntry?.() ?? null);
  const loose = [...data.files];

  if (entries.length === 0 || entries.some((entry) => entry === null)) return loose.filter(keep);

  const out: File[] = [];
  for (const entry of entries) {
    if (entry) await walk(entry, out);
  }
  return out;
}
