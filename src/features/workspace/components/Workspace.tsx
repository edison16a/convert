"use client";

import { DropOverlay } from "@/features/dropzone/DropOverlay";
import { EmptyState } from "@/features/dropzone/EmptyState";
import { useGlobalDrop } from "@/features/dropzone/useGlobalDrop";
import { usePaste } from "@/features/dropzone/usePaste";
import { LiveRegion } from "@/features/a11y/LiveRegion";
import { FileList } from "@/features/queue/components/FileList";
import { useStage } from "@/features/queue/selectors";
import { useBoot } from "../hooks/useBoot";
import { ActionBar } from "./ActionBar";
import { AddMore } from "./AddMore";
import { TopBar } from "./TopBar";

/**
 * The whole product on one full screen page. The empty screen is a single
 * large drop target. Once files exist, a pinned action bar sits above the list.
 */
export function Workspace() {
  const stage = useStage();
  const dragging = useGlobalDrop();
  usePaste();
  useBoot();

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex flex-1 flex-col px-4 pb-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
          {stage === "empty" ? (
            <EmptyState />
          ) : (
            <>
              <ActionBar />
              <FileList />
              <AddMore />
            </>
          )}
        </div>
      </main>
      <DropOverlay visible={dragging} />
      <LiveRegion />
    </div>
  );
}
