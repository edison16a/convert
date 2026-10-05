import { AudioIcon, DocumentIcon, ImageIcon, TableIcon, VideoIcon } from "@/components/icons/file-types";
import { LockIcon } from "@/components/icons/interface";
import { Button } from "@/components/ui/Button";
import { pickFiles } from "./pickFiles";

const HINTS = [
  { label: "Images", Icon: ImageIcon },
  { label: "Documents", Icon: DocumentIcon },
  { label: "Data", Icon: TableIcon },
  { label: "Video", Icon: VideoIcon },
  { label: "Audio", Icon: AudioIcon },
];

/** The first screen: one big target, one sentence, one button, and the privacy promise. */
export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-[2rem] border border-dashed border-muted/40 px-6 py-16 text-center">
      <ul className="mb-8 flex items-center gap-5 text-accent-ink" aria-label="Supported kinds of files">
        {HINTS.map(({ label, Icon }) => (
          <li key={label} title={label}>
            <Icon size={30} />
            <span className="sr-only">{label}</span>
          </li>
        ))}
      </ul>
      <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Drop files</h1>
      <p className="mt-4 max-w-md text-balance text-base text-muted">
        Convert images, audio, video, documents and data. As many as you like, all at once.
      </p>
      <Button variant="primary" onClick={pickFiles} className="mt-8 h-12 rounded-2xl px-6 text-base">
        Choose files
      </Button>
      <p className="mt-8 flex items-center gap-2 text-sm text-muted">
        <LockIcon size={15} />
        Files never leave your device. Works offline.
      </p>
    </div>
  );
}
