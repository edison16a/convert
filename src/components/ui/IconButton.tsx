import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required because the button has no visible text. Screen readers read this. */
  label: string;
  children: ReactNode;
}

/** A square, rounded icon only button. The label doubles as the hover tooltip. */
export function IconButton({ label, className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-hover hover:text-fg disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
