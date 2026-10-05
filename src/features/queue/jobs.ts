import { canConvert, defaultOutput, isReadable, outputsFor, type Unavailable } from "@/features/formats/registry";
import { FORMATS } from "@/features/formats/definitions";
import type { FormatId } from "@/features/formats/types";
import { newId } from "@/lib/ids";
import type { Job, Stage } from "./types";

/** A fresh row for a dropped file. Detection fills in the rest a moment later. */
export function createJob(file: File): Job {
  return {
    id: newId(),
    file,
    detected: undefined,
    target: null,
    status: "idle",
    progress: 0,
    phase: "converting",
    result: null,
    error: null,
  };
}

/**
 * Records what we found out about a file and gives it a starting target.
 * The global choice wins when this file can reach it, otherwise we pick a
 * sensible default so the file is ready to convert without any clicks.
 */
export function applyDetection(
  job: Job,
  detected: FormatId | null,
  globalTarget: FormatId | null,
  unavailable: Unavailable,
): Job {
  if (!detected) return { ...job, detected: null, target: null };
  const target =
    globalTarget && canConvert(detected, globalTarget, unavailable)
      ? globalTarget
      : defaultOutput(detected, unavailable);
  return { ...job, detected, target };
}

/** Applies one output format to every row that can reach it. The rest keep their own choice. */
export function applyGlobalTarget(jobs: readonly Job[], target: FormatId, unavailable: Unavailable): Job[] {
  return jobs.map((job) =>
    job.status === "idle" && job.detected && canConvert(job.detected, target, unavailable)
      ? { ...job, target }
      : job,
  );
}

/** True when this row can be sent to a worker right now. */
export function isConvertible(job: Job, unavailable: Unavailable): boolean {
  return Boolean(job.detected && job.target && canConvert(job.detected, job.target, unavailable));
}

/** Why a row can never be converted, or null when it can. Shown instead of the format picker. */
export function unsupportedReason(job: Job): string | null {
  if (job.detected === undefined) return null;
  if (job.detected === null) return "Unrecognized file type";
  if (!isReadable(job.detected)) return `${FORMATS[job.detected].label} files are not supported yet`;
  if (outputsFor(job.detected).length === 0) return "No output formats available";
  return null;
}

/** A hint for rows that cannot follow the global format, so the user sees why they were skipped. */
export function skippedByGlobal(job: Job, globalTarget: FormatId | null, unavailable: Unavailable): string | null {
  if (!globalTarget || !job.detected || job.status !== "idle") return null;
  if (unsupportedReason(job)) return null;
  if (canConvert(job.detected, globalTarget, unavailable)) return null;
  return `Cannot convert to ${FORMATS[globalTarget].label}`;
}

/** Which of the four screens the queue is on, derived so it can never get out of sync. */
export function stageOf(jobs: readonly Job[]): Stage {
  if (jobs.length === 0) return "empty";
  if (jobs.some((job) => job.status === "queued" || job.status === "running")) return "converting";
  const pending = jobs.some((job) => job.status === "idle" && job.target);
  const settled = jobs.some((job) => job.status === "done" || job.status === "error" || job.status === "cancelled");
  return settled && !pending ? "done" : "queued";
}

export interface Summary {
  done: number;
  failed: number;
  total: number;
  inputBytes: number;
  outputBytes: number;
}

/** Totals for the summary bar. Sizes only count finished files so the comparison is fair. */
export function summarize(jobs: readonly Job[]): Summary {
  const finished = jobs.filter((job) => job.status === "done" && job.result);
  return {
    done: finished.length,
    failed: jobs.filter((job) => job.status === "error").length,
    total: jobs.length,
    inputBytes: finished.reduce((sum, job) => sum + job.file.size, 0),
    outputBytes: finished.reduce((sum, job) => sum + (job.result?.size ?? 0), 0),
  };
}
