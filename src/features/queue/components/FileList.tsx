"use client";

import { useCapabilities } from "@/features/formats/capabilities";
import { useQueue } from "../store";
import { FileRow } from "./FileRow";

/** Every queued file in the order it was added. */
export function FileList() {
  const jobs = useQueue((state) => state.jobs);
  const globalTarget = useQueue((state) => state.globalTarget);
  const unavailable = useCapabilities((state) => state.unavailable);

  return (
    <ul className="flex flex-col gap-2.5" aria-label="Files">
      {jobs.map((job) => (
        <FileRow key={job.id} job={job} globalTarget={globalTarget} unavailable={unavailable} />
      ))}
    </ul>
  );
}
