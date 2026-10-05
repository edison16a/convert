import { useQueue } from "@/features/queue/store";

/**
 * Opens the system file dialog and adds whatever is chosen. The input is
 * created on demand, so there is no hidden element to keep in the page and
 * the call works from any button's click handler.
 */
export function pickFiles(): void {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.addEventListener("change", () => {
    const files = [...(input.files ?? [])];
    if (files.length > 0) void useQueue.getState().addFiles(files);
  });
  input.click();
}
