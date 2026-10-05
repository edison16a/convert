import { CloseIcon, DownloadIcon } from "@/components/icons/interface";
import { IconButton } from "@/components/ui/IconButton";
import { saveBlob } from "@/features/download/save";
import { cancelJob, removeJob } from "@/features/conversion/controller";
import type { Job } from "../types";

/** The buttons at the end of a row: download once done, and cancel or remove. */
export function RowActions({ job }: { job: Job }) {
  const active = job.status === "queued" || job.status === "running";
  return (
    <div className="order-2 flex items-center gap-1 sm:order-none">
      {job.status === "done" && job.result && (
        <IconButton
          label={`Download ${job.result.name}`}
          className="bg-bg text-fg hover:bg-surface-hover"
          onClick={() => job.result && saveBlob(job.result.blob, job.result.name)}
        >
          <DownloadIcon size={16} />
        </IconButton>
      )}
      <IconButton
        label={active ? `Cancel ${job.file.name}` : `Remove ${job.file.name}`}
        onClick={() => (active ? cancelJob(job.id) : removeJob(job.id))}
      >
        <CloseIcon size={15} />
      </IconButton>
    </div>
  );
}
