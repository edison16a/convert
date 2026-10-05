import { useCapabilities } from "@/features/formats/capabilities";
import { isConvertible } from "@/features/queue/jobs";
import { useQueue } from "@/features/queue/store";
import type { Job } from "@/features/queue/types";
import { clearOpfsResults, removeFromOpfs } from "./opfs";
import { WorkerPool, type RunHandle } from "./pool";
import { prepareInput } from "./prepare";
import { isHeavy, pickNext, poolSize } from "./scheduler";
import { explainFailure } from "@/engines/errors";

/** Progress is throttled so a fast engine does not re-render the list hundreds of times a second. */
const PROGRESS_INTERVAL_MS = 120;

let pool: WorkerPool | null = null;
const active = new Map<string, RunHandle>();

const store = () => useQueue.getState();
const limits = () => ({
  workers: poolSize(typeof navigator === "undefined" ? undefined : navigator.hardwareConcurrency),
  heavy: 1,
});

/** Loads the lightweight engines in the background once the page is idle. */
export function warmEngines(): void {
  pool ??= new WorkerPool();
  void pool.warm();
}

/** Marks every ready row as waiting and starts as many as the pool allows. */
export function startConversion(): void {
  const unavailable = useCapabilities.getState().unavailable;
  for (const job of store().jobs) {
    if (job.status === "idle" && isConvertible(job, unavailable)) {
      store().patch(job.id, { status: "queued", progress: 0, error: null, phase: "converting" });
    }
  }
  pump();
}

/** Starts waiting jobs until the scheduler says the pool is full. */
function pump(): void {
  const jobs = store().jobs;
  const candidate = (job: Job) => ({ id: job.id, heavy: isHeavy(job.detected ?? "png") });
  const ids = pickNext(
    jobs.filter((job) => job.status === "queued").map(candidate),
    jobs.filter((job) => job.status === "running").map(candidate),
    limits(),
  );
  for (const id of ids) {
    const job = jobs.find((j) => j.id === id);
    if (job) void run(job);
  }
}

async function run(job: Job): Promise<void> {
  store().patch(job.id, { status: "running", progress: 0 });
  try {
    const input = await prepareInput(job.file, job.detected as NonNullable<Job["detected"]>);
    // The user may have cancelled or removed the row while we were preparing.
    if (store().jobs.find((j) => j.id === job.id)?.status !== "running") return;

    pool ??= new WorkerPool();
    let last = 0;
    const handle = pool.run(
      { id: job.id, file: input.file, from: input.from, to: job.target as NonNullable<Job["target"]> },
      (fraction) => {
        const now = performance.now();
        if (now - last < PROGRESS_INTERVAL_MS && fraction < 1) return;
        last = now;
        store().patch(job.id, { progress: fraction });
      },
      (phase) => store().patch(job.id, { phase }),
    );
    active.set(job.id, handle);
    const outcome = await handle.promise;
    active.delete(job.id);

    if (store().jobs.find((j) => j.id === job.id)?.status !== "running") return;
    if (outcome.ok) {
      store().patch(job.id, {
        status: "done",
        progress: 1,
        result: { blob: outcome.blob, name: outcome.name, size: outcome.blob.size, opfsName: outcome.opfsName },
      });
    } else {
      store().patch(job.id, { status: "error", error: outcome.message });
    }
  } catch (error) {
    store().patch(job.id, { status: "error", error: explainFailure(error) });
  }
  pump();
}

/** Stops one file. A running job loses its worker, which frees its memory within a moment. */
export function cancelJob(id: string): void {
  const job = store().jobs.find((j) => j.id === id);
  if (!job || (job.status !== "queued" && job.status !== "running")) return;
  store().patch(id, { status: "cancelled", progress: 0 });
  active.get(id)?.cancel();
  active.delete(id);
  pump();
}

export function cancelAll(): void {
  store().jobs.forEach((job) => cancelJob(job.id));
}

/** Puts a failed or cancelled row back in the queue. */
export function retryJob(id: string): void {
  store().patch(id, { status: "queued", progress: 0, error: null, phase: "converting", result: null });
  pump();
}

/** Removes a row, stopping it first and freeing any result written to disk. */
export function removeJob(id: string): void {
  const job = store().jobs.find((j) => j.id === id);
  cancelJob(id);
  if (job?.result?.opfsName) void removeFromOpfs(job.result.opfsName);
  store().removeJob(id);
}

/** "Start over": cancels everything, deletes spilled results and empties the queue. */
export function startOver(): void {
  cancelAll();
  store().reset();
  void clearOpfsResults();
}
