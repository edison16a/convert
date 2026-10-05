"use client";

import { useEffect, useState } from "react";
import { useQueue } from "@/features/queue/store";

/**
 * Announces progress and completion to screen readers. The region is polite,
 * so it waits for the reader to finish speaking. We only speak when the count
 * of finished files changes, not on every progress tick, which would be noise.
 */
export function LiveRegion() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let lastSettled = 0;
    return useQueue.subscribe((state) => {
      const jobs = state.jobs;
      const working = jobs.some((job) => job.status === "queued" || job.status === "running");
      const done = jobs.filter((job) => job.status === "done").length;
      const failed = jobs.filter((job) => job.status === "error").length;
      const settled = done + failed;
      if (settled === lastSettled) return;
      lastSettled = settled;
      if (settled === 0) return;
      if (working) setMessage(`${done} of ${jobs.length} files converted.`);
      else setMessage(failed > 0 ? `Finished. ${done} converted, ${failed} failed.` : `All ${done} files converted.`);
    });
  }, []);

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
