"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FormatIcon } from "@/components/icons/file-types";
import { CheckIcon, SearchIcon } from "@/components/icons/interface";
import { groupByCategory } from "../registry";
import { FORMATS } from "../definitions";
import type { FormatId } from "../types";
import { useMenuNavigation } from "./useMenuNavigation";

const CATEGORY_TITLES = { image: "Image", audio: "Audio", video: "Video", document: "Document", data: "Data", archive: "Archive" };

/** Menus longer than this get a search box. Short menus are faster to just scan. */
const SEARCH_THRESHOLD = 7;

interface FormatMenuProps {
  options: readonly FormatId[];
  value: FormatId | null;
  onSelect: (format: FormatId) => void;
}

/** The dropdown body: options grouped by category, searchable, fully keyboard operable. */
export function FormatMenu({ options, value, onSelect }: FormatMenuProps) {
  const [query, setQuery] = useState("");
  const listId = useId();
  const searchable = options.length > SEARCH_THRESHOLD;
  const focusRef = useRef<HTMLInputElement & HTMLDivElement>(null);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = options.filter((id) => !needle || id.includes(needle) || CATEGORY_TITLES[FORMATS[id].category].toLowerCase().includes(needle));
    return groupByCategory(matches);
  }, [options, query]);

  const flat = groups.flatMap((group) => group.formats);
  const selectedIndex = Math.max(0, flat.findIndex((def) => def.id === value));
  const nav = useMenuNavigation(flat.length, (index) => onSelect(flat[index].id), selectedIndex);

  useEffect(() => focusRef.current?.focus(), []);

  return (
    <div onKeyDown={nav.onKeyDown} className="flex max-h-80 min-w-44 flex-col overflow-hidden">
      {searchable && (
        <div className="flex items-center gap-2 border-b border-line px-3">
          <SearchIcon size={15} className="text-muted" />
          <input
            ref={focusRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search formats"
            aria-label="Search formats"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={flat[nav.active] ? `${listId}-${flat[nav.active].id}` : undefined}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
      )}
      <div
        id={listId}
        role="listbox"
        aria-label="Output format"
        tabIndex={searchable ? -1 : 0}
        ref={searchable ? undefined : focusRef}
        aria-activedescendant={!searchable && flat[nav.active] ? `${listId}-${flat[nav.active].id}` : undefined}
        className="overflow-y-auto p-1.5 outline-none"
      >
        {flat.length === 0 && <p className="px-3 py-4 text-sm text-muted">No matching formats</p>}
        {groups.map((group) => (
          <div key={group.category} role="group" aria-label={CATEGORY_TITLES[group.category]}>
            <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted">
              {CATEGORY_TITLES[group.category]}
            </p>
            {group.formats.map((def) => {
              const index = flat.indexOf(def);
              const isActive = index === nav.active;
              return (
                <div
                  key={def.id}
                  id={`${listId}-${def.id}`}
                  role="option"
                  aria-selected={def.id === value}
                  onMouseEnter={() => nav.setActive(index)}
                  onClick={() => onSelect(def.id)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${isActive ? "bg-surface" : ""}`}
                >
                  <FormatIcon format={def.id} size={15} />
                  <span className="flex-1 font-mono text-xs font-medium">{def.label}</span>
                  {def.id === value && <CheckIcon size={15} className="text-accent-ink" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
