import * as Comlink from "comlink";
import { explainFailure } from "@/engines/errors";
import { findEngine } from "@/features/formats/registry";
import { outputName } from "../naming";
import { SPILL_THRESHOLD, spillToOpfs } from "../opfs";
import type { WorkerApi } from "../types";
import { LIGHT_ENGINES, loadEngine } from "./engines";

/**
 * One worker runs one job at a time. Routing is a lookup in the format
 * registry, so this file never needs to change when a format is added.
 */
const api: WorkerApi = {
  async convert(job, onProgress, onPhase) {
    try {
      const engineId = findEngine(job.from, job.to);
      if (!engineId) return { ok: false, message: "This conversion is not supported." };

      const convert = await loadEngine(engineId);
      const result = await convert({ file: job.file, from: job.from, to: job.to, report: onProgress, phase: onPhase });

      const name = outputName(job.file.name, result.extension);
      if (result.blob.size > SPILL_THRESHOLD) {
        const opfsName = `${job.id}-${name}`;
        const spilled = await spillToOpfs(result.blob, opfsName);
        if (spilled) return { ok: true, blob: spilled, name, opfsName };
      }
      return { ok: true, blob: result.blob, name, opfsName: null };
    } catch (error) {
      return { ok: false, message: explainFailure(error) };
    }
  },

  async warm() {
    await Promise.allSettled(LIGHT_ENGINES.map(loadEngine));
  },
};

Comlink.expose(api);
