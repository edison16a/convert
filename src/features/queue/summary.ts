import { formatBytes } from "@/lib/bytes";
import type { Summary } from "./jobs";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * One line for the done screen: how many files, the output size, and how it
 * compares with the input. Lossy conversions can surprise people, so the
 * size change is shown plainly instead of hidden.
 */
export function describeSummary({ done, failed, inputBytes, outputBytes }: Summary): string {
  const parts = [`${plural(done, "file")} converted`];
  if (done > 0) {
    const change = inputBytes > 0 ? Math.round(((outputBytes - inputBytes) / inputBytes) * 100) : 0;
    const note = change === 0 ? "same size" : `${Math.abs(change)}% ${change < 0 ? "smaller" : "larger"}`;
    parts[0] += `, ${formatBytes(outputBytes)} total (${note})`;
  }
  if (failed > 0) parts.push(`${failed} failed`);
  return parts.join(", ");
}
