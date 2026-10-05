"use client";

import { useStage } from "@/features/queue/selectors";
import { ConvertingBar } from "./ConvertingBar";
import { DoneBar } from "./DoneBar";
import { QueuedBar } from "./QueuedBar";

/**
 * The bar above the list. It stays pinned while the list scrolls, so the
 * main action is always in reach even with a hundred files. Which controls
 * it shows depends only on the stage.
 */
export function ActionBar() {
  const stage = useStage();
  return (
    <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 bg-bg/90 px-1 py-3 backdrop-blur">
      {stage === "converting" ? <ConvertingBar /> : stage === "done" ? <DoneBar /> : <QueuedBar />}
    </div>
  );
}
