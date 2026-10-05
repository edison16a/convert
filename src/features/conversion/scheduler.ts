import { FORMATS } from "@/features/formats/definitions";
import type { FormatId } from "@/features/formats/types";

/** A job as the scheduler sees it: just an id and how much memory it is likely to want. */
export interface Candidate {
  id: string;
  heavy: boolean;
}

export interface Limits {
  /** Total jobs that may run at once. */
  workers: number;
  /** How many heavy jobs (video) may run at once. */
  heavy: number;
}

/**
 * Worker count from the spec: one less than the CPU cores so the page stays
 * responsive, never fewer than 1 and never more than 4.
 */
export function poolSize(cores: number | undefined): number {
  return Math.min(4, Math.max(1, (cores ?? 2) - 1));
}

/** Video is the heavy case: a decoded 4K clip can fill a tab, so those run one at a time. */
export const isHeavy = (from: FormatId) => FORMATS[from].category === "video";

/**
 * Chooses which waiting jobs to start now, in queue order. A heavy job that
 * has to wait does not block the light jobs behind it, so one long video
 * never stalls a stack of images.
 */
export function pickNext(queued: readonly Candidate[], running: readonly Candidate[], limits: Limits): string[] {
  let slots = limits.workers - running.length;
  let heavy = running.filter((job) => job.heavy).length;
  const start: string[] = [];
  for (const job of queued) {
    if (slots <= 0) break;
    if (job.heavy && heavy >= limits.heavy) continue;
    start.push(job.id);
    slots--;
    if (job.heavy) heavy++;
  }
  return start;
}
