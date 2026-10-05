import { create } from "zustand";
import { detectFormat } from "@/features/detect/detect";
import { useCapabilities } from "@/features/formats/capabilities";
import type { FormatId } from "@/features/formats/types";
import { applyDetection, applyGlobalTarget, createJob } from "./jobs";
import type { Job } from "./types";

/** How many files we sniff at once. Small enough to keep the UI responsive on a 100 file drop. */
const DETECT_BATCH = 8;

interface QueueState {
  jobs: Job[];
  /** The "convert all to" choice, or null when none was made. */
  globalTarget: FormatId | null;
  /** Appends files, shows them right away, then fills in their detected types. */
  addFiles: (files: File[]) => Promise<void>;
  setTarget: (id: string, target: FormatId) => void;
  setGlobalTarget: (target: FormatId) => void;
  /** Merges fields into one job. The conversion controller uses this for status and progress. */
  patch: (id: string, patch: Partial<Job>) => void;
  removeJob: (id: string) => void;
  reset: () => void;
}

const unavailable = () => useCapabilities.getState().unavailable;

export const useQueue = create<QueueState>((set) => ({
  jobs: [],
  globalTarget: null,

  addFiles: async (files) => {
    const added = files.map(createJob);
    set((state) => ({ jobs: [...state.jobs, ...added] }));

    for (let i = 0; i < added.length; i += DETECT_BATCH) {
      const batch = added.slice(i, i + DETECT_BATCH);
      const found = await Promise.all(batch.map((job) => detectFormat(job.file).catch(() => null)));
      const byId = new Map(batch.map((job, index) => [job.id, found[index]]));
      set((state) => ({
        jobs: state.jobs.map((job) =>
          byId.has(job.id) ? applyDetection(job, byId.get(job.id) ?? null, state.globalTarget, unavailable()) : job,
        ),
      }));
    }
  },

  setTarget: (id, target) =>
    set((state) => ({ jobs: state.jobs.map((job) => (job.id === id ? { ...job, target } : job)) })),

  setGlobalTarget: (target) =>
    set((state) => ({ globalTarget: target, jobs: applyGlobalTarget(state.jobs, target, unavailable()) })),

  patch: (id, patch) =>
    set((state) => ({ jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job)) })),

  removeJob: (id) => set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) })),

  reset: () => set({ jobs: [], globalTarget: null }),
}));
