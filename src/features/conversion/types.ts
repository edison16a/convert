import type { Phase } from "@/engines/types";
import type { FormatId } from "@/features/formats/types";

/** What the main thread sends to a worker for one conversion. */
export interface WorkerJob {
  id: string;
  file: File;
  from: FormatId;
  to: FormatId;
}

/**
 * Errors are returned as data instead of thrown. Comlink would flatten a
 * thrown error to a plain Error and lose its type, but the message is all
 * the UI needs and we have already turned it into plain language.
 */
export type WorkerOutcome =
  | { ok: true; blob: Blob; name: string; opfsName: string | null }
  | { ok: false; message: string; cancelled?: boolean };

/** The surface the conversion worker exposes through Comlink. */
export interface WorkerApi {
  convert(
    job: WorkerJob,
    onProgress: (fraction: number) => void,
    onPhase: (phase: Phase) => void,
  ): Promise<WorkerOutcome>;
}
