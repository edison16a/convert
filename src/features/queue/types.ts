import type { Phase } from "@/engines/types";
import type { FormatId } from "@/features/formats/types";

/**
 * idle: added, waiting for the user to press Convert.
 * queued: Convert was pressed, waiting for a free worker.
 */
export type JobStatus = "idle" | "queued" | "running" | "done" | "error" | "cancelled";

/** The finished file. Large results may live in the Origin Private File System. */
export interface JobResult {
  blob: Blob;
  name: string;
  size: number;
  /** Set when the result was written to OPFS, so it can be deleted later. */
  opfsName: string | null;
}

export interface Job {
  id: string;
  file: File;
  /** What was detected from the content. undefined while detection is still running, null when unknown. */
  detected: FormatId | null | undefined;
  target: FormatId | null;
  status: JobStatus;
  /** 0 to 1. */
  progress: number;
  phase: Phase;
  result: JobResult | null;
  /** A plain-language reason, set when status is "error". */
  error: string | null;
}

/** The four screens from the spec. */
export type Stage = "empty" | "queued" | "converting" | "done";
