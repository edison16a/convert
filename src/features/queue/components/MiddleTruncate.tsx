interface MiddleTruncateProps {
  text: string;
  /** How many trailing characters always stay visible, enough for the extension. */
  tail?: number;
}

/**
 * Shortens long names in the middle ("IMG_20240301_wed...ing.HEIC") so the
 * extension never gets cut off. Plain CSS ellipsis only trims the end.
 */
export function MiddleTruncate({ text, tail = 10 }: MiddleTruncateProps) {
  if (text.length <= tail + 4) return <span className="block truncate">{text}</span>;
  return (
    <span className="flex min-w-0" title={text}>
      <span className="truncate">{text.slice(0, -tail)}</span>
      <span className="shrink-0">{text.slice(-tail)}</span>
    </span>
  );
}
