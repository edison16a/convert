/** Why a conversion failed, in terms a person can act on. */
export type FailureKind = "unsupported" | "corrupt" | "memory" | "encrypted" | "unknown";

/**
 * An error whose message is safe to show as is. Engines throw this when they
 * know what went wrong, so the row can say it plainly instead of leaking a
 * stack trace or a codec's internal wording.
 */
export class ConversionError extends Error {
  constructor(
    message: string,
    readonly kind: FailureKind = "unknown",
  ) {
    super(message);
    this.name = "ConversionError";
  }
}

const MEMORY_HINTS = [/out of memory/i, /allocation failed/i, /array buffer allocation/i, /memory access out of bounds/i];

/**
 * Turns anything thrown during a conversion into one calm sentence. Unknown
 * errors get a generic message on purpose: raw library errors are confusing,
 * and a retry usually works for the ones that are really transient.
 */
export function explainFailure(error: unknown): string {
  if (error instanceof ConversionError) return error.message;
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (error instanceof RangeError || MEMORY_HINTS.some((re) => re.test(text))) {
    return "This file is too large for your browser's memory.";
  }
  if (/password|encrypt/i.test(text)) return "This file is password protected.";
  if (/invalid|corrupt|unsupported|decode|malformed|unexpected/i.test(text)) {
    return "This file could not be read. It may be damaged.";
  }
  return "Something went wrong converting this file. You can retry.";
}
