import type { FormatId } from "@/features/formats/types";

/** What the worker hands an engine: one file, one target, and a way to report progress. */
export interface EngineRequest {
  file: File;
  from: FormatId;
  to: FormatId;
  /** Reports completion from 0 to 1. Cheap to call often, the pool throttles it. */
  report: (fraction: number) => void;
}

/** What an engine returns. `extension` can differ from the target (a multi-page PDF becomes a zip). */
export interface EngineResult {
  blob: Blob;
  extension: string;
}

/** Every engine exports a function of this shape as its single entry point. */
export type Converter = (request: EngineRequest) => Promise<EngineResult>;
