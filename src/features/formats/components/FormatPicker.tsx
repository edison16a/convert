"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { FormatIcon } from "@/components/icons/file-types";
import { ChevronDownIcon, LayersIcon } from "@/components/icons/interface";
import { useDismiss } from "@/components/ui/useDismiss";
import { FORMATS } from "../definitions";
import type { FormatId } from "../types";
import { FormatMenu } from "./FormatMenu";

interface FormatPickerProps {
  options: readonly FormatId[];
  value: FormatId | null;
  onChange: (format: FormatId) => void;
  /** "global" is the batch picker in the top bar, "row" sits inside a file row. */
  variant: "row" | "global";
  label: string;
  disabled?: boolean;
}

/**
 * A button that opens the format menu. The menu flips upward when there is
 * no room below it, which matters for the last rows of a long list.
 */
export function FormatPicker({ options, value, onChange, variant, label, disabled }: FormatPickerProps) {
  const [open, setOpen] = useState(false);
  const [flip, setFlip] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);
  useDismiss(open, close, rootRef);

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setFlip(rect.bottom > window.innerHeight - 8 && rect.height < (triggerRef.current?.getBoundingClientRect().top ?? 0));
  }, [open]);

  const def = value ? FORMATS[value] : null;
  const global = variant === "global";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:opacity-50 bg-bg ${
          open || (global && def) ? "border-accent-ink" : "border-line hover:border-muted/50"
        }`}
      >
        {global ? (
          <LayersIcon size={15} className="text-muted" />
        ) : (
          value && <FormatIcon format={value} size={14} />
        )}
        <span className={global && !def ? "font-sans text-sm font-medium" : "font-mono"}>
          {def ? def.label : global ? "Convert all to" : "Choose"}
        </span>
        <ChevronDownIcon size={14} className="text-muted" />
      </button>
      {open && (
        <div
          ref={panelRef}
          className={`absolute right-0 z-30 rounded-2xl border border-line bg-bg shadow-[0_8px_30px_rgb(0_0_0/0.08)] ${
            flip ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <FormatMenu
            options={options}
            value={value}
            onSelect={(format) => {
              onChange(format);
              close();
            }}
          />
        </div>
      )}
    </div>
  );
}
