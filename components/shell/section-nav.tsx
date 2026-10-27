"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SECTIONS, isActive } from "./nav";

/** In-section navigation (e.g. Academics → Registration / Results / …), always visible, never a flyout. */
export function SectionNav({ section, label }: { section: keyof typeof SECTIONS; label: string }) {
  const pathname = usePathname();
  const items = SECTIONS[section];
  return (
    <nav aria-label={label} className="no-scrollbar -mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:mb-6">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable relative flex h-11 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <Icon className={cn("size-4", active ? "text-gold-strong" : "text-subtle")} aria-hidden />
                {item.label}
                {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
