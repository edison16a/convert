import { create } from "zustand";
import type { FormatId } from "./types";

const IMAGE_OUTPUTS: FormatId[] = ["png", "jpg", "webp", "avif", "gif", "bmp", "ico"];

/**
 * Finds the outputs this browser cannot produce at all. Image work needs
 * OffscreenCanvas inside workers, so without it every image output is hidden
 * up front instead of failing halfway through a batch. WebP and AVIF are not
 * listed because they have WASM fallbacks that work everywhere.
 */
export function probeUnavailable(): Set<FormatId> {
  const missing = new Set<FormatId>();
  const canvas = typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined";
  if (!canvas) IMAGE_OUTPUTS.forEach((id) => missing.add(id));
  return missing;
}

interface CapabilityState {
  unavailable: ReadonlySet<FormatId>;
  /** Runs the probes once, in the browser. */
  detect: () => void;
}

export const useCapabilities = create<CapabilityState>((set) => ({
  unavailable: new Set(),
  detect: () => set({ unavailable: probeUnavailable() }),
}));
