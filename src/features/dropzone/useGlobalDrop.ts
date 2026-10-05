import { useEffect, useState } from "react";
import { useQueue } from "@/features/queue/store";
import { filesFromDataTransfer } from "./readDropped";

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;

/**
 * Makes the whole window a drop target, as the spec asks ("drag files
 * anywhere on the page"). Browsers fire dragenter and dragleave for every
 * child element, so a depth counter tells us when the pointer really left.
 */
export function useGlobalDrop(): boolean {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let depth = 0;

    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth++;
      setDragging(true);
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onOver = (event: DragEvent) => {
      // Without this the browser would navigate to the dropped file.
      if (hasFiles(event)) event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      if (!event.dataTransfer || !hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      void filesFromDataTransfer(event.dataTransfer).then((files) => {
        if (files.length > 0) void useQueue.getState().addFiles(files);
      });
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return dragging;
}
