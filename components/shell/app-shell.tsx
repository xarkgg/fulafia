"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getTerm, hasSession, logout } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";
import { PageSkeleton } from "@/components/ui/states";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { StudentProvider } from "./student-context";

const SIDEBAR_KEY = "fulafia.sidebar.collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [term, setTerm] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSession()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    setReady(true);
    getTerm()
      .then(({ current }) => setTerm(`${current.session} · ${current.semester} Semester`))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      localStorage.setItem(SIDEBAR_KEY, c ? "0" : "1");
      return !c;
    });
  }, []);

  const onLogout = useCallback(async () => {
    await logout();
    toast.info("You've been logged out", "See you next time.");
    router.replace("/login");
  }, [router, toast]);

  return (
    <StudentProvider>
      <div className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow-pop"
        >
          Skip to content
        </a>
        <Sidebar collapsed={collapsed} onToggle={toggle} />
        <div className={cn("flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200 ease-out", collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]")}>
          <Topbar onLogout={onLogout} term={term} />
          <main
            id="main"
            className="mx-auto w-full max-w-6xl flex-1 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8"
          >
            {ready ? <div key={pathname} className="animate-rise">{children}</div> : <PageSkeleton />}
          </main>
        </div>
        <BottomNav onLogout={onLogout} />
      </div>
    </StudentProvider>
  );
}
