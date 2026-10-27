import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-sm text-center">
        <Logo className="mx-auto mb-8 h-10" />
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-gold-soft text-gold-strong">
          <Compass className="size-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold text-ink">This page doesn&apos;t exist</h1>
        <p className="mt-1 text-[15px] text-muted">The link may be old or mistyped. Head back to your dashboard to continue.</p>
        <Link
          href="/dashboard"
          className="pressable mt-6 inline-flex h-11 items-center rounded-[10px] bg-[#0b1f3a] px-5 text-[15px] font-medium text-white dark:bg-gold dark:text-[#0b1424]"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
