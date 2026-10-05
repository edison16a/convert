import { memo } from "react";
import { CategoryIcon } from "@/components/icons/file-types";
import { ChevronRightIcon } from "@/components/icons/interface";
import { retryJob } from "@/features/conversion/controller";
import { outputName } from "@/features/conversion/naming";
import { FORMATS } from "@/features/formats/definitions";
import { FormatPicker } from "@/features/formats/components/FormatPicker";
import { outputsFor, type Unavailable } from "@/features/formats/registry";
import type { FormatId } from "@/features/formats/types";
import { formatBytes } from "@/lib/bytes";
import { skippedByGlobal, unsupportedReason } from "../jobs";
import { useQueue } from "../store";
import type { Job } from "../types";
import { MiddleTruncate } from "./MiddleTruncate";
import { RowActions } from "./RowActions";
import { StatusCell } from "./StatusCell";

interface FileRowProps {
  job: Job;
  globalTarget: FormatId | null;
  unavailable: Unavailable;
}

/** The small monospace chip for a detected type, such as HEIC. */
function TypeChip({ label }: { label: string }) {
  return <span className="rounded-md bg-bg px-2 py-1 font-mono text-[11px] font-medium text-muted">{label}</span>;
}

/**
 * One file. Memoized so that a progress tick on one row does not re-render
 * the other ninety nine: unchanged jobs keep the same object identity.
 */
function FileRowBase({ job, globalTarget, unavailable }: FileRowProps) {
  const setTarget = useQueue((state) => state.setTarget);
  const category = job.detected ? FORMATS[job.detected].category : null;
  const unsupported = unsupportedReason(job);
  const idle = job.status === "idle";
  const finished = job.status === "running" || job.status === "done";
  const shownName = finished && job.target ? outputName(job.file.name, job.target) : job.file.name;
  const detectedLabel = job.detected ? FORMATS[job.detected].label : null;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl bg-surface px-4 py-3">
      <div className="flex min-w-0 flex-1 basis-52 items-center gap-3">
        <CategoryIcon category={category} size={20} className="shrink-0 text-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            <MiddleTruncate text={shownName} />
          </p>
          <p className="font-mono text-[11px] text-muted">
            {finished && detectedLabel && job.target
              ? `${detectedLabel} to ${FORMATS[job.target].label}`
              : formatBytes(job.file.size)}
          </p>
        </div>
      </div>

      {idle && !unsupported && (
        <div className="flex items-center gap-2">
          {job.detected === undefined ? (
            <span className="font-mono text-[11px] text-muted">Detecting</span>
          ) : (
            detectedLabel && <TypeChip label={detectedLabel} />
          )}
          {job.detected && (
            <>
              <ChevronRightIcon size={14} className="text-muted" />
              <FormatPicker
                variant="row"
                label={`Output format for ${job.file.name}`}
                options={outputsFor(job.detected, unavailable)}
                value={job.target}
                onChange={(format) => setTarget(job.id, format)}
              />
            </>
          )}
        </div>
      )}

      <StatusCell
        job={job}
        unsupported={unsupported}
        note={skippedByGlobal(job, globalTarget, unavailable)}
        onRetry={() => retryJob(job.id)}
      />
      <RowActions job={job} />
    </li>
  );
}

export const FileRow = memo(FileRowBase);
