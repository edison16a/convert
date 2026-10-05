import { useState, type KeyboardEvent } from "react";

/**
 * Arrow key navigation for a flat list of options. The active index is
 * tracked here (not with real focus) so the search box can keep focus while
 * the user moves through results, which is the standard combobox pattern.
 */
export function useMenuNavigation(count: number, onChoose: (index: number) => void, initial = 0) {
  const [active, setActive] = useState(initial);
  const clamped = Math.min(active, Math.max(0, count - 1));

  const onKeyDown = (event: KeyboardEvent) => {
    if (count === 0) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((clamped + 1) % count);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((clamped - 1 + count) % count);
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(count - 1);
        break;
      case "Enter":
        event.preventDefault();
        onChoose(clamped);
        break;
    }
  };

  return { active: clamped, setActive, onKeyDown };
}
