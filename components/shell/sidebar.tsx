"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/config";
import { Logo } from "@/components/ui/misc";
import { NAV, isActive } from "./nav";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[76px]" : "w-[264px]",
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border", collapsed ? "justify-center px-2" : "px-5")}>
        <Link href="/dashboard" className="pressable flex items-center rounded-lg" aria-label="FULafia portal home">
          {collapsed ? (
            <Image src="/crest.png" alt="FULafia" width={36} height={36} priority />
          ) : (
            <Logo className="h-9" />
          )}
        </Link>
      </div>

      <nav className="scroll-contain no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && "mt-5")}>
            {collapsed ? (
              gi > 0 && <div className="mx-3 mb-3 border-t border-border" aria-hidden />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href} className="group/item relative">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      className={cn(
                        "pressable relative flex h-10 items-center gap-3 rounded-[10px] text-[14px] font-medium",
                        collapsed ? "justify-center px-0" : "px-3",
                        active
                          ? "bg-gold-soft text-gold-strong"
                          : "text-muted hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      {active && !collapsed && (
                        <span className="absolute -left-3 top-2 h-6 w-[3px] rounded-r-full bg-gold" aria-hidden />
                      )}
                      <Icon className="size-[18px] shrink-0" aria-hidden />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                    {collapsed && (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#0b1f3a] px-2 py-1 text-xs font-medium text-white opacity-0 shadow-pop transition-opacity group-hover/item:opacity-100 group-focus-within/item:opacity-100"
                      >
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 border-t border-border p-3", collapsed && "flex justify-center")}>
        {!collapsed && <p className="px-2 pb-2 text-[11px] leading-snug text-subtle">{SITE.tagline}</p>}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "pressable flex h-9 items-center gap-2 rounded-lg text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink",
            collapsed ? "w-10 justify-center" : "w-full px-2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
