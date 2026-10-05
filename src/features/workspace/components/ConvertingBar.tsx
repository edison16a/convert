import { Button } from "@/components/ui/Button";
import { cancelAll } from "@/features/conversion/controller";
import { useQueue } from "@/features/queue/store";

/** While converting: show overall progress and offer one way out. */
export function ConvertingBar() {
  const jobs = useQueue((state) => state.jobs);
  const active = jobs.filter((job) => job.status === "queued" || job.status === "running" || job.status === "done");
  const finished = active.filter((job) => job.status === "done").length;

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Converting</h2>
        <p className="font-mono text-xs text-muted">
          {finished} of {active.length} done
        </p>
      </div>
      <Button onClick={cancelAll}>Cancel</Button>
    </>
  );
}
