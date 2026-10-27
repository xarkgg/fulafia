"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem<T extends string> = { value: T; label: string; icon?: ReactNode; count?: number };

/**
 * Segmented, horizontally scrollable tabs. Arrow keys move between tabs (WAI-ARIA tabs pattern).
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  label,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent, i: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      refs.current[next]?.focus();
      onChange(items[next]!.value);
    }
  }

  return (
    <div className={cn("no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <div role="tablist" aria-label={label} className="inline-flex min-w-full gap-1 rounded-xl bg-surface-3/70 p-1 sm:min-w-0">
        {items.map((t, i) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => onChange(t.value)}
              className={cn(
                "pressable flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 text-sm font-medium sm:flex-none",
                active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
              )}
            >
              {t.icon}
              {t.label}
              {typeof t.count === "number" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular",
                    active ? "bg-gold-soft text-gold-strong" : "bg-surface-2 text-subtle",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
