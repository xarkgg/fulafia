"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/components/theme";
import { Sheet } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/misc";
import { BOTTOM_TABS, MORE_ITEMS, MORE_TAB, isActive } from "./nav";
import { useStudent } from "./student-context";

const matches = (pathname: string, prefixes: string[]) => prefixes.some((p) => isActive(pathname, p));

export function BottomNav({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const { theme, toggle } = useTheme();
  const { student } = useStudent();

  useEffect(() => setMore(false), [pathname]);

  const MoreIcon = MORE_TAB.icon;
  const moreActive = matches(pathname, MORE_TAB.match);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pb-safe backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-xl grid-cols-5">
          {BOTTOM_TABS.map((tab) => {
            const active = matches(pathname, tab.match);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "pressable flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    active ? "text-gold-strong" : "text-subtle",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-12 place-items-center rounded-full transition-colors",
                      active && "bg-gold-soft",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMore(true)}
              aria-haspopup="dialog"
              aria-expanded={more}
              className={cn(
                "pressable flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                moreActive || more ? "text-gold-strong" : "text-subtle",
              )}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", (moreActive || more) && "bg-gold-soft")}>
                <MoreIcon className="size-5" aria-hidden />
              </span>
              {MORE_TAB.label}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="More">
        {student && (
          <Link
            href="/account"
            className="pressable mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3"
          >
            <Avatar name={`${student.firstName} ${student.lastName}`} src={student.photoUrl ?? undefined} size={44} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">
                {student.firstName} {student.lastName}
              </span>
              <span className="block truncate text-sm text-muted">{student.matricNo}</span>
            </span>
            <ChevronRight className="size-4 text-subtle" />
          </Link>
        )}
        <ul className="grid grid-cols-2 gap-2">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "pressable flex h-full flex-col gap-2 rounded-2xl border p-3.5",
                    active ? "border-gold/40 bg-gold-soft" : "border-border bg-surface",
                  )}
                >
                  <Icon className={cn("size-5", active ? "text-gold-strong" : "text-muted")} aria-hidden />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{item.label}</span>
                    {item.description && <span className="mt-0.5 block text-xs leading-snug text-muted">{item.description}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border">
          <button
            type="button"
            onClick={toggle}
            className="pressable flex h-12 w-full items-center gap-3 px-4 text-[15px] text-ink"
          >
            {theme === "dark" ? <Sun className="size-5 text-muted" /> : <Moon className="size-5 text-muted" />}
            <span className="flex-1 text-left">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="pressable flex h-12 w-full items-center gap-3 px-4 text-[15px] text-danger"
          >
            <LogOut className="size-5" />
            <span className="flex-1 text-left">Log out</span>
          </button>
        </div>
      </Sheet>
    </>
  );
}
