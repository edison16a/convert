import { CheckCircleIcon, DownloadIcon, PlusIcon } from "@/components/icons/interface";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { startOver } from "@/features/conversion/controller";
import { pickFiles } from "@/features/dropzone/pickFiles";
import { saveAsZip } from "@/features/download/save";
import { useSummary } from "@/features/queue/selectors";
import { useQueue } from "@/features/queue/store";
import { describeSummary } from "@/features/queue/summary";

/** After converting: the summary, a way to start over, and the big Download all button. */
export function DoneBar() {
  const summary = useSummary();
  const jobs = useQueue((state) => state.jobs);

  const downloadAll = () => {
    const results = jobs.flatMap((job) => (job.status === "done" && job.result ? [job.result] : []));
    void saveAsZip(results);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <CheckCircleIcon size={26} className="text-success" />
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Done</h2>
          <p className="font-mono text-xs text-muted">{describeSummary(summary)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <IconButton label="Add more files" onClick={pickFiles} className="border border-line">
          <PlusIcon size={16} />
        </IconButton>
        <Button onClick={startOver}>Clear</Button>
        <Button variant="primary" disabled={summary.done === 0} onClick={downloadAll} icon={<DownloadIcon size={16} />}>
          Download all
        </Button>
      </div>
    </>
  );
}
