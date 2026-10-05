import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  // The accent is reserved for the one main action on screen.
  primary: "bg-accent text-on-accent hover:brightness-110 disabled:opacity-40",
  secondary: "bg-surface text-fg hover:bg-surface-hover disabled:opacity-40",
  ghost: "text-muted hover:bg-surface hover:text-fg disabled:opacity-40",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

/** The only text button style in the app. Rounded, medium weight, 40px tall. */
export function Button({ variant = "secondary", icon, className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
