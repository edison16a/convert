import { PlusIcon } from "@/components/icons/interface";
import { pickFiles } from "@/features/dropzone/pickFiles";

/** The compact drop target below the list. Files can also be dropped anywhere on the page. */
export function AddMore() {
  return (
    <button
      type="button"
      onClick={pickFiles}
      className="mt-2.5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm text-muted transition hover:border-muted/50 hover:text-fg"
    >
      <PlusIcon size={16} />
      Add more files, or drop them anywhere
    </button>
  );
}
