"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatLongDate } from "@/lib/format";
import { useTheme } from "@/components/theme";
import { Avatar } from "@/components/ui/misc";
import { useStudent } from "./student-context";
import { titleFor } from "./nav";

export function Topbar({ onLogout, term }: { onLogout: () => void; term: string | null }) {
  const pathname = usePathname();
  const { student } = useStudent();
  const { theme, toggle } = useTheme();
  const [today, setToday] = useState("");
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setToday(formatLongDate()), []);
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const name = student ? `${student.firstName} ${student.lastName}` : "Student";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 pt-safe backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
        {/* Mobile: crest + page title */}
        <Link href="/dashboard" className="pressable shrink-0 rounded-lg lg:hidden" aria-label="Dashboard">
          <Image src="/crest.png" alt="" width={32} height={32} priority />
        </Link>
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink lg:hidden">{titleFor(pathname)}</p>

        {/* Desktop: date + current term */}
        <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <span className="flex items-center gap-2 text-sm text-muted">
            <CalendarDays className="size-4" aria-hidden />
            <span suppressHydrationWarning>{today}</span>
          </span>
          {term && (
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
              {term}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          className="pressable hidden size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink sm:grid"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-haspopup="menu"
            aria-expanded={menu}
            className="pressable flex items-center gap-2 rounded-full p-0.5 hover:bg-surface-2 lg:rounded-xl lg:py-1 lg:pl-1 lg:pr-2"
          >
            <Avatar name={name} src={student?.photoUrl ?? undefined} size={34} />
            <span className="hidden text-left lg:block">
              <span className="block max-w-40 truncate text-sm font-semibold leading-tight text-ink">{name}</span>
              <span className="block text-xs leading-tight text-muted">{student?.matricNo ?? " "}</span>
            </span>
            <ChevronDown className="hidden size-4 text-subtle lg:block" aria-hidden />
          </button>
          {menu && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-60 animate-rise rounded-xl border border-border bg-surface p-1.5 shadow-sheet"
            >
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold text-ink">{name}</p>
                <p className="truncate text-xs text-muted">{student?.email}</p>
              </div>
              <div className="my-1 border-t border-border" />
              <Link
                role="menuitem"
                href="/account"
                className="pressable flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm text-ink hover:bg-surface-2"
              >
                <UserRound className="size-4 text-muted" /> Account settings
              </Link>
              <button
                role="menuitem"
                type="button"
                onClick={toggle}
                className="pressable flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-ink hover:bg-surface-2 sm:hidden"
              >
                {theme === "dark" ? <Sun className="size-4 text-muted" /> : <Moon className="size-4 text-muted" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={onLogout}
                className="pressable flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-danger hover:bg-danger-soft"
              >
                <LogOut className="size-4" /> Log out
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "pressable hidden h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink lg:flex",
          )}
        >
          <LogOut className="size-4" aria-hidden />
          Log out
        </button>
      </div>
    </header>
  );
}
