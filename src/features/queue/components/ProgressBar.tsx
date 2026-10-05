interface ProgressBarProps {
  /** 0 to 1. */
  value: number;
  label: string;
}

/** A thin accent bar. The percentage is shown beside it, so color is never the only signal. */
export function ProgressBar({ value, label }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-1.5 w-full overflow-hidden rounded-full bg-line"
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${percent}%` }} />
    </div>
  );
}
