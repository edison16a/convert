import { AlertIcon, CheckCircleIcon, RetryIcon } from "@/components/icons/interface";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/bytes";
import type { Job } from "../types";
import { ProgressBar } from "./ProgressBar";

interface StatusCellProps {
  job: Job;
  /** A note for idle rows the global format skipped. */
  note: string | null;
  /** Set for rows that can never convert. */
  unsupported: string | null;
  onRetry: () => void;
}

const mono = "font-mono text-xs text-muted";

/** The right hand part of a row. What it shows depends only on the job's status. */
export function StatusCell({ job, note, unsupported, onRetry }: StatusCellProps) {
  switch (job.status) {
    case "queued":
      return <span className={mono}>Waiting</span>;

    case "running":
      if (job.phase === "preparing") return <span className={mono}>Preparing converter</span>;
      return (
        <div className="flex w-40 items-center gap-3 sm:w-56">
          <ProgressBar value={job.progress} label={`Converting ${job.file.name}`} />
          <span className={`${mono} w-9 text-right`}>{Math.round(job.progress * 100)}%</span>
        </div>
      );

    case "done":
      return (
        <span className="flex items-center gap-2 text-success">
          <CheckCircleIcon size={16} />
          <span className={mono}>{job.result ? formatBytes(job.result.size) : "Done"}</span>
        </span>
      );

    case "error":
      return <Failure message={job.error ?? "Something went wrong."} onRetry={onRetry} />;

    case "cancelled":
      return <Failure message="Cancelled" onRetry={onRetry} />;

    default: {
      const text = unsupported ?? note;
      if (!text) return null;
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <AlertIcon size={14} />
          {text}
        </span>
      );
    }
  }
}

function Failure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <AlertIcon size={15} />
        {message}
      </span>
      <Button onClick={onRetry} icon={<RetryIcon size={14} />} className="h-8 rounded-lg px-3 text-xs">
        Retry
      </Button>
    </div>
  );
}
