import { PlusIcon } from "@/components/icons/interface";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { startConversion } from "@/features/conversion/controller";
import { pickFiles } from "@/features/dropzone/pickFiles";
import { FormatPicker } from "@/features/formats/components/FormatPicker";
import { useConvertibleCount, useGlobalOptions } from "@/features/queue/selectors";
import { useQueue } from "@/features/queue/store";

/** Before converting: choose one format for everything, add files, and press Convert. */
export function QueuedBar() {
  const jobCount = useQueue((state) => state.jobs.length);
  const globalTarget = useQueue((state) => state.globalTarget);
  const setGlobalTarget = useQueue((state) => state.setGlobalTarget);
  const options = useGlobalOptions();
  const ready = useConvertibleCount();

  return (
    <>
      <h2 className="text-xl font-semibold tracking-tight">
        {jobCount} {jobCount === 1 ? "file" : "files"}
      </h2>
      <div className="flex items-center gap-2">
        <FormatPicker
          variant="global"
          label="Convert all files to"
          options={options}
          value={globalTarget}
          onChange={setGlobalTarget}
          disabled={options.length === 0}
        />
        <IconButton label="Add more files" onClick={pickFiles} className="border border-line">
          <PlusIcon size={16} />
        </IconButton>
        <Button variant="primary" disabled={ready === 0} onClick={startConversion} aria-label={`Convert ${ready} files`}>
          Convert
        </Button>
      </div>
    </>
  );
}
