import type { FormatId } from "@/features/formats/types";

/**
 * "preparing" means a heavy engine (like ffmpeg) is still being downloaded or
 * started, so the row can say so instead of sitting at 0 percent.
 */
export type Phase = "preparing" | "converting";

/** What the worker hands an engine: one file, one target, and a way to report progress. */
export interface EngineRequest {
  file: File;
  from: FormatId;
  to: FormatId;
  /** Reports completion from 0 to 1. Cheap to call often, the pool throttles it. */
  report: (fraction: number) => void;
  /** Tells the UI which phase the job is in. Engines that start instantly never call it. */
  phase: (phase: Phase) => void;
}

/** What an engine returns. `extension` can differ from the target (a multi-page PDF becomes a zip). */
export interface EngineResult {
  blob: Blob;
  extension: string;
}

/** Every engine exports a function of this shape as its single entry point. */
export type Converter = (request: EngineRequest) => Promise<EngineResult>;
