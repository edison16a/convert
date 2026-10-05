import { useMemo } from "react";
import { useCapabilities } from "@/features/formats/capabilities";
import { reachableOutputs } from "@/features/formats/registry";
import type { FormatId } from "@/features/formats/types";
import { isConvertible, stageOf, summarize } from "./jobs";
import { useQueue } from "./store";

/** The current screen, derived from the jobs. */
export const useStage = () => useQueue((state) => stageOf(state.jobs));

export const useSummary = () => {
  const jobs = useQueue((state) => state.jobs);
  return useMemo(() => summarize(jobs), [jobs]);
};

/** How many rows would start if the user pressed Convert now. */
export function useConvertibleCount(): number {
  const jobs = useQueue((state) => state.jobs);
  const unavailable = useCapabilities((state) => state.unavailable);
  return useMemo(
    () => jobs.filter((job) => job.status === "idle" && isConvertible(job, unavailable)).length,
    [jobs, unavailable],
  );
}

/** Outputs at least one waiting file can reach: the global picker's contents. */
export function useGlobalOptions(): FormatId[] {
  const jobs = useQueue((state) => state.jobs);
  const unavailable = useCapabilities((state) => state.unavailable);
  return useMemo(() => {
    const formats = jobs
      .filter((job) => job.status === "idle" && job.detected)
      .map((job) => job.detected as FormatId);
    return reachableOutputs(formats, unavailable);
  }, [jobs, unavailable]);
}
