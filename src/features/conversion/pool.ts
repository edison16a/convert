import * as Comlink from "comlink";
import type { Phase } from "@/engines/types";
import type { WorkerApi, WorkerJob, WorkerOutcome } from "./types";

interface Slot {
  worker: Worker;
  api: Comlink.Remote<WorkerApi>;
}

/** A running job: wait on `promise`, or call `cancel` to kill its worker at once. */
export interface RunHandle {
  promise: Promise<WorkerOutcome>;
  cancel: () => void;
}

const CRASH_MESSAGE =
  "The converter stopped unexpectedly. This often means the file is too large for your browser's memory.";

/**
 * Keeps converter workers alive between jobs so a loaded engine (ffmpeg's
 * 30 MB core, a HEIC decoder) is reused. Cancelling terminates the worker,
 * which frees its memory immediately; the next job simply spawns a fresh one.
 */
export class WorkerPool {
  private idle: Slot[] = [];
  private busy = new Map<string, Slot>();

  private spawn(): Slot {
    const worker = new Worker(new URL("./worker/convert.worker.ts", import.meta.url), { type: "module" });
    return { worker, api: Comlink.wrap<WorkerApi>(worker) };
  }

  /**
   * Starts a worker and has it load the lightweight engines. The service
   * worker caches those files as they stream in, so image, data and document
   * conversions keep working offline. The worker then waits for real jobs.
   */
  async warm(): Promise<void> {
    const slot = this.spawn();
    try {
      await slot.api.warm();
      this.idle.push(slot);
    } catch {
      slot.worker.terminate();
    }
  }

  run(job: WorkerJob, onProgress: (fraction: number) => void, onPhase: (phase: Phase) => void): RunHandle {
    const slot = this.idle.pop() ?? this.spawn();
    this.busy.set(job.id, slot);

    let settle!: (outcome: WorkerOutcome) => void;
    const done = new Promise<WorkerOutcome>((resolve) => (settle = resolve));

    // A worker that dies (out of memory, for example) never answers, so we listen for it.
    const onCrash = (reason?: unknown) => {
      console.error("converter worker stopped", reason);
      this.busy.delete(job.id);
      slot.worker.terminate();
      settle({ ok: false, message: CRASH_MESSAGE });
    };
    slot.worker.addEventListener("error", onCrash, { once: true });

    slot.api
      .convert(job, Comlink.proxy(onProgress), Comlink.proxy(onPhase))
      .then((outcome) => {
        slot.worker.removeEventListener("error", onCrash);
        if (this.busy.delete(job.id)) this.idle.push(slot);
        settle(outcome);
      })
      .catch(onCrash);

    return {
      promise: done,
      cancel: () => {
        if (!this.busy.delete(job.id)) return;
        slot.worker.removeEventListener("error", onCrash);
        slot.worker.terminate();
        settle({ ok: false, message: "Cancelled", cancelled: true });
      },
    };
  }
}
